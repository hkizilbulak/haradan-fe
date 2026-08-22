import { Platform, StyleSheet } from 'react-native';

const INK = '#0c0c0e';

/** Paylaşılan liquid-glass yüzey stilleri. */
export const glassSurface = StyleSheet.create({
  /** Açık tema — kart / arama. */
  panel: {
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.52)',
    backgroundColor: 'rgba(255,255,255,0.78)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(28px) saturate(185%)',
        WebkitBackdropFilter: 'blur(28px) saturate(185%)',
        boxShadow:
          '0 16px 48px rgba(12,12,14,0.12), inset 0 1px 0 rgba(255,255,255,0.65)',
      } as object,
      ios: {
        shadowColor: INK,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.14,
        shadowRadius: 28,
      },
      android: { elevation: 14 },
      default: {},
    }),
  },
  /** Koyu kontrast — mobil alt bar. */
  dockDark: {
    backgroundColor: 'rgba(12,12,14,0.94)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    ...Platform.select({
      web: {
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        boxShadow: '0 -8px 32px rgba(0,0,0,0.35)',
      } as object,
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: { elevation: 16 },
      default: {},
    }),
  },
  /** Havada duran oval mobil üst bar — solid siyah. */
  headerFloat: {
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: INK,
    ...Platform.select({
      web: {
        boxShadow:
          '0 12px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
      } as object,
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.28,
        shadowRadius: 20,
      },
      android: { elevation: 12 },
      default: {},
    }),
  },
  /** Koyu kontrast — tam genişlik şerit (kullanılmıyor, geriye dönük). */
  headerDark: {
    backgroundColor: INK,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
});

export const MOBILE_INK = INK;
