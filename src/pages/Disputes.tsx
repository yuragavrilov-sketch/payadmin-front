import { useState, useEffect, useMemo } from 'react';
import {
  Alert, Card, Col, Row, Space, Button, Tag, Select,
  Table, Drawer, Tabs, Descriptions, Timeline, Typography, Flex, Upload,
  Input, Avatar, Checkbox, theme as antdTheme, Badge,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DownloadOutlined, ReloadOutlined, PlusOutlined,
  WarningOutlined, CloseOutlined, CloudUploadOutlined,
  FileTextOutlined, FilePdfOutlined, FileImageOutlined,
  FileOutlined, ClockCircleOutlined, CheckOutlined,
  MessageOutlined, SendOutlined, DeleteOutlined,
} from '@ant-design/icons';
import {
  disputes, disputesKpi, stageLabels, stageColors, networkLabels,
  type Dispute, type DisputeStage, type EvidenceItem,
} from '../disputes-mock';
import Kpi from '../components/Kpi';
import { brand } from '../theme';

const { Title, Text } = Typography;
const { TextArea } = Input;

const fmtRub = (n: number) =>
  n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ============================== COUNTDOWN ============================== */

type Urgency = 'urgent' | 'warn' | 'ok' | 'past';

function useNow(tickMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), tickMs);
    return () => window.clearInterval(id);
  }, [tickMs]);
  return now;
}

function formatCountdown(dueMs: number, nowMs: number): { text: string; urgency: Urgency } {
  const diff = dueMs - nowMs;
  if (diff <= 0) {
    const past = Math.abs(diff);
    const d = Math.floor(past / 86400000);
    return { text: d > 0 ? `просрочено ${d}д` : 'просрочено', urgency: 'past' };
  }
  const s = Math.floor(diff / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  let text: string;
  if (d > 0) text = `${d}д ${h}ч`;
  else if (h >= 24) text = `${h}ч`;
  else if (h > 0) text = `${h}ч ${String(m).padStart(2, '0')}м`;
  else text = `${m}м ${String(sec).padStart(2, '0')}с`;
  const urgency: Urgency = diff < 24 * 3600 * 1000 ? 'urgent'
    : diff < 72 * 3600 * 1000 ? 'warn' : 'ok';
  return { text, urgency };
}

function Countdown({ dueMs, now, showIcon = false }: { dueMs: number; now: number; showIcon?: boolean }) {
  const { token } = antdTheme.useToken();
  const { text, urgency } = formatCountdown(dueMs, now);
  const color = urgency === 'urgent' ? token.colorError
    : urgency === 'warn' ? token.colorWarning
    : urgency === 'past' ? token.colorError
    : token.colorTextSecondary;
  const isUrgent = urgency === 'urgent' || urgency === 'past';
  return (
    <span className="mono countdown" style={{ color, fontWeight: isUrgent ? 600 : 400 }}>
      {showIcon && <ClockCircleOutlined className="text-xs" />}
      {text}
    </span>
  );
}

/* ============================== EVIDENCE ============================== */

function evidenceIcon(type: EvidenceItem['type']) {
  if (type === 'receipt' || type === 'terms') return <FilePdfOutlined style={{ color: '#c8381e' }} />;
  if (type === 'delivery_proof') return <FileImageOutlined style={{ color: brand.rust }} />;
  if (type === 'communication') return <FileTextOutlined style={{ color: '#1f6b94' }} />;
  return <FileOutlined />;
}

function EvidenceList({ items }: { items: EvidenceItem[] }) {
  const { token } = antdTheme.useToken();
  if (!items.length) {
    return (
      <div className="evidence-empty"
        style={{ border: `1px dashed ${token.colorBorder}` }}>
        <Text type="secondary" className="text-sm">Ещё ничего не загружено</Text>
      </div>
    );
  }
  return (
    <Flex vertical gap={6}>
      {items.map(ev => (
        <Flex key={ev.id} align="center" gap={10}
          className="evidence-item"
          style={{
            border: `1px solid ${token.colorBorderSecondary}`,
            background: token.colorFillQuaternary,
          }}>
          <span className="text-lg" style={{ flexShrink: 0 }}>{evidenceIcon(ev.type)}</span>
          <Flex vertical style={{ flex: 1, minWidth: 0 }}>
            <Text className="text-base fw-500" ellipsis>{ev.name}</Text>
            <Text type="secondary" className="text-xs">
              {ev.sizeKb} KB · загрузил {ev.by} · {ev.uploadedAt}
            </Text>
          </Flex>
          <Button size="small" type="text" icon={<DeleteOutlined />} aria-label="Удалить" />
        </Flex>
      ))}
    </Flex>
  );
}

/* ============================== TIMELINE ============================== */

function MessageTimeline({ dispute }: { dispute: Dispute }) {
  const { token } = antdTheme.useToken();
  const actorMeta: Record<string, { label: string; color: string }> = {
    network:  { label: 'Сеть',     color: '#531dab' },
    acquirer: { label: 'Эквайер',  color: '#0958d9' },
    operator: { label: 'Оператор', color: brand.rust },
    merchant: { label: 'Мерчант',  color: token.colorSuccess },
  };

  return (
    <Timeline
      items={dispute.messages.map(m => {
        const meta = actorMeta[m.from];
        return {
          color: meta.color,
          dot: <Avatar size={22} style={{ background: meta.color, fontSize: 10 }}>
            {meta.label.slice(0, 1)}
          </Avatar>,
          children: (
            <div className="text-base">
              <Space size={6} style={{ marginBottom: 2 }}>
                <Text strong className="text-sm" style={{ color: meta.color }}>{meta.label}</Text>
                <Text type="secondary" className="mono text-xs">{m.ts}</Text>
              </Space>
              <div style={{ lineHeight: 1.55 }}>{m.body}</div>
            </div>
          ),
        };
      })}
    />
  );
}

/* ============================== DRAWER ============================== */

interface DisputePanelProps {
  dispute: Dispute | null;
  dueMs: number | null;
  onClose: () => void;
  now: number;
}

function DisputePanel({ dispute, dueMs, onClose, now }: DisputePanelProps) {
  const { token } = antdTheme.useToken();
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>([]);
  const [responseText, setResponseText] = useState('');

  if (!dispute || dueMs == null) return null;

  const canRespond = dispute.stage === 'response_due' || dispute.stage === 'notification';

  const OverviewTab = (
    <Descriptions bordered column={1} size="small"
      styles={{ label: { background: token.colorFillQuaternary, width: 130 } }}
      className="desc-label"
      items={[
        { key: 'case', label: 'Кейс', children: <Text className="mono">{dispute.caseNumber}</Text> },
        { key: 'txn', label: 'Транзакция', children: (
          <Text className="mono" copyable={{ text: dispute.txnId }}>{dispute.txnId}</Text>
        ) },
        { key: 'mrch', label: 'Мерчант', children: <>{dispute.merchant}<br /><Text type="secondary" className="mono cell-sub">{dispute.merchantId}</Text></> },
        { key: 'amt', label: 'Сумма', children: <span className="fw-600 text-lg">₽ {fmtRub(dispute.amount)}</span> },
        { key: 'net', label: 'Сеть', children: networkLabels[dispute.network] },
        { key: 'reason', label: 'Причина', children: (
          <Flex vertical gap={2}>
            <Tag color="purple" style={{ margin: 0, width: 'fit-content' }}>{dispute.reasonCode}</Tag>
            <Text className="text-sm">{dispute.reasonLabel}</Text>
          </Flex>
        ) },
        { key: 'holder', label: 'Держатель карты', children: <Text className="mono">{dispute.cardholder}</Text> },
        { key: 'acq', label: 'Эквайер', children: dispute.acquirer },
        { key: 'opened', label: 'Открыт', children: <Text className="mono cell-id">{dispute.openedAt}</Text> },
        { key: 'due', label: 'Дедлайн', children: (
          <Flex align="center" gap={10}>
            <Countdown dueMs={dueMs} now={now} showIcon />
            <Text type="secondary" className="text-xs">
              {canRespond ? 'ответ эквайеру' : 'нет открытых действий'}
            </Text>
          </Flex>
        ) },
      ]} />
  );

  const EvidenceTab = (
    <Flex vertical gap={14}>
      <Upload.Dragger multiple showUploadList={false}
        beforeUpload={() => false}
        style={{ padding: '12px 8px' }}>
        <p className="upload-icon" style={{ margin: 0 }}>
          <CloudUploadOutlined style={{ color: brand.rust }} />
        </p>
        <p className="upload-title">
          Перетащите файлы сюда или кликните
        </p>
        <p className="upload-hint" style={{ color: token.colorTextSecondary }}>
          PDF, PNG, JPG, TXT · до 10 МБ · максимум 12 файлов
        </p>
      </Upload.Dragger>

      <div>
        <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
          <Text strong className="text-base">
            Загружено <Tag style={{ marginInlineStart: 4 }}>{dispute.evidence.length} / 12</Tag>
          </Text>
          <Text type="secondary" className="text-xs">выбрать для ответа — кликнуть по чек-боксу</Text>
        </Flex>
        <EvidenceList items={dispute.evidence} />
      </div>
    </Flex>
  );

  const TimelineTab = <MessageTimeline dispute={dispute} />;

  const ResponseTab = (
    <Flex vertical gap={14}>
      {!canRespond && (
        <Alert type="info" showIcon
          message="Ответ не требуется"
          description={`Кейс в стадии «${stageLabels[dispute.stage]}». Форма ответа недоступна.`} />
      )}

      <div>
        <Text strong className="text-base" style={{ display: 'block', marginBottom: 6 }}>
          1. Приложить эвиденсы
        </Text>
        {dispute.evidence.length === 0 ? (
          <Alert type="warning" showIcon message="Нет загруженных эвиденсов. Перейдите на вкладку «Эвиденсы»." />
        ) : (
          <Flex vertical gap={6}>
            {dispute.evidence.map(ev => (
              <label key={ev.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '6px 10px', border: `1px solid ${token.colorBorderSecondary}`,
                borderRadius: 4, cursor: 'pointer',
                background: selectedEvidence.includes(ev.id) ? token.colorFillQuaternary : 'transparent',
              }}>
                <Checkbox checked={selectedEvidence.includes(ev.id)}
                  onChange={e => {
                    setSelectedEvidence(s => e.target.checked
                      ? [...s, ev.id]
                      : s.filter(id => id !== ev.id));
                  }}
                  disabled={!canRespond} />
                <span className="text-lg">{evidenceIcon(ev.type)}</span>
                <Flex vertical style={{ flex: 1, minWidth: 0 }}>
                  <Text className="text-base fw-500" ellipsis>{ev.name}</Text>
                  <Text type="secondary" className="text-xs">{ev.sizeKb} KB</Text>
                </Flex>
              </label>
            ))}
          </Flex>
        )}
      </div>

      <div>
        <Text strong className="text-base" style={{ display: 'block', marginBottom: 6 }}>
          2. Сопроводительное письмо
          <Text type="secondary" className="fw-400 text-xs" style={{ marginLeft: 6 }}>
            англ., для передачи в сеть
          </Text>
        </Text>
        <TextArea rows={5}
          value={responseText}
          onChange={e => setResponseText(e.target.value)}
          placeholder="Merchant confirms delivery on 2026-04-12 (tracking RU1234567). Cardholder attempted refund on day 18, beyond 14-day policy. See attached terms, receipt, delivery proof, chat transcript."
          disabled={!canRespond}
          maxLength={2000}
          showCount />
      </div>

      <Flex justify="space-between" align="center">
        <Text type="secondary" className="text-xs">
          Выбрано эвиденсов: <b>{selectedEvidence.length}</b> · символов: <b>{responseText.length}</b>
        </Text>
        <Space size={6}>
          <Button disabled={!canRespond}>Сохранить черновик</Button>
          <Button type="primary" icon={<SendOutlined />}
            disabled={!canRespond || selectedEvidence.length === 0 || responseText.trim().length < 20}>
            Отправить эквайеру
          </Button>
        </Space>
      </Flex>
    </Flex>
  );

  return (
    <Drawer
      open={!!dispute}
      onClose={onClose}
      width={520}
      mask={false}
      closeIcon={<CloseOutlined />}
      title={
        <Space direction="vertical" size={2} style={{ width: '100%' }}>
          <Text type="secondary" className="mono drawer-id">
            {dispute.id} · кейс {dispute.caseNumber}
          </Text>
          <div className="drawer-title" style={{ color: token.colorText }}>
            ₽ {fmtRub(dispute.amount)}
            <Text type="secondary" className="drawer-amount-suffix">RUB</Text>
          </div>
          <Space size={6} className="drawer-tags">
            <Tag color={stageColors[dispute.stage]}>{stageLabels[dispute.stage]}</Tag>
            <Tag color="purple">{dispute.reasonCode}</Tag>
            <Tag>{networkLabels[dispute.network]}</Tag>
            {canRespond && <Countdown dueMs={dueMs} now={now} showIcon />}
          </Space>
        </Space>
      }
      styles={{
        header: { padding: 16, borderBottom: `1px solid ${token.colorBorderSecondary}` },
        body: { padding: 0 },
      }}
    >
      <Tabs
        defaultActiveKey="overview"
        className="drawer-tabs"
        items={[
          { key: 'overview', label: 'Обзор', children: <div className="tab-content">{OverviewTab}</div> },
          {
            key: 'evidence',
            label: <>Эвиденсы <Badge count={dispute.evidence.length} size="small" style={{ marginLeft: 4 }} showZero color={token.colorBorder} /></>,
            children: <div className="tab-content">{EvidenceTab}</div>,
          },
          {
            key: 'timeline',
            label: <>Таймлайн <Badge count={dispute.messages.length} size="small" style={{ marginLeft: 4 }} showZero color={token.colorBorder} /></>,
            children: <div className="tab-content">{TimelineTab}</div>,
          },
          {
            key: 'response',
            label: <Flex align="center" gap={4}>Ответ {canRespond && <Badge status="processing" />}</Flex>,
            children: <div className="tab-content">{ResponseTab}</div>,
          },
        ]}
      />
    </Drawer>
  );
}

/* ============================== PAGE ============================== */

export default function DisputesPage() {
  const [selected, setSelected] = useState<Dispute | null>(null);
  const now = useNow(1000);

  const deadlines = useMemo(
    () => new Map(disputes.map(d => [d.id, Date.now() + d.hoursLeft * 3600 * 1000])),
    []
  );

  const urgentCount = disputes.filter(d =>
    (d.stage === 'response_due' || d.stage === 'notification') &&
    (deadlines.get(d.id)! - now) < 24 * 3600 * 1000 &&
    (deadlines.get(d.id)! - now) > 0
  ).length;

  const columns: ColumnsType<Dispute> = useMemo(() => [
    {
      title: 'Кейс', dataIndex: 'caseNumber', key: 'caseNumber', width: 130,
      render: (_, r) => (
        <>
          <div className="cell-name">{r.caseNumber}</div>
          <Text type="secondary" className="mono cell-sub">{r.id.slice(0, 18)}…</Text>
        </>
      ),
    },
    {
      title: 'Мерчант / Транзакция', key: 'merchant',
      render: (_, r) => (
        <>
          <div className="cell-name">{r.merchant}</div>
          <Text type="secondary" className="mono cell-sub">{r.txnId}</Text>
        </>
      ),
    },
    {
      title: 'Сумма', dataIndex: 'amount', key: 'amount', align: 'right', width: 130,
      render: (v, r) => (
        <span className="cell-amount">
          {fmtRub(v)}
          <Text type="secondary" className="cell-amount-suffix">{r.currency}</Text>
        </span>
      ),
      sorter: (a, b) => a.amount - b.amount,
    },
    {
      title: 'Причина', key: 'reason', width: 160,
      render: (_, r) => (
        <Flex vertical gap={2}>
          <Tag color="purple" style={{ margin: 0, width: 'fit-content' }}>{r.reasonCode}</Tag>
          <Text type="secondary" className="cell-sub" ellipsis>{r.reasonLabel}</Text>
        </Flex>
      ),
    },
    {
      title: 'Сеть', dataIndex: 'network', key: 'network', width: 90,
      render: v => <Text className="mono cell-sub" type="secondary">{networkLabels[v as Dispute['network']]}</Text>,
    },
    {
      title: 'Стадия', dataIndex: 'stage', key: 'stage',
      render: (v: DisputeStage) => <Tag color={stageColors[v]}>{stageLabels[v]}</Tag>,
      filters: Object.entries(stageLabels).map(([k, v]) => ({ text: v, value: k })),
      onFilter: (v, r) => r.stage === v,
    },
    {
      title: 'Эвиденсы', dataIndex: 'evidence', key: 'evidence', align: 'center', width: 90,
      render: (items: EvidenceItem[]) => items.length === 0
        ? <Text type="warning" className="mono cell-id">0 ⚠</Text>
        : <Text className="mono cell-id" type="secondary">{items.length}</Text>,
    },
    {
      title: 'Дедлайн', key: 'due', width: 120,
      render: (_, r) => {
        const dueMs = deadlines.get(r.id)!;
        const isResolved = ['won', 'lost', 'accepted'].includes(r.stage);
        if (isResolved) return <Text type="secondary" className="text-sm">—</Text>;
        return <Countdown dueMs={dueMs} now={now} showIcon />;
      },
      sorter: (a, b) => a.hoursLeft - b.hoursLeft,
    },
  ], [now, deadlines]);

  return (
    <Flex vertical gap={12} className="page">
      {urgentCount > 0 && (
        <Alert
          type="error" showIcon
          icon={<WarningOutlined />}
          message={<><b>{urgentCount}</b> {urgentCount === 1 ? 'диспут требует' : 'диспутов требуют'} ответа в ближайшие 24 часа.</>}
          description="Пропуск SLA = автоматический проигрыш кейса у эквайера. Откройте карточку и отправьте эвиденсы."
          action={<Button size="small" danger>К срочным</Button>}
          closable
        />
      )}

      <Card className="page-header">
        <Flex justify="space-between" align="center">
          <div>
            <Title level={4} style={{ margin: 0 }} className="fw-600">
              Диспуты{' '}
              <Tag color="processing" style={{ verticalAlign: 'middle' }}>
                <MessageOutlined /> {disputes.filter(d => d.stage === 'response_due').length} ждут ответа
              </Tag>
            </Title>
            <Text type="secondary" className="text-sm">
              Управление спорными транзакциями, загрузка эвиденсов, ответы эквайеру
            </Text>
          </div>
          <Space size={6}>
            <Button icon={<DownloadOutlined />}>Экспорт CSV</Button>
            <Button icon={<ReloadOutlined />}>Обновить</Button>
            <Button type="primary" icon={<PlusOutlined />}>Новый диспут</Button>
          </Space>
        </Flex>
      </Card>

      <Row gutter={12}>
        <Col flex={1}><Kpi title="Открытых" value={String(disputesKpi.open.value)} trendLabel={disputesKpi.open.delta} accent="warning" /></Col>
        <Col flex={1}><Kpi title="Ближайший дедлайн" value="8" suffix="ч" trendLabel={disputesKpi.nextDeadlineH.delta} accent="danger" /></Col>
        <Col flex={1}><Kpi title="Win rate (30д)" value={String(disputesKpi.winRate30d.value)} suffix="%" trendLabel={disputesKpi.winRate30d.delta} accent="ok" /></Col>
        <Col flex={1}><Kpi title="Проиграно (30д)" prefix="₽" value={fmtRub(disputesKpi.lostVolume30d.value)} trendLabel={disputesKpi.lostVolume30d.delta} /></Col>
        <Col flex={1}><Kpi title="Avg ответ" value={String(disputesKpi.avgResponseH.value)} suffix="ч" trendLabel={disputesKpi.avgResponseH.delta} /></Col>
      </Row>

      <Card className="filter-bar">
        <Flex wrap gap={6} align="center">
          <Select defaultValue="open" style={{ minWidth: 160 }} options={[
            { value: 'open', label: <><Text type="secondary">Статус: </Text>Открытые</> },
            { value: 'urgent', label: 'Срочные (<24ч)' },
            { value: 'all', label: 'Все' },
          ]} />
          <Select defaultValue="any-reason" style={{ minWidth: 160 }} options={[
            { value: 'any-reason', label: <><Text type="secondary">Причина: </Text>Любая</> },
          ]} />
          <Select defaultValue="any-net" className="filter-select" options={[
            { value: 'any-net', label: <><Text type="secondary">Сеть: </Text>Любая</> },
          ]} />
          <Select defaultValue="any-mrch" style={{ minWidth: 160 }} options={[
            { value: 'any-mrch', label: <><Text type="secondary">Мерчант: </Text>Любой</> },
          ]} />
          <Button type="link" icon={<PlusOutlined />}>Добавить фильтр</Button>
          <div className="filter-actions">
            <Space size={6}>
              <Button type="text" icon={<CheckOutlined />}>Только с эвиденсами</Button>
            </Space>
          </div>
        </Flex>
      </Card>

      <Card className="table-card"
        title={
          <Flex justify="space-between" align="center">
            <span>Диспуты <Tag>{disputes.length}</Tag></span>
            <Text type="secondary" className="table-subtitle">Сортировка по дедлайну ↑</Text>
          </Flex>
        }
      >
        <Table
          columns={columns}
          dataSource={[...disputes].sort((a, b) => a.hoursLeft - b.hoursLeft)}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          rowClassName={(r) => r.id === selected?.id ? 'ant-table-row-selected' : ''}
          onRow={r => ({ onClick: () => setSelected(r) })}
        />
      </Card>

      <DisputePanel
        dispute={selected}
        dueMs={selected ? deadlines.get(selected.id) ?? null : null}
        onClose={() => setSelected(null)}
        now={now}
      />
    </Flex>
  );
}
