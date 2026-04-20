import { useState, useMemo } from 'react';
import {
  Alert, Card, Col, Row, Space, Button, Tag, Select,
  Table, Drawer, Tabs, Descriptions, Timeline, Progress, Typography, Flex,
  theme as antdTheme,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DownloadOutlined, ReloadOutlined, PlusOutlined,
  WarningOutlined, CloseOutlined, PlayCircleOutlined,
  UndoOutlined, FlagOutlined, CheckCircleFilled,
} from '@ant-design/icons';
import {
  transactions, kpis, statusLabels, statusColors, brandLabels, brandColors,
  type Txn, type TxnStatus, type CardBrand,
} from '../mock';
import Kpi from '../components/Kpi';

const { Title, Text } = Typography;

const fmtRub = (n: number) =>
  n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ============================== FILTER BAR ============================== */

function FilterBar() {
  return (
    <Card className="filter-bar">
      <Flex wrap gap={6} align="center">
        <Select defaultValue="today" className="filter-select" options={[
          { value: 'today', label: <><Text type="secondary">Период: </Text>Сегодня</> },
          { value: '7d', label: 'Последние 7 дней' },
          { value: '30d', label: 'Месяц' },
        ]} />
        <Select defaultValue="all" className="filter-select" options={[
          { value: 'all', label: <><Text type="secondary">Статус: </Text>Все</> },
          { value: 'captured', label: 'Captured' },
          { value: 'declined', label: 'Declined' },
          { value: 'review', label: 'In review' },
        ]} />
        <Select defaultValue="any-mrch" className="filter-select" options={[
          { value: 'any-mrch', label: <><Text type="secondary">Мерчант: </Text>312 активных</> },
        ]} />
        <Select defaultValue="any-m" className="filter-select" options={[
          { value: 'any-m', label: <><Text type="secondary">Метод: </Text>Карта · SBP · Wlt</> },
        ]} />
        <Select defaultValue="1000" className="filter-select" options={[
          { value: '1000', label: <><Text type="secondary">Сумма: </Text>≥ ₽1 000</> },
        ]} />
        <Select defaultValue="any-3ds" className="filter-select" options={[
          { value: 'any-3ds', label: <><Text type="secondary">3DS: </Text>Любой</> },
        ]} />
        <Select defaultValue="any-risk" className="filter-select" options={[
          { value: 'any-risk', label: <><Text type="secondary">Риск: </Text>Любой</> },
        ]} />
        <Button type="link" icon={<PlusOutlined />}>Добавить фильтр</Button>
        <div className="filter-actions">
          <Space size={6}>
            <Button type="text">Сбросить</Button>
            <Button type="primary">Применить</Button>
          </Space>
        </div>
      </Flex>
    </Card>
  );
}

/* ============================== TABLE CELLS ============================== */

function BrandMark({ brand: b }: { brand: CardBrand }) {
  const { token } = antdTheme.useToken();
  const c = brandColors[b];
  return (
    <span className="brand-mark"
      style={{ border: `1px solid ${token.colorBorder}`, background: c.bg, color: c.fg }}>
      {brandLabels[b]}
    </span>
  );
}

function RiskCell({ value }: { value: number }) {
  const { token } = antdTheme.useToken();
  const color = value < 25 ? token.colorSuccess
    : value < 50 ? token.colorWarning
    : token.colorError;
  return (
    <div className="risk-cell">
      <Progress percent={Math.min(value, 100)} showInfo={false}
        size={[52, 5]} strokeColor={color} />
      <Text type="secondary" className="mono risk-label">
        {String(value).padStart(2, '0')}
      </Text>
    </div>
  );
}

function ThreedsTag({ value }: { value: Txn['threeds'] }) {
  if (value === 'n/a') return <Tag>N/A</Tag>;
  if (value === 'frictionless') return <Tag color="blue">Frictionless</Tag>;
  return <Tag color="purple">Challenge</Tag>;
}

/* ============================== DRAWER ============================== */

interface TxnPanelProps { txn: Txn | null; onClose: () => void; }

function TxnPanel({ txn, onClose }: TxnPanelProps) {
  const { token } = antdTheme.useToken();
  if (!txn) return null;

  const DetailsTab = (
    <Descriptions bordered column={1} size="small"
      styles={{ label: { background: token.colorFillQuaternary, width: 120 } }}
      className="desc-label"
      items={[
        { key: 'mrch', label: 'Мерчант', children: <>{txn.merchant}<br /><Text type="secondary" className="mono cell-sub">{txn.merchantId} · {txn.category}</Text></> },
        { key: 'acq', label: 'Эквайер', children: <>{txn.acquirer}<br /><Text type="secondary" className="mono cell-sub">mid 501-203 · {txn.country}</Text></> },
        { key: 'mth', label: 'Метод', children: <>{txn.method.toUpperCase()} · {txn.panLast4}<br /><Text type="secondary" className="mono cell-sub">{txn.binIssuer ?? '—'}</Text></> },
        { key: 'cust', label: 'Клиент', children: <>{txn.customerId}<br /><Text type="secondary" className="cell-sub">{txn.customerNote}</Text></> },
        { key: 'dev', label: 'Устройство', children: <Text className="mono cell-sub">{txn.device}</Text> },
        { key: 'geo', label: 'Гео', children: <Text className="mono cell-sub">{txn.geo}</Text> },
        { key: 'ord', label: 'Заказ', children: <Text className="mono cell-sub">{txn.order}</Text> },
      ]} />
  );

  const TimelineTab = (
    <Timeline
      items={txn.lifecycle.map(ev => ({
        color: ev.state === 'ok' ? 'green' : ev.state === 'warn' ? 'orange' : ev.state === 'fail' ? 'red' : 'gray',
        dot: ev.state === 'ok' ? <CheckCircleFilled style={{ color: token.colorSuccess }} /> : undefined,
        children: (
          <div className="text-base">
            <Text type="secondary" className="mono text-xs">{ev.ts}</Text>
            <div><b>{ev.label}</b></div>
            {ev.detail && <Text type="secondary" className="text-xs">{ev.detail}</Text>}
          </div>
        ),
      }))}
    />
  );

  const RiskTab = (
    <div>
      {txn.riskFactors.map(rf => (
        <Flex key={rf.label} align="center" gap={10}
          style={{ padding: '6px 0', borderBottom: `1px dashed ${token.colorBorderSecondary}` }}>
          <span className="text-base" style={{ flex: 1 }}>{rf.label}</span>
          <Progress percent={rf.weight} showInfo={false} size={[72, 5]}
            strokeColor={
              rf.severity === 'hi' ? token.colorError
              : rf.severity === 'mid' ? token.colorWarning
              : token.colorSuccess
            } />
          <Text type="secondary" className="mono text-xs" style={{ minWidth: 52, textAlign: 'right' }}>
            {rf.value}
          </Text>
        </Flex>
      ))}
    </div>
  );

  const JsonTab = (
    <pre style={{
      background: token.colorFillQuaternary,
      border: `1px solid ${token.colorBorderSecondary}`,
      borderRadius: 4, padding: '10px 12px', lineHeight: 1.6,
      color: token.colorTextSecondary, margin: 0, overflow: 'auto', maxHeight: 240,
    } as React.CSSProperties} className="text-xs">{JSON.stringify({
      id: txn.id, amount: txn.amount, currency: txn.currency,
      status: txn.status, threeds: { flow: txn.threeds },
      risk: { score: txn.risk, factors: txn.riskFactors.length },
      acquirer: txn.acquirer, latency_ms: txn.latencyMs,
    }, null, 2)}</pre>
  );

  return (
    <Drawer
      open={!!txn}
      onClose={onClose}
      width={440}
      mask={false}
      closeIcon={<CloseOutlined />}
      title={
        <Space direction="vertical" size={2} style={{ width: '100%' }}>
          <Text type="secondary" className="mono drawer-id">
            {txn.id}{txn.rrn && <> · RRN {txn.rrn}</>}
          </Text>
          <div className="drawer-title" style={{ color: token.colorText }}>
            ₽ {fmtRub(txn.amount)}
            <Text type="secondary" className="drawer-amount-suffix">RUB</Text>
          </div>
          <Space size={4} className="drawer-tags">
            <Tag color={statusColors[txn.status]}>● {statusLabels[txn.status]}</Tag>
            {txn.threeds !== 'n/a' && <Tag color="blue">3DS {txn.threeds}</Tag>}
            {txn.status === 'captured' && <Tag>Refundable</Tag>}
          </Space>
        </Space>
      }
      styles={{
        header: { padding: 16, borderBottom: `1px solid ${token.colorBorderSecondary}` },
        body: { padding: 0 },
        footer: { padding: 10 },
      }}
      footer={
        <Flex gap={6} justify="flex-end" wrap>
          <Button icon={<PlayCircleOutlined />}>Replay webhook</Button>
          <Button icon={<UndoOutlined />}>Возврат</Button>
          <Button danger icon={<FlagOutlined />}>Отметить мошенничество</Button>
          <Button type="primary">Capture more</Button>
        </Flex>
      }
    >
      <Tabs
        defaultActiveKey="details"
        className="drawer-tabs"
        items={[
          { key: 'details', label: 'Детали', children: <div className="tab-content">{DetailsTab}</div> },
          { key: 'timeline', label: 'Таймлайн', children: <div className="tab-content">{TimelineTab}</div> },
          { key: 'risk', label: 'Риск', children: <div className="tab-content">{RiskTab}</div> },
          { key: 'json', label: 'JSON', children: <div className="tab-content">{JsonTab}</div> },
        ]}
      />
    </Drawer>
  );
}

/* ============================== PAGE ============================== */

export default function TransactionsPage() {
  const [selected, setSelected] = useState<Txn | null>(null);

  const columns: ColumnsType<Txn> = useMemo(() => [
    {
      title: 'Мерчант', dataIndex: 'merchant', key: 'merchant',
      render: (_, r) => (
        <>
          <div className="cell-name">{r.merchant}</div>
          <Text type="secondary" className="cell-sub">{r.category}</Text>
        </>
      ),
    },
    {
      title: 'Txn ID', dataIndex: 'id', key: 'id',
      render: v => <Text className="mono cell-id" type="secondary">{v}</Text>,
    },
    {
      title: 'Время', dataIndex: 'ts', key: 'ts', width: 90,
      render: v => <Text className="mono cell-id" type="secondary">{v}</Text>,
    },
    {
      title: 'Сумма', dataIndex: 'amount', key: 'amount', align: 'right', width: 140,
      render: (v, r) => (
        <span className="cell-amount">
          {fmtRub(v)}
          <Text type="secondary" className="cell-amount-suffix">{r.currency}</Text>
        </span>
      ),
    },
    {
      title: 'Метод', key: 'method',
      render: (_, r) => (
        <Space size={8}>
          <BrandMark brand={r.method} />
          <Text className="mono cell-id" type="secondary">{r.panLast4}</Text>
        </Space>
      ),
    },
    { title: '3DS', dataIndex: 'threeds', key: 'threeds', render: v => <ThreedsTag value={v} /> },
    { title: 'Риск', dataIndex: 'risk', key: 'risk', render: v => <RiskCell value={v} /> },
    {
      title: 'Latency', dataIndex: 'latencyMs', key: 'latencyMs', align: 'right', width: 90,
      render: v => <Text className="mono cell-id" type="secondary">{v.toLocaleString()} ms</Text>,
    },
    {
      title: 'Статус', dataIndex: 'status', key: 'status',
      render: (v: TxnStatus) => <Tag color={statusColors[v]}>{statusLabels[v]}</Tag>,
    },
  ], []);

  return (
    <Flex vertical gap={12} className="page">
      <Alert
        type="warning" showIcon
        message={<><b>3DS RU-1 degraded</b> — auth p95 at 1.9s, up from 842ms baseline. Decline rate +241/24h on 3DS timeouts.</>}
        action={<Button size="small" type="link">Incident →</Button>}
        closable
        icon={<WarningOutlined />}
      />

      <Card className="page-header">
        <Flex justify="space-between" align="center">
          <div>
            <Title level={4} style={{ margin: 0 }} className="fw-600">
              Транзакции <Tag color="processing" style={{ verticalAlign: 'middle' }}>Live</Tag>
            </Title>
            <Text type="secondary" className="text-sm">
              128 413 транзакций · ₽42.81M · обновлено только что
            </Text>
          </div>
          <Space size={6}>
            <Button icon={<DownloadOutlined />}>Экспорт CSV</Button>
            <Button icon={<ReloadOutlined />}>Обновить</Button>
            <Button type="primary" icon={<PlusOutlined />}>Сохранить вид</Button>
          </Space>
        </Flex>
      </Card>

      <Row gutter={12}>
        <Col flex={1}><Kpi title="Volume (24h)" prefix="₽" value={`${kpis.volume24h.value}${kpis.volume24h.unit}`} trend="up" trendLabel="+8.2% vs вчера" spark={kpis.volume24h.spark} /></Col>
        <Col flex={1}><Kpi title="Success rate" value={String(kpis.successRate.value)} suffix="%" trend="dn" trendLabel="−0.42 pp — investigate" spark={kpis.successRate.spark} accent="primary" /></Col>
        <Col flex={1}><Kpi title="Auth p95" value={String(kpis.authP95.value)} suffix="ms" trend="up" trendLabel="в рамках SLA < 1.5s" spark={kpis.authP95.spark} /></Col>
        <Col flex={1}><Kpi title="Declined (24h)" value={kpis.declined24h.value.toLocaleString('ru-RU')} trend="dn" trendLabel="+241 · 3DS spike" spark={kpis.declined24h.spark} /></Col>
        <Col flex={1}><Kpi title="Disputes open" value={String(kpis.disputesOpen.value)} suffix="· ₽128K" trend={null} trendLabel="2 due < 48h" spark={kpis.disputesOpen.spark} /></Col>
      </Row>

      <FilterBar />

      <Card className="table-card"
        title={
          <Flex justify="space-between" align="center">
            <span>Транзакции <Tag>128 413</Tag></span>
            <Text type="secondary" className="table-subtitle">Сортировка по времени ↓ · показано 15</Text>
          </Flex>
        }
      >
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="id"
          size="small"
          pagination={{
            pageSize: 15, total: 128413, showSizeChanger: true,
            showTotal: (t, [a, b]) => `${a}–${b} из ${t.toLocaleString('ru-RU')}`,
          }}
          rowClassName={(r) => r.id === selected?.id ? 'ant-table-row-selected' : ''}
          onRow={r => ({ onClick: () => setSelected(r) })}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <TxnPanel txn={selected} onClose={() => setSelected(null)} />
    </Flex>
  );
}
