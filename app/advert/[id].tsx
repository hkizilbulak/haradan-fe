import React, { useCallback } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader, HomeContentContainer } from '@/components/layout';
import { AdvertDetailSkeleton, AdvertDetailView } from '@/components/advert-detail';
import { ErrorState } from '@/components/ui';
import { useAdvert } from '@/hooks/useAdvert';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Spacing } from '@/constants/Spacing';
import { prepareListingWizardEntry } from '@/services/listing';

export default function AdvertDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const bg = useThemeColor('background');
  const { isLoggedIn, session } = useAuthSession();

  const { data, isLoading, isError, error, refetch } = useAdvert(
    id,
    session?.accessToken ?? null,
    session?.user.id ?? null
  );

  const onLogin = useCallback(() => router.push('/auth/login'), [router]);
  const onSignup = useCallback(() => router.push('/auth/signup'), [router]);
  const onProfile = useCallback(() => router.push('/profile'), [router]);

  const title = data
    ? `${data.title} | Haradan.com`
    : 'İlan detayı | Haradan.com';

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      {Platform.OS === 'web' ? (
        <Head>
          <title>{title}</title>
          {data ? (
            <meta
              name="description"
              content={data.description.slice(0, 160)}
            />
          ) : null}
        </Head>
      ) : null}

      <AppHeader
        brandName="Haradan.com"
        isLoggedIn={isLoggedIn}
        onLoginPress={onLogin}
        onSignupPress={onSignup}
        onProfilePress={onProfile}
        onPostAdPress={() => {
          prepareListingWizardEntry();
          router.push('/post');
        }}
      />

      <SafeAreaView edges={['left', 'right', 'bottom']} style={styles.flex}>
        {isError ? (
          <ErrorState
            variant="notFound"
            message={error}
            onRetry={refetch}
            secondaryLabel="Ana sayfaya dön"
            onSecondaryAction={() => router.push('/')}
          />
        ) : isLoading || !data ? (
          <HomeContentContainer style={styles.loadingPad}>
            <AdvertDetailSkeleton />
          </HomeContentContainer>
        ) : (
          <AdvertDetailView
            detail={data}
            isOwner={
              Boolean(session?.user.id) && data.sellerId === session?.user.id
            }
            accessToken={session?.accessToken ?? null}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  loadingPad: { paddingTop: Spacing.lg, paddingBottom: Spacing['3xl'] },
});
