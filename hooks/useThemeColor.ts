import { useColorScheme } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useIsHydrated } from '@/hooks/useIsHydrated';

export function useThemeColor(
  colorName: keyof typeof Colors.light
): string {
  const hydrated = useIsHydrated();
  const scheme = useColorScheme();
  const resolved = !hydrated ? 'light' : (scheme ?? 'light');
  return Colors[resolved][colorName];
}
