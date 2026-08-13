/** Köşe yarıçapları — canvas kuralları. */
export const Radius = {
  input: 8,
  card: 12,
  sheet: 16,
  pill: 50,
  avatar: 999,
} as const;

export type RadiusKey = keyof typeof Radius;
