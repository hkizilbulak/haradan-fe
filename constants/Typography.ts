import { TextStyle } from 'react-native';

/**
 * Tipografi ölçeği — mobil kolon (canvas TYPE_SCALE).
 * Font ailesi native sistem tipografisi; ağırlık ile hiyerarşi kurulur.
 */
export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
  },
  h5: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  body: {
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
  },
  small: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 18,
  },
  caption: {
    fontSize: 11,
    fontWeight: '400',
    lineHeight: 14,
  },
} as const satisfies Record<string, TextStyle>;

export type TypographyKey = keyof typeof Typography;
