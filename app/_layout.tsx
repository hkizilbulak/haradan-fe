import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { HeaderDrawersProvider } from '@/components/layout/HeaderDrawersContext';
import { Colors } from '@/constants/Colors';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const palette = Colors[scheme];

  const navTheme = {
    ...(scheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(scheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      primary: palette.primary,
      background: palette.background,
      card: palette.surface,
      text: palette.text,
      border: palette.border,
      notification: palette.error,
    },
  };

  return (
    <ThemeProvider value={navTheme}>
      <HeaderDrawersProvider>
        <Stack>
        <Stack.Screen
          name="(tabs)"
          options={{
            headerShown: false,
            title: 'Haradan.com | At İlanları',
          }}
        />
        <Stack.Screen
          name="auth"
          options={{
            headerShown: false,
            title: 'Hesap | Haradan.com',
          }}
        />
        <Stack.Screen
          name="advert"
          options={{
            headerShown: false,
            title: 'İlan | Haradan.com',
          }}
        />
        <Stack.Screen
          name="listings"
          options={{
            headerShown: false,
            title: 'İlanlar | Haradan.com',
          }}
        />
        <Stack.Screen
          name="post"
          options={{
            headerShown: false,
            title: 'İlan Ver | Haradan.com',
          }}
        />
        <Stack.Screen
          name="my-listings"
          options={{
            headerShown: false,
            title: 'İlanlarım | Haradan.com',
          }}
        />
        <Stack.Screen name="+not-found" options={{ title: 'Sayfa bulunamadı' }} />
        </Stack>
        <StatusBar style="auto" />
      </HeaderDrawersProvider>
    </ThemeProvider>
  );
}
