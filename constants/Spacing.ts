/** 4px tabanlı boşluk sistemi — canvas kuralları. */
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
} as const;

export type SpacingKey = keyof typeof Spacing;
