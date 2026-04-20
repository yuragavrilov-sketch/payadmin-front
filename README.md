# pay-admin-front

Фронт админ-панели «Платёж». React 18 + TypeScript + Vite + Ant Design 5.

Авторизация через Keycloak (ROPC grant, форма логина — наша). Бэкенд — [pay-admin-back](../payadmin-back).

## Стэк

- **Vite 5** + **React 18** + **TypeScript 5** (strict)
- **antd v5** — компоненты + бренд-токены через `ConfigProvider`
- **react-router-dom v6**
- **dayjs** с русской локалью
- **IBM Plex Sans** + **JetBrains Mono** через Google Fonts

## Быстрый старт

```bash
cp .env.example .env.local        # отредактируй под свой Keycloak/API
npm install
npm run dev                        # http://localhost:5173
```

Бэк (Spring Boot) и Keycloak поднимаются из репо `payadmin-back` через `docker compose up -d` + `mvn spring-boot:run`.

**Тестовый логин (из realm-import):**
- логин: `operator`
- пароль: `operator`

## Структура

```
src/
├── main.tsx                  ConfigProvider + RouterProvider + auth state
├── App.tsx                   Layout shell (Sider / Header / Content + Outlet)
├── theme.ts                  makeBrandTheme(mode) — light/dark
├── navigation.tsx            единый источник правды для меню+роутов
├── index.css                 глобальные стили + утилиты
├── auth/
│   └── keycloak.ts           ROPC-клиент: login/refresh/logout/restore
├── api/
│   └── client.ts             fetch-обёртка: Bearer + 401-retry
├── components/               Logo, Kpi, Sparkline (shared)
├── pages/
│   ├── Login.tsx             форма (логин/пароль) — отправляет в keycloak
│   ├── Transactions.tsx      полный экран
│   ├── Disputes.tsx          полный экран
│   ├── Merchants.tsx         полный экран
│   └── skeletons.tsx         заглушки остальных экранов
├── mock.ts                   мок транзакций
├── disputes-mock.ts          мок диспутов
└── merchants-mock.ts         мок мерчантов
```

## Переменные окружения

| Переменная | Default | Описание |
|---|---|---|
| `VITE_KEYCLOAK_URL` | `http://localhost:8080` | URL Keycloak |
| `VITE_KEYCLOAK_REALM` | `pay-admin` | realm |
| `VITE_KEYCLOAK_CLIENT_ID` | `pay-admin-web` | client id (public) |
| `VITE_API_URL` | `http://localhost:8081` | URL бэка |

## Темы

`light` / `dark`. Выбор:
1. `localStorage['platezh.theme']`,
2. `prefers-color-scheme`,
3. Segmented в header'е.

Inline-скрипт в `index.html` ставит `data-theme` до первого рендера (anti-FOUC).

## Что дальше

- Заменить мок-данные на реальные вызовы API (через `src/api/client.ts`)
- Тема Keycloak (FreeMarker) для прода — чтобы получить 2FA/MFA, не теряя UX
- TanStack Query для кэширования
