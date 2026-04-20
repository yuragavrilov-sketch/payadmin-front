/**
 * Keycloak ROPC (Resource Owner Password Credentials) клиент.
 *
 * Кастомная форма логина → POST на /token с grant_type=password.
 * Не поддерживает 2FA/MFA. Когда понадобятся — переезжаем на тему Keycloak
 * с обычным authorization_code flow.
 */

const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8080';
const REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'pay-admin';
const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'pay-admin-web';
const AUTH_ENABLED = import.meta.env.VITE_AUTH_ENABLED !== 'false';

// Mock-профиль для VITE_AUTH_ENABLED=false (e2e-тесты, локальный смок без Keycloak).
const MOCK_PROFILE: UserProfile = {
  sub: 'mock-operator',
  email: 'operator@platezh.ru',
  name: 'Тестовый Оператор',
  preferred_username: 'operator',
  realm_access: { roles: ['operator'] },
};
const MOCK_TOKEN = 'mock-token-no-keycloak';

const TOKEN_URL = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/token`;
const LOGOUT_URL = `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/logout`;

const REFRESH_KEY = 'platezh.kc.refresh';
// access_token держим в памяти; refresh — в localStorage, чтобы пережить reload.

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
}

export interface UserProfile {
  sub: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  realm_access?: { roles: string[] };
}

let accessToken: string | null = null;
let accessTokenExpiresAt = 0;
let refreshToken: string | null = readStoredRefresh();
let refreshTimer: ReturnType<typeof setTimeout> | null = null;

function readStoredRefresh(): string | null {
  try { return localStorage.getItem(REFRESH_KEY); } catch { return null; }
}

function storeRefresh(token: string | null) {
  try {
    if (token) localStorage.setItem(REFRESH_KEY, token);
    else localStorage.removeItem(REFRESH_KEY);
  } catch { /* storage blocked */ }
}

function applyTokens(res: TokenResponse) {
  accessToken = res.access_token;
  accessTokenExpiresAt = Date.now() + res.expires_in * 1000;
  refreshToken = res.refresh_token;
  storeRefresh(res.refresh_token);
  scheduleRefresh(res.expires_in);
}

function clearTokens() {
  accessToken = null;
  accessTokenExpiresAt = 0;
  refreshToken = null;
  storeRefresh(null);
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
}

function scheduleRefresh(expiresInSec: number) {
  if (refreshTimer) clearTimeout(refreshTimer);
  // Обновляем за 30 сек до истечения, но не реже чем раз в 10 сек.
  const delay = Math.max(10_000, (expiresInSec - 30) * 1000);
  refreshTimer = setTimeout(() => { refresh().catch(() => logout()); }, delay);
}

export async function login(username: string, password: string): Promise<UserProfile> {
  if (!AUTH_ENABLED) {
    accessToken = MOCK_TOKEN;
    accessTokenExpiresAt = Date.now() + 3600_000;
    return MOCK_PROFILE;
  }

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'password',
    username,
    password,
    scope: 'openid profile email',
  });

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new AuthError(mapError(response.status, text));
  }

  const data: TokenResponse = await response.json();
  applyTokens(data);
  return parseProfile(data.access_token);
}

export async function refresh(): Promise<void> {
  if (!refreshToken) throw new AuthError('Нет refresh-токена');

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    clearTokens();
    throw new AuthError('Сессия истекла');
  }

  const data: TokenResponse = await response.json();
  applyTokens(data);
}

export async function logout(): Promise<void> {
  const token = refreshToken;
  clearTokens();
  if (!token) return;
  try {
    await fetch(LOGOUT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ client_id: CLIENT_ID, refresh_token: token }),
    });
  } catch { /* ignore — токены уже очистили */ }
}

/** Восстановление сессии при старте приложения. */
export async function restore(): Promise<UserProfile | null> {
  if (!AUTH_ENABLED) return null;
  if (!refreshToken) return null;
  try {
    await refresh();
    return accessToken ? parseProfile(accessToken) : null;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  if (!accessToken) return null;
  if (Date.now() >= accessTokenExpiresAt) return null;
  return accessToken;
}

/** Возвращает живой токен — рефрешит, если истёк. */
export async function getValidToken(): Promise<string | null> {
  if (!AUTH_ENABLED) return MOCK_TOKEN;
  if (accessToken && Date.now() < accessTokenExpiresAt - 5_000) return accessToken;
  if (!refreshToken) return null;
  try {
    await refresh();
    return accessToken;
  } catch {
    return null;
  }
}

export function getProfile(): UserProfile | null {
  return accessToken ? parseProfile(accessToken) : null;
}

function parseProfile(token: string): UserProfile {
  const payload = token.split('.')[1];
  const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  return decoded as UserProfile;
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

function mapError(status: number, body: string): string {
  if (status === 401) return 'Неверный логин или пароль';
  if (status === 400 && body.includes('invalid_grant')) return 'Неверный логин или пароль';
  if (status === 0 || status >= 500) return 'Сервис авторизации недоступен';
  return 'Ошибка авторизации';
}
