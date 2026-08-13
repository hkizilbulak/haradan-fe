import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';

type PostFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string | null;
  hint?: string | null;
  locked?: boolean;
  suffix?: string;
};

export function PostField({
  label,
  error,
  hint,
  locked = false,
  suffix,
  onFocus,
  onBlur,
  ...inputProps
}: PostFieldProps) {
  const text = useThemeColor('text');
  const muted = useThemeColor('textMuted');
  const secondary = useThemeColor('textSecondary');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const header = useThemeColor('header');
  const errorColor = useThemeColor('error');
  const [focused, setFocused] = useState(false);
  const borderColor = error ? errorColor : focused ? header : border;

  return (
    <View style={styles.wrap}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: secondary }]}>{label}</Text>
        {locked ? (
          <Text style={[styles.lock, { color: muted }]}>TJK</Text>
        ) : null}
      </View>
      <View
        style={[
          styles.field,
          inputProps.multiline ? styles.multiline : null,
          {
            borderColor,
            backgroundColor: locked ? `${border}88` : surface,
          },
        ]}
      >
        <TextInput
          {...inputProps}
          editable={!locked && inputProps.editable !== false}
          placeholderTextColor={muted}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            inputProps.multiline ? styles.inputMulti : null,
            { color: text },
          ]}
          accessibilityLabel={label}
        />
        {suffix ? (
          <Text style={[styles.suffix, { color: muted }]}>{suffix}</Text>
        ) : null}
      </View>
      {error ? (
        <Text style={[styles.error, { color: errorColor }]}>{error}</Text>
      ) : hint ? (
        <Text style={[styles.hint, { color: muted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    ...Typography.caption,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  lock: {
    ...Typography.caption,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  field: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  multiline: {
    minHeight: 128,
    paddingVertical: Spacing.sm,
    alignItems: 'stretch',
  },
  input: {
    ...Typography.body,
    flex: 1,
    paddingVertical: Platform.OS === 'web' ? 14 : 12,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  inputMulti: {
    minHeight: 104,
    textAlignVertical: 'top',
  },
  suffix: {
    ...Typography.small,
    fontWeight: '600',
    marginLeft: 8,
  },
  error: { ...Typography.caption },
  hint: { ...Typography.caption },
});
