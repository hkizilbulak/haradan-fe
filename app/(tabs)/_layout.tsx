import { Tabs } from 'expo-router';

/**
 * Tab ekranları — alt navigasyon MobileDockHost (root) üzerinden.
 * Varsayılan tab bar gizli; height:0 kırpma sorunu yok.
 */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="favorites" options={{ title: 'Wishlist' }} />
      <Tabs.Screen name="profile" options={{ title: 'Account' }} />
    </Tabs>
  );
}
