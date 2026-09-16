import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Head from 'expo-router/head';
import { Ionicons } from '@expo/vector-icons';
import { PostDetailsStep, PostFormShell } from '@/components/post';
import { toast } from '@/components/ui';
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
    const isResubmit = edit.isResubmittable;
    const res = await edit.save({ andSubmit: isResubmit });
    if (!res.ok) {
      setScrollTrigger((v) => v + 1);
      toast.error(
        res.error || 'Lütfen zorunlu alanları kontrol edin.',
        'Kayıt Yapılamadı'
      );
      return;
    }
    if (isResubmit) {
      toast.success(
        'İlanınız güncellendi ve onay için incelemeye gönderildi.',
        'Başarılı'
      );
    } else {
      toast.success('Değişiklikler kaydedildi.', 'Başarılı');
    }
    if (id) {
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
          saveLabel={
            edit.isResubmittable
              ? 'Kaydet ve İncelemeye Gönder'
              : 'Değişiklikleri kaydet'
          }
          scrollViewRef={scrollViewRef}
          onClose={close}
          onSave={() => void onSave()}
        >
          {edit.error ? (
            <Text style={[styles.error, { color: text }]}>{edit.error}</Text>
          ) : null}

          {edit.isResubmittable ? (
            <View
              style={[
                styles.resubmitBanner,
                {
                  borderColor:
                    edit.backendStatus === 'REJECTED' ||
                    edit.backendStatus === 'rejected'
                      ? 'rgba(239, 68, 68, 0.4)'
                      : 'rgba(245, 158, 11, 0.4)',
                  backgroundColor:
                    edit.backendStatus === 'REJECTED' ||
                    edit.backendStatus === 'rejected'
                      ? 'rgba(239, 68, 68, 0.08)'
                      : 'rgba(245, 158, 11, 0.08)',
                },
              ]}
            >
              <Ionicons
                name={
                  edit.backendStatus === 'REJECTED' ||
                  edit.backendStatus === 'rejected'
                    ? 'alert-circle-outline'
                    : 'warning-outline'
                }
                size={22}
                color={
                  edit.backendStatus === 'REJECTED' ||
                  edit.backendStatus === 'rejected'
                    ? '#ef4444'
                    : '#f59e0b'
                }
                style={{ marginTop: 2 }}
              />
              <View style={styles.resubmitBannerBody}>
                <Text
                  style={[
                    styles.resubmitBannerTitle,
                    {
                      color:
                        edit.backendStatus === 'REJECTED' ||
                        edit.backendStatus === 'rejected'
                          ? '#ef4444'
                          : '#f59e0b',
                    },
                  ]}
                >
                  {edit.backendStatus === 'REJECTED' ||
                  edit.backendStatus === 'rejected'
                    ? 'Bu İlan Reddedilmiştir'
                    : 'İlanınız İçin Düzeltme İstenmiştir'}
                </Text>
                <Text style={[styles.resubmitBannerSubtitle, { color: text }]}>
                  {edit.rejectionReason
                    ? edit.backendStatus === 'REJECTED' ||
                      edit.backendStatus === 'rejected'
                      ? `Reddedilme Nedeni: ${edit.rejectionReason}`
                      : `Düzeltme Talebi: ${edit.rejectionReason}`
                    : 'İlan detaylarını düzenledikten sonra "Kaydet ve İncelemeye Gönder" butonuna tıklayarak tekrar onaya gönderebilirsiniz.'}
                </Text>
              </View>
            </View>
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
  resubmitBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  resubmitBannerBody: {
    flex: 1,
    marginLeft: 10,
  },
  resubmitBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  resubmitBannerSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    opacity: 0.9,
  },
});

