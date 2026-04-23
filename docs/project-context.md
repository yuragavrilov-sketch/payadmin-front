---
name: Pay Admin project context
description: Платёж — админка платёжного шлюза для операторов; React 18 + AntD 5; 3 полных экрана + 11 заглушек; auth/API/CI готовы, реальный API не подключён
type: project
---

Проект `payadmin-front` — внутренняя админка платёжного шлюза для L3-операторов (не кабинет мерчанта). Бэкенд — `payadmin-back` в соседнем репо.

**Стек:** Vite 5 + React 18 + TypeScript 5 (strict) + antd 5 + react-router-dom 6 + dayjs (ru). Без Tailwind (конфликтует с antd-токенами).

## Дизайн-решения

- **Фундамент:** Ant Design 5 с бренд-токенами через `ConfigProvider.theme`.
- **Логотип:** буква **П** как ворота — две paper-стойки + rust-перекладина на ink-плитке 24×24 rx=4. SVG, 4 шейпа, без зависимостей. Файл: `src/components/Logo.tsx`.

## Бренд-токены (актуальные на 2026-04-16)

| Token | Value |
|---|---|
| colorPrimary (rust) | `#fd6141` |
| rustHover | `#c75138` |
| rustSoftLight | `#fff0ec` |
| rustSoftDark | `rgba(253,97,65,.14)` |
| colorBgLayout light | `#f4f1ec` (warm paper) |
| colorBgLayout dark | `#0f0d0a` (warm-black) |
| siderBg light/dark | `#141210` / `#0a0806` (sider всегда тёмный) |
| fontFamily | IBM Plex Sans |
| fontFamilyCode | JetBrains Mono |
| fontSize / controlHeight / borderRadius | 13 / 30 / 4 |

## Состояние реализации (на 2026-04-23)

**Полные экраны** (KPI + фильтры + таблица + drawer):
- `/transactions` — drawer 4 таба: Детали / Таймлайн / Риск / JSON
- `/disputes` — live-countdown 1s, drawer 4 таба: Обзор / Эвиденсы / Таймлайн / Ответ
- `/merchants` — drawer 4 таба: Профиль / Тарифы / Статистика / История

**Заглушки** (`src/pages/skeletons.tsx`, через AntD `Result`):
Dashboard, Refunds, Chargebacks, Settlements, Payouts, Reconciliation, RiskRules, Webhooks, ApiKeys, Settings.

**Auth** (`src/auth/keycloak.ts`): ROPC password grant. login / refresh / logout / restore. access_token в памяти, refresh_token в `localStorage['platezh.kc.refresh']`. Silent refresh за 30s до истечения. `VITE_AUTH_ENABLED=false` → mock-режим.

**API** (`src/api/client.ts`): fetch-обёртка `api<T>()`, Bearer + 401-retry с авто-refresh, типизированные ошибки `ApiError` / `SessionExpiredError`. **Не используется** ни на одной странице — все на моках (`src/mock.ts`, `disputes-mock.ts`, `merchants-mock.ts`).

**CI/CD** (`.gitlab-ci.yml`): install → lint → typecheck → build → docker → helm. Образ — `nginx:1.27-alpine` из Harbor. Helm-чарт `kubernetes/payform:0.0.9`. test/prod через manual trigger. Хосты: `pay-admin.test.tkbbank.ru` / `pay-admin.tkbbank.ru`.

## Ключевые паттерны

- `src/navigation.tsx` — single source of truth для меню + роутов (3 группы: ops / ledger / control)
- `src/theme.ts` → `makeBrandTheme(mode)` — фабрика light/dark
- Anti-FOUC: inline-скрипт в `index.html` ставит `data-theme` до React-рендера
- Drawer без маски (`mask={false}`) — оператор видит таблицу за drawer
- `useNow(1000)` + stable `deadlines` Map via `useMemo([], [])` для countdown
- Sider всегда ink-dark, не меняется с темой
- Tabular-nums везде на числах, JetBrains Mono для ID / RRN / PAN / timestamp
- Тёплые нейтралы (`#f4f1ec` / `#0f0d0a`), холодные серые запрещены

## Что нужно для следующего этапа

1. **API-контракты от бэка** — главный блокер. Образец оформления — `api/merchants.md`.
2. Приоритет skeleton-экранов (что делать после Merchants — Refunds? Dashboard? RiskRules?)

Фронт-задачи когда API готов:
- Заменить мок-импорты на `useQuery()` через `src/api/client.ts`
- Добавить TanStack Query
- Тема Keycloak (FreeMarker) для прода — для 2FA/MFA без потери UX
- MSW для разработки (вместо прямых импортов из `*-mock.ts`)
- Error boundaries
- Тесты (Vitest + Testing Library)
- ESLint (сейчас в `package.json` — заглушка `echo 'lint not configured'`)

## Аудитория и UX

- L3-оператор у экрана часами → плотность и горячие клавиши важнее декора
- Текст UI — на русском
- Не добавлять фичи, которые не просили
