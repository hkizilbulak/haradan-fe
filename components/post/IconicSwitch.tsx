import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type IconicSwitchProps = {
  value: boolean;
  compact?: boolean;
};

export function IconicSwitch({ value, compact = true }: IconicSwitchProps) {
  const switchStyle = compact ? styles.compactSwitch : styles.switch;
  const knobStyle = compact ? styles.compactSwitchKnob : styles.switchKnob;
  const trackIconSize = compact ? 12 : 14;

  return (
    <View
      style={[
        switchStyle,
        {
          backgroundColor: value ? '#16a34a' : '#ef4444',
          justifyContent: value ? 'flex-end' : 'flex-start',
        },
      ]}
    >
      {value ? (
        <View style={[styles.switchTrackIcon, { left: compact ? 8 : 10 }]}>
          <Ionicons name="checkmark-sharp" size={trackIconSize} color="#ffffff" />
        </View>
      ) : (
        <View style={[styles.switchTrackIcon, { right: compact ? 8 : 10 }]}>
          <Ionicons name="close-sharp" size={trackIconSize} color="#ffffff" />
        </View>
      )}
      <View style={knobStyle} />
    </View>
  );
}

const styles = StyleSheet.create({
  switch: {
    width: 56,
    height: 32,
    borderRadius: 16,
    padding: 3,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    ...Platform.select({
      web: {
        transition: 'background-color 0.2s ease',
        cursor: 'pointer',
      } as any,
      default: {},
    }),
  },
  switchKnob: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
        transition: 'transform 0.2s ease',
      } as any,
      default: {
        elevation: 2,
      },
    }),
  },
  compactSwitch: {
    width: 52,
    height: 28,
    borderRadius: 14,
    padding: 2,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    ...Platform.select({
      web: {
        transition: 'background-color 0.2s ease',
        cursor: 'pointer',
      } as any,
      default: {},
    }),
  },
  compactSwitchKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
        transition: 'transform 0.2s ease',
      } as any,
      default: {
        elevation: 2,
      },
    }),
  },
  switchTrackIcon: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
