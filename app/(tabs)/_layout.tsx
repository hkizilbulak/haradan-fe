import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="index"
        options={{ title: 'İlanlar', tabBarIcon: () => null }}
      />
      <Tabs.Screen
        name="favorites"
        options={{ title: 'Favoriler', tabBarIcon: () => null }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profil', tabBarIcon: () => null }}
      />
    </Tabs>
  );
}
