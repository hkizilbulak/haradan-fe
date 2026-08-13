import { Stack } from 'expo-router';

export default function ListingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'İlanlar | Haradan.com' }} />
    </Stack>
  );
}
