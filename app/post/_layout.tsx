import { Stack } from 'expo-router';

export default function PostLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" options={{ title: 'İlan Ver | Haradan.com' }} />
      <Stack.Screen
        name="payment-result"
        options={{ title: 'Ödeme sonucu | Haradan.com' }}
      />
    </Stack>
  );
}
