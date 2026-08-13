import React, { useCallback, useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { PostDetailsStep, PostFormShell } from '@/components/post';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useMyListingEdit } from '@/hooks/useMyListingEdit';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function EditListingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { session, isLoggedIn } = useAuthSession();
  const bg = useThemeColor('background');
  const text = useThemeColor('text');
  const edit = useMyListingEdit(id, session?.accessToken ?? null);

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace('/auth/login?next=/my-listings');
    }
  }, [isLoggedIn, router]);

  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/my-listings');
  }, [router]);

  const onSave = useCallback(async () => {
    const ok = await edit.save();
    if (ok && id) {
      router.replace(`/advert/${id}`);
    }
  }, [edit, id, router]);

  if (!isLoggedIn) return null;

  return (
    <View style={[styles.root, { backgroundColor: bg }]}>
      {Platform.OS === 'web' ? (
        <Head>
          <title>İlanı düzenle | Haradan.com</title>
        </Head>
      ) : null}

      {edit.loading || !edit.draft ? (
        <PostFormShell
          title="İlanı düzenle"
          canSave={false}
          onClose={close}
          onSave={() => undefined}
        >
          <Text style={{ color: text }}>
            {edit.error ?? 'İlan yükleniyor…'}
          </Text>
        </PostFormShell>
      ) : (
        <PostFormShell
          title="İlanı düzenle"
          canSave={edit.canSave}
          saving={edit.saving}
          saveLabel="Değişiklikleri kaydet"
          onClose={close}
          onSave={() => void onSave()}
        >
          {edit.error ? (
            <Text style={[styles.error, { color: text }]}>{edit.error}</Text>
          ) : null}
          <PostDetailsStep
            draft={edit.draft}
            errors={edit.fieldErrors}
            tjkPromptSeen
            kicker="Düzenle"
            heading="İlan bilgileri"
            lead="Alanları güncelleyin; kayıt sonrası ilan detayına dönersiniz."
            onUpdate={edit.updateDetails}
            onMediaChange={edit.setMedia}
            onSetCover={edit.setCover}
            onApplyTjk={(tjkId) => void edit.applyTjk(tjkId)}
            onSkipTjk={() =>
              edit.updateDetails({ tjkSkipped: true, tjkId: null })
            }
            onMarkTjkSeen={() => undefined}
          />
        </PostFormShell>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  error: { marginBottom: 12 },
});
