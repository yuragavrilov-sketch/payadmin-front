export type DisputeStage =
  | 'notification'
  | 'response_due'
  | 'acquirer_review'
  | 'arbitration'
  | 'won'
  | 'lost'
  | 'accepted';

export interface EvidenceItem {
  id: string;
  name: string;
  type: 'receipt' | 'communication' | 'shipping' | 'terms' | 'delivery_proof' | 'other';
  sizeKb: number;
  uploadedAt: string;
  by: string;
}

export interface DisputeMessage {
  ts: string;
  from: 'acquirer' | 'merchant' | 'operator' | 'network';
  body: string;
}

export interface Dispute {
  id: string;
  caseNumber: string;
  txnId: string;
  merchant: string;
  merchantId: string;
  amount: number;
  currency: 'RUB';
  reasonCode: string;
  reasonLabel: string;
  network: 'visa' | 'mc' | 'mir' | 'amex';
  stage: DisputeStage;
  openedAt: string;
  /** Hours remaining until deadline from "now" (live computation). */
  hoursLeft: number;
  acquirer: string;
  cardholder: string;
  evidence: EvidenceItem[];
  messages: DisputeMessage[];
}

export const stageLabels: Record<DisputeStage, string> = {
  notification: 'Уведомление',
  response_due: 'Ждёт ответа',
  acquirer_review: 'Эквайер разбирает',
  arbitration: 'Арбитраж',
  won: 'Выиграно',
  lost: 'Проиграно',
  accepted: 'Принято',
};

export const stageColors: Record<DisputeStage, 'default' | 'processing' | 'warning' | 'error' | 'success'> = {
  notification: 'processing',
  response_due: 'warning',
  acquirer_review: 'processing',
  arbitration: 'error',
  won: 'success',
  lost: 'error',
  accepted: 'default',
};

export const networkLabels: Record<Dispute['network'], string> = {
  visa: 'VISA',
  mc: 'Mastercard',
  mir: 'МИР',
  amex: 'Amex',
};

const sampleEvidence = (prefix: string): EvidenceItem[] => [
  { id: `${prefix}-ev1`, name: 'receipt-A882391.pdf', type: 'receipt', sizeKb: 142, uploadedAt: '2026-04-14 18:12', by: 'ops.smirnova' },
  { id: `${prefix}-ev2`, name: 'delivery-track-RU1234.png', type: 'delivery_proof', sizeKb: 386, uploadedAt: '2026-04-14 18:14', by: 'ops.smirnova' },
  { id: `${prefix}-ev3`, name: 'refund-policy.pdf', type: 'terms', sizeKb: 89, uploadedAt: '2026-04-14 18:15', by: 'ops.smirnova' },
  { id: `${prefix}-ev4`, name: 'chat-transcript.txt', type: 'communication', sizeKb: 12, uploadedAt: '2026-04-14 18:18', by: 'ops.smirnova' },
];

const sampleMessages = (stage: DisputeStage): DisputeMessage[] => {
  const base: DisputeMessage[] = [
    { ts: '2026-04-13 09:14', from: 'network', body: 'Dispute initiated by cardholder. Reason code 4853 — Cardholder Disputes Quality.' },
    { ts: '2026-04-13 09:22', from: 'acquirer', body: 'Передача кейса в Платёж. SLA ответа — 7 дней.' },
  ];
  if (stage === 'response_due' || stage === 'acquirer_review' || stage === 'arbitration' || stage === 'won' || stage === 'lost') {
    base.push({ ts: '2026-04-14 16:02', from: 'operator', body: 'Запрошены эвиденсы у мерчанта: доставка подтверждена, возврат отклонён по политике 14 дней.' });
  }
  if (stage === 'acquirer_review' || stage === 'arbitration' || stage === 'won' || stage === 'lost') {
    base.push({ ts: '2026-04-15 10:44', from: 'operator', body: 'Ответ отправлен: 4 документа (receipt, delivery proof, terms, chat transcript).' });
  }
  if (stage === 'won') {
    base.push({ ts: '2026-04-18 11:20', from: 'network', body: 'Case closed in merchant favour. ₽18 740 оставлены у мерчанта.' });
  }
  if (stage === 'lost') {
    base.push({ ts: '2026-04-18 11:20', from: 'network', body: 'Case closed in cardholder favour. ₽18 740 возвращены клиенту.' });
  }
  return base;
};

export const disputes: Dispute[] = [
  {
    id: 'disp_01HYC8A2K3F1M',
    caseNumber: 'C260415-001',
    txnId: 'txn_01HXQ8ZHT14K',
    merchant: 'Lamoda',
    merchantId: 'mrch_6451',
    amount: 18740.00,
    currency: 'RUB',
    reasonCode: '4853',
    reasonLabel: 'Cardholder Disputes Quality',
    network: 'visa',
    stage: 'response_due',
    openedAt: '2026-04-13 09:14',
    hoursLeft: 18, // URGENT
    acquirer: 'Tinkoff',
    cardholder: 'В. С*****ов',
    evidence: [sampleEvidence('d1')[0]],
    messages: sampleMessages('response_due'),
  },
  {
    id: 'disp_01HYC7N1X0AB9',
    caseNumber: 'C260415-002',
    txnId: 'txn_01HXQ8ZFA9Q0',
    merchant: 'Booking',
    merchantId: 'mrch_6691',
    amount: 218400.00,
    currency: 'RUB',
    reasonCode: '4855',
    reasonLabel: 'Goods / Services Not Provided',
    network: 'amex',
    stage: 'response_due',
    openedAt: '2026-04-14 11:02',
    hoursLeft: 46, // warn
    acquirer: 'Tinkoff (cross-border)',
    cardholder: 'A. P*****a',
    evidence: [],
    messages: sampleMessages('response_due'),
  },
  {
    id: 'disp_01HYC6B4M2P7Q',
    caseNumber: 'C260414-017',
    txnId: 'txn_01HXQ8ZDX2P3',
    merchant: 'TSUM',
    merchantId: 'mrch_9001',
    amount: 342100.00,
    currency: 'RUB',
    reasonCode: '4837',
    reasonLabel: 'Fraud — No Cardholder Authorization',
    network: 'mc',
    stage: 'response_due',
    openedAt: '2026-04-14 07:40',
    hoursLeft: 8, // VERY URGENT
    acquirer: 'Tinkoff',
    cardholder: 'E. K******a',
    evidence: sampleEvidence('d3').slice(0, 2),
    messages: sampleMessages('response_due'),
  },
  {
    id: 'disp_01HYC5Q8T1L2N',
    caseNumber: 'C260414-011',
    txnId: 'txn_01HXQ8ZGX2L4',
    merchant: 'DNS Shop',
    merchantId: 'mrch_4420',
    amount: 124800.00,
    currency: 'RUB',
    reasonCode: '4834',
    reasonLabel: 'Duplicate Processing',
    network: 'visa',
    stage: 'acquirer_review',
    openedAt: '2026-04-11 14:22',
    hoursLeft: 144,
    acquirer: 'Tinkoff',
    cardholder: 'М. И*****ев',
    evidence: sampleEvidence('d4'),
    messages: sampleMessages('acquirer_review'),
  },
  {
    id: 'disp_01HYC4P7R3K8M',
    caseNumber: 'C260413-008',
    txnId: 'txn_01HXQ7Y8K1A9N',
    merchant: 'Citilink',
    merchantId: 'mrch_4802',
    amount: 54200.00,
    currency: 'RUB',
    reasonCode: '4863',
    reasonLabel: 'Cardholder Does Not Recognize',
    network: 'mir',
    stage: 'notification',
    openedAt: '2026-04-15 06:12',
    hoursLeft: 168,
    acquirer: 'Tinkoff',
    cardholder: 'Д. С****ев',
    evidence: [],
    messages: [
      { ts: '2026-04-15 06:12', from: 'network', body: 'Dispute initiated by cardholder. Reason code 4863.' },
      { ts: '2026-04-15 06:30', from: 'acquirer', body: 'Ожидание передачи в Платёж, SLA старт через 24ч.' },
    ],
  },
  {
    id: 'disp_01HYC3K2Q9J4L',
    caseNumber: 'C260408-042',
    txnId: 'txn_01HXR5B2P8D7X',
    merchant: 'Aviasales',
    merchantId: 'mrch_5512',
    amount: 89600.00,
    currency: 'RUB',
    reasonCode: '4855',
    reasonLabel: 'Goods / Services Not Provided',
    network: 'mc',
    stage: 'arbitration',
    openedAt: '2026-04-01 12:00',
    hoursLeft: 72,
    acquirer: 'Tinkoff (cross-border)',
    cardholder: 'О. В*****а',
    evidence: sampleEvidence('d6'),
    messages: sampleMessages('arbitration'),
  },
  {
    id: 'disp_01HYC2M8V5H3K',
    caseNumber: 'C260402-105',
    txnId: 'txn_01HXP2L9M3B5Y',
    merchant: 'Ozon',
    merchantId: 'mrch_8241',
    amount: 12480.00,
    currency: 'RUB',
    reasonCode: '4853',
    reasonLabel: 'Cardholder Disputes Quality',
    network: 'visa',
    stage: 'won',
    openedAt: '2026-04-02 14:30',
    hoursLeft: -120, // resolved
    acquirer: 'Tinkoff',
    cardholder: 'В. С*****ов',
    evidence: sampleEvidence('d7'),
    messages: sampleMessages('won'),
  },
  {
    id: 'disp_01HYC1A4F2G7H',
    caseNumber: 'C260401-019',
    txnId: 'txn_01HXN8K2C3F9V',
    merchant: 'Wildberries',
    merchantId: 'mrch_8102',
    amount: 3290.50,
    currency: 'RUB',
    reasonCode: '4831',
    reasonLabel: 'Incorrect Amount',
    network: 'mc',
    stage: 'lost',
    openedAt: '2026-04-01 09:15',
    hoursLeft: -240,
    acquirer: 'Tinkoff',
    cardholder: 'Н. Б****ин',
    evidence: sampleEvidence('d8').slice(0, 2),
    messages: sampleMessages('lost'),
  },
];

export const disputesKpi = {
  open: { value: 7, delta: '+3 за 24ч' },
  winRate30d: { value: 68.2, delta: '+2.4 pp vs прошлый период' },
  lostVolume30d: { value: 184500, delta: '−18% vs прошлый период' },
  avgResponseH: { value: 42, delta: 'SLA норм' },
  nextDeadlineH: { value: 8, delta: 'C260414-017 · TSUM' },
};
