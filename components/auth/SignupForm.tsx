import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Platform, Modal, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthBanner } from './AuthBanner';
import { AuthFormHeader } from './AuthFormHeader';
import { AuthScreenFooter } from './AuthScreenFooter';
import { AuthSubmitButton } from './AuthSubmitButton';
import { AuthTextField } from './AuthTextField';
import { GoogleSignInButton } from './GoogleSignInButton';
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

import { TERMS_AND_CONDITIONS, KVKK_TEXT } from '@/constants/LegalTexts';

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
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [campaignAccepted, setCampaignAccepted] = useState(false);
  const [legalError, setLegalError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<'terms' | 'kvkk' | null>(null);

  const handleSubmit = async () => {
    clearError();
    setFieldError(null);
    setLegalError(null);
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
    if (!termsAccepted || !kvkkAccepted) {
      setLegalError('Devam etmek için sözleşmeleri kabul etmelisiniz.');
      return;
    }
    
    const channel = Platform.OS === 'ios' ? 'IOS' : Platform.OS === 'android' ? 'ANDROID' : 'WEB';
    const userAgent = typeof navigator !== 'undefined' && navigator.userAgent ? navigator.userAgent : `HaradanApp/${Platform.OS}`;

    const result = await register({
      email: email.trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      termsAccepted,
      kvkkAccepted,
      allowEmail: campaignAccepted,
      allowSms: campaignAccepted,
      allowWhatsapp: false,
      channel,
      userAgent,
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

      <View style={{ gap: Spacing.sm }}>
        <Pressable style={styles.checkboxRow} onPress={() => { setTermsAccepted(!termsAccepted); setLegalError(null); }}>
          <View style={[styles.checkbox, { borderColor: termsAccepted ? tokens.primary : tokens.border, backgroundColor: termsAccepted ? tokens.primary : 'transparent' }]}>
            {termsAccepted && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={[styles.checkboxLabel, { color: tokens.textSecondary }]}>
            <Text 
              style={{ color: tokens.primary, fontWeight: '600' }}
              onPress={() => setActiveModal('terms')}
            >
              Üyelik ve Hizmet Sözleşmesini
            </Text> okudum, kabul ediyorum.
          </Text>
        </Pressable>

        <Pressable style={styles.checkboxRow} onPress={() => { setKvkkAccepted(!kvkkAccepted); setLegalError(null); }}>
          <View style={[styles.checkbox, { borderColor: kvkkAccepted ? tokens.primary : tokens.border, backgroundColor: kvkkAccepted ? tokens.primary : 'transparent' }]}>
            {kvkkAccepted && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={[styles.checkboxLabel, { color: tokens.textSecondary }]}>
            <Text 
              style={{ color: tokens.primary, fontWeight: '600' }}
              onPress={() => setActiveModal('kvkk')}
            >
              KVKK Aydınlatma Metnini
            </Text> okudum ve Açık Rıza Beyanını kabul ediyorum.
          </Text>
        </Pressable>

        <Pressable style={styles.checkboxRow} onPress={() => setCampaignAccepted(!campaignAccepted)}>
          <View style={[styles.checkbox, { borderColor: campaignAccepted ? tokens.primary : tokens.border, backgroundColor: campaignAccepted ? tokens.primary : 'transparent' }]}>
            {campaignAccepted && <Ionicons name="checkmark" size={14} color="#fff" />}
          </View>
          <Text style={[styles.checkboxLabel, { color: tokens.textSecondary }]}>
            Kampanya, indirim ve yeniliklerden haberdar olmak için E-Posta ve SMS ile iletişime geçilmesine izin veriyorum.
          </Text>
        </Pressable>
        {legalError && (
          <Text style={{ color: tokens.error, fontSize: 12, marginTop: 4 }}>{legalError}</Text>
        )}
      </View>

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

      <View style={styles.dividerRow}>
        <View style={[styles.dividerLine, { backgroundColor: tokens.border }]} />
        <Text style={[styles.dividerText, { color: tokens.textMuted }]}>veya</Text>
        <View style={[styles.dividerLine, { backgroundColor: tokens.border }]} />
      </View>

      <GoogleSignInButton
        actionText="signup"
        onSuccess={() => {
          router.replace('/');
        }}
        onError={(err) => setGoogleError(err)}
      />

      {googleError ? <AuthBanner message={googleError} variant="error" /> : null}

      <AuthScreenFooter
        prompt="Zaten hesabınız var mı?"
        actionLabel="Giriş yap"
        href="/auth/login"
      />

      <Modal 
        visible={!!activeModal} 
        animationType="slide" 
        presentationStyle="pageSheet" 
        onRequestClose={() => setActiveModal(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: tokens.background }}>
          <View style={{ padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: tokens.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[Typography.h4, { color: tokens.text, flex: 1 }]}>
              {activeModal === 'terms' ? 'Üyelik ve Hizmet Sözleşmesi' : 'KVKK Aydınlatma Metni'}
            </Text>
            <TouchableOpacity onPress={() => setActiveModal(null)} style={{ padding: 4 }}>
              <Ionicons name="close" size={24} color={tokens.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1, padding: Spacing.md }}>
            <Text style={{ color: tokens.textSecondary, lineHeight: 22, paddingBottom: Spacing.xl }}>
              {activeModal === 'terms' ? TERMS_AND_CONDITIONS : KVKK_TEXT}
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxLabel: {
    ...Typography.caption,
    flex: 1,
    lineHeight: 18,
  },
  terms: {
    ...Typography.caption,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: -Spacing.sm,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginVertical: -Spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    ...Typography.caption,
    fontSize: 12,
    textTransform: 'uppercase',
  },
});
