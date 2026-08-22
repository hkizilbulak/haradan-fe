import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AuthBanner } from './AuthBanner';
import { AuthFormHeader } from './AuthFormHeader';
import { AuthScreenFooter } from './AuthScreenFooter';
import { AuthSubmitButton } from './AuthSubmitButton';
import { AuthTextField } from './AuthTextField';
import { PasswordStrengthBar } from './PasswordStrengthBar';
import { useAuthTheme } from './AuthThemeContext';
import { AUTH_FORM_MAX_WIDTH } from '@/constants/AuthTheme';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useAuth } from '@/hooks/useAuth';
import { setAuthSession } from '@/services/auth/sessionStore';

type SignupFormProps = {
  onSuccess?: (message: string) => void;
};

export function SignupForm({ onSuccess }: SignupFormProps) {
  const router = useRouter();
  const { register, login, loading, error, clearError } = useAuth();
  const { tokens } = useAuthTheme();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const handleSubmit = async () => {
    clearError();
    setFieldError(null);
    if (password !== confirm) {
      setFieldError('Parolalar eşleşmiyor.');
      return;
    }
    if (password.length < 8) {
      setFieldError('Parola en az 8 karakter olmalıdır.');
      return;
    }
    if (firstName.trim().length > 100 || lastName.trim().length > 100) {
      setFieldError('Ad ve soyad en fazla 100 karakter olabilir.');
      return;
    }
    const result = await register({
      email: email.trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });
    if (!result) return;
    onSuccess?.(result.message);

    const session = await login(email.trim(), password);
    if (session) {
      setAuthSession(session);
      router.replace('/(tabs)');
    } else {
      router.replace({
        pathname: '/auth/login',
        params: { registered: '1' },
      });
    }
  };

  const displayError = fieldError ?? error;

  return (
    <View style={styles.wrap}>
      <AuthFormHeader
        title="Hesap oluştur"
        subtitle={
          <Text style={[styles.lead, { color: tokens.textSecondary }]}>
            Ücretsiz hesap açın, ilan verin ve favorilerinizi kaydedin.
          </Text>
        }
      />

      {displayError ? (
        <AuthBanner message={displayError} variant="error" />
      ) : null}

      <View style={styles.fields}>
        <View style={styles.nameRow}>
          <View style={styles.nameCol}>
            <AuthTextField
              label="Ad"
              placeholder="Adınız"
              value={firstName}
              onChangeText={(v) => {
                clearError();
                setFieldError(null);
                setFirstName(v);
              }}
              leftIcon="person-outline"
              autoComplete="given-name"
              textContentType="givenName"
              returnKeyType="next"
            />
          </View>
          <View style={styles.nameCol}>
            <AuthTextField
              label="Soyad"
              placeholder="Soyadınız"
              value={lastName}
              onChangeText={(v) => {
                clearError();
                setFieldError(null);
                setLastName(v);
              }}
              autoComplete="family-name"
              textContentType="familyName"
              returnKeyType="next"
            />
          </View>
        </View>
        <AuthTextField
          label="E-posta"
          placeholder="ornek@email.com"
          value={email}
          onChangeText={(v) => {
            clearError();
            setFieldError(null);
            setEmail(v);
          }}
          leftIcon="mail-outline"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
        />
        <View>
          <AuthTextField
            label="Parola"
            placeholder="En az 8 karakter"
            value={password}
            onChangeText={(v) => {
              clearError();
              setFieldError(null);
              setPassword(v);
            }}
            leftIcon="lock-closed-outline"
            secureTextEntry={!showPassword}
            autoComplete="new-password"
            textContentType="newPassword"
            rightIcon={showPassword ? 'eye-off' : 'eye'}
            onRightIconPress={() => setShowPassword((s) => !s)}
          />
          <PasswordStrengthBar password={password} />
        </View>
        <AuthTextField
          label="Parola tekrar"
          placeholder="Parolayı tekrar girin"
          value={confirm}
          onChangeText={(v) => {
            setFieldError(null);
            setConfirm(v);
          }}
          leftIcon="shield-checkmark-outline"
          secureTextEntry={!showPassword}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          error={
            confirm && password !== confirm ? 'Parolalar eşleşmiyor.' : null
          }
        />
      </View>

      <Text style={[styles.terms, { color: tokens.textMuted }]}>
        Hesap oluşturarak{' '}
        <Text style={{ color: tokens.textSecondary, fontWeight: '600' }}>
          kullanım koşullarını
        </Text>{' '}
        kabul etmiş olursunuz.
      </Text>

      <AuthSubmitButton
        label="Hesap oluştur"
        onPress={handleSubmit}
        loading={loading}
        disabled={
          !firstName.trim() ||
          !lastName.trim() ||
          !email.trim() ||
          !password ||
          !confirm
        }
      />

      <AuthScreenFooter
        prompt="Zaten hesabınız var mı?"
        actionLabel="Giriş yap"
        href="/auth/login"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: Spacing.lg,
    width: '100%',
    maxWidth: AUTH_FORM_MAX_WIDTH,
  },
  lead: {
    ...Typography.body,
  },
  fields: {
    gap: Spacing.md,
  },
  nameRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  nameCol: {
    flex: 1,
  },
  terms: {
    ...Typography.caption,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: -Spacing.sm,
  },
});
