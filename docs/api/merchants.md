# API-контракт: Мерчанты

Контракт под текущую реализацию `src/pages/Merchants.tsx`. Покрывает таблицу, фильтры, KPI, drawer на 4 таба, действия в футере, кнопки «Новый мерчант» и «Экспорт».

**Статус:** черновик, ждёт согласования с бэк-командой.

---

## 1. Эндпоинты

| # | Метод | Путь | Зачем | Владелец (предложение) |
|---|---|---|---|---|
| 1 | `GET` | `/api/v1/merchants` | основная таблица + фильтры + сортировка + пагинация | **BFF: Merchant + Reporting** |
| 2 | `GET` | `/api/v1/merchants/kpi` | 5 карточек KPI над таблицей | **Reporting** |
| 3 | `GET` | `/api/v1/merchants/{id}` | drawer → Профиль | **Merchant** |
| 4 | `GET` | `/api/v1/merchants/{id}/tariffs` | drawer → Тарифы | **Merchant (Billing)** |
| 5 | `GET` | `/api/v1/merchants/{id}/stats?period=30d` | drawer → Статистика | **Reporting** |
| 6 | `GET` | `/api/v1/merchants/{id}/events?limit=50&cursor=…` | drawer → История (timeline) | **Audit Log** |
| 7 | `PATCH` | `/api/v1/merchants/{id}` | кнопка «Редактировать» | **Merchant** |
| 8 | `POST` | `/api/v1/merchants/{id}/block` | футер — «Заблокировать» | **Merchant** |
| 9 | `POST` | `/api/v1/merchants/{id}/unblock` | футер — «Разблокировать» | **Merchant** |
| 10 | `POST` | `/api/v1/merchants/{id}/approve` | футер — «Одобрить» (для pending) | **Merchant** |
| 11 | `POST` | `/api/v1/merchants` | кнопка «Новый мерчант» | **Merchant** |
| 12 | `GET` | `/api/v1/merchants/export?format=xlsx&…` | кнопка «Экспорт» (тот же фильтр) | **Reporting** |
| 13 | `GET` | `/api/v1/reference/mcc` | селект «Категория: MCC» | **Reference** |
| 14 | `GET` | `/api/v1/reference/managers` | селект «Менеджер» | **Merchant** |

---

## 2. TypeScript-типы

Лягут в `src/api/types/merchants.ts` (когда соберём папку типов).

```ts
// ========= общие =========
type MerchantStatus = 'active' | 'blocked' | 'pending' | 'test';
type RiskLevel = 'low' | 'mid' | 'hi';

// ========= GET /merchants =========
type SortField =
  | 'volume30d' | 'txnCount30d' | 'successRate'
  | 'disputesOpen' | 'connectedAt';
type SortDir = 'asc' | 'desc';

interface MerchantsListQuery {
  status?: MerchantStatus[];
  mcc?: string[];
  risk?: RiskLevel[];
  managerId?: string[];
  search?: string;          // по name / legalName / inn / id
  sort?: SortField;
  dir?: SortDir;
  page?: number;            // 1-based
  pageSize?: number;        // default 20, max 100
}

interface MerchantsListResponse {
  items: MerchantListItem[];
  total: number;
  page: number;
  pageSize: number;
}

// Срез полей для таблицы — без tariffs / events / контактов
interface MerchantListItem {
  id: string;               // "mrch_8241"
  name: string;
  legalName: string;
  inn: string;
  mcc: string;
  mccLabel: string;
  status: MerchantStatus;
  riskLevel: RiskLevel;
  stats30d: {
    volume: number;         // ₽, см. п.4 (деньги)
    txnCount: number;
    successRate: number;    // 0..100
    disputesOpen: number;
    disputeRate: number;    // 0..100
    avgTicket: number;
  };
  connectedAt: string;      // ISO 8601 date
  managerId: string;
  managerName: string;
}

// ========= GET /merchants/kpi =========
interface MerchantsKpiResponse {
  total:       { value: number; spark: number[] };
  active:      { value: number; spark: number[] };
  volume30d:   { value: number; unit: 'M' | 'B'; spark: number[]; deltaPct: number };
  avgTicket:   { value: number; spark: number[]; deltaPct: number };
  disputeRate: { value: number; spark: number[]; deltaPp: number };
}

// ========= GET /merchants/{id} =========
interface MerchantDetails extends MerchantListItem {
  contactEmail: string;
  contactPhone: string;
  website: string;
  country: string;          // ISO 3166-1 alpha-2
  kyb: {
    status: 'passed' | 'pending' | 'failed';
    passedAt?: string;
    provider?: string;
  };
}

// ========= GET /merchants/{id}/tariffs =========
interface TariffRow {
  method: string;           // "Visa / Mastercard", "МИР", "SBP", ...
  percent: number;
  fixRub: number;
  minRub: number;
  holdDays: number;
}

interface MerchantTariffs {
  rows: TariffRow[];
  limits: {
    perTxnRub: number;
    dailyRub: number;
    velocityPerHour: number;
  };
  effectiveFrom: string;
  nextRows?: { effectiveFrom: string; rows: TariffRow[] };
}

// ========= GET /merchants/{id}/stats =========
interface MerchantStatsResponse {
  period: '30d' | '90d' | 'ytd';
  volume: number;
  txnCount: number;
  successRate: number;
  disputesOpen: number;
  disputeRate: number;
  avgTicket: number;
  byDay?: { date: string; volume: number; txn: number; success: number }[];
}

// ========= GET /merchants/{id}/events =========
interface MerchantEvent {
  ts: string;               // ISO 8601 datetime
  label: string;
  detail?: string;
  state: 'ok' | 'warn' | 'fail' | 'info';
}

interface MerchantEventsResponse {
  items: MerchantEvent[];
  nextCursor?: string;
}

// ========= mutations =========
interface PatchMerchantRequest {
  name?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  managerId?: string;
  riskLevel?: RiskLevel;
  // tariffs / limits — отдельные эндпоинты, чтобы не путать BA с юр-лицом
}

interface BlockRequest   { reason: string; ticketUrl?: string; }
interface ApproveRequest { kybNote?: string; }

interface CreateMerchantRequest {
  name: string;
  legalName: string;
  inn: string;
  mcc: string;
  managerId: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  // status создаётся как 'pending', нельзя передать явно
}
```

---

## 3. Микросервисная декомпозиция

```
                    ┌─────────────────────────┐
Фронт (pay-admin)  ─┤  Admin BFF              │
                    │  /api/v1/merchants*     │
                    └──┬────────┬───────┬─────┘
                       │        │       │
             ┌─────────▼──┐ ┌───▼───┐ ┌─▼────────┐
             │ Merchant   │ │Report │ │Audit Log │
             │ Service    │ │-ing   │ │Service   │
             │ (SoT)      │ │(CH/PG)│ │          │
             └─────┬──────┘ └───▲───┘ └──▲───────┘
                   │            │        │
            CDC / events        │   события из всех
                   └────────────┴────────┘
```

### Merchant Service — source of truth
Владеет: CRUD мерчантов, статус (`active/blocked/pending/test`), тарифы, лимиты, контакты, KYB, менеджер.

Эндпоинты-владельцы: **3, 4, 7, 8, 9, 10, 11, 14**. Эмитит доменные события (`merchant.created`, `merchant.blocked`, `tariff.changed`) в шину — их подхватывают Reporting и Audit Log.

### Reporting Service — агрегаты
Владеет: 30d / 90d / ytd метрики (volume / txn / success / disputes / avgTicket), сводные KPI, экспорт.

Почему отдельно: считать `volume30d` онлайн-джойном по сотням миллионов транзакций нельзя. Это materialized view в ClickHouse (или агрегирующий PG-читатель), пересчёт инкрементально из CDC транзакций и диспутов. Latency секунды-минуты, для админки нормально.

Эндпоинты-владельцы: **2, 5, 12** (и часть 6 в плане агрегатов истории).

### Audit Log Service — события мерчанта
Владеет: единый хронологический поток событий по сущности (регистрация, смена тарифа, velocity-алерт, блок). Собирает событийный стрим из Merchant, Risk, Billing, Dispute.

Эндпоинт-владелец: **6**.

### Risk Service (запланирован — `RiskRules` skeleton)
Владеет: `riskLevel` как **вычисляемый** атрибут. Merchant Service либо пулит его и кэширует у себя, либо отдаёт через join на `/merchants` через BFF.

### Reference Service
Справочник MCC. Если отдельного сервиса нет — read-only endpoint внутри Merchant.

### Admin BFF — ключевой момент
Эндпоинты **1, 2, 5** — composite. Фронт **не должен** джойнить Merchant + Reporting + Risk сам.

```
GET /api/v1/merchants
  → Merchant:  SELECT * FROM merchants WHERE … LIMIT 20
  → Reporting: SELECT stats30d FROM merchant_stats
                WHERE merchant_id IN (…)
  → merge + return
```

Без BFF получите либо N+1 запросов со стороны фронта, либо толстый агрегат в Merchant Service, который держит метрики у себя — антипаттерн.

---

## 4. Критичные решения

1. **Деньги** — в рублях как `number` (минорные единицы не нужны для UI). Поле — явно `*Rub`. Если бэк хочет копейки — пусть это будет `*Kop`, но конвертация на стороне клиента.
2. **Пагинация** — page-based (`page`, `pageSize`, `total`) для списков с сортировкой; cursor — только для `/events`.
3. **Multi-select фильтры** — повторяющиеся параметры (`?status=active&status=pending`), OpenAPI `style=form, explode=true`.
4. **Сортировка** — whitelist полей (`sort=volume30d&dir=desc`), 400 на невалидное.
5. **Кэш / свежесть** — `Cache-Control: max-age=60` на `/kpi` и `/stats`; `no-cache` на `/{id}` (важна актуальность после edit).
6. **Идемпотентность мутаций** — `Idempotency-Key` header на `/block`, `/approve`, `/unblock`, `POST /merchants`.
7. **Формат ошибок** (совместим с `ApiError` в `src/api/client.ts`):
   ```json
   {
     "code": "MERCHANT_NOT_FOUND",
     "message": "Мерчант mrch_8241 не найден",
     "details": {},
     "traceId": "01HX…"
   }
   ```
8. **Ролевая модель** — BFF проверяет скоупы Keycloak (`merchants:read`, `merchants:write`, `merchants:approve`). Action-кнопки в drawer прячутся по скоупам — поле в `/me` или флаги в ответе мерчанта (`_actions: { canBlock, canApprove }`).
9. **`riskLevel` без Risk Service** — временно вернуть статичное поле в Merchant Service с TODO-меткой, чтобы потом заменить.
10. **Экспорт** — асинхронный job (`POST /merchants/export → { jobId }`, потом `GET /jobs/{id}`) если выгрузка >10 000 строк. Иначе синхронный stream.

---

## 5. Следующие шаги

1. Подтвердить с бэк-лидом: реально ли есть отдельные Merchant / Reporting / Audit-сервисы, или сейчас монолит. Контракт тот же — поменяется только владелец.
2. Сгенерировать OpenAPI-файл (`docs/api/merchants.yaml`) → `openapi-typescript` → `src/api/types/merchants.ts` (заменит ручной `merchants-mock.ts`).
3. Поднять MSW с этими эндпоинтами — фронт переключается на сетевой слой, моки отдаются sw-перехватчиком из тех же данных.
