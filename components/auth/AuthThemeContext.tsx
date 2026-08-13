import React, { createContext, useContext, useMemo } from 'react';
import { Colors } from '@/constants/Colors';
import {
  AuthDarkTheme,
  AuthLuxuryTheme,
  type AuthThemeTokens,
  type AuthThemeVariant,
} from '@/constants/AuthTheme';

type AuthThemeContextValue = {
  variant: AuthThemeVariant;
  tokens: AuthThemeTokens;
};

const AuthThemeContext = createContext<AuthThemeContextValue | null>(null);

function buildLightTokens(): AuthThemeTokens {
  const c = Colors.light;
  return {
    background: c.surface,
    surface: c.surface,
    surfaceElevated: c.background,
    text: c.text,
    textSecondary: c.textSecondary,
    textMuted: c.textMuted,
    border: c.border,
    borderFocus: 'rgba(29,33,41,0.22)',
    primary: c.primary,
    primaryDark: c.primaryDark,
    accent: c.warning,
    accentSoft: c.warningLight,
    glow: 'rgba(243,71,112,0.12)',
    error: c.error,
    divider: c.border,
    checkboxBorder: c.border,
    frameless: false,
  };
}

function resolveTokens(variant: AuthThemeVariant): AuthThemeTokens {
  if (variant === 'dark') return AuthDarkTheme;
  if (variant === 'luxury') return AuthLuxuryTheme;
  return buildLightTokens();
}

type AuthThemeProviderProps = {
  variant?: AuthThemeVariant;
  children: React.ReactNode;
};

export function AuthThemeProvider({
  variant = 'light',
  children,
}: AuthThemeProviderProps) {
  const value = useMemo<AuthThemeContextValue>(
    () => ({
      variant,
      tokens: resolveTokens(variant),
    }),
    [variant]
  );

  return (
    <AuthThemeContext.Provider value={value}>{children}</AuthThemeContext.Provider>
  );
}

export function useAuthTheme(): AuthThemeContextValue {
  const ctx = useContext(AuthThemeContext);
  if (!ctx) {
    return {
      variant: 'light',
      tokens: buildLightTokens(),
    };
  }
  return ctx;
}
