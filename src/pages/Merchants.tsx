import { useState, useMemo } from 'react';
import {
  Card, Col, Row, Space, Button, Tag, Select,
  Table, Drawer, Tabs, Descriptions, Timeline, Typography, Flex,
  theme as antdTheme, Progress,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DownloadOutlined, ReloadOutlined, PlusOutlined,
  CloseOutlined, EditOutlined, StopOutlined,
  CheckCircleOutlined, CheckCircleFilled,
} from '@ant-design/icons';
import {
  merchants, merchantsKpi, statusLabels, statusColors,
  riskLabels, riskColors,
  type Merchant, type MerchantStatus,
} from '../merchants-mock';
import Kpi from '../components/Kpi';
import { brand } from '../theme';

const { Title, Text } = Typography;

const fmtRub = (n: number) =>
  n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtNum = (n: number) => n.toLocaleString('ru-RU');

/* ============================== FILTER BAR ============================== */

function FilterBar() {
  return (
    <Card className="filter-bar">
      <Flex wrap gap={6} align="center">
        <Select defaultValue="all-status" className="filter-select" options={[
          { value: 'all-status', label: <><Text type="secondary">Статус: </Text>Все</> },
          { value: 'active', label: 'Активен' },
          { value: 'blocked', label: 'Заблокирован' },
          { value: 'pending', label: 'На модерации' },
          { value: 'test', label: 'Тест' },
        ]} />
        <Select defaultValue="all-cat" className="filter-select" options={[
          { value: 'all-cat', label: <><Text type="secondary">Категория: </Text>Все MCC</> },
          { value: '5411', label: '5411 · Маркетплейс' },
          { value: '5732', label: '5732 · Электроника' },
          { value: '5651', label: '5651 · Одежда' },
          { value: '4722', label: '4722 · Туризм' },
        ]} />
        <Select defaultValue="all-risk" className="filter-select" options={[
          { value: 'all-risk', label: <><Text type="secondary">Риск: </Text>Любой</> },
          { value: 'low', label: 'Низкий' },
          { value: 'mid', label: 'Средний' },
          { value: 'hi', label: 'Высокий' },
        ]} />
        <Select defaultValue="all-mgr" className="filter-select" options={[
          { value: 'all-mgr', label: <><Text type="secondary">Менеджер: </Text>Все</> },
          { value: 'ivanova', label: 'Иванова А.С.' },
          { value: 'petrov', label: 'Петров Д.К.' },
          { value: 'sidorova', label: 'Сидорова Е.В.' },
          { value: 'kozlov', label: 'Козлов И.М.' },
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

/* ============================== RISK BADGE ============================== */

function RiskBadge({ level }: { level: Merchant['riskLevel'] }) {
  return (
    <Tag color={level === 'hi' ? 'error' : level === 'mid' ? 'warning' : 'success'}>
      {riskLabels[level]}
    </Tag>
  );
}

/* ============================== DRAWER ============================== */

interface MerchantPanelProps { merchant: Merchant | null; onClose: () => void; }

function MerchantPanel({ merchant: m, onClose }: MerchantPanelProps) {
  const { token } = antdTheme.useToken();
  if (!m) return null;

  const ProfileTab = (
    <Descriptions bordered column={1} size="small"
      styles={{ label: { background: token.colorFillQuaternary, width: 130 } }}
      className="desc-label"
      items={[
        { key: 'legal', label: 'Юрлицо', children: <>{m.legalName}<br /><Text type="secondary" className="mono cell-sub">ИНН {m.inn}</Text></> },
        { key: 'mcc', label: 'MCC', children: <><Text className="mono">{m.mcc}</Text> · {m.mccLabel}</> },
        { key: 'risk', label: 'Риск-профиль', children: <RiskBadge level={m.riskLevel} /> },
        { key: 'mgr', label: 'Менеджер', children: m.manager },
        { key: 'email', label: 'Email', children: <Text className="mono cell-sub">{m.contactEmail}</Text> },
        { key: 'phone', label: 'Телефон', children: <Text className="mono cell-sub">{m.contactPhone}</Text> },
        { key: 'site', label: 'Сайт', children: <Text className="mono cell-sub">{m.website}</Text> },
        { key: 'conn', label: 'Подключён', children: <Text className="mono cell-sub">{m.connectedAt}</Text> },
      ]} />
  );

  const TariffsTab = (
    <div>
      <Table
        dataSource={m.tariffs}
        rowKey="method"
        size="small"
        pagination={false}
        columns={[
          { title: 'Метод', dataIndex: 'method', key: 'method' },
          { title: '%', dataIndex: 'percent', key: 'percent', align: 'right',
            render: v => <Text className="mono cell-id">{v.toFixed(1)}</Text>,
          },
          { title: 'Fix ₽', dataIndex: 'fixRub', key: 'fixRub', align: 'right',
            render: v => <Text className="mono cell-id">{v}</Text>,
          },
          { title: 'Min ₽', dataIndex: 'minRub', key: 'minRub', align: 'right',
            render: v => <Text className="mono cell-id">{v}</Text>,
          },
          { title: 'Hold', dataIndex: 'holdDays', key: 'holdDays', align: 'right',
            render: v => <Text className="mono cell-id">{v}д</Text>,
          },
        ]}
      />
      <Flex vertical gap={8} style={{ marginTop: 16 }}>
        {[
          ['Лимит на транзакцию', '₽ 500 000'],
          ['Суточный лимит', '₽ 50 000 000'],
          ['Velocity', '600 txn/h'],
        ].map(([label, val]) => (
          <Flex key={label} justify="space-between">
            <Text type="secondary" className="text-sm">{label}</Text>
            <Text className="mono text-sm">{val}</Text>
          </Flex>
        ))}
      </Flex>
    </div>
  );

  const StatsTab = (
    <div>
      {[
        { label: 'Оборот (30д)', value: m.volume30d > 0 ? `₽ ${fmtRub(m.volume30d)}` : '—' },
        { label: 'Транзакций (30д)', value: m.txnCount30d > 0 ? fmtNum(m.txnCount30d) : '—' },
        { label: 'Средний чек', value: m.avgTicket > 0 ? `₽ ${fmtRub(m.avgTicket)}` : '—' },
        { label: 'Успешность', value: m.successRate > 0 ? `${m.successRate}%` : '—', accent: m.successRate < 92 },
        { label: 'Диспуты (открытые)', value: String(m.disputesOpen), accent: m.disputesOpen > 3 },
        { label: 'Диспут-рейт', value: m.disputeRate > 0 ? `${m.disputeRate}%` : '—', accent: m.disputeRate > 1 },
      ].map(row => (
        <Flex key={row.label} align="center" justify="space-between"
          className="stat-row"
          style={{ borderBottom: `1px dashed ${token.colorBorderSecondary}` }}>
          <Text type="secondary" className="text-base">{row.label}</Text>
          <Text className="mono text-base fw-600"
            style={{ color: row.accent ? token.colorError : token.colorText }}>
            {row.value}
          </Text>
        </Flex>
      ))}
    </div>
  );

  const HistoryTab = (
    <Timeline
      items={m.events.map(ev => ({
        color: ev.state === 'ok' ? 'green' : ev.state === 'warn' ? 'orange' : ev.state === 'fail' ? 'red' : 'blue',
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

  return (
    <Drawer
      open={!!m}
      onClose={onClose}
      width={480}
      mask={false}
      closeIcon={<CloseOutlined />}
      title={
        <Space direction="vertical" size={2} style={{ width: '100%' }}>
          <Text type="secondary" className="mono drawer-id">
            {m.id} · MCC {m.mcc}
          </Text>
          <div className="drawer-title" style={{ color: token.colorText }}>
            {m.name}
          </div>
          <Text type="secondary" className="text-sm">{m.legalName}</Text>
          <Space size={4} className="drawer-tags">
            <Tag color={statusColors[m.status]}>● {statusLabels[m.status]}</Tag>
            <RiskBadge level={m.riskLevel} />
            {m.disputesOpen > 0 && <Tag color="warning">{m.disputesOpen} диспут{m.disputesOpen > 1 ? (m.disputesOpen < 5 ? 'а' : 'ов') : ''}</Tag>}
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
          <Button icon={<EditOutlined />}>Редактировать</Button>
          {m.status === 'active' && (
            <Button danger icon={<StopOutlined />}>Заблокировать</Button>
          )}
          {m.status === 'blocked' && (
            <Button icon={<CheckCircleOutlined />} style={{ color: brand.rust, borderColor: brand.rust }}>
              Разблокировать
            </Button>
          )}
          {m.status === 'pending' && (
            <Button type="primary" icon={<CheckCircleOutlined />}>Одобрить</Button>
          )}
        </Flex>
      }
    >
      <Tabs
        defaultActiveKey="profile"
        className="drawer-tabs"
        items={[
          { key: 'profile', label: 'Профиль', children: <div className="tab-content">{ProfileTab}</div> },
          { key: 'tariffs', label: 'Тарифы', children: <div className="tab-content">{TariffsTab}</div> },
          { key: 'stats', label: 'Статистика', children: <div className="tab-content">{StatsTab}</div> },
          { key: 'history', label: 'История', children: <div className="tab-content">{HistoryTab}</div> },
        ]}
      />
    </Drawer>
  );
}

/* ============================== PAGE ============================== */

export default function MerchantsPage() {
  const [selected, setSelected] = useState<Merchant | null>(null);

  const columns: ColumnsType<Merchant> = useMemo(() => [
    {
      title: 'Мерчант', dataIndex: 'name', key: 'name',
      render: (_, r) => (
        <>
          <div className="cell-name">{r.name}</div>
          <Text type="secondary" className="cell-sub">{r.mcc} · {r.mccLabel}</Text>
        </>
      ),
    },
    {
      title: 'ID', dataIndex: 'id', key: 'id',
      render: v => <Text className="mono cell-id" type="secondary">{v}</Text>,
    },
    {
      title: 'Статус', dataIndex: 'status', key: 'status',
      render: (v: MerchantStatus) => <Tag color={statusColors[v]}>{statusLabels[v]}</Tag>,
    },
    {
      title: 'Риск', dataIndex: 'riskLevel', key: 'riskLevel',
      render: (_, r) => {
        const color = riskColors[r.riskLevel];
        return (
          <div className="risk-cell">
            <Progress percent={r.riskLevel === 'hi' ? 85 : r.riskLevel === 'mid' ? 50 : 20}
              showInfo={false} size={[42, 5]} strokeColor={color} />
            <Text type="secondary" className="text-sm">{riskLabels[r.riskLevel]}</Text>
          </div>
        );
      },
    },
    {
      title: 'Оборот (30д)', dataIndex: 'volume30d', key: 'volume30d', align: 'right', width: 150,
      render: v => v > 0 ? (
        <span className="cell-amount">₽ {fmtRub(v)}</span>
      ) : <Text type="secondary">—</Text>,
      sorter: (a, b) => a.volume30d - b.volume30d,
    },
    {
      title: 'Txn (30д)', dataIndex: 'txnCount30d', key: 'txnCount30d', align: 'right', width: 100,
      render: v => v > 0 ? (
        <Text className="mono cell-id">{fmtNum(v)}</Text>
      ) : <Text type="secondary">—</Text>,
      sorter: (a, b) => a.txnCount30d - b.txnCount30d,
    },
    {
      title: 'Успешность', dataIndex: 'successRate', key: 'successRate', align: 'right', width: 100,
      render: v => v > 0 ? (
        <Text className="mono cell-id"
          style={{
            color: v < 92 ? '#ff4d4f' : v < 95 ? '#faad14' : undefined,
            fontWeight: v < 92 ? 600 : undefined,
          }}>{v}%</Text>
      ) : <Text type="secondary">—</Text>,
      sorter: (a, b) => a.successRate - b.successRate,
    },
    {
      title: 'Диспуты', dataIndex: 'disputesOpen', key: 'disputesOpen', align: 'right', width: 90,
      render: (v, r) => v > 0 ? (
        <Text className="mono cell-id"
          style={{
            color: r.disputeRate > 1 ? '#ff4d4f' : r.disputeRate > 0.4 ? '#faad14' : undefined,
            fontWeight: r.disputeRate > 1 ? 600 : undefined,
          }}>{v} <Text type="secondary" style={{ fontSize: 10 }}>({r.disputeRate}%)</Text></Text>
      ) : <Text type="secondary" className="cell-id">0</Text>,
      sorter: (a, b) => a.disputesOpen - b.disputesOpen,
    },
    {
      title: 'Подключён', dataIndex: 'connectedAt', key: 'connectedAt', width: 110,
      render: v => <Text className="mono cell-id" type="secondary">{v}</Text>,
      sorter: (a, b) => a.connectedAt.localeCompare(b.connectedAt),
    },
  ], []);

  const activeCount = merchants.filter(m => m.status === 'active').length;
  const blockedCount = merchants.filter(m => m.status === 'blocked').length;

  return (
    <Flex vertical gap={12} className="page">
      <Card className="page-header">
        <Flex justify="space-between" align="center">
          <div>
            <Title level={4} style={{ margin: 0 }} className="fw-600">
              Мерчанты
              <Tag style={{ verticalAlign: 'middle', marginLeft: 8 }}>{merchants.length}</Tag>
              {blockedCount > 0 && (
                <Tag color="error" style={{ verticalAlign: 'middle' }}>{blockedCount} заблокирован</Tag>
              )}
            </Title>
            <Text type="secondary" className="text-sm">
              {activeCount} активных · оборот ₽{merchantsKpi.volume30d.value}M за 30 дней
            </Text>
          </div>
          <Space size={6}>
            <Button icon={<DownloadOutlined />}>Экспорт</Button>
            <Button icon={<ReloadOutlined />}>Обновить</Button>
            <Button type="primary" icon={<PlusOutlined />}>Новый мерчант</Button>
          </Space>
        </Flex>
      </Card>

      <Row gutter={12}>
        <Col flex={1}>
          <Kpi title="Всего мерчантов" value={String(merchantsKpi.total.value)}
            trend="up" trendLabel="+14 за квартал" spark={merchantsKpi.total.spark} />
        </Col>
        <Col flex={1}>
          <Kpi title="Активных" value={String(merchantsKpi.active.value)} suffix={`из ${merchantsKpi.total.value}`}
            trend="up" trendLabel="+12 · 92% от всех" spark={merchantsKpi.active.spark} />
        </Col>
        <Col flex={1}>
          <Kpi title="Оборот (30д)" prefix="₽" value={`${merchantsKpi.volume30d.value}${merchantsKpi.volume30d.unit}`}
            trend="up" trendLabel="+6.4% vs пред. месяц" spark={merchantsKpi.volume30d.spark} />
        </Col>
        <Col flex={1}>
          <Kpi title="Средний чек" prefix="₽" value={fmtNum(merchantsKpi.avgTicket.value)}
            trend={null} trendLabel="стабильно ±2%" spark={merchantsKpi.avgTicket.spark} />
        </Col>
        <Col flex={1}>
          <Kpi title="Диспут-рейт" value={String(merchantsKpi.disputeRate.value)} suffix="%"
            trend="dn" trendLabel="−0.04 pp · тренд ↓" spark={merchantsKpi.disputeRate.spark} accent="primary" />
        </Col>
      </Row>

      <FilterBar />

      <Card className="table-card"
        title={
          <Flex justify="space-between" align="center">
            <span>Мерчанты <Tag>{merchants.length}</Tag></span>
            <Text type="secondary" className="table-subtitle">
              Сортировка по обороту ↓ · показано {merchants.length}
            </Text>
          </Flex>
        }
      >
        <Table
          columns={columns}
          dataSource={merchants}
          rowKey="id"
          size="small"
          pagination={{
            pageSize: 20, total: 312, showSizeChanger: true,
            showTotal: (t, [a, b]) => `${a}–${b} из ${t.toLocaleString('ru-RU')}`,
          }}
          rowClassName={(r) => r.id === selected?.id ? 'ant-table-row-selected' : ''}
          onRow={r => ({ onClick: () => setSelected(r) })}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <MerchantPanel merchant={selected} onClose={() => setSelected(null)} />
    </Flex>
  );
}
