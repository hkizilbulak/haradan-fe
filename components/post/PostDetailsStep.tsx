import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
  const [tjkEditMode, setTjkEditMode] = useState(false);
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

  useEffect(() => {
    if (d.provinceId) {
      const resolved = locationLookup.resolveProvinceUuid?.(d.provinceId);
      if (resolved && resolved !== d.provinceId) {
        onUpdate({ provinceId: resolved });
      }
    }
  }, [d.provinceId, onUpdate]);

  useEffect(() => {
    if (d.districtId && districts.length > 0) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(d.districtId);
      if (!isUuid) {
        const legacyName = locationLookup.getDistrictName(d.districtId);
        const matched = districts.find(
          (dist) =>
            dist.name.toLowerCase() === legacyName.toLowerCase() ||
            (legacyName.toLowerCase().includes('merkez') && dist.name.toLowerCase().includes('merkez'))
        );
        if (matched) {
          onUpdate({ districtId: matched.id });
        }
      }
    }
  }, [d.districtId, districts, onUpdate]);

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

  const horseLineageLabel = useMemo(() => {
    const horseName = (d.registeredName || d.studHorseName || '').trim();
    if (!horseName && !d.horseId) return 'TJK’dan bilgilerimi getir';

    const sire = (
      d.sire ||
      d.studSire ||
      (d.properties?.['SIRE'] as string) ||
      (d.properties?.['studSire'] as string) ||
      ''
    ).trim();

    const dam = (
      d.dam ||
      d.studDam ||
      (d.properties?.['DAM'] as string) ||
      (d.properties?.['studDam'] as string) ||
      ''
    ).trim();

    const damsire = (
      d.damsire ||
      d.studDamsire ||
      (d.properties?.['DAMSIRE'] as string) ||
      (d.properties?.['studDamSire'] as string) ||
      (d.properties?.['studDamsire'] as string) ||
      ''
    ).trim();

    let pedigree = '';
    if (sire && dam && damsire) {
      pedigree = `${sire} - ${dam} / ${damsire}`;
    } else if (sire && dam) {
      pedigree = `${sire} - ${dam}`;
    } else if (sire && damsire) {
      pedigree = `${sire} / ${damsire}`;
    } else if (dam && damsire) {
      pedigree = `${dam} / ${damsire}`;
    } else if (sire) {
      pedigree = sire;
    } else if (dam) {
      pedigree = dam;
    }

    if (horseName && pedigree) {
      return `${horseName} (${pedigree})`;
    }
    return horseName || 'TJK’dan bilgilerimi getir';
  }, [
    d.horseId,
    d.registeredName,
    d.studHorseName,
    d.sire,
    d.studSire,
    d.dam,
    d.studDam,
    d.damsire,
    d.studDamsire,
    d.properties,
  ]);

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
        locked && !tjkEditMode ? (
          /* ─── READ-ONLY TJK INFO CARD ─── */
          <View style={[styles.card, { backgroundColor: surface, borderColor: border }]}>
            {/* Header row */}
            <View
              style={[
                styles.cardHeader,
                {
                  borderBottomColor: border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="ribbon-outline" size={17} color={header} />
                <Text style={[styles.section, { color: text }]}>TJK Bilgileri</Text>
              </View>
              <Pressable
                onPress={() => setTjkEditMode(true)}
                accessibilityRole="button"
                accessibilityLabel="TJK bilgilerini düzenle"
                style={({ pressed }) => [
                  styles.editBtn,
                  { borderColor: header, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Ionicons name="pencil-outline" size={14} color={header} />
                <Text style={[styles.editBtnLabel, { color: header }]}>Düzenle</Text>
              </Pressable>
            </View>

            {/* Category properties merged inline — single source of truth */}
            <PostCategoryProperties
              draft={draft}
              onUpdate={onUpdate}
              errors={errors}
              readOnly
              hideCard
              onPropertiesLoaded={onCategoryPropertiesLoaded}
            />
          </View>
        ) : (
          <>
            <Pressable
              onPress={openTjkSearch}
              accessibilityRole="button"
              accessibilityLabel={d.horseId || d.registeredName ? horseLineageLabel : 'TJK\'dan bilgilerimi getir'}
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
                {d.horseId || d.registeredName ? horseLineageLabel : 'TJK\'dan bilgilerimi getir'}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
            </Pressable>
            {locked && (
              <Pressable
                onPress={() => setTjkEditMode(false)}
                accessibilityRole="button"
                style={({ pressed }) => [styles.doneBtn, { borderColor: secondary, opacity: pressed ? 0.7 : 1 }]}
              >
                <Ionicons name="checkmark" size={15} color={secondary} />
                <Text style={[styles.doneBtnLabel, { color: secondary }]}>Bitti</Text>
              </Pressable>
            )}
            {locked && tjkEditMode && (
              <>
                <PostCategoryProperties
                  draft={draft}
                  onUpdate={onUpdate}
                  errors={errors}
                  onPropertiesLoaded={onCategoryPropertiesLoaded}
                  onLayoutSection={(_section, y) => {
                    fieldYMap.current.categoryProperties = y;
                  }}
                />
                <Pressable
                  onPress={() => setTjkEditMode(false)}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.doneBtn,
                    {
                      borderColor: header,
                      backgroundColor: surface,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color={header} />
                  <Text style={[styles.doneBtnLabel, { color: header, fontWeight: '700' }]}>Bitti</Text>
                </Pressable>
              </>
            )}
          </>
        )
      ) : null}

      <View
        style={[styles.card, { backgroundColor: surface, borderColor: border }]}
        onLayout={(e) => {
          card1Y.current = e.nativeEvent.layout.y;
          ['title', 'description', 'priceTl', 'provinceId', 'districtId', 'address'].forEach((k) => updateFieldY(k));
        }}
      >
        <View style={[styles.cardHeader, { borderBottomColor: border }]}>
          <Text style={[styles.section, { color: text }]}>İlan</Text>
        </View>

        <View style={styles.fieldRow} onLayout={(e) => updateFieldY('title', e.nativeEvent.layout.y)}>
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
          <View
            style={[styles.fieldRow, { borderTopColor: border }]}
            onLayout={(e) => updateFieldY('description', e.nativeEvent.layout.y)}
          >
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
          <View
            style={[styles.fieldRow, { borderTopColor: border }]}
            onLayout={(e) => updateFieldY('priceTl', e.nativeEvent.layout.y)}
          >
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
              style={[styles.fieldRow, { borderTopColor: border }]}
              onLayout={(e) => updateFieldY('provinceId', e.nativeEvent.layout.y)}
            >
              <View style={styles.horizontalRow}>
                <View style={styles.labelCol}>
                  <Text style={[styles.fieldLabel, { color: secondary }]}>
                    İl
                    {locationConfig.isRequired ? (
                      <Text style={{ color: errorColor }}> *</Text>
                    ) : null}
                  </Text>
                </View>
                <View style={styles.inputCol}>
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
                        fontSize: 14,
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
              </View>
            </View>

            <View
              style={[styles.fieldRow, { borderTopColor: border }]}
              onLayout={(e) => updateFieldY('districtId', e.nativeEvent.layout.y)}
            >
              <View style={styles.horizontalRow}>
                <View style={styles.labelCol}>
                  <Text style={[styles.fieldLabel, { color: secondary }]}>
                    İlçe
                    {locationConfig.isRequired ? (
                      <Text style={{ color: errorColor }}> *</Text>
                    ) : null}
                  </Text>
                </View>
                <View style={styles.inputCol}>
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
                        fontSize: 14,
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
            </View>
          </>
        ) : null}

        {addressConfig.isActive ? (
          <View
            style={[styles.fieldRow, { borderTopColor: border }]}
            onLayout={(e) => updateFieldY('address', e.nativeEvent.layout.y)}
          >
            <PostField
              label={addressConfig.title}
              required={addressConfig.isRequired}
              value={d.address}
              onChangeText={(address) => onUpdate({ address })}
              placeholder="Mahalle, cadde, sokak, no, tesis veya çiftlik/hara adı…"
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
                  style={[styles.fieldRow, { borderTopColor: border }]}
                  onLayout={(e) => updateFieldY(prop.code, e.nativeEvent.layout.y)}
                >
                  <View style={styles.horizontalRow}>
                    <View style={styles.labelCol}>
                      <Text style={[styles.fieldLabel, { color: secondary }]}>
                        {prop.title}
                        {prop.isRequired ? <Text style={{ color: errorColor }}> *</Text> : null}
                      </Text>
                    </View>
                    <View style={[styles.inputCol, { alignItems: 'flex-start', justifyContent: 'center' }]}>
                      <Pressable
                        onPress={() => handleCustomPropertyChange(prop.code, !boolVal)}
                        accessibilityRole="switch"
                        accessibilityState={{ checked: boolVal }}
                      >
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
                  </View>
                </View>
              );
            }

            if (prop.options && prop.options.length > 0) {
              return (
                <View
                  key={prop.code}
                  style={[styles.fieldRow, { borderTopColor: border }]}
                  onLayout={(e) => updateFieldY(prop.code, e.nativeEvent.layout.y)}
                >
                  <View style={styles.horizontalRow}>
                    <View style={[styles.labelCol, { paddingTop: 6 }]}>
                      <Text style={[styles.fieldLabel, { color: secondary }]}>
                        {prop.title}
                        {prop.isRequired ? <Text style={{ color: errorColor }}> *</Text> : null}
                      </Text>
                    </View>
                    <View style={styles.inputCol}>
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
                  </View>
                </View>
              );
            }

            return (
              <View
                key={prop.code}
                style={[styles.fieldRow, { borderTopColor: border }]}
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
          <View style={[styles.cardHeader, { borderBottomColor: border }]}>
            <Text style={[styles.section, { color: text }]}>{phoneConfig.title}</Text>
          </View>
          <View style={styles.fieldRow} onLayout={(e) => updateFieldY('sellerPhone', e.nativeEvent.layout.y)}>
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



      {/* Standalone category properties — only shown when horse is not locked / non-TJK */}
      {!locked && (
        <PostCategoryProperties
          draft={draft}
          onUpdate={onUpdate}
          errors={errors}
          onPropertiesLoaded={onCategoryPropertiesLoaded}
          onLayoutSection={(_section, y) => {
            fieldYMap.current.categoryProperties = y;
          }}
        />
      )}


      <View
        style={[styles.card, { backgroundColor: surface, borderColor: border }]}
        onLayout={(e) => {
          const y = e.nativeEvent.layout.y;
          cardMediaY.current = y;
          updateFieldY('media', 0);
        }}
      >
        <View style={[styles.cardHeader, { borderBottomColor: border }]}>
          <Text style={[styles.section, { color: text }]}>
            Görseller
            <Text style={{ color: errorColor }}> *</Text>
          </Text>
          <Text style={[styles.cardDesc, { color: secondary }]}>
            En fazla 5 fotoğraf ekleyebilirsiniz (En az 1 görsel zorunludur).
          </Text>
        </View>
        <View style={styles.mediaCardBody}>
          <PostMediaGrid
            items={draft.media}
            error={errors.media}
            onChange={onMediaChange}
            onSetCover={onSetCover}
          />
        </View>
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
    borderRadius: 18,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
      } as any,
      default: {},
    }),
  },
  cardHeader: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fieldRow: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  horizontalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  labelCol: {
    width: 110,
    flexShrink: 0,
    minHeight: 46,
    justifyContent: 'center',
  },
  inputCol: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  section: { ...Typography.h5, fontWeight: '700' },
  cardDesc: {
    ...Typography.caption,
    fontSize: 12.5,
    marginTop: 3,
    lineHeight: 17,
  },
  mediaCardBody: {
    padding: Spacing.lg,
  },
  tjkCta: {
    minHeight: 52,
    paddingVertical: 10,
    borderRadius: 14,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 8,
    borderWidth: 1,
  },
  editBtnLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  doneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  doneBtnLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  infoLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'left',
    flex: 1,
    textTransform: 'uppercase',
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
    fontSize: 13.5,
    fontWeight: '600',
    letterSpacing: 0.2,
    lineHeight: 18,
  },
  select: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingVertical: 4 },
  chip: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: { ...Typography.small, fontSize: 13, fontWeight: '600' },
  chipText: { ...Typography.small, fontSize: 13, fontWeight: '600' },
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  row: { flexDirection: 'row', gap: Spacing.sm },
  flex: { flex: 1 },
  err: { ...Typography.caption, fontSize: 12 },
});
