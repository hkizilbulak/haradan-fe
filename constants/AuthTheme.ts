/** Login panel premium dark palette. */
export const AuthDarkTheme = {
  background: '#09090b',
  surface: '#121216',
  surfaceElevated: '#1a1a20',
  text: '#f4f4f5',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',
  border: 'rgba(255,255,255,0.1)',
  borderFocus: 'rgba(255,140,66,0.65)',
  primary: '#f34770',
  primaryDark: '#d63a5f',
  accent: '#ff8c42',
  accentSoft: 'rgba(255,140,66,0.18)',
  glow: 'rgba(243,71,112,0.22)',
  error: '#ff6b8a',
  divider: 'rgba(255,255,255,0.08)',
  checkboxBorder: 'rgba(255,255,255,0.2)',
  frameless: false,
} as const;

/**
 * Cartzilla login referansı — beyaz zemin, ince border, siyah vurgular.
 */
export const AuthLuxuryTheme = {
  background: '#ffffff',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  text: '#1d2129',
  textSecondary: '#6c727f',
  textMuted: '#9ca3af',
  border: '#e3e9ef',
  borderFocus: 'rgba(29,33,41,0.28)',
  primary: '#0c0c0e',
  primaryDark: '#000000',
  accent: '#0c0c0e',
  accentSoft: 'rgba(12,12,14,0.04)',
  glow: 'rgba(12,12,14,0.14)',
  error: '#dc2626',
  divider: '#e3e9ef',
  checkboxBorder: '#cfd6de',
  frameless: false,
} as const;

export type AuthThemeVariant = 'light' | 'dark' | 'luxury';

export type AuthThemeTokens = {
  background: string;
  surface: string;
  surfaceElevated: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderFocus: string;
  primary: string;
  primaryDark: string;
  accent: string;
  accentSoft: string;
  glow: string;
  error: string;
  divider: string;
  checkboxBorder: string;
  frameless: boolean;
};

/** Login split oranları — form 40%, hero 60%. */
export const AUTH_FORM_RATIO = 0.4;
export const AUTH_FORM_MAX_WIDTH = 400;
