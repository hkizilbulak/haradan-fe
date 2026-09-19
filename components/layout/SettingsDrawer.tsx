import React, { memo, useCallback, useEffect, useState } from 'react';
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
import { useAppTheme, type ThemePreference } from '@/hooks/useAppTheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useAuth } from '@/hooks/useAuth';
import { useAuthSession } from '@/hooks/useAuthSession';
import {
  digitsOnly,
  formatNationalPhone,
  isValidNationalPhone,
  parseInternationalPhone,
} from '@/services/phone';
import type { AuthUser } from '@/types';

type SettingsDrawerProps = {
  user: AuthUser | null;
};

/* ─── Expandable setting item key ─── */
type SettingKey = 'password' | 'email' | 'name' | 'phone' | 'theme';

/* ─── Theme options list ─── */
const THEME_OPTIONS: Array<{
  key: ThemePreference;
  label: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  {
    key: 'system',
    label: 'Sistem Varsayılanı',
    desc: 'Cihazınızın tema ayarlarını takip eder',
    icon: 'phone-portrait-outline',
  },
  {
    key: 'light',
    label: 'Açık Tema',
    desc: 'Aydınlık ve ferah görünüm',
    icon: 'sunny-outline',
  },
  {
    key: 'dark',
    label: 'Karanlık Mod',
    desc: 'Gece kullanımı ve göz rahatlığı',
    icon: 'moon-outline',
  },
];

/* ─── Inline row component (same pattern as ProfileDrawer) ─── */
type RowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  expanded?: boolean;
  text: string;
  textMuted: string;
  badge?: string;
};

function SettingsRow({ icon, label, onPress, expanded, text, textMuted, badge }: RowProps) {
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
      {badge ? (
        <View style={styles.rowBadge}>
          <Text style={[styles.rowBadgeText, { color: textMuted }]}>{badge}</Text>
        </View>
      ) : null}
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
  autoComplete?: TextInput['props']['autoComplete'];
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
  autoComplete,
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
        secureTextEntry={secureTextEntry ? hidden : false}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'none'}
        autoComplete={autoComplete ?? (secureTextEntry ? 'new-password' : 'off')}
        textContentType={secureTextEntry ? 'none' : undefined}
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
            name={hidden ? 'eye-outline' : 'eye-off-outline'}
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
          backgroundColor: disabled ? `${primary}33` : primary,
          opacity: disabled ? 0.55 : (pressed ? 0.85 : 1),
          ...Platform.select({
            web: {
              cursor: (disabled ? 'not-allowed' : 'pointer') as any,
              transition: 'all 180ms ease',
            },
            default: {},
          }),
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#fff" />
      ) : (
        <Text style={[styles.actionBtnText, disabled && { opacity: 0.75 }]}>{label}</Text>
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
  const { themePreference, resolvedTheme, isDark, setThemePreference } = useAppTheme();

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

  // Name form state
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');

  const initialFirstName = (user?.firstName ?? '').trim();
  const initialLastName = (user?.lastName ?? '').trim();
  const isNameChanged =
    firstName.trim() !== initialFirstName ||
    lastName.trim() !== initialLastName;
  const isNameValid = firstName.trim().length > 0 && lastName.trim().length > 0;

  // Email form state
  const [newEmail, setNewEmail] = useState('');
  const initialEmail = (user?.email ?? '').trim().toLowerCase();
  const isEmailChanged =
    newEmail.trim().length > 0 &&
    newEmail.trim().toLowerCase() !== initialEmail;
  const isEmailValid = isEmailChanged && newEmail.includes('@');

  // Phone form state
  const [phoneInput, setPhoneInput] = useState(() => {
    if (user?.phone) {
      return parseInternationalPhone(user.phone).national;
    }
    return '';
  });

  const initialPhoneDigits = digitsOnly(
    user?.phone ? parseInternationalPhone(user.phone).national : ''
  );
  const isPhoneChanged = digitsOnly(phoneInput) !== initialPhoneDigits;
  const isPhoneValid = isValidNationalPhone('TR', phoneInput);

  useEffect(() => {
    if (user?.firstName !== undefined) setFirstName(user.firstName ?? '');
    if (user?.lastName !== undefined) setLastName(user.lastName ?? '');
    if (user?.phone !== undefined) {
      setPhoneInput(user.phone ? parseInternationalPhone(user.phone).national : '');
    }
  }, [user?.firstName, user?.lastName, user?.phone]);

  const toggle = useCallback(
    (key: SettingKey) => {
      clearError();
      setSuccessMsg(null);
      if (key === 'password' && expanded !== 'password') {
        setCurrentPw('');
        setNewPw('');
      }
      setExpanded((prev) => (prev === key ? null : key));
    },
    [clearError, expanded]
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
    const trimmed = newEmail.trim();
    const result = await requestEmailChange(accessToken, trimmed);
    if (result) {
      setSuccessMsg(result.message);
      setNewEmail('');
      if (session) {
        const { setAuthSession } = await import('@/services/auth/sessionStore');
        setAuthSession({
          ...session,
          user: {
            ...session.user,
            email: trimmed.toLowerCase(),
          },
        });
      }
    }
  }, [requestEmailChange, accessToken, newEmail, clearError, session]);

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

  /* ── Telefon Numarası Değiştir ── */
  const handleUpdatePhone = useCallback(async () => {
    clearError();
    setSuccessMsg(null);
    const digits = digitsOnly(phoneInput);
    const clean = digits.startsWith('0') ? digits.slice(1) : digits;
    const fullPhone = clean ? `+90${clean}` : null;

    const result = await updateProfile(accessToken, {
      phone: fullPhone,
    });
    if (result) {
      setSuccessMsg('Telefon numaranız güncellendi.');
      if (session) {
        const { setAuthSession } = await import('@/services/auth/sessionStore');
        setAuthSession({
          ...session,
          user: {
            ...session.user,
            phone: result.phone ?? fullPhone,
          },
        });
      }
    }
  }, [updateProfile, accessToken, phoneInput, clearError, session]);

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.body}
    >
      {/* ── 1. Hesap İsmi Değiştir ── */}
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
            disabled={!isNameValid || !isNameChanged}
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
            label="E-posta Adresini Değiştir"
            onPress={handleChangeEmail}
            loading={loading}
            disabled={!isEmailValid}
            primary={primary}
          />
        </View>
      )}

      {/* ── 3. Telefon Numarası Değiştir ── */}
      <SettingsRow
        icon="call-outline"
        label="Telefon Numarası Değiştir"
        onPress={() => toggle('phone')}
        expanded={expanded === 'phone'}
        text={text}
        textMuted={textMuted}
      />
      {expanded === 'phone' && (
        <View style={[styles.formWrap, { borderColor: border }]}>
          <Text style={[styles.hint, { color: textMuted }]}>
            Mevcut: {user?.phone ? (parseInternationalPhone(user.phone).national ? `+90 ${parseInternationalPhone(user.phone).national}` : user.phone) : 'Belirtilmedi'}
          </Text>
          <View style={styles.phoneInputRow}>
            <View style={[styles.phonePrefix, { borderColor: border, backgroundColor: 'rgba(150,150,150,0.06)' }]}>
              <Text style={[styles.phonePrefixText, { color: text }]}>🇹🇷 +90</Text>
            </View>
            <View style={{ flex: 1 }}>
              <InlineField
                placeholder="5XX XXX XX XX"
                value={phoneInput}
                onChangeText={(v) => setPhoneInput(formatNationalPhone('TR', v))}
                keyboardType="phone-pad"
                border={border}
                text={text}
                textMuted={textMuted}
              />
            </View>
          </View>
          <StatusBanner
            message={expanded === 'phone' ? (error ?? successMsg) : null}
            isError={!!error}
            errorColor="#e53935"
            successColor="#43a047"
          />
          <ActionButton
            label="Telefon Numarasını Güncelle"
            onPress={handleUpdatePhone}
            loading={loading}
            disabled={!isPhoneValid || !isPhoneChanged}
            primary={primary}
          />
        </View>
      )}

      {/* ── 4. Şifre Değiştir ── */}
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

      {/* ── 5. Karanlık Mod ── */}
      <SettingsRow
        icon={resolvedTheme === 'dark' ? 'moon-outline' : 'sunny-outline'}
        label="Karanlık Mod"
        badge={
          themePreference === 'dark'
            ? 'Koyu'
            : themePreference === 'light'
            ? 'Açık'
            : 'Sistem'
        }
        onPress={() => toggle('theme')}
        expanded={expanded === 'theme'}
        text={text}
        textMuted={textMuted}
      />
      {expanded === 'theme' && (
        <View style={[styles.formWrap, { borderColor: border }]}>
          <Text style={[styles.hint, { color: textMuted }]}>
            Görünüm ve renk temasını seçin:
          </Text>
          <View style={styles.themeOptionsGrid}>
            {THEME_OPTIONS.map((opt) => {
              const isSelected = themePreference === opt.key;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => setThemePreference(opt.key)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={opt.label}
                  style={({ pressed }) => [
                    styles.themeOptionCard,
                    {
                      borderColor: isSelected ? primary : border,
                      backgroundColor: isSelected
                        ? (isDark ? 'rgba(239, 68, 68, 0.14)' : 'rgba(239, 68, 68, 0.06)')
                        : (isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'),
                      opacity: pressed ? 0.85 : 1,
                      ...Platform.select({
                        web: {
                          cursor: 'pointer' as const,
                          transition: 'all 180ms ease',
                        },
                        default: {},
                      }),
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.themeOptionIconWrap,
                      {
                        backgroundColor: isSelected
                          ? primary
                          : (isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)'),
                      },
                    ]}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={18}
                      color={isSelected ? '#ffffff' : text}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.themeOptionLabel,
                        { color: isSelected ? (isDark ? '#ffffff' : primary) : text },
                      ]}
                    >
                      {opt.label}
                    </Text>
                    <Text style={[styles.themeOptionDesc, { color: textMuted }]}>
                      {opt.desc}
                    </Text>
                  </View>
                  <Ionicons
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={isSelected ? primary : textMuted}
                  />
                </Pressable>
              );
            })}
          </View>
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
  rowBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  rowBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  themeOptionsGrid: {
    gap: 8,
    marginTop: 2,
  },
  themeOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  themeOptionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeOptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  themeOptionDesc: {
    fontSize: 12,
    marginTop: 1,
    lineHeight: 16,
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
  phoneInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phonePrefix: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  phonePrefixText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
