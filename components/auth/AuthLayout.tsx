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
import { AuthBackButton } from './AuthBackButton';
import { AuthGlassCard } from './AuthGlassCard';
import { AuthHeroPanel } from './AuthHeroPanel';
import { AuthMobileGlassBackdrop } from './AuthMobileGlassBackdrop';
import { AuthMobileHero } from './AuthMobileHero';
import {
  AuthLayoutContextProvider,
  type AuthMobileLayout,
} from './AuthLayoutContext';
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
  mobileTagline?: string;
  /** Mobil: sheet (alt kart) veya glass (ortalanmış liquid glass). */
  mobileLayout?: AuthMobileLayout;
};

const EASE = Easing.bezier(0.22, 1, 0.36, 1);
const WIDE_BREAKPOINT = 900;

function AuthLayoutInner({
  children,
  formKey = 'auth',
  formRatio = AUTH_FORM_RATIO,
  mobileTagline = "Türkiye'nin at ilan platformu",
  mobileLayout = 'sheet',
}: AuthLayoutProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { tokens } = useAuthTheme();
  const isWide = width >= WIDE_BREAKPOINT;
  const isMobile = !isWide;

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scale = useRef(new Animated.Value(0.97)).current;
  const heroOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(20);
    scale.setValue(0.97);
    heroOpacity.setValue(0);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 520,
        easing: EASE,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 520,
        easing: EASE,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 9,
        tension: 80,
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
  }, [formKey, opacity, translateY, scale, heroOpacity]);

  const cardAnimStyle = {
    opacity,
    transform: [{ translateY }, { scale }],
  };

  if (isMobile && mobileLayout === 'glass') {
    const viewportMin =
      height - insets.top - insets.bottom - Spacing.md * 2;

    return (
      <AuthLayoutContextProvider isMobile mobileLayout="glass">
        <View style={styles.mobileGlassRoot}>
          <AuthMobileGlassBackdrop />
          <View
            style={[
              styles.glassNav,
              { top: insets.top + Spacing.sm, left: Spacing.lg },
            ]}
          >
            <AuthBackButton onHero />
          </View>

          <KeyboardAvoidingView
            style={styles.mobileFlex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            <ScrollView
              style={styles.mobileFlex}
              contentContainerStyle={[
                styles.glassScroll,
                {
                  minHeight: viewportMin,
                  paddingTop: insets.top + 52,
                  paddingBottom: insets.bottom + Spacing.lg,
                  paddingHorizontal: Spacing.lg,
                },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <Animated.View style={[styles.glassCenter, cardAnimStyle]}>
                <AuthGlassCard>{children}</AuthGlassCard>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </AuthLayoutContextProvider>
    );
  }

  if (isMobile) {
    return (
      <AuthLayoutContextProvider isMobile mobileLayout="sheet">
        <View style={[styles.mobileRoot, { backgroundColor: tokens.background }]}>
          <View style={[styles.mobileHeroWrap, { paddingTop: insets.top }]}>
            <View style={[styles.mobileNav, { top: insets.top + Spacing.sm }]}>
              <AuthBackButton onHero />
            </View>
            <AuthMobileHero tagline={mobileTagline} />
          </View>

          <KeyboardAvoidingView
            style={styles.mobileFlex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
          >
            <ScrollView
              style={styles.mobileFlex}
              contentContainerStyle={[
                styles.mobileScroll,
                { paddingBottom: insets.bottom + Spacing.xl },
              ]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              <Animated.View
                style={[
                  styles.mobileCard,
                  {
                    backgroundColor: tokens.surface,
                    opacity,
                    transform: [{ translateY }],
                  },
                ]}
              >
                {children}
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </AuthLayoutContextProvider>
    );
  }

  return (
    <AuthLayoutContextProvider isMobile={false} mobileLayout="sheet">
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
        <View style={styles.split}>
          <KeyboardAvoidingView
            style={[
              styles.formPane,
              { flex: formRatio, backgroundColor: tokens.background },
            ]}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <ScrollView
              contentContainerStyle={styles.formScrollWide}
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

          <Animated.View
            style={[
              styles.heroPane,
              { flex: 1 - formRatio, opacity: heroOpacity },
            ]}
          >
            <AuthHeroPanel />
          </Animated.View>
        </View>
      </View>
    </AuthLayoutContextProvider>
  );
}

export function AuthLayout({
  children,
  formKey = 'auth',
  variant = 'light',
  formRatio = AUTH_FORM_RATIO,
  mobileTagline,
  mobileLayout = 'sheet',
}: AuthLayoutProps) {
  return (
    <AuthThemeProvider variant={variant}>
      <AuthLayoutInner
        formKey={formKey}
        formRatio={formRatio}
        mobileTagline={mobileTagline}
        mobileLayout={mobileLayout}
      >
        {children}
      </AuthLayoutInner>
    </AuthThemeProvider>
  );
}

const CARD_RADIUS = 24;

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  split: {
    flex: 1,
    flexDirection: 'row',
  },
  formPane: {
    flex: 1,
  },
  formScrollWide: {
    flexGrow: 1,
    paddingHorizontal: 48,
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
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
  mobileGlassRoot: {
    flex: 1,
    backgroundColor: '#0c0c0e',
  },
  glassNav: {
    position: 'absolute',
    zIndex: 10,
  },
  glassScroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassCenter: {
    width: '100%',
    alignItems: 'center',
  },
  mobileRoot: {
    flex: 1,
  },
  mobileHeroWrap: {
    position: 'relative',
  },
  mobileNav: {
    position: 'absolute',
    left: Spacing.md,
    zIndex: 2,
  },
  mobileFlex: {
    flex: 1,
  },
  mobileScroll: {
    flexGrow: 1,
  },
  mobileCard: {
    marginTop: -CARD_RADIUS,
    borderTopLeftRadius: CARD_RADIUS,
    borderTopRightRadius: CARD_RADIUS,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    minHeight: 420,
    ...Platform.select({
      ios: {
        shadowColor: '#0c0c0e',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  },
});
