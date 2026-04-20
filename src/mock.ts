export type TxnStatus = 'captured' | 'authorized' | 'declined' | 'review' | 'refunded';
export type ThreeDS = 'frictionless' | 'challenge' | 'n/a';
export type CardBrand = 'visa' | 'mc' | 'mir' | 'amex' | 'apay';

export interface LifecycleEvent {
  ts: string;
  label: string;
  detail?: string;
  state: 'ok' | 'warn' | 'fail' | 'pending';
}

export interface RiskFactor {
  label: string;
  value: string;
  weight: number; // 0..100
  severity: 'low' | 'mid' | 'hi';
}

export interface Txn {
  id: string;
  rrn: string | null;
  ts: string;
  merchant: string;
  merchantId: string;
  category: string;
  amount: number;
  currency: 'RUB';
  method: CardBrand;
  panLast4: string;
  country: string;
  threeds: ThreeDS;
  risk: number;
  latencyMs: number;
  fee: number;
  status: TxnStatus;
  acquirer: string;
  binIssuer?: string;
  customerId: string;
  customerNote?: string;
  device?: string;
  geo?: string;
  order?: string;
  lifecycle: LifecycleEvent[];
  riskFactors: RiskFactor[];
}

const baseLifecycle: LifecycleEvent[] = [
  { ts: '14:31:48.204', state: 'ok', label: 'Авторизация инициирована', detail: 'checkout.ozon.ru · idem 8fe3…' },
  { ts: '14:31:48.612', state: 'ok', label: 'Риск-скоринг', detail: '18 / 100 · низкий · 0 правил сработало' },
  { ts: '14:31:49.044', state: 'ok', label: '3DS frictionless', detail: 'ACS sberbank · v2.2.0 · ECI 05' },
  { ts: '14:31:49.512', state: 'ok', label: 'Авторизовано', detail: 'Δ 468ms · auth_code 328104 · network Visa' },
  { ts: '14:31:50.001', state: 'ok', label: 'Полный capture', detail: '₽ 12 480.00 · fee ₽ 187.20' },
  { ts: 'ожид. 2026-04-17', state: 'pending', label: 'Settlement pending', detail: 'batch SB-2026-0417-012' },
];

const baseRisk: RiskFactor[] = [
  { label: 'Velocity · 24h same card', value: '2 txn', weight: 12, severity: 'low' },
  { label: 'Geo / BIN mismatch', value: '0.04', weight: 4, severity: 'low' },
  { label: 'Device reputation', value: 'trusted', weight: 8, severity: 'low' },
  { label: 'Customer tenure', value: '4.2 yr', weight: 6, severity: 'low' },
  { label: 'Amount z-score', value: '+0.9σ', weight: 34, severity: 'mid' },
  { label: 'Basket heat', value: 'calm', weight: 22, severity: 'mid' },
];

type Row = [
  string, string | null, string,
  string, string, string,
  number, CardBrand, string, string,
  ThreeDS, number, number, number,
  TxnStatus
];

const seed: Row[] = [
  ['txn_01HXQ8ZK3F2A', '234510234891', '14:31:48', 'Ozon', 'mrch_8241', 'marketplace', 12480.0, 'visa', '**** 4417', 'RU', 'frictionless', 18, 468, 187.2, 'captured'],
  ['txn_01HXQ8ZJ7B2M', '234510234888', '14:31:32', 'Wildberries', 'mrch_8102', 'marketplace', 3290.5, 'mc', '**** 2201', 'RU', 'challenge', 26, 1124, 49.36, 'captured'],
  ['txn_01HXQ8ZJ0Q9X', null, '14:31:21', 'Yandex.Market', 'mrch_7721', 'marketplace', 89900.0, 'mir', '**** 8833', 'RU', 'frictionless', 9, 512, 1348.5, 'authorized'],
  ['txn_01HXQ8ZHT14K', '234510234881', '14:30:58', 'Lamoda', 'mrch_6451', 'fashion', 18740.0, 'visa', '**** 0012', 'RU', 'challenge', 42, 2401, 0, 'declined'],
  ['txn_01HXQ8ZHM0A2', '234510234879', '14:30:41', 'Aviasales', 'mrch_5512', 'travel', 45120.0, 'mc', '**** 7789', 'TR', 'frictionless', 31, 604, 676.8, 'captured'],
  ['txn_01HXQ8ZH8F3P', '234510234874', '14:30:22', 'SberMegaMarket', 'mrch_9821', 'marketplace', 2199.0, 'apay', 'Apple Pay', 'RU', 'n/a', 11, 288, 32.98, 'captured'],
  ['txn_01HXQ8ZGX2L4', null, '14:30:12', 'DNS Shop', 'mrch_4420', 'electronics', 124800.0, 'visa', '**** 9021', 'RU', 'challenge', 67, 3102, 0, 'review'],
  ['txn_01HXQ8ZGK0Y8', '234510234870', '14:29:55', 'Samokat', 'mrch_3115', 'grocery', 784.0, 'mc', '**** 1144', 'RU', 'frictionless', 7, 401, 11.76, 'captured'],
  ['txn_01HXQ8ZG2M1R', '234510234867', '14:29:41', 'Citilink', 'mrch_4802', 'electronics', 54200.0, 'visa', '**** 3301', 'RU', 'frictionless', 22, 542, 813.0, 'captured'],
  ['txn_01HXQ8ZFP3K2', '234510234861', '14:29:18', 'Perekrestok', 'mrch_2209', 'grocery', 3210.45, 'mir', '**** 5508', 'RU', 'frictionless', 14, 389, 48.15, 'captured'],
  ['txn_01HXQ8ZFA9Q0', null, '14:29:02', 'Booking', 'mrch_6691', 'travel', 218400.0, 'amex', '**** 1003', 'GB', 'challenge', 78, 4800, 0, 'declined'],
  ['txn_01HXQ8ZED4J7', '234510234854', '14:28:47', 'Kinopoisk', 'mrch_3044', 'media', 649.0, 'visa', '**** 4417', 'RU', 'frictionless', 12, 322, 9.73, 'captured'],
  ['txn_01HXQ8ZE1B6W', '234510234850', '14:28:29', 'Yandex Go', 'mrch_7182', 'mobility', 412.0, 'apay', 'Apple Pay', 'RU', 'n/a', 10, 251, 6.18, 'captured'],
  ['txn_01HXQ8ZDX2P3', '234510234846', '14:28:10', 'TSUM', 'mrch_9001', 'luxury', 342100.0, 'mc', '**** 6612', 'FR', 'challenge', 54, 2811, 0, 'review'],
  ['txn_01HXQ8ZD7K0N', '234510234841', '14:27:55', 'Ozon', 'mrch_8241', 'marketplace', 1249.0, 'visa', '**** 4417', 'RU', 'frictionless', 15, 418, -18.74, 'refunded'],
];

export const transactions: Txn[] = seed.map(
  ([id, rrn, ts, merchant, merchantId, category, amount, method, panLast4, country, threeds, risk, latencyMs, fee, status]) => ({
    id, rrn, ts, merchant, merchantId, category,
    amount, currency: 'RUB', method, panLast4, country,
    threeds, risk, latencyMs, fee, status,
    acquirer: country === 'RU' ? 'Tinkoff' : 'Tinkoff (cross-border)',
    binIssuer: method === 'visa' ? 'Sberbank · BIN 427601' : method === 'mc' ? 'Alfa · BIN 548673' : undefined,
    customerId: 'cust_2314',
    customerNote: '214 прошлых транзакций · LTV ₽182K · с 2022-01',
    device: 'iOS 17.4 · Safari · fp f2a9…c1b',
    geo: 'Moscow, RU · 85.142.33.12',
    order: 'ord_A882391',
    lifecycle: baseLifecycle,
    riskFactors: baseRisk,
  })
);

export const kpis = {
  volume24h: { value: 42.81, unit: 'M', spark: [16, 15, 17, 13, 14, 11, 12, 8, 10, 6, 7] },
  successRate: { value: 94.31, spark: [5, 5, 6, 5, 7, 8, 6, 10, 9, 12, 13] },
  authP95: { value: 842, spark: [12, 14, 11, 13, 10, 12, 11, 12, 10, 11, 10] },
  declined24h: { value: 3204, spark: [16, 15, 14, 15, 13, 11, 12, 9, 10, 6, 4] },
  disputesOpen: { value: 7, spark: [13, 13, 14, 12, 13, 11, 12, 11, 10, 11, 9] },
};

export const brandLabels: Record<CardBrand, string> = {
  visa: 'VISA', mc: 'MC', mir: 'МИР', amex: 'AMEX', apay: '◉',
};

export const brandColors: Record<CardBrand, { bg: string; fg: string }> = {
  visa: { bg: '#e8eaf6', fg: '#1a1f71' },
  mc: { bg: '#ffebee', fg: '#eb001b' },
  mir: { bg: '#e8f5e9', fg: '#0f754e' },
  amex: { bg: '#e3f2fd', fg: '#006fcf' },
  apay: { bg: '#eeeae0', fg: '#1a1814' },
};

export const statusLabels: Record<TxnStatus, string> = {
  captured: 'Captured',
  authorized: 'Authorized',
  declined: 'Declined',
  review: 'In review',
  refunded: 'Refunded',
};

export const statusColors: Record<TxnStatus, 'success' | 'processing' | 'error' | 'warning' | 'default'> = {
  captured: 'success',
  authorized: 'processing',
  declined: 'error',
  review: 'warning',
  refunded: 'default',
};
