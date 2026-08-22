import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MobileGlassDock } from '@/components/layout/MobileGlassDock';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function TabsLayout() {
  const primary = useThemeColor('primary');
  const textMuted = useThemeColor('textMuted');
  const isWeb = Platform.OS === 'web';
  const useGlassDock = !isWeb;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: primary,
        tabBarInactiveTintColor: textMuted,
        tabBarStyle: useGlassDock
          ? {
              position: 'absolute',
              backgroundColor: 'transparent',
              borderTopWidth: 0,
              elevation: 0,
              height: 0,
            }
          : { display: 'none' },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
      tabBar={useGlassDock ? (props) => <MobileGlassDock {...props} /> : undefined}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarAccessibilityLabel: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={size}
              color={focused ? primary : color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Wishlist',
          tabBarAccessibilityLabel: 'Wishlist',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'heart' : 'heart-outline'}
              size={size}
              color={focused ? primary : color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Account',
          tabBarAccessibilityLabel: 'Account',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
