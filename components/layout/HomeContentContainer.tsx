import type { LayoutChangeEvent, ViewStyle } from 'react-native';
import { StyleSheet, View } from 'react-native';
import {
  HOME_CONTENT_MAX_WIDTH,
  HOME_DESKTOP_BREAKPOINT,
  homeContentPadding,
} from '@/constants/Layout';
import { useLayoutWidth } from '@/hooks/useLayoutWidth';

type HomeContentContainerProps = {
  children: React.ReactNode;
  style?: ViewStyle;
  nativeID?: string;
  testID?: string;
  onLayout?: (e: LayoutChangeEvent) => void;
};

/** Header / footer / scroll içeriği — aynı max genişlik ve yatay padding. */
export function HomeContentContainer({
  children,
  style,
  nativeID,
  testID,
  onLayout,
}: HomeContentContainerProps) {
  const width = useLayoutWidth();
  const isWide = width >= HOME_DESKTOP_BREAKPOINT;

  return (
    <View
      nativeID={nativeID}
      testID={testID}
      onLayout={onLayout}
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
