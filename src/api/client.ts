/**
 * HTTP-клиент для бэка админки. Подкладывает Bearer-токен,
 * на 401 пробует refresh + ретрай, на повторный fail — выкидывает SessionExpiredError.
 */

import { getValidToken, refresh, AuthError } from '../auth/keycloak';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081';

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message);
    this.name = 'ApiError';
  }
}

export class SessionExpiredError extends Error {
  constructor() {
    super('Сессия истекла');
    this.name = 'SessionExpiredError';
  }
}

export interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = buildUrl(path, options.query);
  const init = await buildInit(options);

  let response = await fetch(url, init);

  if (response.status === 401) {
    try { await refresh(); }
    catch { throw new SessionExpiredError(); }
    response = await fetch(url, await buildInit(options));
    if (response.status === 401) throw new SessionExpiredError();
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new ApiError(response.status, `HTTP ${response.status}`, body);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function buildInit(options: RequestOptions): Promise<RequestInit> {
  const token = await getValidToken();
  if (!token) throw new AuthError('Нет валидного токена');

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';

  return {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  };
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(path, API_URL);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined) url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
}
