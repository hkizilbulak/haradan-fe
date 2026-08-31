/** Login panel premium dark palette. */
export const AuthDarkTheme = {
  background: '#09090b',
  surface: '#121216',
  surfaceElevated: '#1a1a20',
  text: '#f4f4f5',
  textSecondary: '#a1a1aa',
  textMuted: '#71717a',
  border: 'rgba(255,255,255,0.1)',
  borderFocus: 'rgba(255,96,0,0.65)',
  primary: '#ff6000',
  primaryDark: '#e05300',
  accent: '#ff6000',
  accentSoft: 'rgba(255,96,0,0.18)',
  glow: 'rgba(255,96,0,0.22)',
  error: '#ff6b8a',
  divider: 'rgba(255,255,255,0.08)',
  checkboxBorder: 'rgba(255,255,255,0.2)',
  frameless: false,
} as const;

/**
 * Haradan auth — temiz beyaz zemin, canlı turuncu CTA.
 * Mobil ve masaüstü giriş / kayıt ekranları.
 */
export const AuthLuxuryTheme = {
  background: '#f3f5f9',
  surface: '#ffffff',
  surfaceElevated: '#ffffff',
  text: '#1d2129',
  textSecondary: '#6c727f',
  textMuted: '#9ca3af',
  border: '#e3e9ef',
  borderFocus: 'rgba(255,96,0,0.45)',
  primary: '#ff6000',
  primaryDark: '#e05300',
  accent: '#ff6000',
  accentSoft: 'rgba(255,96,0,0.08)',
  glow: 'rgba(255,96,0,0.22)',
  error: '#dc2626',
  errorSoft: '#fef2f2',
  success: '#16a34a',
  successSoft: '#f0fdf4',
  infoSoft: '#eff6ff',
  divider: '#e3e9ef',
  checkboxBorder: '#cfd6de',
  frameless: false,
  heroOverlay: 'rgba(12,12,14,0.55)',
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
  errorSoft?: string;
  success?: string;
  successSoft?: string;
  infoSoft?: string;
  divider: string;
  checkboxBorder: string;
  frameless: boolean;
  heroOverlay?: string;
};

/** Login split oranları — form 40%, hero 60%. */
export const AUTH_FORM_RATIO = 0.4;
export const AUTH_FORM_MAX_WIDTH = 400;
