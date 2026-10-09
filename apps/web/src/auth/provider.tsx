'use client';
import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { AppLoadingSurface } from '../host/app-loading-surface';
import { useFrontendTranslation } from '@community-go/i18n';

function AuthBootSurface() {
  const { t } = useFrontendTranslation();
  return <AppLoadingSurface label={t('common.appLoading')} />;
}

// The browser session runtime loads after the shared Host boot/hydration surface.
const AuthRuntime = dynamic(() => import('./runtime').then((module) => module.AuthRuntime), {
  ssr: false,
  loading: AuthBootSurface,
});

export function AuthProvider({ children }: Readonly<{ children: ReactNode }>) {
  return <AuthRuntime>{children}</AuthRuntime>;
}
