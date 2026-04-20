import { Card, Typography, theme as antdTheme } from 'antd';
import { RiseOutlined, FallOutlined } from '@ant-design/icons';
import Sparkline from './Sparkline';
import { brand } from '../theme';

const { Text } = Typography;

export interface KpiProps {
  title: string;
  value: string;
  suffix?: string;
  prefix?: string;
  trend?: 'up' | 'dn' | null;
  trendLabel?: string;
  spark?: number[];
  accent?: 'primary' | 'danger' | 'warning' | 'ok' | null;
}

export default function Kpi({
  title, value, suffix, prefix,
  trend, trendLabel, spark, accent,
}: KpiProps) {
  const { token } = antdTheme.useToken();

  const valueColor = accent === 'primary' ? brand.rust
    : accent === 'danger' ? token.colorError
    : accent === 'warning' ? brand.rust
    : accent === 'ok' ? token.colorSuccess
    : token.colorText;

  const trendColor = trend === 'up' ? token.colorSuccess
    : trend === 'dn' ? token.colorError
    : token.colorTextSecondary;

  const sparkColor = trend === 'up' ? token.colorSuccess
    : trend === 'dn' ? token.colorError
    : token.colorTextTertiary;

  return (
    <Card className="kpi-card">
      <Text type="secondary" className="kpi-title">{title}</Text>
      <div className="kpi-value" style={{ color: valueColor }}>
        {prefix && <Text type="secondary" className="kpi-prefix">{prefix} </Text>}
        {value}
        {suffix && <Text type="secondary" className="kpi-suffix">{suffix}</Text>}
      </div>
      {trendLabel && (
        <div className="kpi-trend" style={{ color: trendColor }}>
          {trend === 'up' ? <RiseOutlined /> : trend === 'dn' ? <FallOutlined /> : null}
          {trendLabel}
        </div>
      )}
      {spark && (
        <Sparkline points={spark} color={sparkColor}
          className="kpi-spark" />
      )}
    </Card>
  );
}
