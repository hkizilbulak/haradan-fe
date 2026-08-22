import { useContext } from 'react';
import {
  SafeAreaInsetsContext,
  type EdgeInsets,
} from 'react-native-safe-area-context';

const ZERO_INSETS: EdgeInsets = { top: 0, right: 0, bottom: 0, left: 0 };

/**
 * Safe area inset'leri — provider yoksa veya SSR'de sıfır döner, crash etmez.
 */
export function useSafeInsets(): EdgeInsets {
  const insets = useContext(SafeAreaInsetsContext);
  return insets ?? ZERO_INSETS;
}
