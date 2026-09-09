import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';

type PostFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string | null;
  hint?: string | null;
  locked?: boolean;
  suffix?: string;
  /** Red asterisk for required fields. */
  required?: boolean;
  /** When true, renders label on top of the input. */
  stacked?: boolean;
};

export function PostField({
  label,
  error,
  hint,
  locked = false,
  suffix,
  required = false,
  stacked = false,
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
  const isMultiline = Boolean(inputProps.multiline);

  return (
    <View style={[styles.row, stacked && styles.rowStacked]}>
      <View
        style={[
          styles.labelCol,
          stacked
            ? styles.labelColStacked
            : isMultiline
              ? styles.labelColTop
              : styles.labelColCenter,
        ]}
      >
        <Text style={[styles.label, { color: secondary }]}>
          {label}
          {required ? (
            <Text style={[styles.requiredMark, { color: errorColor }]}> *</Text>
          ) : null}
        </Text>
        {locked ? (
          <Text style={[styles.lock, { color: muted }]}>TJK</Text>
        ) : null}
      </View>

      <View style={[styles.inputCol, stacked && styles.inputColStacked]}>
        <View
          style={[
            styles.field,
            isMultiline ? styles.multiline : null,
            {
              borderColor,
              backgroundColor: locked ? `${border}88` : surface,
            },
          ]}
        >
          <TextInput
            {...inputProps}
            editable={!locked && inputProps.editable !== false}
            placeholderTextColor={inputProps.placeholderTextColor || secondary}
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
              isMultiline ? styles.inputMulti : null,
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
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  rowStacked: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 6,
  },
  labelCol: {
    width: 110,
    flexShrink: 0,
  },
  labelColStacked: {
    width: '100%',
    minHeight: 0,
    paddingTop: 0,
    justifyContent: 'flex-start',
  },
  labelColCenter: {
    minHeight: 46,
    justifyContent: 'center',
  },
  labelColTop: {
    paddingTop: 12,
    justifyContent: 'flex-start',
  },
  label: {
    ...Typography.caption,
    fontSize: 13.5,
    fontWeight: '600',
    letterSpacing: 0.2,
    lineHeight: 18,
  },
  requiredMark: {
    fontWeight: '700',
  },
  lock: {
    ...Typography.caption,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  inputCol: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  inputColStacked: {
    width: '100%',
    minWidth: 0,
  },
  field: {
    width: '100%',
    minWidth: 0,
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  multiline: {
    minHeight: 96,
    paddingVertical: 10,
    alignItems: 'stretch',
  },
  input: {
    ...Typography.body,
    fontSize: 14,
    flex: 1,
    minWidth: 0,
    paddingVertical: Platform.OS === 'web' ? 12 : 8,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  inputMulti: {
    minHeight: 76,
    textAlignVertical: 'top',
  },
  suffix: {
    ...Typography.small,
    fontWeight: '600',
    marginLeft: 8,
  },
  error: { ...Typography.caption, fontSize: 12 },
  hint: { ...Typography.caption, fontSize: 11 },
});

