import type { ThemeConfig } from 'antd';
import { theme } from 'antd';

export type ThemeMode = 'light' | 'dark';

/**
 * Brand colour tokens that are stable across both themes.
 * Mode-dependent values (bg, text, borders) live inside `makeBrandTheme`.
 */
export const brand = {
  rust: '#fd6141',         // primary accent — same in both modes
  rustHover: '#c75138',
  rustSoftLight: '#fff0ec',
  rustSoftDark: 'rgba(253,97,65,.14)',
  siderInk: '#141210',     // light-mode sider
  siderInkDark: '#0a0806', // dark-mode sider (darker than body)
  paper: '#f4f1ec',        // light-mode body
  bodyDark: '#0f0d0a',     // dark-mode body
} as const;

export function makeBrandTheme(mode: ThemeMode): ThemeConfig {
  const isDark = mode === 'dark';

  return {
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      // Primary coral-rust — #fd6141
      colorPrimary: brand.rust,
      colorInfo: isDark ? '#4a9ac5' : '#1f6b94',
      colorSuccess: isDark ? '#4fa968' : '#2f8f4a',
      colorWarning: isDark ? '#e0a339' : '#c08400',
      colorError: isDark ? '#e5624b' : '#c8381e',

      // Surfaces — warm neutrals in both modes (not cold greys)
      colorBgLayout: isDark ? brand.bodyDark : brand.paper,
      colorBgContainer: isDark ? '#17150f' : '#ffffff',
      colorBgElevated: isDark ? '#1d1a13' : '#ffffff',

      colorBorder: isDark ? '#2d2921' : '#d9d2c3',
      colorBorderSecondary: isDark ? '#201d16' : '#ebe5d6',

      colorText: isDark ? '#ebe7db' : '#1a1814',
      colorTextSecondary: isDark ? 'rgba(235,231,219,.68)' : 'rgba(26,24,20,.68)',
      colorTextTertiary: isDark ? 'rgba(235,231,219,.48)' : 'rgba(26,24,20,.48)',
      colorTextQuaternary: isDark ? 'rgba(235,231,219,.28)' : 'rgba(26,24,20,.28)',

      // Typography
      fontFamily: `'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`,
      fontFamilyCode: `'JetBrains Mono', SFMono-Regular, Menlo, Consolas, monospace`,
      fontSize: 13,
      controlHeight: 30,

      // Shape
      borderRadius: 4,
      borderRadiusLG: 6,
      borderRadiusSM: 2,
    },
    components: {
      Layout: {
        siderBg: isDark ? brand.siderInkDark : brand.siderInk,
        headerBg: isDark ? '#17150f' : '#ffffff',
        headerHeight: 52,
        headerPadding: '0 20px',
        bodyBg: isDark ? brand.bodyDark : brand.paper,
      },
      Menu: {
        darkItemBg: isDark ? brand.siderInkDark : brand.siderInk,
        darkItemSelectedBg: brand.rust,
        darkSubMenuItemBg: isDark ? brand.siderInkDark : brand.siderInk,
        darkItemHoverBg: 'rgba(255,255,255,.05)',
        darkGroupTitleColor: 'rgba(255,255,255,.38)',
        itemHeight: 36,
      },
      Table: {
        headerBg: isDark ? '#1e1b14' : '#faf7f0',
        headerColor: isDark ? 'rgba(235,231,219,.68)' : 'rgba(26,24,20,.68)',
        headerSplitColor: isDark ? '#201d16' : '#ebe5d6',
        rowHoverBg: isDark ? brand.rustSoftDark : brand.rustSoftLight,
        rowSelectedBg: isDark ? brand.rustSoftDark : brand.rustSoftLight,
        rowSelectedHoverBg: isDark ? 'rgba(253,97,65,.22)' : '#fde0d6',
        cellPaddingBlock: 9,
        cellPaddingInline: 14,
        fontSize: 13,
      },
      Button: {
        primaryShadow: '0 1px 0 rgba(253,97,65,.12)',
        defaultShadow: isDark ? '0 1px 0 rgba(0,0,0,.25)' : '0 1px 0 rgba(0,0,0,.02)',
      },
      Card: {
        boxShadowTertiary: isDark
          ? '0 1px 2px rgba(0,0,0,.3), 0 1px 6px -1px rgba(0,0,0,.25)'
          : '0 1px 2px rgba(0,0,0,.03), 0 1px 6px -1px rgba(0,0,0,.02)',
      },
      Tag: {
        defaultBg: isDark ? 'rgba(235,231,219,.06)' : 'rgba(26,24,20,.04)',
      },
      Alert: {
        colorWarningBg: isDark ? 'rgba(224,163,57,.12)' : '#fcf6e6',
        colorWarningBorder: isDark ? 'rgba(224,163,57,.4)' : '#ebd69a',
      },
      Breadcrumb: {
        fontSize: 13,
      },
      Segmented: {
        itemSelectedBg: isDark ? '#2d2921' : '#ffffff',
        itemSelectedColor: isDark ? '#ebe7db' : '#1a1814',
      },
    },
  };
}
