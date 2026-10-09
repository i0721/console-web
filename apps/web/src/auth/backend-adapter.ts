import {
  AuthError,
  readSession,
  type AuthService,
  type AuthSession,
  type LoginInput,
  type RegisterInput,
} from './contract';

/** Proposed cookie-session API. Actual server integration is pending a supplied backend. */
export function createBackendAuthService(
  apiBaseUrl: string,
  request: typeof fetch = fetch,
): AuthService {
  async function call(
    path: string,
    body?: LoginInput | RegisterInput | Readonly<{ logout: true }>,
  ): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      let csrfToken: string | undefined;
      if (body) {
        const response = await request(`${apiBaseUrl}/auth/csrf`, {
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
        });
        if (!response.ok)
          throw new AuthError(response.status === 403 ? 'forbidden' : 'unavailable');
        let value: unknown;
        try {
          value = await response.json();
        } catch {
          throw new AuthError('protocol');
        }
        if (
          typeof value !== 'object' ||
          value === null ||
          !('token' in value) ||
          typeof value.token !== 'string' ||
          !value.token
        )
          throw new AuthError('protocol');
        csrfToken = value.token;
      }
      const response = await request(`${apiBaseUrl}${path}`, {
        method: body ? 'POST' : 'GET',
        credentials: 'include',
        cache: 'no-store',
        signal: controller.signal,
        ...(body
          ? {
              headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken ?? '' },
              body: JSON.stringify(body),
            }
          : {}),
      });
      if (!response.ok) {
        if (response.status === 401)
          throw new AuthError(path === '/auth/session' ? 'expired' : 'credentials');
        if (response.status === 403) throw new AuthError('forbidden');
        if (response.status === 409) throw new AuthError('account-exists');
        throw new AuthError('unavailable');
      }
      if (response.status === 204) return null;
      try {
        return await response.json();
      } catch {
        throw new AuthError('protocol');
      }
    } catch (error) {
      if (error instanceof AuthError) throw error;
      throw new AuthError(controller.signal.aborted ? 'timeout' : 'network');
    } finally {
      clearTimeout(timeout);
    }
  }
  async function restore(): Promise<AuthSession | null> {
    try {
      const session = readSession(await call('/auth/session'));
      if (session.expiresAt <= Date.now()) return null;
      return session;
    } catch (error) {
      if (error instanceof AuthError && error.code === 'expired') return null;
      throw error;
    }
  }
  async function authenticate(path: string, input: LoginInput | RegisterInput) {
    await call(path, input);
    const session = await restore();
    if (!session) throw new AuthError('expired');
    return session;
  }
  return {
    restore,
    login: (input) => authenticate('/auth/login', input),
    register: (input) => authenticate('/auth/register', input),
    logout: async () => {
      await call('/auth/logout', { logout: true });
    },
  };
}
