import React from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthTheme } from './AuthThemeContext';

type AuthBackButtonProps = {
  /** Mobilde hero üzerinde açık ikon. */
  onHero?: boolean;
};

export function AuthBackButton({ onHero = false }: AuthBackButtonProps) {
  const router = useRouter();
  const { tokens } = useAuthTheme();

  const onPress = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Geri"
      hitSlop={12}
      style={({ pressed }) => [
        styles.btn,
        onHero ? styles.onHero : { backgroundColor: tokens.surface },
        pressed ? { opacity: 0.75 } : null,
      ]}
    >
      <Ionicons
        name="chevron-back"
        size={22}
        color={onHero ? '#ffffff' : tokens.text}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' as const },
      default: {},
    }),
  },
  onHero: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
});
