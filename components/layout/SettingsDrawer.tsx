import React, { memo, useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Spacing } from '@/constants/Spacing';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAuth } from '@/hooks/useAuth';
import { useAuthSession } from '@/hooks/useAuthSession';
import type { AuthUser } from '@/types';

type SettingsDrawerProps = {
  user: AuthUser | null;
};

/* ─── Expandable setting item key ─── */
type SettingKey = 'password' | 'email' | 'photo' | 'name';

/* ─── Inline row component (same pattern as ProfileDrawer) ─── */
type RowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  expanded?: boolean;
  text: string;
  textMuted: string;
};

function SettingsRow({ icon, label, onPress, expanded, text, textMuted }: RowProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      accessibilityRole="menuitem"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor:
            hovered || pressed ? 'rgba(12,12,14,0.035)' : 'transparent',
          opacity: pressed ? 0.88 : 1,
          ...Platform.select({
            web: {
              cursor: 'pointer' as const,
              transition: 'background-color 220ms cubic-bezier(0.22,1,0.36,1)',
            },
            default: {},
          }),
        },
      ]}
    >
      <Ionicons name={icon} size={18} color={text} />
      <Text style={[styles.rowLabel, { color: text }]}>{label}</Text>
      <Ionicons
        name={expanded ? 'chevron-down' : 'chevron-forward'}
        size={14}
        color={textMuted}
      />
    </Pressable>
  );
}

/* ─── Inline form field ─── */
type FieldProps = {
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: TextInput['props']['keyboardType'];
  autoCapitalize?: TextInput['props']['autoCapitalize'];
  border: string;
  text: string;
  textMuted: string;
};

function InlineField({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  border,
  text,
  textMuted,
}: FieldProps) {
  const [hidden, setHidden] = useState(secureTextEntry === true);

  return (
    <View style={styles.inputWrap}>
      <TextInput
        style={[
          styles.input,
          {
            borderColor: border,
            color: text,
            paddingRight: secureTextEntry ? 44 : 14,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={textMuted}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={hidden}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'none'}
      />
      {secureTextEntry && (
        <Pressable
          onPress={() => setHidden((p) => !p)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={hidden ? 'Şifreyi göster' : 'Şifreyi gizle'}
          style={styles.eyeBtn}
        >
          <Ionicons
            name={hidden ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={textMuted}
          />
        </Pressable>
      )}
    </View>
  );
}

/* ─── Inline action button ─── */
type ActionBtnProps = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  primary: string;
};

function ActionButton({ label, onPress, loading, disabled, primary }: ActionBtnProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.actionBtn,
        {
          backgroundColor: disabled ? `${primary}66` : primary,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text style={styles.actionBtnText}>{label}</Text>
      )}
    </Pressable>
  );
}

/* ─── Status banner ─── */
function StatusBanner({ message, isError, errorColor, successColor }: {
  message: string | null;
  isError: boolean;
  errorColor: string;
  successColor: string;
}) {
  if (!message) return null;
  return (
    <Text style={[styles.banner, { color: isError ? errorColor : successColor }]}>
      {message}
    </Text>
  );
}

/* ═══════════════════════════════════════════
   SettingsDrawer — ana bileşen
   ═══════════════════════════════════════════ */
export const SettingsDrawer = memo(function SettingsDrawer({
  user,
}: SettingsDrawerProps) {
  const text = useThemeColor('text');
  const textMuted = useThemeColor('textMuted');
  const border = useThemeColor('border');
  const primary = useThemeColor('primary');
  const header = useThemeColor('header');

  const { session } = useAuthSession();
  const {
    changePassword,
    requestEmailChange,
    updateProfile,
    loading,
    error,
    clearError,
  } = useAuth();

  const [expanded, setExpanded] = useState<SettingKey | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Password form state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');

  // Email form state
  const [newEmail, setNewEmail] = useState('');

  // Name form state
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');

  const toggle = useCallback(
    (key: SettingKey) => {
      clearError();
      setSuccessMsg(null);
      setExpanded((prev) => (prev === key ? null : key));
    },
    [clearError]
  );

  const accessToken = session?.accessToken ?? '';

  /* ── Şifre Değiştir ── */
  const handleChangePassword = useCallback(async () => {
    clearError();
    setSuccessMsg(null);
    const result = await changePassword(accessToken, currentPw, newPw);
    if (result) {
      setSuccessMsg(result.message);
      setCurrentPw('');
      setNewPw('');
    }
  }, [changePassword, accessToken, currentPw, newPw, clearError]);

  /* ── E-posta Değiştir ── */
  const handleChangeEmail = useCallback(async () => {
    clearError();
    setSuccessMsg(null);
    const result = await requestEmailChange(accessToken, newEmail);
    if (result) {
      setSuccessMsg(result.message);
      setNewEmail('');
    }
  }, [requestEmailChange, accessToken, newEmail, clearError]);

  /* ── Hesap İsmi Değiştir ── */
  const handleUpdateName = useCallback(async () => {
    clearError();
    setSuccessMsg(null);
    const result = await updateProfile(accessToken, {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
    });
    if (result) {
      setSuccessMsg('İsim bilgileriniz güncellendi.');
      // Session'daki user bilgilerini güncelle
      if (session) {
        const { setAuthSession } = await import('@/services/auth/sessionStore');
        setAuthSession({
          ...session,
          user: {
            ...session.user,
            firstName: result.firstName,
            lastName: result.lastName,
          },
        });
      }
    }
  }, [updateProfile, accessToken, firstName, lastName, clearError, session]);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.body}
    >
      {/* ── 1. Şifre Değiştir ── */}
      <SettingsRow
        icon="lock-closed-outline"
        label="Şifre Değiştir"
        onPress={() => toggle('password')}
        expanded={expanded === 'password'}
        text={text}
        textMuted={textMuted}
      />
      {expanded === 'password' && (
        <View style={[styles.formWrap, { borderColor: border }]}>
          <InlineField
            placeholder="Mevcut şifre"
            value={currentPw}
            onChangeText={setCurrentPw}
            secureTextEntry
            border={border}
            text={text}
            textMuted={textMuted}
          />
          <InlineField
            placeholder="Yeni şifre (en az 8 karakter)"
            value={newPw}
            onChangeText={setNewPw}
            secureTextEntry
            border={border}
            text={text}
            textMuted={textMuted}
          />
          <StatusBanner
            message={expanded === 'password' ? (error ?? successMsg) : null}
            isError={!!error}
            errorColor="#e53935"
            successColor="#43a047"
          />
          <ActionButton
            label="Şifreyi Güncelle"
            onPress={handleChangePassword}
            loading={loading}
            disabled={!currentPw || !newPw || newPw.length < 8}
            primary={primary}
          />
        </View>
      )}

      {/* ── 2. E-posta Değiştir ── */}
      <SettingsRow
        icon="mail-outline"
        label="E-posta Değiştir"
        onPress={() => toggle('email')}
        expanded={expanded === 'email'}
        text={text}
        textMuted={textMuted}
      />
      {expanded === 'email' && (
        <View style={[styles.formWrap, { borderColor: border }]}>
          <Text style={[styles.hint, { color: textMuted }]}>
            Mevcut: {user?.email ?? '—'}
          </Text>
          <InlineField
            placeholder="Yeni e-posta adresi"
            value={newEmail}
            onChangeText={setNewEmail}
            keyboardType="email-address"
            border={border}
            text={text}
            textMuted={textMuted}
          />
          <StatusBanner
            message={expanded === 'email' ? (error ?? successMsg) : null}
            isError={!!error}
            errorColor="#e53935"
            successColor="#43a047"
          />
          <ActionButton
            label="Doğrulama Bağlantısı Gönder"
            onPress={handleChangeEmail}
            loading={loading}
            disabled={!newEmail.trim()}
            primary={primary}
          />
        </View>
      )}

      {/* ── 3. Profil Fotoğrafı Değiştir ── */}
      <SettingsRow
        icon="camera-outline"
        label="Profil Fotoğrafı Değiştir"
        onPress={() => toggle('photo')}
        expanded={expanded === 'photo'}
        text={text}
        textMuted={textMuted}
      />
      {expanded === 'photo' && (
        <View style={[styles.formWrap, { borderColor: border }]}>
          <View style={styles.photoSection}>
            <View style={[styles.photoPreview, { backgroundColor: header }]}>
              <Ionicons name="person" size={32} color="#fff" />
            </View>
            <Text style={[styles.hint, { color: textMuted }]}>
              Profil fotoğrafı özelliği yakında eklenecek.
            </Text>
          </View>
        </View>
      )}

      {/* ── 4. Hesap İsmi Değiştir ── */}
      <SettingsRow
        icon="person-outline"
        label="Hesap İsmi Değiştir"
        onPress={() => toggle('name')}
        expanded={expanded === 'name'}
        text={text}
        textMuted={textMuted}
      />
      {expanded === 'name' && (
        <View style={[styles.formWrap, { borderColor: border }]}>
          <InlineField
            placeholder="Ad"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            border={border}
            text={text}
            textMuted={textMuted}
          />
          <InlineField
            placeholder="Soyad"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            border={border}
            text={text}
            textMuted={textMuted}
          />
          <StatusBanner
            message={expanded === 'name' ? (error ?? successMsg) : null}
            isError={!!error}
            errorColor="#e53935"
            successColor="#43a047"
          />
          <ActionButton
            label="İsmi Güncelle"
            onPress={handleUpdateName}
            loading={loading}
            disabled={!firstName.trim() || !lastName.trim()}
            primary={primary}
          />
        </View>
      )}
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  body: {
    paddingTop: 12,
    paddingBottom: Spacing.xl,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 48,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.15,
  },
  formWrap: {
    marginHorizontal: 10,
    marginTop: 4,
    marginBottom: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    gap: 12,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  hint: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 20,
  },
  banner: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  actionBtn: {
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  photoSection: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  photoPreview: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    position: 'relative',
  },
  eyeBtn: {
    position: 'absolute',
    right: 10,
    top: 0,
    bottom: 0,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
