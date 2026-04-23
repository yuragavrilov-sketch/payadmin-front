import { useState, useMemo } from 'react';
import {
  Card, Col, Row, Space, Button, Tag, Select,
  Table, Drawer, Tabs, Descriptions, Timeline, Typography, Flex,
  theme as antdTheme, Progress, Alert, Spin, App as AntApp,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DownloadOutlined, ReloadOutlined, PlusOutlined,
  CloseOutlined, EditOutlined, StopOutlined,
  CheckCircleOutlined, CheckCircleFilled,
} from '@ant-design/icons';
import {
  useMerchantsList, useMerchantsKpi,
  useMerchantDetails, useMerchantTariffs, useMerchantStats, useMerchantEvents,
  useBlockMerchant, useUnblockMerchant, useApproveMerchant,
} from '../api/merchants';
import type {
  MerchantListItem, MerchantDetails, MerchantStatus,
  MerchantsListQuery,
} from '../api/types';
import { statusLabels, statusColors, riskLabels, riskColors } from '../merchants-mock';
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

function RiskBadge({ level }: { level: MerchantListItem['riskLevel'] }) {
  return (
    <Tag color={level === 'hi' ? 'error' : level === 'mid' ? 'warning' : 'success'}>
      {riskLabels[level]}
    </Tag>
  );
}

/* ============================== DRAWER ============================== */

interface MerchantPanelProps { id: string | null; onClose: () => void; }

function MerchantPanel({ id, onClose }: MerchantPanelProps) {
  const { token } = antdTheme.useToken();
  const { message } = AntApp.useApp();

  const details = useMerchantDetails(id);
  const tariffs = useMerchantTariffs(id);
  const stats   = useMerchantStats(id, '30d');
  const events  = useMerchantEvents(id);

  const block   = useBlockMerchant();
  const unblock = useUnblockMerchant();
  const approve = useApproveMerchant();

  if (!id) return null;

  const m: MerchantDetails | undefined = details.data;
  const isBusy = block.isPending || unblock.isPending || approve.isPending;

  const handleBlock = () => {
    if (!m) return;
    // TODO: заменить на диалог с reason
    block.mutate(
      { id: m.id, body: { reason: 'Блокировка оператором' } },
      { onSuccess: () => message.success('Мерчант заблокирован') },
    );
  };
  const handleUnblock = () => {
    if (!m) return;
    unblock.mutate(m.id, { onSuccess: () => message.success('Мерчант разблокирован') });
  };
  const handleApprove = () => {
    if (!m) return;
    approve.mutate({ id: m.id, body: {} }, { onSuccess: () => message.success('Мерчант одобрен') });
  };

  const ProfileTab = m && (
    <Descriptions bordered column={1} size="small"
      styles={{ label: { background: token.colorFillQuaternary, width: 130 } }}
      className="desc-label"
      items={[
        { key: 'legal', label: 'Юрлицо',       children: <>{m.legalName}<br /><Text type="secondary" className="mono cell-sub">ИНН {m.inn}</Text></> },
        { key: 'mcc',   label: 'MCC',          children: <><Text className="mono">{m.mcc}</Text> · {m.mccLabel}</> },
        { key: 'risk',  label: 'Риск-профиль', children: <RiskBadge level={m.riskLevel} /> },
        { key: 'mgr',   label: 'Менеджер',     children: m.managerName },
        { key: 'email', label: 'Email',        children: <Text className="mono cell-sub">{m.contactEmail}</Text> },
        { key: 'phone', label: 'Телефон',      children: <Text className="mono cell-sub">{m.contactPhone}</Text> },
        { key: 'site',  label: 'Сайт',         children: <Text className="mono cell-sub">{m.website}</Text> },
        { key: 'conn',  label: 'Подключён',    children: <Text className="mono cell-sub">{m.connectedAt}</Text> },
      ]} />
  );

  const TariffsTab = tariffs.data && (
    <div>
      <Table
        dataSource={tariffs.data.rows}
        rowKey="method"
        size="small"
        pagination={false}
        columns={[
          { title: 'Метод', dataIndex: 'method', key: 'method' },
          { title: '%',     dataIndex: 'percent', key: 'percent', align: 'right',
            render: v => <Text className="mono cell-id">{v.toFixed(1)}</Text> },
          { title: 'Fix ₽', dataIndex: 'fixRub', key: 'fixRub', align: 'right',
            render: v => <Text className="mono cell-id">{v}</Text> },
          { title: 'Min ₽', dataIndex: 'minRub', key: 'minRub', align: 'right',
            render: v => <Text className="mono cell-id">{v}</Text> },
          { title: 'Hold',  dataIndex: 'holdDays', key: 'holdDays', align: 'right',
            render: v => <Text className="mono cell-id">{v}д</Text> },
        ]}
      />
      <Flex vertical gap={8} style={{ marginTop: 16 }}>
        {[
          ['Лимит на транзакцию', `₽ ${fmtNum(tariffs.data.limits.perTxnRub)}`],
          ['Суточный лимит',      `₽ ${fmtNum(tariffs.data.limits.dailyRub)}`],
          ['Velocity',            `${fmtNum(tariffs.data.limits.velocityPerHour)} txn/h`],
        ].map(([label, val]) => (
          <Flex key={label} justify="space-between">
            <Text type="secondary" className="text-sm">{label}</Text>
            <Text className="mono text-sm">{val}</Text>
          </Flex>
        ))}
      </Flex>
    </div>
  );

  const StatsTab = stats.data && m && (
    <div>
      {[
        { label: 'Оборот (30д)',        value: stats.data.volume > 0 ? `₽ ${fmtRub(stats.data.volume)}` : '—' },
        { label: 'Транзакций (30д)',    value: stats.data.txnCount > 0 ? fmtNum(stats.data.txnCount) : '—' },
        { label: 'Средний чек',         value: stats.data.avgTicket > 0 ? `₽ ${fmtRub(stats.data.avgTicket)}` : '—' },
        { label: 'Успешность',          value: stats.data.successRate > 0 ? `${stats.data.successRate}%` : '—', accent: stats.data.successRate > 0 && stats.data.successRate < 92 },
        { label: 'Диспуты (открытые)',  value: String(stats.data.disputesOpen), accent: stats.data.disputesOpen > 3 },
        { label: 'Диспут-рейт',         value: stats.data.disputeRate > 0 ? `${stats.data.disputeRate}%` : '—', accent: stats.data.disputeRate > 1 },
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

  const HistoryTab = events.data && (
    <Timeline
      items={events.data.items.map(ev => ({
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

  const body = details.isLoading ? (
    <Flex justify="center" align="center" style={{ padding: 60 }}><Spin /></Flex>
  ) : details.isError ? (
    <Alert type="error" showIcon message="Не удалось загрузить мерчанта" description={String(details.error)} style={{ margin: 16 }} />
  ) : (
    <Tabs
      defaultActiveKey="profile"
      className="drawer-tabs"
      items={[
        { key: 'profile', label: 'Профиль',    children: <div className="tab-content">{ProfileTab}</div> },
        { key: 'tariffs', label: 'Тарифы',     children: <div className="tab-content">{tariffs.isLoading ? <Spin /> : TariffsTab}</div> },
        { key: 'stats',   label: 'Статистика', children: <div className="tab-content">{stats.isLoading ? <Spin /> : StatsTab}</div> },
        { key: 'history', label: 'История',    children: <div className="tab-content">{events.isLoading ? <Spin /> : HistoryTab}</div> },
      ]}
    />
  );

  return (
    <Drawer
      open={!!id}
      onClose={onClose}
      width={480}
      mask={false}
      closeIcon={<CloseOutlined />}
      title={m ? (
        <Space direction="vertical" size={2} style={{ width: '100%' }}>
          <Text type="secondary" className="mono drawer-id">{m.id} · MCC {m.mcc}</Text>
          <div className="drawer-title" style={{ color: token.colorText }}>{m.name}</div>
          <Text type="secondary" className="text-sm">{m.legalName}</Text>
          <Space size={4} className="drawer-tags">
            <Tag color={statusColors[m.status]}>● {statusLabels[m.status]}</Tag>
            <RiskBadge level={m.riskLevel} />
            {m.stats30d.disputesOpen > 0 && (
              <Tag color="warning">
                {m.stats30d.disputesOpen} диспут{m.stats30d.disputesOpen > 1 ? (m.stats30d.disputesOpen < 5 ? 'а' : 'ов') : ''}
              </Tag>
            )}
          </Space>
        </Space>
      ) : <Spin size="small" />}
      styles={{
        header: { padding: 16, borderBottom: `1px solid ${token.colorBorderSecondary}` },
        body: { padding: 0 },
        footer: { padding: 10 },
      }}
      footer={m && (
        <Flex gap={6} justify="flex-end" wrap>
          <Button icon={<EditOutlined />} disabled={isBusy}>Редактировать</Button>
          {m.status === 'active' && (
            <Button danger icon={<StopOutlined />} loading={block.isPending} onClick={handleBlock}>
              Заблокировать
            </Button>
          )}
          {m.status === 'blocked' && (
            <Button icon={<CheckCircleOutlined />} loading={unblock.isPending} onClick={handleUnblock}
              style={{ color: brand.rust, borderColor: brand.rust }}>
              Разблокировать
            </Button>
          )}
          {m.status === 'pending' && (
            <Button type="primary" icon={<CheckCircleOutlined />} loading={approve.isPending} onClick={handleApprove}>
              Одобрить
            </Button>
          )}
        </Flex>
      )}
    >
      {body}
    </Drawer>
  );
}

/* ============================== PAGE ============================== */

const PAGE_SIZE = 20;

export default function MerchantsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const query: MerchantsListQuery = useMemo(() => ({
    page,
    pageSize: PAGE_SIZE,
    sort: 'volume30d',
    dir: 'desc',
  }), [page]);

  const list = useMerchantsList(query);
  const kpi  = useMerchantsKpi();

  const items = list.data?.items ?? [];
  const total = list.data?.total ?? 0;

  const columns: ColumnsType<MerchantListItem> = useMemo(() => [
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
      title: 'Оборот (30д)', key: 'volume30d', align: 'right', width: 150,
      render: (_, r) => r.stats30d.volume > 0 ? (
        <span className="cell-amount">₽ {fmtRub(r.stats30d.volume)}</span>
      ) : <Text type="secondary">—</Text>,
      sorter: (a, b) => a.stats30d.volume - b.stats30d.volume,
    },
    {
      title: 'Txn (30д)', key: 'txnCount30d', align: 'right', width: 100,
      render: (_, r) => r.stats30d.txnCount > 0 ? (
        <Text className="mono cell-id">{fmtNum(r.stats30d.txnCount)}</Text>
      ) : <Text type="secondary">—</Text>,
      sorter: (a, b) => a.stats30d.txnCount - b.stats30d.txnCount,
    },
    {
      title: 'Успешность', key: 'successRate', align: 'right', width: 100,
      render: (_, r) => r.stats30d.successRate > 0 ? (
        <Text className="mono cell-id"
          style={{
            color: r.stats30d.successRate < 92 ? '#ff4d4f' : r.stats30d.successRate < 95 ? '#faad14' : undefined,
            fontWeight: r.stats30d.successRate < 92 ? 600 : undefined,
          }}>{r.stats30d.successRate}%</Text>
      ) : <Text type="secondary">—</Text>,
      sorter: (a, b) => a.stats30d.successRate - b.stats30d.successRate,
    },
    {
      title: 'Диспуты', key: 'disputesOpen', align: 'right', width: 90,
      render: (_, r) => r.stats30d.disputesOpen > 0 ? (
        <Text className="mono cell-id"
          style={{
            color: r.stats30d.disputeRate > 1 ? '#ff4d4f' : r.stats30d.disputeRate > 0.4 ? '#faad14' : undefined,
            fontWeight: r.stats30d.disputeRate > 1 ? 600 : undefined,
          }}>{r.stats30d.disputesOpen} <Text type="secondary" style={{ fontSize: 10 }}>({r.stats30d.disputeRate}%)</Text></Text>
      ) : <Text type="secondary" className="cell-id">0</Text>,
      sorter: (a, b) => a.stats30d.disputesOpen - b.stats30d.disputesOpen,
    },
    {
      title: 'Подключён', dataIndex: 'connectedAt', key: 'connectedAt', width: 110,
      render: v => <Text className="mono cell-id" type="secondary">{v}</Text>,
      sorter: (a, b) => a.connectedAt.localeCompare(b.connectedAt),
    },
  ], []);

  const activeCount = items.filter(m => m.status === 'active').length;
  const blockedCount = items.filter(m => m.status === 'blocked').length;

  return (
    <Flex vertical gap={12} className="page">
      <Card className="page-header">
        <Flex justify="space-between" align="center">
          <div>
            <Title level={4} style={{ margin: 0 }} className="fw-600">
              Мерчанты
              <Tag style={{ verticalAlign: 'middle', marginLeft: 8 }}>{total}</Tag>
              {blockedCount > 0 && (
                <Tag color="error" style={{ verticalAlign: 'middle' }}>{blockedCount} заблокирован</Tag>
              )}
            </Title>
            <Text type="secondary" className="text-sm">
              {activeCount} активных на странице · оборот ₽{kpi.data?.volume30d.value ?? '—'}M за 30 дней
            </Text>
          </div>
          <Space size={6}>
            <Button icon={<DownloadOutlined />}>Экспорт</Button>
            <Button icon={<ReloadOutlined />} loading={list.isFetching} onClick={() => list.refetch()}>Обновить</Button>
            <Button type="primary" icon={<PlusOutlined />}>Новый мерчант</Button>
          </Space>
        </Flex>
      </Card>

      <Row gutter={12}>
        <Col flex={1}>
          <Kpi title="Всего мерчантов" value={String(kpi.data?.total.value ?? '—')}
            trend="up" trendLabel="+14 за квартал" spark={kpi.data?.total.spark ?? []} />
        </Col>
        <Col flex={1}>
          <Kpi title="Активных" value={String(kpi.data?.active.value ?? '—')} suffix={`из ${kpi.data?.total.value ?? '—'}`}
            trend="up" trendLabel="+12 · 92% от всех" spark={kpi.data?.active.spark ?? []} />
        </Col>
        <Col flex={1}>
          <Kpi title="Оборот (30д)" prefix="₽"
            value={`${kpi.data?.volume30d.value ?? '—'}${kpi.data?.volume30d.unit ?? ''}`}
            trend="up" trendLabel={kpi.data ? `+${kpi.data.volume30d.deltaPct}% vs пред. месяц` : ''}
            spark={kpi.data?.volume30d.spark ?? []} />
        </Col>
        <Col flex={1}>
          <Kpi title="Средний чек" prefix="₽" value={kpi.data ? fmtNum(kpi.data.avgTicket.value) : '—'}
            trend={null} trendLabel="стабильно ±2%" spark={kpi.data?.avgTicket.spark ?? []} />
        </Col>
        <Col flex={1}>
          <Kpi title="Диспут-рейт" value={String(kpi.data?.disputeRate.value ?? '—')} suffix="%"
            trend="dn" trendLabel={kpi.data ? `${kpi.data.disputeRate.deltaPp} pp · тренд ↓` : ''}
            spark={kpi.data?.disputeRate.spark ?? []} accent="primary" />
        </Col>
      </Row>

      <FilterBar />

      {list.isError && (
        <Alert type="error" showIcon
          message="Не удалось загрузить мерчантов"
          description={String(list.error)}
          action={<Button size="small" onClick={() => list.refetch()}>Повторить</Button>}
        />
      )}

      <Card className="table-card"
        title={
          <Flex justify="space-between" align="center">
            <span>Мерчанты <Tag>{total}</Tag></span>
            <Text type="secondary" className="table-subtitle">
              Сортировка по обороту ↓ · показано {items.length}
            </Text>
          </Flex>
        }
      >
        <Table
          columns={columns}
          dataSource={items}
          rowKey="id"
          size="small"
          loading={list.isLoading}
          pagination={{
            current: page, pageSize: PAGE_SIZE, total, showSizeChanger: false,
            onChange: setPage,
            showTotal: (t, [a, b]) => `${a}–${b} из ${t.toLocaleString('ru-RU')}`,
          }}
          rowClassName={(r) => r.id === selectedId ? 'ant-table-row-selected' : ''}
          onRow={r => ({ onClick: () => setSelectedId(r.id) })}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      <MerchantPanel id={selectedId} onClose={() => setSelectedId(null)} />
    </Flex>
  );
}
