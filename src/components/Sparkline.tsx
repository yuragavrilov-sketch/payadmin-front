interface SparklineProps {
  points: number[];
  color?: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
  className?: string;
}

export default function Sparkline({
  points,
  color = '#6e6a60',
  width = 72,
  height = 22,
  style,
  className,
}: SparklineProps) {
  if (!points.length) return null;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;
  const step = points.length > 1 ? width / (points.length - 1) : 0;
  const path = points
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
      style={style} className={className}>
      <path d={path} fill="none" stroke={color} strokeWidth="1.2" />
    </svg>
  );
}
