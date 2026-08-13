import React from 'react';
import { StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';
import {
  HOME_CONTENT_MAX_WIDTH,
  HOME_DESKTOP_BREAKPOINT,
  homeContentPadding,
} from '@/constants/Layout';

type HomeContentContainerProps = {
  children: React.ReactNode;
  style?: ViewStyle;
};

/** Header / footer / scroll içeriği — aynı max genişlik ve yatay padding. */
export function HomeContentContainer({
  children,
  style,
}: HomeContentContainerProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;

  return (
    <View
      style={[
        styles.container,
        {
          maxWidth: HOME_CONTENT_MAX_WIDTH,
          paddingHorizontal: homeContentPadding(isWide),
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'center',
  },
});
