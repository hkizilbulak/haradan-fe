import { Colors } from '@/constants/Colors';
import { useAppTheme } from '@/hooks/useAppTheme';

export function useThemeColor(
  colorName: keyof typeof Colors.light
): string {
  const { resolvedTheme } = useAppTheme();
  return Colors[resolvedTheme][colorName];
}

