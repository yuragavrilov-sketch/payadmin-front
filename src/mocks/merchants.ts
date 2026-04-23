/**
 * MSW-хэндлеры эндпоинтов справочника мерчантов.
 * Контракт — `docs/api/merchants.md`. Данные — `src/merchants-mock.ts`.
 *
 * Работают до появления реального бэка. Переключение: просто снимаем `worker.start()`
 * в `src/main.tsx` — запросы пойдут на `VITE_API_BASE_URL`.
 */

import { http, HttpResponse, delay } from 'msw';
import type {
  MerchantsListResponse, MerchantListItem, MerchantDetails,
  MerchantStatus, RiskLevel, MerchantSortField, SortDir,
  MerchantTariffs, MerchantStatsResponse, MerchantEventsResponse,
  BlockRequest, ApproveRequest, PatchMerchantRequest, CreateMerchantRequest,
} from '../api/types';
import {
  merchants, tariffsById, eventsById, merchantsKpi,
  managers, mccReference,
} from '../merchants-mock';

// In-memory копия данных — handlers могут её мутировать (block/unblock/approve/patch).
const store: MerchantDetails[] = merchants.map(m => ({ ...m }));

const MATCH = '*/api/v1';

function toListItem(m: MerchantDetails): MerchantListItem {
  const {
    id, name, legalName, inn, mcc, mccLabel, status, riskLevel,
    stats30d, connectedAt, managerId, managerName,
  } = m;
  return { id, name, legalName, inn, mcc, mccLabel, status, riskLevel, stats30d, connectedAt, managerId, managerName };
}

function parseList(param: string | null): string[] | undefined {
  if (!param) return undefined;
  return param.split(',').map(s => s.trim()).filter(Boolean);
}

function applyFilters(list: MerchantDetails[], url: URL): MerchantDetails[] {
  const status   = parseList(url.searchParams.get('status')) as MerchantStatus[] | undefined;
  const mcc      = parseList(url.searchParams.get('mcc'));
  const risk     = parseList(url.searchParams.get('risk')) as RiskLevel[] | undefined;
  const managerId = parseList(url.searchParams.get('managerId'));
  const search   = url.searchParams.get('search')?.toLowerCase().trim();

  return list.filter(m => {
    if (status?.length    && !status.includes(m.status)) return false;
    if (mcc?.length       && !mcc.includes(m.mcc)) return false;
    if (risk?.length      && !risk.includes(m.riskLevel)) return false;
    if (managerId?.length && !managerId.includes(m.managerId)) return false;
    if (search) {
      const hay = `${m.name} ${m.legalName} ${m.inn} ${m.id}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }
    return true;
  });
}

function applySort(list: MerchantDetails[], sort: MerchantSortField | null, dir: SortDir): MerchantDetails[] {
  if (!sort) return list;
  const sign = dir === 'desc' ? -1 : 1;
  const pick = (m: MerchantDetails): number | string => {
    switch (sort) {
      case 'volume30d':    return m.stats30d.volume;
      case 'txnCount30d':  return m.stats30d.txnCount;
      case 'successRate':  return m.stats30d.successRate;
      case 'disputesOpen': return m.stats30d.disputesOpen;
      case 'connectedAt':  return m.connectedAt;
    }
  };
  return [...list].sort((a, b) => {
    const av = pick(a), bv = pick(b);
    if (av < bv) return -1 * sign;
    if (av > bv) return 1 * sign;
    return 0;
  });
}

function jsonError(status: number, code: string, message: string) {
  return HttpResponse.json({ code, message, details: {}, traceId: `mock-${Date.now()}` }, { status });
}

export const merchantsHandlers = [
  // ---- GET /merchants ----
  http.get(`${MATCH}/merchants`, async ({ request }) => {
    await delay(80);
    const url = new URL(request.url);
    const filtered = applyFilters(store, url);
    const sort = url.searchParams.get('sort') as MerchantSortField | null;
    const dir  = (url.searchParams.get('dir') ?? 'desc') as SortDir;
    const sorted = applySort(filtered, sort, dir);

    const page     = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get('pageSize') ?? '20', 10)));
    const start = (page - 1) * pageSize;
    const items = sorted.slice(start, start + pageSize).map(toListItem);

    const body: MerchantsListResponse = { items, total: sorted.length, page, pageSize };
    return HttpResponse.json(body);
  }),

  // ---- GET /merchants/kpi ----
  http.get(`${MATCH}/merchants/kpi`, async () => {
    await delay(60);
    return HttpResponse.json(merchantsKpi);
  }),

  // ---- GET /merchants/:id ----
  http.get(`${MATCH}/merchants/:id`, async ({ params }) => {
    await delay(60);
    const m = store.find(x => x.id === params.id);
    if (!m) return jsonError(404, 'MERCHANT_NOT_FOUND', `Мерчант ${params.id} не найден`);
    return HttpResponse.json(m);
  }),

  // ---- GET /merchants/:id/tariffs ----
  http.get(`${MATCH}/merchants/:id/tariffs`, async ({ params }) => {
    await delay(60);
    const rows = tariffsById.get(String(params.id));
    if (!rows) return jsonError(404, 'MERCHANT_NOT_FOUND', `Мерчант ${params.id} не найден`);
    const body: MerchantTariffs = {
      rows,
      limits: { perTxnRub: 500_000, dailyRub: 50_000_000, velocityPerHour: 600 },
      effectiveFrom: '2024-04-01',
    };
    return HttpResponse.json(body);
  }),

  // ---- GET /merchants/:id/stats?period= ----
  http.get(`${MATCH}/merchants/:id/stats`, async ({ request, params }) => {
    await delay(60);
    const m = store.find(x => x.id === params.id);
    if (!m) return jsonError(404, 'MERCHANT_NOT_FOUND', `Мерчант ${params.id} не найден`);
    const url = new URL(request.url);
    const period = (url.searchParams.get('period') ?? '30d') as MerchantStatsResponse['period'];
    // Для периодов 90d/ytd — грубо scale для демонстрации.
    const factor = period === '90d' ? 3 : period === 'ytd' ? 10 : 1;
    const body: MerchantStatsResponse = {
      period,
      volume:       m.stats30d.volume * factor,
      txnCount:     m.stats30d.txnCount * factor,
      successRate:  m.stats30d.successRate,
      disputesOpen: m.stats30d.disputesOpen,
      disputeRate:  m.stats30d.disputeRate,
      avgTicket:    m.stats30d.avgTicket,
    };
    return HttpResponse.json(body);
  }),

  // ---- GET /merchants/:id/events ----
  http.get(`${MATCH}/merchants/:id/events`, async ({ params }) => {
    await delay(60);
    const items = eventsById.get(String(params.id));
    if (!items) return jsonError(404, 'MERCHANT_NOT_FOUND', `Мерчант ${params.id} не найден`);
    const body: MerchantEventsResponse = { items };
    return HttpResponse.json(body);
  }),

  // ---- PATCH /merchants/:id ----
  http.patch(`${MATCH}/merchants/:id`, async ({ params, request }) => {
    await delay(120);
    const idx = store.findIndex(x => x.id === params.id);
    if (idx < 0) return jsonError(404, 'MERCHANT_NOT_FOUND', `Мерчант ${params.id} не найден`);
    const patch = (await request.json()) as PatchMerchantRequest;
    const prev = store[idx];
    const next: MerchantDetails = {
      ...prev,
      ...patch,
      managerName: patch.managerId
        ? (managers.find(m => m.id === patch.managerId)?.name ?? prev.managerName)
        : prev.managerName,
    };
    store[idx] = next;
    return HttpResponse.json(next);
  }),

  // ---- POST /merchants/:id/block ----
  http.post(`${MATCH}/merchants/:id/block`, async ({ params, request }) => {
    await delay(120);
    const idx = store.findIndex(x => x.id === params.id);
    if (idx < 0) return jsonError(404, 'MERCHANT_NOT_FOUND', `Мерчант ${params.id} не найден`);
    const body = (await request.json().catch(() => ({}))) as BlockRequest;
    if (!body?.reason) return jsonError(400, 'REASON_REQUIRED', 'Укажите причину блокировки');
    store[idx] = { ...store[idx], status: 'blocked' };
    return HttpResponse.json(store[idx]);
  }),

  // ---- POST /merchants/:id/unblock ----
  http.post(`${MATCH}/merchants/:id/unblock`, async ({ params }) => {
    await delay(120);
    const idx = store.findIndex(x => x.id === params.id);
    if (idx < 0) return jsonError(404, 'MERCHANT_NOT_FOUND', `Мерчант ${params.id} не найден`);
    store[idx] = { ...store[idx], status: 'active' };
    return HttpResponse.json(store[idx]);
  }),

  // ---- POST /merchants/:id/approve ----
  http.post(`${MATCH}/merchants/:id/approve`, async ({ params, request }) => {
    await delay(120);
    const idx = store.findIndex(x => x.id === params.id);
    if (idx < 0) return jsonError(404, 'MERCHANT_NOT_FOUND', `Мерчант ${params.id} не найден`);
    await request.json().catch(() => ({})) as ApproveRequest;
    if (store[idx].status !== 'pending') {
      return jsonError(409, 'INVALID_STATE', `Мерчант не в статусе pending (сейчас: ${store[idx].status})`);
    }
    store[idx] = {
      ...store[idx],
      status: 'active',
      kyb: { ...store[idx].kyb, status: 'passed', passedAt: new Date().toISOString().slice(0, 10) },
    };
    return HttpResponse.json(store[idx]);
  }),

  // ---- POST /merchants ----
  http.post(`${MATCH}/merchants`, async ({ request }) => {
    await delay(160);
    const body = (await request.json()) as CreateMerchantRequest;
    const id = `mrch_${Math.floor(1000 + Math.random() * 9000)}`;
    const mccEntry = mccReference.find(x => x.code === body.mcc);
    const mgr = managers.find(m => m.id === body.managerId);
    const created: MerchantDetails = {
      id,
      name: body.name,
      legalName: body.legalName,
      inn: body.inn,
      mcc: body.mcc,
      mccLabel: mccEntry?.label ?? body.mcc,
      status: 'pending',
      riskLevel: 'low',
      stats30d: { volume: 0, txnCount: 0, successRate: 0, disputesOpen: 0, disputeRate: 0, avgTicket: 0 },
      connectedAt: new Date().toISOString().slice(0, 10),
      managerId: body.managerId,
      managerName: mgr?.name ?? body.managerId,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      website: body.website,
      country: 'RU',
      kyb: { status: 'pending' },
    };
    store.unshift(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  // ---- GET /reference/mcc ----
  http.get(`${MATCH}/reference/mcc`, async () => {
    await delay(30);
    return HttpResponse.json(mccReference);
  }),

  // ---- GET /reference/managers ----
  http.get(`${MATCH}/reference/managers`, async () => {
    await delay(30);
    return HttpResponse.json(managers);
  }),
];
