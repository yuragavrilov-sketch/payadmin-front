import type { ReactNode } from 'react';
import {
  DashboardOutlined, UnorderedListOutlined, UndoOutlined,
  WarningOutlined, StopOutlined, SwapOutlined, RiseOutlined,
  ReconciliationOutlined, ShopOutlined, SafetyOutlined,
  ApiOutlined, SettingOutlined, KeyOutlined,
} from '@ant-design/icons';

export type NavGroup = 'ops' | 'ledger' | 'control';

export interface NavItem {
  key: string;
  path: string;
  label: string;
  icon: ReactNode;
  group: NavGroup;
  badge?: string;
}

export const groupLabels: Record<NavGroup, string> = {
  ops: 'Операции',
  ledger: 'Леджер',
  control: 'Контроль',
};

export const navItems: NavItem[] = [
  { key: 'dashboard',      path: '/',               label: 'Дашборд',      icon: <DashboardOutlined />,      group: 'ops' },
  { key: 'transactions',   path: '/transactions',   label: 'Транзакции',   icon: <UnorderedListOutlined />,  group: 'ops', badge: '128K' },
  { key: 'refunds',        path: '/refunds',        label: 'Возвраты',     icon: <UndoOutlined />,            group: 'ops', badge: '42' },
  { key: 'disputes',       path: '/disputes',       label: 'Диспуты',      icon: <WarningOutlined />,         group: 'ops', badge: '7' },
  { key: 'chargebacks',    path: '/chargebacks',    label: 'Чарджбеки',    icon: <StopOutlined />,            group: 'ops', badge: '2' },

  { key: 'settlements',    path: '/settlements',    label: 'Расчёты',      icon: <SwapOutlined />,            group: 'ledger' },
  { key: 'payouts',        path: '/payouts',        label: 'Выплаты',      icon: <RiseOutlined />,            group: 'ledger' },
  { key: 'reconciliation', path: '/reconciliation', label: 'Сверка',       icon: <ReconciliationOutlined />,  group: 'ledger' },

  { key: 'merchants',      path: '/merchants',      label: 'Мерчанты',     icon: <ShopOutlined />,            group: 'control' },
  { key: 'risk',           path: '/risk',           label: 'Риск-правила', icon: <SafetyOutlined />,          group: 'control' },
  { key: 'webhooks',       path: '/webhooks',       label: 'Webhooks',     icon: <ApiOutlined />,             group: 'control' },
  { key: 'api-keys',       path: '/api-keys',       label: 'API-ключи',    icon: <KeyOutlined />,             group: 'control' },
  { key: 'settings',       path: '/settings',       label: 'Настройки',    icon: <SettingOutlined />,         group: 'control' },
];

export function findByPath(pathname: string): NavItem | undefined {
  return navItems.find(it => it.path === pathname);
}
