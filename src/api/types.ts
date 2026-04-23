/**
 * Контрактные типы REST-API админки. Соответствуют `docs/api/merchants.md`.
 */

// ============ общие ============
export type MerchantStatus = 'active' | 'blocked' | 'pending' | 'test';
export type RiskLevel = 'low' | 'mid' | 'hi';

// ============ GET /merchants ============
export type MerchantSortField =
  | 'volume30d' | 'txnCount30d' | 'successRate' | 'disputesOpen' | 'connectedAt';
export type SortDir = 'asc' | 'desc';

export interface MerchantsListQuery {
  status?: MerchantStatus[];
  mcc?: string[];
  risk?: RiskLevel[];
  managerId?: string[];
  search?: string;
  sort?: MerchantSortField;
  dir?: SortDir;
  page?: number;
  pageSize?: number;
}

export interface MerchantsListResponse {
  items: MerchantListItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface MerchantStats30d {
  volume: number;
  txnCount: number;
  successRate: number;
  disputesOpen: number;
  disputeRate: number;
  avgTicket: number;
}

export interface MerchantListItem {
  id: string;
  name: string;
  legalName: string;
  inn: string;
  mcc: string;
  mccLabel: string;
  status: MerchantStatus;
  riskLevel: RiskLevel;
  stats30d: MerchantStats30d;
  connectedAt: string;
  managerId: string;
  managerName: string;
}

// ============ GET /merchants/kpi ============
export interface MerchantsKpiResponse {
  total:       { value: number; spark: number[] };
  active:      { value: number; spark: number[] };
  volume30d:   { value: number; unit: 'M' | 'B'; spark: number[]; deltaPct: number };
  avgTicket:   { value: number; spark: number[]; deltaPct: number };
  disputeRate: { value: number; spark: number[]; deltaPp: number };
}

// ============ GET /merchants/{id} ============
export interface MerchantDetails extends MerchantListItem {
  contactEmail: string;
  contactPhone: string;
  website: string;
  country: string;
  kyb: {
    status: 'passed' | 'pending' | 'failed';
    passedAt?: string;
    provider?: string;
  };
}

// ============ GET /merchants/{id}/tariffs ============
export interface TariffRow {
  method: string;
  percent: number;
  fixRub: number;
  minRub: number;
  holdDays: number;
}

export interface MerchantTariffs {
  rows: TariffRow[];
  limits: {
    perTxnRub: number;
    dailyRub: number;
    velocityPerHour: number;
  };
  effectiveFrom: string;
}

// ============ GET /merchants/{id}/stats ============
export type StatsPeriod = '30d' | '90d' | 'ytd';

export interface MerchantStatsResponse {
  period: StatsPeriod;
  volume: number;
  txnCount: number;
  successRate: number;
  disputesOpen: number;
  disputeRate: number;
  avgTicket: number;
}

// ============ GET /merchants/{id}/events ============
export type MerchantEventState = 'ok' | 'warn' | 'fail' | 'info';

export interface MerchantEvent {
  ts: string;
  label: string;
  detail?: string;
  state: MerchantEventState;
}

export interface MerchantEventsResponse {
  items: MerchantEvent[];
  nextCursor?: string;
}

// ============ mutations ============
export interface PatchMerchantRequest {
  name?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  managerId?: string;
  riskLevel?: RiskLevel;
}

export interface BlockRequest {
  reason: string;
  ticketUrl?: string;
}

export interface ApproveRequest {
  kybNote?: string;
}

export interface CreateMerchantRequest {
  name: string;
  legalName: string;
  inn: string;
  mcc: string;
  managerId: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
}

// ============ справочники ============
export interface McсReference {
  code: string;   // "5411"
  label: string;  // "Маркетплейс"
}

export interface ManagerReference {
  id: string;     // "ivanova"
  name: string;   // "Иванова А.С."
}
