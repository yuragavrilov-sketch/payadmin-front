/**
 * React-хуки поверх REST-API справочника мерчантов.
 * Все запросы проходят через `api()` → Keycloak Bearer + 401-retry.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import type {
  MerchantsListQuery, MerchantsListResponse,
  MerchantsKpiResponse, MerchantDetails, MerchantTariffs,
  MerchantStatsResponse, MerchantEventsResponse,
  PatchMerchantRequest, BlockRequest, ApproveRequest, CreateMerchantRequest,
  McсReference, ManagerReference, StatsPeriod,
} from './types';

export const merchantKeys = {
  all:     ['merchants'] as const,
  lists:   () => [...merchantKeys.all, 'list'] as const,
  list:    (q: MerchantsListQuery) => [...merchantKeys.lists(), q] as const,
  kpi:     () => [...merchantKeys.all, 'kpi'] as const,
  details: () => [...merchantKeys.all, 'detail'] as const,
  detail:  (id: string) => [...merchantKeys.details(), id] as const,
  tariffs: (id: string) => [...merchantKeys.detail(id), 'tariffs'] as const,
  stats:   (id: string, p: StatsPeriod) => [...merchantKeys.detail(id), 'stats', p] as const,
  events:  (id: string) => [...merchantKeys.detail(id), 'events'] as const,
  mcc:     () => ['reference', 'mcc'] as const,
  managers: () => ['reference', 'managers'] as const,
};

function buildListQuery(q: MerchantsListQuery): Record<string, string | number | undefined> {
  // Multi-select параметры — join запятой; серверный BFF парсит через split(',').
  // (api() умеет только плоские Record<string, scalar>, ручные repeat-параметры нужно переводить тут.)
  return {
    status:    q.status?.join(','),
    mcc:       q.mcc?.join(','),
    risk:      q.risk?.join(','),
    managerId: q.managerId?.join(','),
    search:    q.search,
    sort:      q.sort,
    dir:       q.dir,
    page:      q.page,
    pageSize:  q.pageSize,
  };
}

export function useMerchantsList(query: MerchantsListQuery = {}) {
  return useQuery({
    queryKey: merchantKeys.list(query),
    queryFn: () => api<MerchantsListResponse>('/api/v1/merchants', { query: buildListQuery(query) }),
    placeholderData: (prev) => prev,  // плавный переход между страницами пагинации
  });
}

export function useMerchantsKpi() {
  return useQuery({
    queryKey: merchantKeys.kpi(),
    queryFn: () => api<MerchantsKpiResponse>('/api/v1/merchants/kpi'),
    staleTime: 60_000,
  });
}

export function useMerchantDetails(id: string | null | undefined) {
  return useQuery({
    queryKey: merchantKeys.detail(id ?? ''),
    queryFn: () => api<MerchantDetails>(`/api/v1/merchants/${id}`),
    enabled: !!id,
  });
}

export function useMerchantTariffs(id: string | null | undefined) {
  return useQuery({
    queryKey: merchantKeys.tariffs(id ?? ''),
    queryFn: () => api<MerchantTariffs>(`/api/v1/merchants/${id}/tariffs`),
    enabled: !!id,
  });
}

export function useMerchantStats(id: string | null | undefined, period: StatsPeriod = '30d') {
  return useQuery({
    queryKey: merchantKeys.stats(id ?? '', period),
    queryFn: () => api<MerchantStatsResponse>(`/api/v1/merchants/${id}/stats`, { query: { period } }),
    enabled: !!id,
  });
}

export function useMerchantEvents(id: string | null | undefined) {
  return useQuery({
    queryKey: merchantKeys.events(id ?? ''),
    queryFn: () => api<MerchantEventsResponse>(`/api/v1/merchants/${id}/events`, { query: { limit: 50 } }),
    enabled: !!id,
  });
}

export function useBlockMerchant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: BlockRequest }) =>
      api<MerchantDetails>(`/api/v1/merchants/${id}/block`, { method: 'POST', body }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: merchantKeys.detail(id) });
      qc.invalidateQueries({ queryKey: merchantKeys.lists() });
    },
  });
}

export function useUnblockMerchant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api<MerchantDetails>(`/api/v1/merchants/${id}/unblock`, { method: 'POST' }),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: merchantKeys.detail(id) });
      qc.invalidateQueries({ queryKey: merchantKeys.lists() });
    },
  });
}

export function useApproveMerchant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body?: ApproveRequest }) =>
      api<MerchantDetails>(`/api/v1/merchants/${id}/approve`, { method: 'POST', body: body ?? {} }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: merchantKeys.detail(id) });
      qc.invalidateQueries({ queryKey: merchantKeys.lists() });
    },
  });
}

export function usePatchMerchant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: PatchMerchantRequest }) =>
      api<MerchantDetails>(`/api/v1/merchants/${id}`, { method: 'PATCH', body }),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: merchantKeys.detail(id) });
      qc.invalidateQueries({ queryKey: merchantKeys.lists() });
    },
  });
}

export function useCreateMerchant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateMerchantRequest) =>
      api<MerchantDetails>('/api/v1/merchants', { method: 'POST', body }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: merchantKeys.lists() });
      qc.invalidateQueries({ queryKey: merchantKeys.kpi() });
    },
  });
}

export function useMccReference() {
  return useQuery({
    queryKey: merchantKeys.mcc(),
    queryFn: () => api<McсReference[]>('/api/v1/reference/mcc'),
    staleTime: 5 * 60_000,
  });
}

export function useManagersReference() {
  return useQuery({
    queryKey: merchantKeys.managers(),
    queryFn: () => api<ManagerReference[]>('/api/v1/reference/managers'),
    staleTime: 5 * 60_000,
  });
}
