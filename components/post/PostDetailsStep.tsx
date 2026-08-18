import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PostField } from './PostField';
import { PostMediaGrid } from './PostMediaGrid';
import { PostPhoneField } from './PostPhoneField';
import { PostPlaceSheet } from './PostPlaceSheet';
import { PostTjkSheet } from './PostTjkSheet';
import { formatTlGrouped } from '@/services/phone';
import { locationLookup } from '@/services/location';
import { useDistricts, useProvinces } from '@/hooks/useLocation';
import { isHorseListing } from '@/services/listing';
import type { ListingFieldErrors } from '@/services/listing';
import type { HorseGender } from '@/types';
import type { ListingDraft, ListingMediaSlot } from '@/types/listing';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';

const GENDERS: HorseGender[] = ['Erkek', 'Dişi', 'İğdiş'];

type PostDetailsStepProps = {
  draft: ListingDraft;
  errors: ListingFieldErrors;
  tjkPromptSeen: boolean;
  kicker?: string;
  heading?: string;
  lead?: string;
  onUpdate: (partial: Partial<ListingDraft['details']>) => void;
  onMediaChange: (items: ListingMediaSlot[]) => void;
  onSetCover: (localId: string) => void;
  onApplyTjk: (horseId: string) => void;
  onSkipTjk: () => void;
  onMarkTjkSeen: () => void;
};

export function PostDetailsStep({
  draft,
  errors,
  tjkPromptSeen,
  kicker = 'Adım 2 · Detay',
  heading = 'İlan bilgileri',
  lead,
  onUpdate,
  onMediaChange,
  onSetCover,
  onApplyTjk,
  onSkipTjk,
  onMarkTjkSeen,
}: PostDetailsStepProps) {
  const text = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const muted = useThemeColor('textMuted');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const header = useThemeColor('header');
  const errorColor = useThemeColor('error');
  const horse = isHorseListing(draft.type);
  const d = draft.details;
  const locked = Boolean(d.horseId);
  const [tjkOpen, setTjkOpen] = useState(false);
  const [tjkMode, setTjkMode] = useState<'ask' | 'search'>('ask');
  const [provinceOpen, setProvinceOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);
  const { items: provinces, loading: provincesLoading, error: provincesError, retry: retryProvinces } =
    useProvinces();
  const { items: districts, loading: districtsLoading, error: districtsError, retry: retryDistricts } =
    useDistricts(d.provinceId);

  useEffect(() => {
    if (horse && !tjkPromptSeen) {
      setTjkMode('ask');
      setTjkOpen(true);
    }
  }, [horse, tjkPromptSeen]);

  const openTjkSearch = () => {
    setTjkMode('search');
    setTjkOpen(true);
  };

  const provinceName =
    (d.provinceId &&
      (provinces.find((p) => p.id === d.provinceId)?.name ||
        locationLookup.getProvinceName(d.provinceId))) ||
    '';
  const districtName =
    (d.districtId &&
      (districts.find((x) => x.id === d.districtId)?.name ||
        locationLookup.getDistrictName(d.districtId))) ||
    '';

  return (
    <View style={styles.wrap}>
      <View style={styles.intro}>
        <Text style={[styles.kicker, { color: muted }]}>{kicker}</Text>
        <Text style={[styles.title, { color: text }]}>{heading}</Text>
        <Text style={[styles.lead, { color: secondary }]}>
          {lead ??
            (horse
              ? 'TJK kaydı varsa alanlar dolar. Zorunlu alanları siz tamamlayın.'
              : 'Başlık, açıklama, fiyat ve iletişim bilgilerini girin.')}
        </Text>
      </View>

      {horse ? (
        <Pressable
          onPress={openTjkSearch}
          accessibilityRole="button"
          accessibilityLabel="TJK’dan bilgilerimi getir"
          style={({ pressed }) => [
            styles.tjkCta,
            {
              backgroundColor: header,
              opacity: pressed ? 0.88 : 1,
            },
          ]}
        >
          <Ionicons name="ribbon-outline" size={18} color="#fff" />
          <Text style={styles.tjkCtaLabel}>
            {d.horseId
              ? `TJK: ${d.registeredName}${d.tjkNumber ? ` · ${d.tjkNumber}` : ''}`
              : 'TJK’dan bilgilerimi getir'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
        </Pressable>
      ) : null}

      <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
        <Text style={[styles.section, { color: text }]}>İlan</Text>
        <PostField
          label="Başlık"
          value={d.title}
          onChangeText={(title) => onUpdate({ title })}
          placeholder="Kısa, net bir başlık"
          error={errors.title}
        />
        <PostField
          label="Açıklama"
          value={d.description}
          onChangeText={(description) => onUpdate({ description })}
          placeholder="Durum, bakım ve öne çıkan özellikler…"
          multiline
          error={errors.description}
        />
        <PostField
          label="Fiyat"
          value={d.priceTl}
          onChangeText={(raw) => onUpdate({ priceTl: formatTlGrouped(raw) })}
          placeholder="0"
          keyboardType="numeric"
          error={errors.priceTl}
          suffix="₺"
        />
        <View style={styles.fieldBlock}>
          <Text style={[styles.fieldLabel, { color: secondary }]}>Konum</Text>
          <Pressable
            onPress={() => setProvinceOpen(true)}
            style={[
              styles.select,
              {
                borderColor: errors.provinceId ? errorColor : border,
                backgroundColor: surface,
              },
            ]}
          >
            <Text
              style={{
                color: provinceName ? text : muted,
                ...Typography.body,
                flex: 1,
              }}
            >
              {provinceName || 'İl seçin'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={muted} />
          </Pressable>
          {errors.provinceId ? (
            <Text style={[styles.err, { color: errorColor }]}>{errors.provinceId}</Text>
          ) : provincesError ? (
            <Pressable onPress={retryProvinces}>
              <Text style={[styles.err, { color: errorColor }]}>
                {provincesError} · Yenile
              </Text>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.fieldBlock}>
          <Text style={[styles.fieldLabel, { color: secondary }]}>İlçe</Text>
          <Pressable
            onPress={() => d.provinceId && setDistrictOpen(true)}
            style={[
              styles.select,
              {
                borderColor: errors.districtId ? errorColor : border,
                backgroundColor: surface,
                opacity: d.provinceId ? 1 : 0.55,
              },
            ]}
          >
            <Text
              style={{
                color: districtName ? text : muted,
                ...Typography.body,
                flex: 1,
              }}
            >
              {districtName || (d.provinceId ? 'İlçe seçin' : 'Önce il seçin')}
            </Text>
            <Ionicons name="chevron-down" size={16} color={muted} />
          </Pressable>
          {errors.districtId ? (
            <Text style={[styles.err, { color: errorColor }]}>{errors.districtId}</Text>
          ) : districtsError ? (
            <Pressable onPress={retryDistricts}>
              <Text style={[styles.err, { color: errorColor }]}>
                {districtsError} · Yenile
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
        <Text style={[styles.section, { color: text }]}>İletişim</Text>
        <PostPhoneField
          iso={d.phoneCountryIso || 'TR'}
          national={d.sellerPhone}
          error={errors.sellerPhone}
          onChange={onUpdate}
        />
      </View>

      {horse ? (
        <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
          <Text style={[styles.section, { color: text }]}>At</Text>
          <PostField
            label="Kayıtlı adı"
            value={d.registeredName}
            onChangeText={(registeredName) => onUpdate({ registeredName })}
            placeholder="Atın adı"
            locked={locked}
            error={errors.registeredName}
          />
          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: secondary }]}>Cinsiyet</Text>
            <View style={styles.chips}>
              {GENDERS.map((g) => {
                const on = d.gender === g;
                return (
                  <Pressable
                    key={g}
                    // When user selects an At (horse), other horse-derived fields
                    // are locked. Gender is allowed to be changed from the form
                    // because our edit flow expects users to correct/override it.
                    disabled={false}
                    onPress={() => onUpdate({ gender: g })}
                    style={[
                      styles.chip,
                      {
                        borderColor: on ? header : border,
                        backgroundColor: on ? header : 'transparent',
                        opacity: 1,
                      },
                    ]}
                  >
                    <Text style={[styles.chipLabel, { color: on ? '#fff' : text }]}>
                      {g}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.gender ? (
              <Text style={[styles.err, { color: errorColor }]}>{errors.gender}</Text>
            ) : null}
          </View>
          <View style={styles.row}>
            <View style={styles.flex}>
              <PostField
                label="Doğum tarihi"
                value={d.birthDate}
                onChangeText={(birthDate) => onUpdate({ birthDate })}
                placeholder="YYYY-AA-GG"
                locked={locked}
              />
            </View>
            <View style={styles.flex}>
              <PostField
                label="Yaş"
                value={d.age}
                onChangeText={(age) => onUpdate({ age })}
                keyboardType="number-pad"
                locked={locked}
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.flex}>
              <PostField
                label="Don"
                value={d.coatColor}
                onChangeText={(coatColor) => onUpdate({ coatColor })}
                placeholder="Doru, al, gri…"
                locked={locked}
              />
            </View>
            <View style={styles.flex}>
              <PostField
                label="Cidago"
                value={d.heightCm}
                onChangeText={(heightCm) => onUpdate({ heightCm })}
                keyboardType="number-pad"
                locked={locked}
                suffix="cm"
              />
            </View>
          </View>
          <PostField
            label="Baba"
            value={d.sire}
            onChangeText={(sire) => onUpdate({ sire })}
            locked={locked}
          />
          <PostField
            label="Anne"
            value={d.dam}
            onChangeText={(dam) => onUpdate({ dam })}
            locked={locked}
          />
          <PostField
            label="Annenin babası"
            value={d.damsire}
            onChangeText={(damsire) => onUpdate({ damsire })}
            locked={locked}
          />
          <PostField
            label="Sahip"
            value={d.ownersText}
            onChangeText={(ownersText) => onUpdate({ ownersText })}
            locked={locked}
          />
          <PostField
            label="Yetiştirici"
            value={d.breeder}
            onChangeText={(breeder) => onUpdate({ breeder })}
            locked={locked}
          />
          <PostField
            label="Antrenör"
            value={d.trainer}
            onChangeText={(trainer) => onUpdate({ trainer })}
            locked={locked}
          />
        </View>
      ) : null}

      <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
        <Text style={[styles.section, { color: text }]}>Görseller</Text>
        <PostMediaGrid
          items={draft.media}
          error={errors.media}
          onChange={onMediaChange}
          onSetCover={onSetCover}
        />
      </View>

      <PostTjkSheet
        visible={tjkOpen}
        initialMode={tjkMode}
        onClose={() => {
          setTjkOpen(false);
          onMarkTjkSeen();
        }}
        onSkip={() => {
          setTjkOpen(false);
          onSkipTjk();
        }}
        onSelect={(id) => {
          setTjkOpen(false);
          void onApplyTjk(id);
        }}
      />
      <PostPlaceSheet
        visible={provinceOpen}
        title="İl seçin"
        items={provinces}
        selectedId={d.provinceId}
        loading={provincesLoading}
        emptyText={provincesError || 'İl listesi yüklenemedi. Yeniden deneyin.'}
        onClose={() => setProvinceOpen(false)}
        onSelect={(id) => onUpdate({ provinceId: id, districtId: null })}
      />
      <PostPlaceSheet
        visible={districtOpen}
        title="İlçe seçin"
        items={districts}
        selectedId={d.districtId}
        loading={districtsLoading}
        emptyText={districtsError || 'Bu il için ilçe bulunamadı.'}
        onClose={() => setDistrictOpen(false)}
        onSelect={(id) => onUpdate({ districtId: id })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.md },
  intro: { gap: 6, marginBottom: 4 },
  kicker: {
    ...Typography.caption,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: { ...Typography.h2 },
  lead: { ...Typography.body },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  section: { ...Typography.h5, fontWeight: '700' },
  tjkCta: {
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tjkCtaLabel: {
    ...Typography.small,
    fontWeight: '700',
    color: '#fff',
    flex: 1,
  },
  fieldBlock: { gap: 6 },
  fieldLabel: {
    ...Typography.caption,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  select: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: { ...Typography.small, fontWeight: '600' },
  row: { flexDirection: 'row', gap: Spacing.sm },
  flex: { flex: 1 },
  err: { ...Typography.caption },
});
