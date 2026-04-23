import React, { useEffect, useState, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, App as AntApp, Spin } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import { makeBrandTheme, type ThemeMode } from './theme';
import App from './App';
import LoginPage from './pages/Login';
import MerchantsPage from './pages/Merchants';
import {
  Dashboard, Transactions, Refunds, Disputes, Chargebacks,
  Settlements, Payouts, Reconciliation,
  RiskRules, Webhooks, ApiKeys, Settings,
} from './pages/skeletons';
import * as keycloak from './auth/keycloak';
import type { UserProfile } from './auth/keycloak';
import { queryClient } from './api/queryClient';
import './index.css';

dayjs.locale('ru');

const STORAGE_KEY = 'platezh.theme';

function readStoredMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* storage blocked */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function Root() {
  const [mode, setMode] = useState<ThemeMode>(readStoredMode);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, mode); } catch { /* ignore */ }
    document.documentElement.dataset.theme = mode;
  }, [mode]);

  useEffect(() => {
    keycloak.restore()
      .then((p) => setProfile(p))
      .finally(() => setRestoring(false));
  }, []);

  const handleLogin = async (username: string, password: string) => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      const p = await keycloak.login(username, password);
      setProfile(p);
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Ошибка авторизации');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await keycloak.logout();
    setProfile(null);
  };

  const router = useMemo(() => createBrowserRouter([
    {
      path: '/',
      element: <App mode={mode} onThemeChange={setMode} profile={profile} onLogout={handleLogout} />,
      children: [
        { index: true, element: <Dashboard /> },
        { path: 'transactions', element: <Transactions /> },
        { path: 'refunds', element: <Refunds /> },
        { path: 'disputes', element: <Disputes /> },
        { path: 'chargebacks', element: <Chargebacks /> },
        { path: 'settlements', element: <Settlements /> },
        { path: 'payouts', element: <Payouts /> },
        { path: 'reconciliation', element: <Reconciliation /> },
        { path: 'merchants', element: <MerchantsPage /> },
        { path: 'risk', element: <RiskRules /> },
        { path: 'webhooks', element: <Webhooks /> },
        { path: 'api-keys', element: <ApiKeys /> },
        { path: 'settings', element: <Settings /> },
      ],
    },
  ]), [mode, profile]);

  return (
    <ConfigProvider theme={makeBrandTheme(mode)} locale={ruRU}>
      <AntApp>
        {restoring ? (
          <div className="app-bootstrap"><Spin size="large" /></div>
        ) : profile ? (
          <RouterProvider router={router} />
        ) : (
          <LoginPage
            mode={mode}
            onThemeChange={setMode}
            onLogin={handleLogin}
            loading={loginLoading}
            error={loginError}
          />
        )}
      </AntApp>
    </ConfigProvider>
  );
}

async function enableMocking() {
  if (!import.meta.env.DEV) return;
  if (import.meta.env.VITE_MSW_ENABLED === 'false') return;
  const { worker } = await import('./mocks/browser');
  await worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  });
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <Root />
      </QueryClientProvider>
    </React.StrictMode>
  );
});
