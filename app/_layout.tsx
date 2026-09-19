import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { HeaderDrawersProvider } from '@/components/layout/HeaderDrawersContext';
import { MobileDockHost } from '@/components/layout/MobileDockHost';
import { ToastProvider } from '@/components/ui';
import { Colors } from '@/constants/Colors';
import { useAppTheme } from '@/hooks/useAppTheme';

export default function RootLayout() {
  const { resolvedTheme, isDark } = useAppTheme();
  const palette = Colors[resolvedTheme];

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: palette.primary,
      background: palette.background,
      card: palette.surface,
      text: palette.text,
      border: palette.border,
      notification: palette.error,
    },
  };

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics ?? undefined}>
      <ThemeProvider value={navTheme}>
        <ToastProvider>
          <HeaderDrawersProvider>
            <Head>
              <link rel="manifest" href="/manifest.json" />
              <link rel="icon" type="image/png" sizes="32x32" href="/icon-32.png" />
              <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
              <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
              <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
              <link rel="apple-touch-icon-precomposed" sizes="180x180" href="/apple-touch-icon-precomposed.png" />
              <meta name="mobile-web-app-capable" content="yes" />
              <meta name="application-name" content="Haradan" />
              <meta name="apple-mobile-web-app-capable" content="yes" />
              <meta name="apple-mobile-web-app-title" content="Haradan" />
              <meta name="theme-color" content="#0d1117" />
              <style>{`
                /* Hide native OS scrollbars in modal dialogs and lists */
                ::-webkit-scrollbar {
                  display: none !important;
                  width: 0px !important;
                  height: 0px !important;
                  background: transparent !important;
                }
                * {
                  -ms-overflow-style: none !important;
                  scrollbar-width: none !important;
                }
                /* Prevent browser password autofill from forcing light/blue background */
                input:-webkit-autofill,
                input:-webkit-autofill:hover, 
                input:-webkit-autofill:focus, 
                input:-webkit-autofill:active {
                  -webkit-box-shadow: 0 0 0 1000px transparent inset !important;
                  -webkit-text-fill-color: inherit !important;
                  transition: background-color 5000s ease-in-out 0s;
                }
              `}</style>
            </Head>
            <View style={{ flex: 1 }}>
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
              <Stack.Screen
                name="verify-email"
                options={{
                  headerShown: false,
                  title: 'E-posta doğrula | Haradan.com',
                }}
              />
              <Stack.Screen
                name="reset-password"
                options={{
                  headerShown: false,
                  title: 'Şifre Sıfırla | Haradan.com',
                }}
              />
              <Stack.Screen
                name="+not-found"
                options={{ title: 'Sayfa bulunamadı' }}
              />
            </Stack>
            <MobileDockHost />
          </View>
          <StatusBar style="auto" />
        </HeaderDrawersProvider>
      </ToastProvider>
    </ThemeProvider>
    </SafeAreaProvider>
  );
}
