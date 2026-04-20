import {
  Layout, Menu, Breadcrumb, Input, Avatar, Tag, Badge, Space, Segmented, Dropdown,
  theme as antdTheme,
} from 'antd';
import type { MenuProps } from 'antd';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  SearchOutlined, BellOutlined, AppstoreOutlined, LogoutOutlined,
} from '@ant-design/icons';
import Logo from './components/Logo';
import { brand, type ThemeMode } from './theme';
import { navItems, groupLabels, findByPath, type NavGroup } from './navigation';
import type { UserProfile } from './auth/keycloak';

const { Sider, Header, Content } = Layout;

const SunIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
       style={{ verticalAlign: '-2px' }}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4 12H2M22 12h-2M6.3 6.3l-1.4-1.4M19.1 19.1l-1.4-1.4M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4" />
  </svg>
);

const MoonIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
       style={{ verticalAlign: '-2px' }}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </svg>
);

function buildMenuItems(): MenuProps['items'] {
  const groups: NavGroup[] = ['ops', 'ledger', 'control'];
  return groups.map(g => ({
    key: `group-${g}`,
    type: 'group' as const,
    label: groupLabels[g],
    children: navItems.filter(it => it.group === g).map(it => ({
      key: it.key,
      icon: it.icon,
      label: it.badge ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {it.label}
          <span className="menu-badge">{it.badge}</span>
        </span>
      ) : it.label,
    })),
  }));
}

function displayName(profile: UserProfile | null): string {
  if (!profile) return 'Гость';
  return profile.name || profile.preferred_username || profile.email || profile.sub;
}

function initials(profile: UserProfile | null): string {
  const name = displayName(profile);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

interface AppProps {
  mode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  profile: UserProfile | null;
  onLogout: () => void;
}

export default function App({ mode, onThemeChange, profile, onLogout }: AppProps) {
  const { token } = antdTheme.useToken();
  const location = useLocation();
  const navigate = useNavigate();
  const current = findByPath(location.pathname);
  const selectedKey = current?.key ?? 'dashboard';

  const breadcrumbs = current
    ? [{ title: groupLabels[current.group] }, { title: current.label }]
    : [{ title: 'Платёж' }];

  const userMenu: MenuProps['items'] = [
    {
      key: 'profile',
      label: (
        <div className="user-menu-header">
          <div className="user-menu-name">{displayName(profile)}</div>
          {profile?.email && <div className="user-menu-email">{profile.email}</div>}
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Выйти', onClick: onLogout },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={216} style={{ borderRight: '1px solid #000' }}>
        <div className="sider-logo"
          style={{ borderBottom: '1px solid rgba(255,255,255,.08)' }}
          onClick={() => navigate('/')}>
          <Logo size={22} />
          <span>Платёж</span>
          <span className="sider-logo-badge">Админ</span>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          items={buildMenuItems()}
          selectedKeys={[selectedKey]}
          onSelect={({ key }) => {
            const item = navItems.find(it => it.key === key);
            if (item) navigate(item.path);
          }}
          style={{ borderInlineEnd: 0 }}
        />
      </Sider>

      <Layout>
        <Header style={{
          display: 'flex', alignItems: 'center', gap: 16,
          boxShadow: `0 1px 0 ${token.colorBorderSecondary}`, zIndex: 2,
        }}>
          <Breadcrumb items={breadcrumbs} />
          <Input
            prefix={<SearchOutlined style={{ color: token.colorTextTertiary }} />}
            suffix={<kbd className="mono text-xs" style={{
              padding: '0 5px',
              border: `1px solid ${token.colorBorder}`, borderRadius: 2,
              color: token.colorTextTertiary,
            }}>⌘K</kbd>}
            placeholder="Поиск по txn id, RRN, PAN last 4, email…"
            style={{ marginLeft: 'auto', maxWidth: 340 }}
          />
          <Space size={14}>
            <Segmented
              size="small"
              value={mode}
              onChange={(v) => onThemeChange(v as ThemeMode)}
              options={[
                { value: 'light', icon: <SunIcon />, title: 'Светлая тема' },
                { value: 'dark', icon: <MoonIcon />, title: 'Тёмная тема' },
              ]}
            />
            <Tag color="success" style={{ margin: 0, fontWeight: 500 }}>● Production · eu-central-1</Tag>
            <Badge dot color={token.colorError}>
              <BellOutlined style={{ fontSize: 15, color: token.colorTextTertiary, cursor: 'pointer' }} />
            </Badge>
            <AppstoreOutlined style={{ fontSize: 15, color: token.colorTextTertiary, cursor: 'pointer' }} />
            <Dropdown menu={{ items: userMenu }} trigger={['click']} placement="bottomRight">
              <span title={displayName(profile)} style={{ display: 'inline-flex' }}>
                <Avatar size={28}
                  style={{ background: brand.rust, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  {initials(profile)}
                </Avatar>
              </span>
            </Dropdown>
          </Space>
        </Header>

        <Content style={{ overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
