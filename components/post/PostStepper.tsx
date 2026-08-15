import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { ListingWizardStep } from '@/types/listing';

const ITEMS: { key: ListingWizardStep; label: string }[] = [
  { key: 'type', label: 'Tür' },
  { key: 'details', label: 'Detay' },
  { key: 'package', label: 'Paket' },
  { key: 'review', label: 'Gönder' },
];

type PostStepperProps = {
  step: ListingWizardStep;
  onPressStep: (key: ListingWizardStep) => void;
};

export function PostStepper({ step, onPressStep }: PostStepperProps) {
  const primary = useThemeColor('primary');
  const muted = useThemeColor('textMuted');
  const text = useThemeColor('text');
  const border = useThemeColor('border');
  const success = useThemeColor('success');
  const activeIndex = ITEMS.findIndex((i) => i.key === step);

  return (
    <View style={styles.row} accessibilityRole="tablist">
      {ITEMS.map((item, index) => {
        const done = index < activeIndex;
        const active = index === activeIndex;
        const color = active ? primary : done ? success : muted;
        return (
          <React.Fragment key={item.key}>
            {index > 0 ? (
              <View
                style={[
                  styles.line,
                  { backgroundColor: index <= activeIndex ? primary : border },
                ]}
              />
            ) : null}
            <Pressable
              onPress={() => onPressStep(item.key)}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              style={styles.item}
            >
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor: active || done ? color : 'transparent',
                    borderColor: color,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.num,
                    { color: active || done ? '#fff' : color },
                  ]}
                >
                  {index + 1}
                </Text>
              </View>
              <Text
                style={[
                  styles.label,
                  { color: active ? text : muted, fontWeight: active ? '700' : '500' },
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    alignItems: 'center',
    gap: 6,
    minWidth: 52,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  num: {
    ...Typography.caption,
    fontWeight: '700',
  },
  label: {
    ...Typography.caption,
  },
  line: {
    flex: 1,
    height: 1.5,
    marginBottom: 18,
    marginHorizontal: 4,
  },
});
