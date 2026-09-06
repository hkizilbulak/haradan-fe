import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/hooks/useAuth';
import { useAuthTheme } from './AuthThemeContext';
import type { AuthSession } from '@/types';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string; select_by?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
            itp_support?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number;
              locale?: string;
            }
          ) => void;
          prompt: (notification?: (notification: unknown) => void) => void;
        };
      };
    };
  }
}

const DEFAULT_CLIENT_ID =
  '180081639052-v2e88scbeblkf79ai3aa872iqr3bgj9v.apps.googleusercontent.com';

type GoogleSignInButtonProps = {
  onSuccess?: (session: AuthSession) => void;
  onError?: (error: string) => void;
  actionText?: 'login' | 'signup';
  disabled?: boolean;
};

export function GoogleSignInButton({
  onSuccess,
  onError,
  actionText = 'login',
  disabled = false,
}: GoogleSignInButtonProps) {
  const { loginWithGoogle } = useAuth();
  const { tokens } = useAuthTheme();
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const buttonContainerRef = useRef<View>(null);

  const clientId =
    process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID;

  const handleCredentialResponse = async (response: { credential?: string }) => {
    if (!response.credential) {
      onError?.('Google ile kimlik doğrulanamadı.');
      return;
    }
    setSigningIn(true);
    try {
      const session = await loginWithGoogle(response.credential);
      if (session) {
        onSuccess?.(session);
      } else {
        onError?.('Google ile giriş işlemi tamamlanamadı.');
      }
    } catch (err) {
      onError?.(
        err instanceof Error ? err.message : 'Google ile giriş yapılırken bir hata oluştu.'
      );
    } finally {
      setSigningIn(false);
    }
  };

  const callbackRef = useRef(handleCredentialResponse);
  callbackRef.current = handleCredentialResponse;

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const initGsi = () => {
      if (!window.google?.accounts?.id) return;
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (res) => {
            callbackRef.current(res);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          itp_support: true,
        });
        setScriptLoaded(true);

        const el = buttonContainerRef.current as unknown as HTMLElement;
        if (el) {
          el.innerHTML = '';
          window.google.accounts.id.renderButton(el, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: actionText === 'signup' ? 'signup_with' : 'signin_with',
            shape: 'rectangular',
            logo_alignment: 'left',
            width: 320,
            locale: 'tr',
          });
        }
      } catch {
        /* ignore GSI init error */
      }
    };

    if (window.google?.accounts?.id) {
      initGsi();
      return;
    }

    const scriptId = 'google-gsi-client-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => initGsi();
      script.onerror = () => {
        /* fallback visible */
      };
      document.body.appendChild(script);
    } else {
      script.addEventListener('load', initGsi);
    }

    return () => {
      if (script) {
        script.removeEventListener('load', initGsi);
      }
    };
  }, [actionText, clientId]);

  const handleManualClick = () => {
    if (disabled || signingIn) return;
    if (Platform.OS === 'web' && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.prompt();
      } catch {
        /* ignore */
      }
    }
  };

  const label =
    actionText === 'signup'
      ? 'Google ile kayıt ol'
      : 'Google ile giriş yap';

  return (
    <View style={styles.container}>
      {/* Official Google Identity Services button container on Web */}
      {Platform.OS === 'web' && (
        <div
          ref={buttonContainerRef as unknown as React.RefObject<HTMLDivElement>}
          style={{
            display: signingIn ? 'none' : 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            minHeight: 44,
          }}
        />
      )}

      {/* Fallback / Loading Custom Button */}
      {(!scriptLoaded || signingIn || Platform.OS !== 'web') && (
        <Pressable
          onPress={handleManualClick}
          disabled={disabled || signingIn}
          style={({ pressed }) => [
            styles.customButton,
            {
              borderColor: tokens.border,
              backgroundColor: pressed ? tokens.surfaceElevated : tokens.surface,
              opacity: disabled ? 0.6 : 1,
            },
          ]}
        >
          {signingIn ? (
            <ActivityIndicator size="small" color={tokens.primary} />
          ) : (
            <Ionicons name="logo-google" size={18} color="#EA4335" />
          )}
          <Text style={[styles.customButtonText, { color: tokens.text }]}>
            {signingIn ? 'Giriş yapılıyor...' : label}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  customButton: {
    width: '100%',
    maxWidth: 320,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    ...Platform.select({
      web: { cursor: 'pointer' as const },
      default: {},
    }),
  },
  customButtonText: {
    ...Typography.body,
    fontWeight: '500',
    fontSize: 14,
  },
});
