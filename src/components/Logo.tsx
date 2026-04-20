import type { CSSProperties } from 'react';

interface LogoProps {
  size?: number;
  inverted?: boolean;
  style?: CSSProperties;
  title?: string;
}

/**
 * Платёж mark — П-as-gate.
 * Two paper posts + one rust rail on an ink tile.
 * Geometry is pixel-agnostic (viewBox 24x24).
 */
export default function Logo({ size = 22, inverted = false, style, title = 'Платёж' }: LogoProps) {
  const tile = inverted ? '#f4f1ec' : '#141210';
  const post = inverted ? '#141210' : '#f4f1ec';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label={title}
      style={style}
    >
      <rect width="24" height="24" rx="4" fill={tile} />
      <rect x="4" y="5" width="3" height="14" rx=".7" fill={post} />
      <rect x="17" y="5" width="3" height="14" rx=".7" fill={post} />
      <rect x="4" y="4.5" width="16" height="2.6" rx=".7" fill="#fd6141" />
    </svg>
  );
}
