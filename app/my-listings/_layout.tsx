import { Stack } from 'expo-router';

export default function MyListingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" options={{ title: 'İlanlarım | Haradan.com' }} />
      <Stack.Screen name="edit" options={{ title: 'İlanı düzenle | Haradan.com' }} />
    </Stack>
  );
}
