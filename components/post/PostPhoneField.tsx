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
  required?: boolean;
  stacked?: boolean;
  onChange: (next: { phoneCountryIso: string; sellerPhone: string }) => void;
};

export function PostPhoneField({
  iso,
  national,
  error,
  required = false,
  stacked = false,
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
    <View style={[styles.row, stacked && styles.rowStacked]}>
      <View style={[styles.labelCol, stacked && styles.labelColStacked]}>
        <Text style={[styles.label, { color: secondary }]}>
          Telefon
          {required ? <Text style={{ color: errorColor }}> *</Text> : null}
        </Text>
      </View>

      <View style={[styles.inputCol, stacked && styles.inputColStacked]}>
        <View style={[styles.field, { borderColor, backgroundColor: surface }]}>
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
            <Ionicons name="chevron-down" size={13} color={muted} />
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
        ) : null}
      </View>

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
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  rowStacked: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 6,
  },
  labelCol: {
    width: 110,
    flexShrink: 0,
    minHeight: 46,
    justifyContent: 'center',
  },
  labelColStacked: {
    width: '100%',
    minHeight: undefined,
    justifyContent: 'flex-start',
  },
  label: {
    ...Typography.caption,
    fontSize: 13.5,
    fontWeight: '600',
    letterSpacing: 0.2,
    lineHeight: 18,
  },
  inputCol: {
    flex: 1,
    gap: 4,
  },
  inputColStacked: {
    width: '100%',
  },
  field: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'stretch',
    overflow: 'hidden',
  },
  code: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    borderRightWidth: 1,
  },
  flag: { fontSize: 15 },
  dial: { ...Typography.small, fontSize: 13, fontWeight: '700' },
  input: {
    flex: 1,
    ...Typography.body,
    fontSize: 14,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'web' ? 12 : 8,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  error: { ...Typography.caption, fontSize: 12 },
  hint: { ...Typography.caption, fontSize: 11 },
});
