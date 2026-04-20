import { Result, Button, Flex, Typography, Card, Space, theme as antdTheme } from 'antd';
import { ToolOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface SkeletonPageProps {
  title: string;
  subtitle: string;
  bullets?: string[];
}

function SkeletonPage({ title, subtitle, bullets }: SkeletonPageProps) {
  const { token } = antdTheme.useToken();
  return (
    <Flex vertical gap={12} style={{ padding: 16 }}>
      <Card>
        <Title level={4} style={{ margin: 0, fontWeight: 600 }}>{title}</Title>
        <Text type="secondary">{subtitle}</Text>
      </Card>
      <Card>
        <Result
          icon={<ToolOutlined style={{ color: token.colorTextQuaternary }} />}
          title="Экран в проектировании"
          subTitle="Макет готовится. Используется тот же стэк токенов, что и Transactions — визуальная регрессия будет."
          extra={
            <Space direction="vertical" align="center" size={12}>
              {bullets && (
                <Flex vertical gap={4} style={{ textAlign: 'left', padding: '0 12px' }}>
                  {bullets.map(b => (
                    <Text key={b} type="secondary" style={{ fontSize: 12 }}>· {b}</Text>
                  ))}
                </Flex>
              )}
              <Button type="primary" disabled>Запросить early access</Button>
            </Space>
          }
        />
      </Card>
    </Flex>
  );
}

export const Dashboard = () => (
  <SkeletonPage
    title="Дашборд"
    subtitle="Сводная панель по всем операциям платёжного шлюза"
    bullets={[
      'Real-time объём и success rate за сутки/неделю/месяц',
      'Карта инцидентов (acquirer, 3DS, риск-движок)',
      'Топ-мерчантов по обороту и по отказам',
    ]}
  />
);

export const Refunds = () => (
  <SkeletonPage
    title="Возвраты"
    subtitle="Возвраты, частичные возвраты, отмены авторизаций"
    bullets={[
      'Создание возврата одним действием из карточки транзакции',
      'Массовые возвраты по списку transaction ID',
      'Лимиты по мерчанту и предупреждения о рисках',
    ]}
  />
);

export const Chargebacks = () => (
  <SkeletonPage
    title="Чарджбеки"
    subtitle="Обработка принудительных возвратов по инициативе issuer'а"
    bullets={['Reason codes 10.x, 11.x, 12.x, 13.x', 'Связка с оригинальной транзакцией', 'SLA по ответу эквайеру']}
  />
);

export const Settlements = () => (
  <SkeletonPage
    title="Расчёты"
    subtitle="График расчётов с мерчантами, net settlement, батчи"
    bullets={['Batch view по дням', 'Экспорт выписки по мерчанту', 'Разбор расхождений с банком']}
  />
);

export const Payouts = () => (
  <SkeletonPage
    title="Выплаты"
    subtitle="Выплаты мерчантам, комиссии, удержания"
    bullets={['Очередь выплат, фильтр по мерчанту', 'Удержания под открытые диспуты', 'Ручное подтверждение крупных выплат']}
  />
);

export const Reconciliation = () => (
  <SkeletonPage
    title="Сверка"
    subtitle="Сверка с банком-эквайером и процессинговыми центрами"
    bullets={['Автоматическая сверка ежедневных батчей', 'Ручная правка расхождений', 'Отчёт по неподтверждённым']}
  />
);

export const Merchants = () => (
  <SkeletonPage
    title="Мерчанты"
    subtitle="Каталог мерчантов, настройки, лимиты, комиссии"
    bullets={[
      'Полный профиль: юрлицо, MCC, подписки на продукты',
      'Риск-профиль и velocity-лимиты',
      'История изменений тарифов',
    ]}
  />
);

export const RiskRules = () => (
  <SkeletonPage
    title="Риск-правила"
    subtitle="Настройка скоринга, правил антифрода, velocity-лимитов"
    bullets={['Редактор правил с тестированием на истории', 'Версионирование и откат', 'A/B на новые правила']}
  />
);

export const Webhooks = () => (
  <SkeletonPage
    title="Webhooks"
    subtitle="Подписки на события, retry-политика, логи доставки"
    bullets={['Подписки по мерчанту и по типу события', 'Replay с любой точки', 'Сигнатура HMAC и ротация секрета']}
  />
);

export const ApiKeys = () => (
  <SkeletonPage
    title="API-ключи"
    subtitle="Ключи, scopes, IP allowlist"
    bullets={['Scopes: read-only, capture, refund, admin', 'IP allowlist per-key', 'Аудит-лог использования']}
  />
);

export const Settings = () => (
  <SkeletonPage
    title="Настройки"
    subtitle="Настройки аккаунта, ролевая модель, уведомления"
    bullets={['Роли: L1/L2/L3/Admin', 'SAML/OIDC интеграция', 'Политика паролей и 2FA']}
  />
);
