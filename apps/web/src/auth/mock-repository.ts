import {
  createPersistStore,
  createLocalStorage,
  createHydrationLifecycle,
} from '@community-go/state-foundation';
import { AuthError, readSession, type AuthSession } from './contract';
import type { MockAccount, MockAuthRepository } from './mock-adapter';

type MockRecords = { accounts: readonly MockAccount[]; session: AuthSession | null };
function createRecords(reportError: (error: unknown) => void) {
  return createPersistStore<MockRecords, MockRecords>(() => ({ accounts: [], session: null }), {
    name: 'community-go.auth-mock',
    version: 1,
    skipHydration: true,
    storage: createLocalStorage(),
    partialize: ({ accounts, session }) => ({ accounts, session }),
    migrate: () => {
      throw new AuthError('protocol');
    },
    onRehydrateStorage: () => (_state, error) => {
      if (error) reportError(error);
    },
    merge: (value, current) => {
      if (value === undefined) return current;
      if (
        typeof value !== 'object' ||
        value === null ||
        !('accounts' in value) ||
        !('session' in value)
      )
        throw new AuthError('protocol');
      return {
        accounts: validateAccounts(value.accounts),
        session: value.session === null ? null : readSession(value.session),
      };
    },
  });
}

function validateAccounts(value: unknown): readonly MockAccount[] {
  if (!Array.isArray(value)) throw new AuthError('protocol');
  return value.map((account: unknown) => {
    if (
      typeof account !== 'object' ||
      account === null ||
      !('user' in account) ||
      !('salt' in account) ||
      typeof account.salt !== 'string' ||
      !('digest' in account) ||
      typeof account.digest !== 'string'
    )
      throw new AuthError('protocol');
    if (!account.salt || !/^[0-9a-f]{64}$/.test(account.digest)) throw new AuthError('protocol');
    return {
      user: readSession({ user: account.user, expiresAt: 0 }).user,
      salt: account.salt,
      digest: account.digest,
    };
  });
}

export function createBrowserMockRepository(): MockAuthRepository {
  async function ready() {
    // Read the latest durable snapshot for each operation, including other tabs.
    // These records are demo persistence; the controller remains the sole current identity.
    let failure: unknown;
    const records = createRecords((error) => {
      failure = error;
    });
    const hydrationError = () =>
      failure instanceof AuthError
        ? failure
        : new AuthError(failure instanceof SyntaxError ? 'protocol' : 'unavailable');
    const lifecycle = createHydrationLifecycle(records);
    lifecycle.trigger();
    if (lifecycle.status === 'hydrated') return records;
    if (lifecycle.status === 'error') throw hydrationError();
    await new Promise<void>((resolve, reject) => {
      const unsubscribe = lifecycle.subscribe((status) => {
        if (status === 'hydrated') {
          unsubscribe();
          resolve();
        }
        if (status === 'error') {
          unsubscribe();
          reject(hydrationError());
        }
      });
    });
    return records;
  }
  return {
    readAccounts: async () => {
      const records = await ready();
      return validateAccounts(records.getState().accounts);
    },
    saveAccount: async (account) => {
      const records = await ready();
      const accounts = validateAccounts(records.getState().accounts);
      if (accounts.some((existing) => existing.user.email === account.user.email))
        throw new AuthError('account-exists');
      records.setState({ accounts: [...accounts, account] });
    },
    readSession: async () => {
      const records = await ready();
      const session = records.getState().session;
      return session === null ? null : readSession(session);
    },
    saveSession: async (session) => {
      const records = await ready();
      records.setState({ session });
    },
  };
}
