import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PostCountrySheet } from './PostCountrySheet';
import {
  formatNationalPhone,
  phoneCountryCatalog,
} from '@/services/phone';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';

type PostPhoneFieldProps = {
  iso: string;
  national: string;
  error?: string | null;
  onChange: (next: { phoneCountryIso: string; sellerPhone: string }) => void;
};

export function PostPhoneField({
  iso,
  national,
  error,
  onChange,
}: PostPhoneFieldProps) {
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');
  const secondary = useThemeColor('textSecondary');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const header = useThemeColor('header');
  const errorColor = useThemeColor('error');
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);
  const country = phoneCountryCatalog.getByIso(iso) ?? phoneCountryCatalog.list()[0];
  const borderColor = error ? errorColor : focused ? header : border;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.label, { color: secondary }]}>Telefon</Text>
      <View style={[styles.row, { borderColor, backgroundColor: surface }]}>
        <Pressable
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Ülke kodu seç"
          style={({ pressed }) => [
            styles.code,
            { borderRightColor: border, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={styles.flag}>{country.flag}</Text>
          <Text style={[styles.dial, { color: text }]}>{country.dial}</Text>
          <Ionicons name="chevron-down" size={14} color={muted} />
        </Pressable>
        <TextInput
          value={national}
          onChangeText={(raw) =>
            onChange({
              phoneCountryIso: country.iso,
              sellerPhone: formatNationalPhone(country.iso, raw),
            })
          }
          placeholder={country.iso === 'TR' ? '5XX XXX XX XX' : 'Numara'}
          placeholderTextColor={muted}
          keyboardType="phone-pad"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, { color: text }]}
          accessibilityLabel="Telefon numarası"
        />
      </View>
      {error ? (
        <Text style={[styles.error, { color: errorColor }]}>{error}</Text>
      ) : (
        <Text style={[styles.hint, { color: muted }]}>
          Önce ülke kodunu seçin, sonra numarayı yazın.
        </Text>
      )}
      <PostCountrySheet
        visible={open}
        selectedIso={country.iso}
        onClose={() => setOpen(false)}
        onSelect={(next) =>
          onChange({
            phoneCountryIso: next.iso,
            sellerPhone: formatNationalPhone(next.iso, national),
          })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: {
    ...Typography.caption,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  row: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
  },
  code: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    borderRightWidth: 1,
  },
  flag: { fontSize: 16 },
  dial: { ...Typography.small, fontWeight: '700' },
  input: {
    flex: 1,
    ...Typography.body,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'web' ? 14 : 12,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  error: { ...Typography.caption },
  hint: { ...Typography.caption },
});
