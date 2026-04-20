import { Button, Card, Form, Input, Typography, Flex, theme as antdTheme, Segmented } from 'antd';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import Logo from '../components/Logo';
import { brand, type ThemeMode } from '../theme';

const { Title, Text } = Typography;

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

interface LoginPageProps {
  mode: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  onLogin: (username: string, password: string) => void;
  loading?: boolean;
  error?: string | null;
}

export default function LoginPage({ mode, onThemeChange, onLogin, loading, error }: LoginPageProps) {
  const { token } = antdTheme.useToken();
  const [form] = Form.useForm();
  const isDark = mode === 'dark';

  const handleSubmit = (values: { username: string; password: string }) => {
    onLogin(values.username, values.password);
  };

  return (
    <div className="login-page"
      style={{ background: isDark ? brand.bodyDark : brand.paper }}>

      <div className="login-theme-toggle">
        <Segmented
          size="small"
          value={mode}
          onChange={(v) => onThemeChange(v as ThemeMode)}
          options={[
            { value: 'light', icon: <SunIcon />, title: 'Светлая тема' },
            { value: 'dark', icon: <MoonIcon />, title: 'Тёмная тема' },
          ]}
        />
      </div>

      <Flex vertical align="center" justify="center" style={{ flex: 1, padding: 24 }}>
        <Flex vertical align="center" gap={8} style={{ marginBottom: 32 }}>
          <Logo size={48} />
          <Title level={3} style={{ margin: 0, fontWeight: 700, letterSpacing: '-.02em' }}>
            Платёж
          </Title>
          <Text type="secondary" className="text-base">Панель оператора</Text>
        </Flex>

        <Card className="login-card"
          style={{
            boxShadow: isDark
              ? '0 2px 8px rgba(0,0,0,.4), 0 8px 24px rgba(0,0,0,.3)'
              : '0 2px 8px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)',
          }}
          styles={{ body: { padding: '28px 28px 20px' } }}
        >
          <Title level={5} style={{ margin: '0 0 20px', textAlign: 'center' }} className="fw-600">
            Вход в систему
          </Title>

          {error && (
            <div className="login-error"
              style={{
                background: isDark ? 'rgba(229,98,75,.12)' : '#fff2f0',
                border: `1px solid ${isDark ? 'rgba(229,98,75,.3)' : '#ffccc7'}`,
                color: token.colorError,
              }}>
              {error}
            </div>
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            requiredMark={false}
            size="middle"
          >
            <Form.Item
              name="username"
              label={<Text className="text-sm">Логин</Text>}
              rules={[{ required: true, message: 'Введите логин' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: token.colorTextTertiary }} />}
                placeholder="operator@platezh.ru"
                autoComplete="username"
                autoFocus
              />
            </Form.Item>

            <Form.Item
              name="password"
              label={<Text className="text-sm">Пароль</Text>}
              rules={[{ required: true, message: 'Введите пароль' }]}
              style={{ marginBottom: 24 }}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: token.colorTextTertiary }} />}
                placeholder="Пароль"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                className="fw-600"
                style={{ height: 38 }}
              >
                Войти
              </Button>
            </Form.Item>
          </Form>
        </Card>

        <Text type="secondary" className="text-xs" style={{ marginTop: 24 }}>
          Доступ через Keycloak SSO · {new Date().getFullYear()}
        </Text>
      </Flex>
    </div>
  );
}
