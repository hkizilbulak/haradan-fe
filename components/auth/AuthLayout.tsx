import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthBrand } from './AuthBrand';
import { AuthHeroPanel } from './AuthHeroPanel';
import { AuthThemeProvider, useAuthTheme } from './AuthThemeContext';
import { Spacing } from '@/constants/Spacing';
import {
  AUTH_FORM_MAX_WIDTH,
  AUTH_FORM_RATIO,
  type AuthThemeVariant,
} from '@/constants/AuthTheme';

type AuthLayoutProps = {
  children: React.ReactNode;
  formKey?: string;
  variant?: AuthThemeVariant;
  formRatio?: number;
};

const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const WIDE_BREAKPOINT = 900;

function AuthLayoutInner({
  children,
  formKey = 'auth',
  formRatio = AUTH_FORM_RATIO,
}: AuthLayoutProps) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { tokens } = useAuthTheme();
  const isWide = width >= WIDE_BREAKPOINT;

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(12);
    heroOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 480,
        easing: EASE,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 480,
        easing: EASE,
        useNativeDriver: true,
      }),
      Animated.timing(heroOpacity, {
        toValue: 1,
        duration: 600,
        delay: 80,
        easing: EASE,
        useNativeDriver: true,
      }),
    ]).start();
  }, [formKey, opacity, translateY, heroOpacity]);

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: tokens.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      <View style={[styles.split, !isWide && styles.splitStack]}>
        <KeyboardAvoidingView
          style={[
            styles.formPane,
            isWide && { flex: formRatio },
            { backgroundColor: tokens.background },
          ]}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={[
              styles.formScroll,
              isWide ? styles.formScrollWide : styles.formScrollNarrow,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.formColumn, { maxWidth: AUTH_FORM_MAX_WIDTH }]}>
              <AuthBrand />
              <Animated.View
                style={{
                  opacity,
                  transform: [{ translateY }],
                  marginTop: Spacing['2xl'],
                }}
              >
                {children}
              </Animated.View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {isWide ? (
          <Animated.View
            style={[
              styles.heroPane,
              { flex: 1 - formRatio, opacity: heroOpacity },
            ]}
          >
            <AuthHeroPanel />
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

export function AuthLayout({
  children,
  formKey = 'auth',
  variant = 'light',
  formRatio = AUTH_FORM_RATIO,
}: AuthLayoutProps) {
  return (
    <AuthThemeProvider variant={variant}>
      <AuthLayoutInner formKey={formKey} formRatio={formRatio}>
        {children}
      </AuthLayoutInner>
    </AuthThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  split: {
    flex: 1,
    flexDirection: 'row',
  },
  splitStack: {
    flexDirection: 'column',
  },
  formPane: {
    flex: 1,
  },
  formScroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  formScrollWide: {
    paddingHorizontal: 48,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formScrollNarrow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },
  formColumn: {
    width: '100%',
    alignSelf: 'center',
  },
  heroPane: {
    minHeight: '100%',
    paddingVertical: Spacing.md,
    paddingRight: Spacing.md,
  },
});
