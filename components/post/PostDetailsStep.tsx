import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PostField } from './PostField';
import { PostMediaGrid } from './PostMediaGrid';
import { PostPhoneField } from './PostPhoneField';
import { PostPlaceSheet } from './PostPlaceSheet';
import { PostTjkSheet } from './PostTjkSheet';
import { formatTlGrouped } from '@/services/phone';
import { locationLookup } from '@/services/location';
import { useDistricts, useProvinces } from '@/hooks/useLocation';
import {
  isPansiyonListing,
  isSaleHorseListing,
  isStudServiceListing,
  isTjkEligibleListing,
  isTransportListing,
} from '@/services/listing';
import { catalogRepository } from '@/services/catalog';
import {
  getGlobalPropertiesConfig,
  setGlobalPropertiesConfig,
  type GlobalPropertiesMap,
} from '@/services/catalog/addressConfig';
import { PostCategoryProperties } from './PostCategoryProperties';
import type { ListingFieldErrors } from '@/services/listing';
import type { CategoryPropertyPublic } from '@/types';
import type { ListingDraft, ListingMediaSlot } from '@/types/listing';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';

const FIELD_ORDER: (keyof ListingFieldErrors)[] = [
  'title',
  'description',
  'priceTl',
  'provinceId',
  'districtId',
  'address',
  'sellerPhone',
  'registeredName',
  'gender',
  'media',
];

type PostDetailsStepProps = {
  draft: ListingDraft;
  errors: ListingFieldErrors;
  tjkPromptSeen: boolean;
  scrollViewRef?: React.RefObject<ScrollView | null>;
  scrollTrigger?: number;
  globalConfigs?: GlobalPropertiesMap;
  customGlobalProperties?: CategoryPropertyPublic[];
  kicker?: string;
  heading?: string;
  lead?: string;
  onUpdate: (partial: Partial<ListingDraft['details']>) => void;
  onMediaChange: (items: ListingMediaSlot[]) => void;
  onSetCover: (localId: string) => void;
  onApplyTjk: (horseId: string) => void;
  onSkipTjk: () => void;
  onMarkTjkSeen: () => void;
  onCategoryPropertiesLoaded?: (props: CategoryPropertyPublic[]) => void;
};

export function PostDetailsStep({
  draft,
  errors,
  globalConfigs: propGlobalConfigs,
  customGlobalProperties,
  tjkPromptSeen,
  scrollViewRef,
  scrollTrigger,
  kicker = 'Adım 2 · Detay',
  heading = 'İlan bilgileri',
  lead,
  onUpdate,
  onMediaChange,
  onSetCover,
  onApplyTjk,
  onSkipTjk,
  onMarkTjkSeen,
  onCategoryPropertiesLoaded,
}: PostDetailsStepProps) {
  const text = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const muted = useThemeColor('textMuted');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const header = useThemeColor('header');
  const errorColor = useThemeColor('error');
  const d = draft.details;
  const locked = Boolean(d.horseId);
  const [tjkOpen, setTjkOpen] = useState(false);
  const [tjkMode, setTjkMode] = useState<'ask' | 'search'>('ask');
  const [provinceOpen, setProvinceOpen] = useState(false);
  const [districtOpen, setDistrictOpen] = useState(false);
  const [fallbackConfigs, setFallbackConfigs] = useState(getGlobalPropertiesConfig());

  const activeConfigs = propGlobalConfigs ?? fallbackConfigs;

  const addressConfig = {
    title: activeConfigs.ADDRESS?.title || 'Açık adres',
    isActive: Boolean(activeConfigs.ADDRESS?.isActive && activeConfigs.ADDRESS?.isFormVisible),
    isRequired: Boolean(activeConfigs.ADDRESS?.isRequired),
  };
  const descConfig = {
    title: activeConfigs.DESCRIPTION?.title || 'Açıklama',
    isActive: Boolean(activeConfigs.DESCRIPTION?.isActive && activeConfigs.DESCRIPTION?.isFormVisible),
    isRequired: Boolean(activeConfigs.DESCRIPTION?.isRequired),
  };
  const priceConfig = {
    title: activeConfigs.PRICE?.title || 'Fiyat',
    isActive: Boolean(activeConfigs.PRICE?.isActive && activeConfigs.PRICE?.isFormVisible),
    isRequired: Boolean(activeConfigs.PRICE?.isRequired),
  };
  const locationConfig = {
    title: activeConfigs.LOCATION?.title || 'Konum',
    isActive: Boolean(activeConfigs.LOCATION?.isActive && activeConfigs.LOCATION?.isFormVisible),
    isRequired: Boolean(activeConfigs.LOCATION?.isRequired),
  };
  const phoneConfig = {
    title: activeConfigs.PHONE?.title || 'İletişim Telefonu',
    isActive: Boolean(activeConfigs.PHONE?.isActive && activeConfigs.PHONE?.isFormVisible),
    isRequired: Boolean(activeConfigs.PHONE?.isRequired),
  };

  useEffect(() => {
    const refresh = () => setFallbackConfigs(getGlobalPropertiesConfig());

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', refresh);
      window.addEventListener('haradan_catalog_data_changed', refresh);
      window.addEventListener('haradan_category_properties_changed', refresh);
      window.addEventListener('haradan_global_properties_changed', refresh);
      try {
        const bc = new BroadcastChannel('haradan_catalog_channel');
        bc.onmessage = refresh;
        return () => {
          window.removeEventListener('storage', refresh);
          window.removeEventListener('haradan_catalog_data_changed', refresh);
          window.removeEventListener('haradan_category_properties_changed', refresh);
          window.removeEventListener('haradan_global_properties_changed', refresh);
          bc.close();
        };
      } catch {
        return () => {
          window.removeEventListener('storage', refresh);
          window.removeEventListener('haradan_catalog_data_changed', refresh);
          window.removeEventListener('haradan_category_properties_changed', refresh);
          window.removeEventListener('haradan_global_properties_changed', refresh);
        };
      }
    }
  }, []);
  const { items: provinces, loading: provincesLoading, error: provincesError, retry: retryProvinces } =
    useProvinces();
  const { items: districts, loading: districtsLoading, error: districtsError, retry: retryDistricts } =
    useDistricts(d.provinceId);

  const card1Y = useRef(0);
  const cardPhoneY = useRef(0);
  const cardHorseY = useRef(0);
  const cardMediaY = useRef(0);
  const relativeYMap = useRef<Record<string, number>>({});
  const fieldYMap = useRef<Record<string, number>>({});

  const updateFieldY = useCallback((key: string, relativeY?: number) => {
    if (relativeY != null) {
      relativeYMap.current[key] = relativeY;
    }
    const rel = relativeYMap.current[key] ?? 0;
    let cardY = 0;
    if (['title', 'description', 'priceTl', 'provinceId', 'districtId', 'address'].includes(key)) {
      cardY = card1Y.current;
    } else if (key === 'sellerPhone') {
      cardY = cardPhoneY.current;
    } else if (['registeredName', 'gender'].includes(key)) {
      cardY = cardHorseY.current;
    } else if (key === 'media') {
      cardY = cardMediaY.current;
    }
    fieldYMap.current[key] = cardY + rel;
  }, []);

  const scrollToFirstError = useCallback(() => {
    if (!errors || Object.keys(errors).length === 0) return;
    const firstErrorKey =
      FIELD_ORDER.find((key) => Boolean(errors[key])) ||
      Object.keys(errors)[0];
    if (!firstErrorKey) return;

    let y = fieldYMap.current[firstErrorKey];
    if (y == null) {
      y = fieldYMap.current.categoryProperties;
    }
    if (y != null && scrollViewRef?.current) {
      scrollViewRef.current.scrollTo({ y: Math.max(0, y - 20), animated: true });
    }
  }, [errors, scrollViewRef]);

  const prevTrigger = useRef(scrollTrigger);
  const prevHasErrors = useRef(false);

  useEffect(() => {
    const hasErrors = Object.keys(errors).length > 0;
    const triggerChanged = scrollTrigger != null && scrollTrigger !== prevTrigger.current;
    const errorJustAppeared = hasErrors && !prevHasErrors.current;

    if (triggerChanged || errorJustAppeared) {
      prevTrigger.current = scrollTrigger;
      prevHasErrors.current = hasErrors;
      const timer = setTimeout(() => {
        scrollToFirstError();
      }, 50);
      return () => clearTimeout(timer);
    }
    prevHasErrors.current = hasErrors;
  }, [scrollTrigger, errors, scrollToFirstError]);

  const isSaleHorse = isSaleHorseListing(draft.type);
  const isStud = isStudServiceListing(draft.type);
  const isPansiyon = isPansiyonListing(draft.type);
  const isTransport = isTransportListing(draft.type);
  const isTjkEligible = isTjkEligibleListing(draft.type);

  useEffect(() => {
    if (isTjkEligible && !tjkPromptSeen) {
      setTjkMode('ask');
      setTjkOpen(true);
    }
  }, [isTjkEligible, tjkPromptSeen]);

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

  const defaultLead = isSaleHorse
    ? 'TJK kaydı varsa alanlar dolar. Zorunlu alanları siz tamamlayın.'
    : isStud
      ? 'Aygır bilgileri ve soy kütüğünü tamamlayın.'
      : isPansiyon
        ? 'Tesis özellikleri, konum ve iletişim bilgilerini girin.'
        : isTransport
          ? 'Nakliye hizmeti, firma ve iletişim bilgilerini girin.'
          : 'Başlık, fiyat, konum ve iletişim bilgilerini girin.';

  const handleCustomPropertyChange = useCallback(
    (code: string, value: unknown) => {
      const currentProps = { ...(d.properties || {}) };
      if (value === undefined || value === null || value === '') {
        delete currentProps[code];
      } else {
        currentProps[code] = value;
      }
      onUpdate({ properties: currentProps });
    },
    [d.properties, onUpdate]
  );

  return (
    <View style={styles.wrap}>
      <View style={styles.intro}>
        <Text style={[styles.kicker, { color: muted }]}>{kicker}</Text>
        <Text style={[styles.title, { color: text }]}>{heading}</Text>
        <Text style={[styles.lead, { color: secondary }]}>
          {lead ?? defaultLead}
        </Text>
      </View>

      {isTjkEligible ? (
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
              ? `TJK: ${d.registeredName || d.studHorseName}${d.tjkNumber ? ` · ${d.tjkNumber}` : ''}`
              : 'TJK’dan bilgilerimi getir'}
          </Text>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
        </Pressable>
      ) : null}

      <View
        style={[styles.card, { backgroundColor: surface, borderColor: border }]}
        onLayout={(e) => {
          card1Y.current = e.nativeEvent.layout.y;
          ['title', 'description', 'priceTl', 'provinceId', 'districtId'].forEach((k) => updateFieldY(k));
        }}
      >
        <Text style={[styles.section, { color: text }]}>İlan</Text>
        <View onLayout={(e) => updateFieldY('title', e.nativeEvent.layout.y)}>
          <PostField
            label="Başlık"
            required
            value={d.title}
            onChangeText={(title) => onUpdate({ title })}
            placeholder="Kısa, net bir başlık"
            error={errors.title}
          />
        </View>
        {descConfig.isActive ? (
          <View onLayout={(e) => updateFieldY('description', e.nativeEvent.layout.y)}>
            <PostField
              label={descConfig.title}
              required={descConfig.isRequired}
              value={d.description}
              onChangeText={(description) => onUpdate({ description })}
              placeholder={
                descConfig.isRequired
                  ? 'Durum, bakım ve öne çıkan özellikler…'
                  : 'Durum, bakım ve öne çıkan özellikler… (opsiyonel)'
              }
              multiline
              error={errors.description}
            />
          </View>
        ) : null}

        {priceConfig.isActive ? (
          <View onLayout={(e) => updateFieldY('priceTl', e.nativeEvent.layout.y)}>
            <PostField
              label={priceConfig.title}
              required={priceConfig.isRequired}
              value={d.priceTl}
              onChangeText={(raw) => onUpdate({ priceTl: formatTlGrouped(raw) })}
              placeholder="0"
              keyboardType="numeric"
              error={errors.priceTl}
              suffix="₺"
            />
          </View>
        ) : null}

        {locationConfig.isActive ? (
          <>
            <View
              style={styles.fieldBlock}
              onLayout={(e) => updateFieldY('provinceId', e.nativeEvent.layout.y)}
            >
              <Text style={[styles.fieldLabel, { color: secondary }]}>
                {locationConfig.title}
                {locationConfig.isRequired ? (
                  <Text style={{ color: errorColor }}> *</Text>
                ) : null}
              </Text>
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
            <View
              style={styles.fieldBlock}
              onLayout={(e) => updateFieldY('districtId', e.nativeEvent.layout.y)}
            >
              <Text style={[styles.fieldLabel, { color: secondary }]}>
                İlçe
                {locationConfig.isRequired ? (
                  <Text style={{ color: errorColor }}> *</Text>
                ) : null}
              </Text>
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
          </>
        ) : null}

        {addressConfig.isActive ? (
          <View
            style={styles.fieldBlock}
            onLayout={(e) => updateFieldY('address', e.nativeEvent.layout.y)}
          >
            <PostField
              label={addressConfig.title}
              required={addressConfig.isRequired}
              value={d.address}
              onChangeText={(address) => onUpdate({ address })}
              placeholder="Mahalle, cadde, sokak, no, tesis veya çiftlik/hara adı…"
              hint="İlanınızın tam konumunu belirtmek için açık adres girin."
              error={errors.address}
              multiline
            />
          </View>
        ) : null}

        {customGlobalProperties && customGlobalProperties.length > 0 ? (
          customGlobalProperties.map((prop) => {
            const val =
              d.properties?.[prop.code] ??
              d.properties?.[prop.code.toLowerCase()] ??
              d.properties?.[prop.code.toUpperCase()];
            const err = errors[prop.code as keyof ListingFieldErrors];

            if (prop.dataType === 'BOOLEAN') {
              const boolVal = Boolean(val);
              return (
                <View
                  key={prop.code}
                  style={styles.fieldBlock}
                  onLayout={(e) => updateFieldY(prop.code, e.nativeEvent.layout.y)}
                >
                  <Pressable
                    onPress={() => handleCustomPropertyChange(prop.code, !boolVal)}
                    style={styles.toggleRow}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: boolVal }}
                  >
                    <Text
                      style={[
                        styles.toggleLabel,
                        { color: boolVal ? text : secondary, fontWeight: boolVal ? '600' : '400' },
                      ]}
                    >
                      {prop.title}
                      {prop.isRequired ? <Text style={{ color: errorColor }}> *</Text> : null}
                    </Text>
                    <View
                      style={[
                        styles.switch,
                        {
                          backgroundColor: boolVal ? header : border,
                          justifyContent: boolVal ? 'flex-end' : 'flex-start',
                        },
                      ]}
                    >
                      <View style={styles.switchKnob} />
                    </View>
                  </Pressable>
                  {err ? <Text style={[styles.err, { color: errorColor }]}>{err}</Text> : null}
                </View>
              );
            }

            if (prop.options && prop.options.length > 0) {
              return (
                <View
                  key={prop.code}
                  style={styles.fieldBlock}
                  onLayout={(e) => updateFieldY(prop.code, e.nativeEvent.layout.y)}
                >
                  <Text style={[styles.fieldLabel, { color: secondary }]}>
                    {prop.title}
                    {prop.isRequired ? <Text style={{ color: errorColor }}> *</Text> : null}
                  </Text>
                  <View style={styles.chips}>
                    {prop.options.map((opt) => {
                      const optVal = opt.value || opt.label;
                      const isSelected =
                        String(val ?? '').toLocaleLowerCase('tr') === optVal.toLocaleLowerCase('tr') ||
                        String(val ?? '').toLocaleLowerCase('tr') === (opt.value || '').toLocaleLowerCase('tr');
                      return (
                        <Pressable
                          key={opt.value || opt.label}
                          onPress={() =>
                            handleCustomPropertyChange(
                              prop.code,
                              isSelected ? '' : opt.value || opt.label
                            )
                          }
                          style={[
                            styles.chip,
                            {
                              borderColor: isSelected ? header : border,
                              backgroundColor: isSelected ? header : surface,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              {
                                color: isSelected ? '#fff' : text,
                                fontWeight: isSelected ? '600' : '400',
                              },
                            ]}
                          >
                            {opt.label || opt.value}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {err ? <Text style={[styles.err, { color: errorColor }]}>{err}</Text> : null}
                </View>
              );
            }

            return (
              <View
                key={prop.code}
                style={styles.fieldBlock}
                onLayout={(e) => updateFieldY(prop.code, e.nativeEvent.layout.y)}
              >
                <PostField
                  label={prop.title}
                  required={Boolean(prop.isRequired)}
                  value={val != null ? String(val) : ''}
                  onChangeText={(txt) => handleCustomPropertyChange(prop.code, txt)}
                  placeholder={prop.helpText || `${prop.title} giriniz…`}
                  keyboardType={
                    prop.dataType === 'INTEGER' ||
                    prop.dataType === 'DECIMAL' ||
                    prop.dataType === 'YEAR'
                      ? 'numeric'
                      : 'default'
                  }
                  multiline={prop.dataType === 'TEXT'}
                  error={err}
                />
              </View>
            );
          })
        ) : null}
      </View>

      {phoneConfig.isActive ? (
        <View
          style={[styles.card, { backgroundColor: surface, borderColor: border }]}
          onLayout={(e) => {
            cardPhoneY.current = e.nativeEvent.layout.y;
            updateFieldY('sellerPhone');
          }}
        >
          <Text style={[styles.section, { color: text }]}>{phoneConfig.title}</Text>
          <View onLayout={(e) => updateFieldY('sellerPhone', e.nativeEvent.layout.y)}>
            <PostPhoneField
              iso={d.phoneCountryIso || 'TR'}
              national={d.sellerPhone}
              error={errors.sellerPhone}
              required={phoneConfig.isRequired}
              onChange={onUpdate}
            />
          </View>
        </View>
      ) : null}



      <PostCategoryProperties
        draft={draft}
        onUpdate={onUpdate}
        errors={errors}
        onPropertiesLoaded={onCategoryPropertiesLoaded}
        onLayoutSection={(_section, y) => {
          fieldYMap.current.categoryProperties = y;
        }}
      />


      <View
        style={[styles.card, { backgroundColor: surface, borderColor: border }]}
        onLayout={(e) => {
          const y = e.nativeEvent.layout.y;
          cardMediaY.current = y;
          updateFieldY('media', 0);
        }}
      >
        <Text style={[styles.section, { color: text }]}>
          Görseller
          <Text style={{ color: errorColor }}> *</Text>
        </Text>
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
  chipText: { ...Typography.small, fontWeight: '600' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleLabel: {
    ...Typography.body,
    fontSize: 15,
  },
  switch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  switchKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  row: { flexDirection: 'row', gap: Spacing.sm },
  flex: { flex: 1 },
  err: { ...Typography.caption },
});
