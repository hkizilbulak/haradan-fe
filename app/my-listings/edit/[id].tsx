import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { PostDetailsStep, PostFormShell } from '@/components/post';
import { parseInternationalPhone } from '@/services/phone';
import { useAuthSession } from '@/hooks/useAuthSession';
import { useMyListingEdit } from '@/hooks/useMyListingEdit';
import { useThemeColor } from '@/hooks/useThemeColor';

export default function EditListingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const { session, isLoggedIn, ready } = useAuthSession();
  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollTrigger, setScrollTrigger] = useState(0);
  const bg = useThemeColor('background');
  const text = useThemeColor('text');
  const edit = useMyListingEdit(id, session?.accessToken ?? null);

  useEffect(() => {
    if (ready && !isLoggedIn) {
      router.replace('/auth/login?next=/my-listings');
    }
  }, [ready, isLoggedIn, router]);

  // Telefon alanı boş geldiyse kullanıcı profilinden veya son kullanılan numaradan otomatik doldur
  useEffect(() => {
    if (edit.draft && !edit.draft.details.sellerPhone?.trim()) {
      const fallback =
        session?.user?.phone ||
        (typeof localStorage !== 'undefined'
          ? localStorage.getItem('haradan.lastSellerPhone')
          : null);
      if (fallback) {
        const parsed = parseInternationalPhone(fallback);
        if (parsed.national) {
          const newPhone = parsed.national;
          const newIso = parsed.iso || 'TR';
          edit.updateDetails({
            phoneCountryIso: newIso,
            sellerPhone: newPhone,
          });
          edit.markClean({
            ...edit.draft,
            details: {
              ...edit.draft.details,
              phoneCountryIso: newIso,
              sellerPhone: newPhone,
            },
          });
        }
      }
    }
  }, [edit.draft, session?.user?.phone, edit.updateDetails, edit.markClean]);


  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/my-listings');
  }, [router]);

  const onSave = useCallback(async () => {
    const ok = await edit.save();
    if (!ok) {
      setScrollTrigger((v) => v + 1);
      return;
    }
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
          scrollViewRef={scrollViewRef}
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
            scrollViewRef={scrollViewRef}
            scrollTrigger={scrollTrigger}
            kicker="Düzenle"
            heading="İlan bilgileri"
            lead="Alanları güncelleyin; kayıt sonrası ilan detayına dönersiniz."
            onUpdate={edit.updateDetails}
            onMediaChange={edit.setMedia}
            onSetCover={edit.setCover}
            onApplyTjk={(horseId) => void edit.applyTjk(horseId)}
            onSkipTjk={() =>
              edit.updateDetails({
                tjkSkipped: true,
                horseId: null,
                tjkNumber: null,
              })
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
