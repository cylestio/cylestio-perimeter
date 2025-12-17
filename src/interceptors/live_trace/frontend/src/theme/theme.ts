/**
 * Design Tokens for Agent Inspector Design System
 * Based on docs/design_system/tokens.md
 */

// ===========================================
// COLORS
// ===========================================

export const colors = {
  // Core Palette - "The Void"
  void: '#000000',
  surface: '#0a0a0f',
  surface2: '#12121a',
  surface3: '#1a1a24',
  surface4: '#22222e',

  // Borders
  borderSubtle: 'rgba(255, 255, 255, 0.06)',
  borderMedium: 'rgba(255, 255, 255, 0.14)',
  borderStrong: 'rgba(255, 255, 255, 0.20)',

  // Signal Colors - Cyan (Primary Accent)
  cyan: '#00f0ff',
  cyanSoft: 'rgba(0, 240, 255, 0.12)',

  // Signal Colors - Green (Success)
  green: '#00ff88',
  greenSoft: 'rgba(0, 255, 136, 0.12)',

  // Signal Colors - Orange (Warning/High)
  orange: '#ff9f43',
  orangeSoft: 'rgba(255, 159, 67, 0.12)',

  // Signal Colors - Red (Critical/Danger)
  red: '#ff4757',
  redSoft: 'rgba(255, 71, 87, 0.12)',

  // Signal Colors - Purple (AI/Behavioral)
  purple: '#a855f7',
  purpleSoft: 'rgba(168, 85, 247, 0.12)',

  // Signal Colors - Yellow (Medium)
  yellow: '#f59e0b',
  yellowSoft: 'rgba(245, 158, 11, 0.12)',

  // Signal Colors - Gold (Premium/Enterprise)
  gold: '#fbbf24',
  goldSoft: 'rgba(251, 191, 36, 0.12)',

  // Text Colors
  white: '#ffffff',
  white90: 'rgba(255, 255, 255, 0.90)',
  white80: 'rgba(255, 255, 255, 0.80)',
  white70: 'rgba(255, 255, 255, 0.70)',
  white50: 'rgba(255, 255, 255, 0.50)',
  white30: 'rgba(255, 255, 255, 0.30)',
  white20: 'rgba(255, 255, 255, 0.20)',
  white15: 'rgba(255, 255, 255, 0.15)',
  white08: 'rgba(255, 255, 255, 0.08)',
  white04: 'rgba(255, 255, 255, 0.04)',

  // Semantic - Severity
  severityCritical: '#dc2626',  // Dark red - most severe
  severityHigh: '#ef4444',      // Bright red - high severity
  severityMedium: '#f59e0b',    // Amber/orange - medium severity
  severityLow: '#6b7280',       // Gray - low severity
  severityPass: '#00ff88',      // Green - passed
} as const;

// ===========================================
// TYPOGRAPHY
// ===========================================

export const typography = {
  // Font Families
  fontDisplay: "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  fontMono: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",

  // Type Scale
  textXs: '11px',
  textSm: '12px',
  textBase: '13px',
  textMd: '14px',
  textLg: '16px',
  textXl: '18px',
  text2xl: '24px',
  text3xl: '32px',
  text4xl: '48px',
  text5xl: '64px',

  // Line Heights
  lineHeightTight: 1.2,
  lineHeightSnug: 1.3,
  lineHeightNormal: 1.5,
  lineHeightRelaxed: 1.6,

  // Font Weights
  weightNormal: 400,
  weightMedium: 500,
  weightSemibold: 600,
  weightBold: 700,
  weightExtrabold: 800,

  // Letter Spacing
  trackingTight: '-0.02em',
  trackingNormal: '0',
  trackingWide: '0.05em',
  trackingWider: '0.08em',
} as const;

// ===========================================
// SPACING
// ===========================================

export const spacing = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
} as const;

// ===========================================
// BORDER RADIUS
// ===========================================

export const radii = {
  xs: '2px',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  '2xl': '16px',
  full: '9999px',
} as const;

// ===========================================
// SHADOWS
// ===========================================

export const shadows = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
  md: '0 4px 8px rgba(0, 0, 0, 0.4)',
  lg: '0 8px 32px rgba(0, 0, 0, 0.5)',
  xl: '0 16px 48px rgba(0, 0, 0, 0.6)',

  // Glow Effects
  glowCyan: '0 0 20px rgba(0, 240, 255, 0.3), 0 0 40px rgba(0, 240, 255, 0.15)',
  glowGreen: '0 0 20px rgba(0, 255, 136, 0.3), 0 0 40px rgba(0, 255, 136, 0.15)',
  glowRed: '0 0 20px rgba(255, 71, 87, 0.3), 0 0 40px rgba(255, 71, 87, 0.15)',
  glowOrange: '0 0 20px rgba(255, 159, 67, 0.3), 0 0 40px rgba(255, 159, 67, 0.15)',
  glowPurple: '0 0 20px rgba(168, 85, 247, 0.3), 0 0 40px rgba(168, 85, 247, 0.15)',
} as const;

// ===========================================
// TRANSITIONS
// ===========================================

export const transitions = {
  fast: '150ms ease',
  base: '200ms ease',
  slow: '300ms ease',
  spring: '300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

// ===========================================
// BREAKPOINTS
// ===========================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ===========================================
// Z-INDEX
// ===========================================

export const zIndex = {
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBg: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  toast: 800,
} as const;

// ===========================================
// LAYOUT
// ===========================================

export const layout = {
  sidebarWidth: '260px',
  sidebarCollapsed: '64px',
  contentMaxWidth: '1200px',
  pageMaxWidth: '1400px',
  pagePadding: '32px',
  cardPadding: '24px',
  cardHeaderPadding: '16px 20px',
} as const;

// ===========================================
// THEME OBJECT
// ===========================================

export const theme = {
  colors,
  typography,
  spacing,
  radii,
  shadows,
  transitions,
  breakpoints,
  zIndex,
  layout,
} as const;

export type Theme = typeof theme;
