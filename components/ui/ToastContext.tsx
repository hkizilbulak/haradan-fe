import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeInsets } from '@/hooks/useSafeInsets';
import { useThemeColor } from '@/hooks/useThemeColor';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type ToastOptions = {
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
};

type ToastContextValue = {
  showToast: (options: ToastOptions | string) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  hideToast: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

let globalShowToast: ((options: ToastOptions | string) => void) | null = null;

/** Standalone toast helper function — her yerden çağrılabilir. */
export const toast = {
  show: (options: ToastOptions | string) => globalShowToast?.(options),
  success: (message: string, title?: string) =>
    globalShowToast?.({ type: 'success', message, title }),
  error: (message: string, title?: string) =>
    globalShowToast?.({ type: 'error', message, title }),
  warning: (message: string, title?: string) =>
    globalShowToast?.({ type: 'warning', message, title }),
  info: (message: string, title?: string) =>
    globalShowToast?.({ type: 'info', message, title }),
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}

type ToastState = (ToastOptions & { id: number }) | null;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [activeToast, setActiveToast] = useState<ToastState>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const safeInsets = useSafeInsets();
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  const hideToast = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 220,
        easing: Easing.bezier(0.4, 0, 1, 1),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setActiveToast(null);
    });
  }, [opacity, translateY]);

  const showToast = useCallback(
    (opts: ToastOptions | string) => {
      const options: ToastOptions =
        typeof opts === 'string' ? { message: opts, type: 'info' } : opts;

      if (timerRef.current) clearTimeout(timerRef.current);

      const nextState = { ...options, id: Date.now() };
      setActiveToast(nextState);

      translateY.setValue(-80);
      opacity.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();

      const duration = options.duration ?? 3500;
      timerRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    },
    [hideToast, opacity, translateY]
  );

  useEffect(() => {
    globalShowToast = showToast;
    return () => {
      globalShowToast = null;
    };
  }, [showToast]);

  const showSuccess = useCallback(
    (message: string, title?: string) =>
      showToast({ type: 'success', message, title }),
    [showToast]
  );
  const showError = useCallback(
    (message: string, title?: string) =>
      showToast({ type: 'error', message, title }),
    [showToast]
  );
  const showWarning = useCallback(
    (message: string, title?: string) =>
      showToast({ type: 'warning', message, title }),
    [showToast]
  );
  const showInfo = useCallback(
    (message: string, title?: string) =>
      showToast({ type: 'info', message, title }),
    [showToast]
  );

  const contextValue = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideToast,
  };

  const type = activeToast?.type ?? 'info';
  const iconName =
    type === 'success'
      ? 'checkmark-circle'
      : type === 'error'
        ? 'close-circle'
        : type === 'warning'
          ? 'warning'
          : 'information-circle';

  const typeColor =
    type === 'success'
      ? '#10b981'
      : type === 'error'
        ? '#ef4444'
        : type === 'warning'
          ? '#f59e0b'
          : '#3b82f6';

  const topInset = Math.max(safeInsets.top + 12, 16);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {activeToast ? (
        <Animated.View
          style={[
            styles.toastHost,
            {
              top: topInset,
              opacity,
              transform: [{ translateY }],
            },
          ]}
          pointerEvents="box-none"
        >
          <Pressable
            onPress={hideToast}
            style={({ pressed }) => [
              styles.toastCard,
              {
                backgroundColor: isDark ? '#1e293b' : '#ffffff',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
                opacity: pressed ? 0.92 : 1,
                ...(Platform.OS === 'web'
                  ? ({
                      backdropFilter: 'blur(16px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                      boxShadow: isDark
                        ? '0 16px 36px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08)'
                        : '0 16px 36px rgba(15, 23, 42, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05)',
                    } as object)
                  : null),
              },
            ]}
          >
            <View style={[styles.accentLine, { backgroundColor: typeColor }]} />

            <View style={[styles.iconContainer, { backgroundColor: `${typeColor}18` }]}>
              <Ionicons name={iconName} size={22} color={typeColor} />
            </View>

            <View style={styles.content}>
              {activeToast.title ? (
                <Text style={[styles.title, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                  {activeToast.title}
                </Text>
              ) : null}
              <Text
                style={[
                  styles.message,
                  {
                    color: isDark ? '#cbd5e1' : '#334155',
                    marginTop: activeToast.title ? 2 : 0,
                  },
                ]}
              >
                {activeToast.message}
              </Text>
            </View>

            <Pressable
              onPress={hideToast}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
              style={({ pressed }) => [
                styles.closeButton,
                pressed && { opacity: 0.6 },
              ]}
            >
              <Ionicons
                name="close"
                size={18}
                color={isDark ? '#94a3b8' : '#64748b'}
              />
            </Pressable>
          </Pressable>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toastHost: {
    position: Platform.OS === 'web' ? ('fixed' as unknown as 'absolute') : 'absolute',
    left: 16,
    right: 16,
    zIndex: 99999,
    alignItems: 'center',
  },
  toastCard: {
    width: '100%',
    maxWidth: 460,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    elevation: 8,
  },
  accentLine: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginLeft: 4,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 13.5,
    fontWeight: '500',
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});
