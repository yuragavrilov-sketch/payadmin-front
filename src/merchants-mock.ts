export type MerchantStatus = 'active' | 'blocked' | 'pending' | 'test';

export interface TariffRow {
  method: string;
  percent: number;
  fixRub: number;
  minRub: number;
  holdDays: number;
}

export interface MerchantEvent {
  ts: string;
  label: string;
  detail?: string;
  state: 'ok' | 'warn' | 'fail' | 'info';
}

export interface Merchant {
  id: string;
  name: string;
  legalName: string;
  inn: string;
  mcc: string;
  mccLabel: string;
  status: MerchantStatus;
  riskLevel: 'low' | 'mid' | 'hi';
  volume30d: number;
  txnCount30d: number;
  successRate: number;
  disputesOpen: number;
  disputeRate: number;
  avgTicket: number;
  connectedAt: string;
  manager: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  country: string;
  tariffs: TariffRow[];
  events: MerchantEvent[];
}

type Row = [
  string, string, string, string,       // id, name, legalName, inn
  string, string, MerchantStatus,        // mcc, mccLabel, status
  'low' | 'mid' | 'hi',                 // riskLevel
  number, number, number,               // volume30d, txnCount30d, successRate
  number, number, number,               // disputesOpen, disputeRate, avgTicket
  string, string,                        // connectedAt, manager
];

const seed: Row[] = [
  ['mrch_8241', 'Ozon', 'ООО «Интернет Решения»', '7704217370', '5411', 'Маркетплейс', 'active', 'low', 18_420_000, 42_810, 96.2, 2, 0.12, 4_302, '2024-03-12', 'Иванова А.С.'],
  ['mrch_8102', 'Wildberries', 'ООО «Вайлдберриз»', '7721546864', '5411', 'Маркетплейс', 'active', 'low', 14_890_000, 38_210, 95.8, 1, 0.08, 3_897, '2024-01-20', 'Иванова А.С.'],
  ['mrch_7721', 'Yandex.Market', 'ООО «Яндекс.Маркет»', '7704340310', '5411', 'Маркетплейс', 'active', 'low', 9_120_000, 21_450, 97.1, 0, 0.04, 4_251, '2024-04-05', 'Петров Д.К.'],
  ['mrch_6451', 'Lamoda', 'ООО «Ламода»', '7728770381', '5651', 'Одежда и обувь', 'active', 'mid', 5_340_000, 12_890, 93.4, 3, 0.31, 4_142, '2024-02-14', 'Петров Д.К.'],
  ['mrch_5512', 'Aviasales', 'ООО «Авиасейлс»', '7840491748', '4722', 'Туризм', 'active', 'mid', 8_710_000, 8_920, 91.2, 4, 0.52, 9_764, '2024-05-22', 'Сидорова Е.В.'],
  ['mrch_9821', 'SberMegaMarket', 'ООО «СберМегаМаркет»', '7707388849', '5411', 'Маркетплейс', 'active', 'low', 6_230_000, 18_340, 96.9, 0, 0.05, 3_397, '2024-06-10', 'Иванова А.С.'],
  ['mrch_4420', 'DNS Shop', 'ООО «ДНС Ритейл»', '2540167061', '5732', 'Электроника', 'active', 'hi', 11_800_000, 9_120, 89.4, 5, 0.78, 12_939, '2024-01-08', 'Сидорова Е.В.'],
  ['mrch_3115', 'Samokat', 'ООО «Умная доставка»', '9715303469', '5411', 'Продукты', 'active', 'low', 2_180_000, 31_210, 98.1, 0, 0.02, 699, '2024-07-15', 'Козлов И.М.'],
  ['mrch_4802', 'Citilink', 'ООО «Ситилинк»', '7718775818', '5732', 'Электроника', 'active', 'mid', 7_940_000, 7_840, 92.8, 2, 0.42, 10_128, '2024-03-28', 'Сидорова Е.В.'],
  ['mrch_2209', 'Perekrestok', 'ООО «Перекрёсток»', '7728602010', '5411', 'Продукты', 'active', 'low', 3_890_000, 28_490, 97.6, 0, 0.03, 1_365, '2024-08-02', 'Козлов И.М.'],
  ['mrch_6691', 'Booking RU', 'ООО «Букинг.ком Раша»', '7703389880', '7011', 'Отели', 'blocked', 'hi', 0, 0, 0, 8, 2.10, 0, '2024-02-05', 'Сидорова Е.В.'],
  ['mrch_3044', 'Kinopoisk', 'ООО «Кинопоиск»', '7704219515', '7832', 'Медиа', 'active', 'low', 1_420_000, 18_900, 98.4, 0, 0.01, 751, '2024-09-11', 'Козлов И.М.'],
  ['mrch_7182', 'Yandex Go', 'ООО «Яндекс.Такси»', '7704270725', '4121', 'Мобильность', 'active', 'low', 4_560_000, 52_100, 97.9, 1, 0.06, 875, '2024-04-18', 'Петров Д.К.'],
  ['mrch_9001', 'TSUM', 'ООО «Торговый дом ЦУМ»', '7710030411', '5311', 'Люкс', 'active', 'hi', 22_300_000, 4_210, 88.1, 6, 1.42, 52_969, '2024-01-15', 'Иванова А.С.'],
  ['mrch_1050', 'FlowerDelivery', 'ИП Краснова Л.В.', '772801182940', '5992', 'Цветы', 'pending', 'low', 0, 0, 0, 0, 0, 0, '2026-04-14', 'Петров Д.К.'],
  ['mrch_1051', 'TestShop DEV', 'ООО «Тестовый мерчант»', '0000000000', '5999', 'Разное', 'test', 'low', 124_000, 312, 99.0, 0, 0, 397, '2026-04-01', 'Козлов И.М.'],
];

const baseTariffs: TariffRow[] = [
  { method: 'Visa / Mastercard', percent: 1.8, fixRub: 3, minRub: 5, holdDays: 2 },
  { method: 'МИР', percent: 1.5, fixRub: 2, minRub: 4, holdDays: 1 },
  { method: 'SBP', percent: 0.7, fixRub: 0, minRub: 0, holdDays: 0 },
  { method: 'Apple Pay / Google Pay', percent: 1.9, fixRub: 3, minRub: 5, holdDays: 2 },
];

const baseEvents: MerchantEvent[] = [
  { ts: '2024-03-12 10:04', state: 'ok', label: 'Мерчант зарегистрирован', detail: 'Заявка одобрена, KYB пройден' },
  { ts: '2024-03-14 14:22', state: 'ok', label: 'Подключение API', detail: 'Выпущены ключи production' },
  { ts: '2024-04-01 09:00', state: 'info', label: 'Тариф обновлён', detail: 'Visa/MC 2.1% → 1.8% (пакет «Стандарт+»)' },
  { ts: '2024-06-15 16:31', state: 'warn', label: 'Превышен velocity-лимит', detail: '412 txn/h (лимит 400) — автоблокировка на 15 мин' },
  { ts: '2024-09-20 11:00', state: 'ok', label: 'Повышен лимит', detail: 'velocity 400 → 600 txn/h по запросу менеджера' },
  { ts: '2025-01-10 08:45', state: 'info', label: 'Смена контактного лица', detail: 'finance@ozon.ru → payments-ops@ozon.ru' },
];

export const merchants: Merchant[] = seed.map(
  ([id, name, legalName, inn, mcc, mccLabel, status, riskLevel, volume30d, txnCount30d, successRate, disputesOpen, disputeRate, avgTicket, connectedAt, manager]) => ({
    id, name, legalName, inn, mcc, mccLabel, status, riskLevel,
    volume30d, txnCount30d, successRate,
    disputesOpen, disputeRate, avgTicket,
    connectedAt, manager,
    contactEmail: `finance@${name.toLowerCase().replace(/[^a-z]/g, '')}.ru`,
    contactPhone: '+7 (495) ' + String(Math.floor(1000000 + Math.random() * 9000000)).replace(/(\d{3})(\d{2})(\d{2})/, '$1-$2-$3'),
    website: `https://${name.toLowerCase().replace(/[^a-z]/g, '')}.ru`,
    country: 'RU',
    tariffs: baseTariffs,
    events: baseEvents,
  })
);

export const merchantsKpi = {
  total: { value: 312, spark: [6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 12] },
  active: { value: 287, spark: [5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 11] },
  volume30d: { value: 116.8, unit: 'M', spark: [14, 13, 15, 14, 16, 15, 17, 16, 18, 17, 19] },
  avgTicket: { value: 4_284, spark: [10, 11, 10, 12, 11, 13, 12, 11, 12, 11, 12] },
  disputeRate: { value: 0.18, spark: [14, 12, 13, 11, 12, 10, 11, 9, 10, 8, 7] },
};

export const statusLabels: Record<MerchantStatus, string> = {
  active: 'Активен',
  blocked: 'Заблокирован',
  pending: 'На модерации',
  test: 'Тест',
};

export const statusColors: Record<MerchantStatus, 'success' | 'error' | 'warning' | 'default'> = {
  active: 'success',
  blocked: 'error',
  pending: 'warning',
  test: 'default',
};

export const riskLabels: Record<Merchant['riskLevel'], string> = {
  low: 'Низкий', mid: 'Средний', hi: 'Высокий',
};

export const riskColors: Record<Merchant['riskLevel'], string> = {
  low: '#52c41a', mid: '#faad14', hi: '#ff4d4f',
};
