import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PostField } from './PostField';
import { catalogRepository } from '@/services/catalog';
import CATALOG_DATA from '@/data/catalog.json';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { CategoryPropertyPublic } from '@/types';
import type { ListingDraft, ListingDraftDetails } from '@/types/listing';
import { setListingWizardState, type ListingFieldErrors } from '@/services/listing';

type PostCategoryPropertiesProps = {
  draft: ListingDraft;
  onUpdate: (partial: Partial<ListingDraftDetails>) => void;
  errors?: ListingFieldErrors;
  onLayoutSection?: (key: string, y: number) => void;
  onPropertiesLoaded?: (props: CategoryPropertyPublic[]) => void;
};

type ToggleItemProps = {
  label: string;
  value: boolean;
  onToggle: () => void;
};

function ToggleItem({ label, value, onToggle }: ToggleItemProps) {
  const text = useThemeColor('text');
  const textSecondary = useThemeColor('textSecondary');
  const header = useThemeColor('header');
  const border = useThemeColor('border');

  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      style={({ pressed }) => [
        styles.toggleRow,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Text
        style={[
          styles.toggleLabel,
          {
            color: value ? text : textSecondary,
            fontWeight: value ? '600' : '400',
          },
        ]}
      >
        {label}
      </Text>
      <View
        style={[
          styles.switch,
          {
            backgroundColor: value ? header : border,
            justifyContent: value ? 'flex-end' : 'flex-start',
          },
        ]}
      >
        <View style={styles.switchKnob} />
      </View>
    </Pressable>
  );
}

const EXCLUDED_CODES = new Set([
  'ADDRESS',
  'DESCRIPTION',
  'PRICE',
  'LOCATION',
  'PHONE',
  'TITLE',
  'MEDIA',
  'IMAGES',
  'HEALTH_VACCINATION',
  'PEDIGREE_IDENTITY',
  'ONSITE_INSPECTION',
  'BREEDER',
  'TRAINER',
]);

function isExcludedProperty(p: any): boolean {
  if (!p) return true;
  if (p.isFormVisible === false) return true;
  const rawCode = String(p.code || '').trim().toUpperCase();
  const codeNormalized = rawCode.replace(/[-_]/g, '');
  if (
    EXCLUDED_CODES.has(rawCode) ||
    codeNormalized === 'HEALTHVACCINATION' ||
    codeNormalized === 'PEDIGREEIDENTITY' ||
    codeNormalized === 'ONSITEINSPECTION' ||
    codeNormalized === 'BREEDER' ||
    codeNormalized === 'TRAINER'
  ) {
    return true;
  }
  if ((p.uiMetadata as any)?.displayGroup === 'highlight') {
    return true;
  }
  const titleLower = String(p.title || '').trim().toLowerCase();
  if (
    titleLower === 'sağlık & aşı kaydı' ||
    titleLower === 'sağlık ve aşı kaydı' ||
    titleLower === 'şecere ve kimlik' ||
    titleLower === 'yerinde inceleme' ||
    titleLower === 'yetiştirici' ||
    titleLower === 'yetistirici' ||
    titleLower === 'antrenör' ||
    titleLower === 'antrenor'
  ) {
    return true;
  }
  return false;
}

function getCanonicalPropertyKey(p: { code?: string; title?: string } | null | undefined): string {
  if (!p) return '';
  const code = String(p.code || '')
    .trim()
    .toUpperCase()
    .replace(/[-_]/g, '');
  const title = String(p.title || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9ğüşıöç]/g, '');

  if (
    code === 'VET' ||
    code === 'VETERINARY' ||
    code === 'VETERINARIAN' ||
    code === 'FACILITYVETERINARIAN' ||
    title === 'veteriner' ||
    title === 'veterinerhekim' ||
    title === 'veterinerhekimhizmeti'
  ) {
    return 'canonical_vet';
  }
  if (
    code === 'FOALINGBARN' ||
    code === 'FOALING' ||
    code === 'FACILITYFOALINGBARN' ||
    title === 'dogumhane' ||
    title === 'doğumhane'
  ) {
    return 'canonical_foaling_barn';
  }
  if (
    code === 'FARRIER' ||
    code === 'FACILITYFARRIER' ||
    title === 'nalbant' ||
    title === 'nalbanthizmeti'
  ) {
    return 'canonical_farrier';
  }
  if (
    code === 'GRASSPADDOCK' ||
    code === 'GRASS' ||
    code === 'FACILITYGRASSPADDOCK' ||
    title === 'cimpadok' ||
    title === 'çimpadok'
  ) {
    return 'canonical_grass_paddock';
  }
  if (
    code === 'SANDPADDOCK' ||
    code === 'SAND' ||
    code === 'FACILITYSANDPADDOCK' ||
    title === 'kumpadok'
  ) {
    return 'canonical_sand_paddock';
  }
  if (
    code === 'STALLIONPADDOCK' ||
    code === 'FACILITYSTALLIONPADDOCK' ||
    title === 'aygirpadogu' ||
    title === 'aygırpadoğu'
  ) {
    return 'canonical_stallion_paddock';
  }
  if (
    code === 'TRAININGTRACK' ||
    code === 'TRACK' ||
    title === 'idmanpisti'
  ) {
    return 'canonical_training_track';
  }
  if (
    code === 'STALLIONBREED' ||
    code === 'STUDBREED'
  ) {
    return 'canonical_stallion_breed';
  }
  if (
    code === 'HORSEBREED' ||
    code === 'BREED' ||
    code === 'HORSESBREED' ||
    title === 'atirki' ||
    title === 'atırkı'
  ) {
    return 'canonical_breed';
  }
  if (
    code === 'COATCOLOR' ||
    code === 'COAT' ||
    code === 'STUDCOATCOLOR' ||
    title === 'don' ||
    title === 'donu' ||
    title === 'donurenk' ||
    title === 'renk'
  ) {
    return 'canonical_coat_color';
  }
  if (
    code === 'HORSEAGE' ||
    code === 'AGE' ||
    code === 'STALLIONAGE' ||
    code === 'STUDAGE' ||
    title === 'yas' ||
    title === 'yaş'
  ) {
    return 'canonical_age';
  }
  if (
    code === 'STUDHORSE' ||
    code === 'STUDHORSENAME' ||
    code === 'REGISTEREDNAME' ||
    code === 'HORSENAME' ||
    title === 'aygiradi' ||
    title === 'atadi' ||
    title === 'kayitliadi'
  ) {
    return 'canonical_stud_name';
  }
  if (
    code === 'STUDSIRE' ||
    code === 'SIRE' ||
    title === 'baba' ||
    title === 'babasire'
  ) {
    return 'canonical_stud_sire';
  }
  if (
    code === 'STUDDAM' ||
    code === 'DAM' ||
    title === 'anne' ||
    title === 'annedam'
  ) {
    return 'canonical_stud_dam';
  }
  if (
    code === 'STUDDAMSIRE' ||
    code === 'DAMSIRE' ||
    title === 'kisrakbabasi' ||
    title === 'annesi' ||
    title === 'anneninbabasi' ||
    title === 'anneninbabasidamsire'
  ) {
    return 'canonical_stud_damsire';
  }
  if (
    code === 'HORSEGENDER' ||
    code === 'GENDER' ||
    title === 'cinsiyet'
  ) {
    return 'canonical_gender';
  }
  if (
    code === 'INTRAINING' ||
    title === 'idmandami' ||
    title === 'idmandamı'
  ) {
    return 'canonical_in_training';
  }
  if (
    code === 'ISFORRENT' ||
    title === 'kiralikmi' ||
    title === 'kiralıkmı'
  ) {
    return 'canonical_is_for_rent';
  }
  if (
    code === 'ISRACEREADY' ||
    code === 'RACEREADY' ||
    title === 'kosardurumdami' ||
    title === 'koşardurumdamı'
  ) {
    return 'canonical_is_race_ready';
  }

  return code || title;
}

export function PostCategoryProperties({
  draft,
  onUpdate,
  errors = {},
  onLayoutSection,
  onPropertiesLoaded,
}: PostCategoryPropertiesProps) {
  const text = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const header = useThemeColor('header');
  const errorColor = useThemeColor('error');

  const d = draft.details;
  const type = draft.type;

  const [categoryProperties, setCategoryProperties] = useState<CategoryPropertyPublic[]>([]);
  const onPropertiesLoadedRef = useRef(onPropertiesLoaded);
  onPropertiesLoadedRef.current = onPropertiesLoaded;

  useEffect(() => {
    const catId = type?.categoryId || type?.categorySlug;
    if (
      !catId ||
      catId === 'ortak-alanlar' ||
      catId === 'cat-ortak-alanlar' ||
      catId === 'c1000000-0000-4000-8000-000000000000' ||
      type?.categorySlug === 'ortak-alanlar'
    ) {
      setCategoryProperties([]);
      onPropertiesLoadedRef.current?.([]);
      return;
    }
    let cancelled = false;

    const loadProps = () => {
      catalogRepository
        .getCategoryFormDefinition(catId, {
          fresh: true,
          categorySlug: type?.categorySlug,
        } as any)
        .then((def) => {
          if (cancelled) return;
          if (def && Array.isArray(def.properties)) {
            const rawList = def.properties.filter(
              (p: any) =>
                p.isActive !== false &&
                !isExcludedProperty(p)
            );
            const initialProps = (CATALOG_DATA.categoryProperties || []) as any[];
            const catIdClean = String(catId || '').toLowerCase();
            const catSlugClean = String(type?.categorySlug || '').toLowerCase();
            for (const ip of initialProps) {
              const isMatch =
                ip.categoryId === catId ||
                ip.categoryId === type?.categoryId ||
                (catSlugClean === 'satilik-yaris-ati' && ip.categoryId === 'c1000000-0000-4000-8000-000000000011') ||
                (catIdClean.includes('satilik-yaris-ati') && ip.categoryId === 'c1000000-0000-4000-8000-000000000011') ||
                ((catSlugClean === 'arap-aygir' || catSlugClean === 'ingiliz-aygir' || catSlugClean === 'asim-hizmetleri' || catIdClean.includes('asim') || catIdClean.includes('aygir')) &&
                  (ip.categoryId === 'c1000000-0000-4000-8000-000000000003' || ip.categoryId === 'c1000000-0000-4000-8000-000000000031' || ip.categoryId === 'c1000000-0000-4000-8000-000000000032'));

              const found = rawList.find(
                (p: any) =>
                  p.code === ip.code ||
                  String(p.code || '').toUpperCase() === String(ip.code || '').toUpperCase() ||
                  getCanonicalPropertyKey(p) === getCanonicalPropertyKey(ip)
              );
              if (!found && isMatch && ip.isActive !== false && !isExcludedProperty(ip)) {
                rawList.push(ip);
              } else if (found) {
                found.options = (ip.options && ip.options.length > (found.options?.length || 0)) ? ip.options : (found.options || ip.options || []);
                found.dataType = ip.dataType || found.dataType;
                found.uiMetadata = ip.uiMetadata || found.uiMetadata;
              }
            }

            const seenKeys = new Set<string>();
            const deduplicated: CategoryPropertyPublic[] = [];
            for (const p of rawList) {
              const key = getCanonicalPropertyKey(p);
              if (!seenKeys.has(key)) {
                seenKeys.add(key);
                deduplicated.push(p);
              }
            }

            deduplicated.sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
            setCategoryProperties(deduplicated);
            setListingWizardState({ categoryProperties: deduplicated });
            onPropertiesLoadedRef.current?.(deduplicated);
          } else {
            setCategoryProperties([]);
            setListingWizardState({ categoryProperties: [] });
            onPropertiesLoadedRef.current?.([]);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setCategoryProperties([]);
            setListingWizardState({ categoryProperties: [] });
            onPropertiesLoadedRef.current?.([]);
          }
        });
    };

    loadProps();

    if (typeof window !== 'undefined') {
      window.addEventListener('haradan_category_properties_changed', loadProps);
      window.addEventListener('storage', loadProps);
    }

    return () => {
      cancelled = true;
      if (typeof window !== 'undefined') {
        window.removeEventListener('haradan_category_properties_changed', loadProps);
        window.removeEventListener('storage', loadProps);
      }
    };
  }, [type?.categoryId, type?.categorySlug]);

  const handlePropertyChange = (code: string, value: unknown) => {
    const currentProps = { ...(d.properties || {}) };
    if (value === undefined || value === null || value === '') {
      delete currentProps[code];
    } else {
      currentProps[code] = value;
    }
    // Clean up any potential duplicate casing keys
    const codeUpper = code.toUpperCase();
    const codeLower = code.toLowerCase();
    const canonicalKey = getCanonicalPropertyKey({ code });
    if (codeUpper !== code) delete currentProps[codeUpper];
    if (codeLower !== code) delete currentProps[codeLower];

    const partialUpdate: Partial<ListingDraftDetails> = {
      properties: currentProps,
    };

    // Keep legacy / top-level details fields in sync if applicable
    if (canonicalKey === 'canonical_breed' || codeUpper === 'HORSE_BREED' || codeUpper === 'BREED' || code === 'studBreed' || code === 'STALLION_BREED') {
      const v = value ? String(value) : '';
      partialUpdate.breed = v;
      partialUpdate.studBreed = v;
      if (value) {
        currentProps['HORSE_BREED'] = value;
        currentProps['breed'] = value;
        currentProps['STALLION_BREED'] = value;
        currentProps['studBreed'] = value;
      } else {
        delete currentProps['HORSE_BREED'];
        delete currentProps['breed'];
        delete currentProps['STALLION_BREED'];
        delete currentProps['studBreed'];
      }
    } else if (canonicalKey === 'canonical_coat_color' || codeUpper === 'COAT_COLOR' || codeUpper === 'COATCOLOR' || code === 'studCoatColor') {
      const v = value ? String(value) : '';
      partialUpdate.coatColor = v;
      partialUpdate.studCoatColor = v;
      if (value) {
        currentProps['COAT_COLOR'] = value;
        currentProps['coatColor'] = value;
        currentProps['studCoatColor'] = value;
      } else {
        delete currentProps['COAT_COLOR'];
        delete currentProps['coatColor'];
        delete currentProps['studCoatColor'];
      }
    } else if (canonicalKey === 'canonical_age' || codeUpper === 'HORSE_AGE' || codeUpper === 'AGE' || code === 'studAge' || code === 'STALLION_AGE') {
      const v = value ? String(value) : '';
      partialUpdate.age = v;
      partialUpdate.studAge = v;
      if (value) {
        currentProps['HORSE_AGE'] = value;
        currentProps['age'] = value;
        currentProps['STALLION_AGE'] = value;
        currentProps['studAge'] = value;
      } else {
        delete currentProps['HORSE_AGE'];
        delete currentProps['age'];
        delete currentProps['STALLION_AGE'];
        delete currentProps['studAge'];
      }
    } else if (canonicalKey === 'canonical_gender' || codeUpper === 'HORSE_GENDER' || codeUpper === 'GENDER') {
      partialUpdate.gender = value as any;
      if (value) {
        currentProps['HORSE_GENDER'] = value;
        currentProps['gender'] = value;
      } else {
        delete currentProps['HORSE_GENDER'];
        delete currentProps['gender'];
      }
    } else if (canonicalKey === 'canonical_grass_paddock' || code === 'grassPaddock') {
      partialUpdate.facilityGrassPaddock = Boolean(value);
    } else if (canonicalKey === 'canonical_sand_paddock' || code === 'sandPaddock') {
      partialUpdate.facilitySandPaddock = Boolean(value);
    } else if (canonicalKey === 'canonical_stallion_paddock' || code === 'stallionPaddock') {
      partialUpdate.facilityStallionPaddock = Boolean(value);
    } else if (canonicalKey === 'canonical_vet' || code === 'vet' || code === 'veterinarian') {
      partialUpdate.facilityVeterinarian = Boolean(value);
    } else if (canonicalKey === 'canonical_farrier' || code === 'farrier') {
      partialUpdate.facilityFarrier = Boolean(value);
    } else if (canonicalKey === 'canonical_foaling_barn' || code === 'foalingBarn' || code === 'maternity') {
      partialUpdate.facilityFoalingBarn = Boolean(value);
    } else if (canonicalKey === 'canonical_training_track' || code === 'trainingTrack' || codeUpper === 'TRAINING_TRACK') {
      if (typeof value === 'boolean') {
        partialUpdate.facilityTrainingTrack = value;
      }
    } else if (code === 'COMPANY_NAME' || code === 'companyName') {
      partialUpdate.companyName = String(value ?? '');
    } else if (code === 'WEBSITE_URL' || code === 'websiteUrl') {
      partialUpdate.websiteUrl = String(value ?? '');
    } else if (canonicalKey === 'canonical_stud_name' || code === 'studHorse' || code === 'studHorseName' || codeUpper === 'REGISTERED_NAME' || codeUpper === 'HORSE_NAME') {
      const v = value ? String(value) : '';
      partialUpdate.studHorseName = v;
      partialUpdate.registeredName = v;
      if (value) {
        currentProps['studHorse'] = value;
        currentProps['studHorseName'] = value;
        currentProps['REGISTERED_NAME'] = value;
        currentProps['HORSE_NAME'] = value;
      } else {
        delete currentProps['studHorse'];
        delete currentProps['studHorseName'];
        delete currentProps['REGISTERED_NAME'];
        delete currentProps['HORSE_NAME'];
      }
    } else if (canonicalKey === 'canonical_stud_sire' || code === 'studSire' || codeUpper === 'SIRE') {
      const v = value ? String(value) : '';
      partialUpdate.studSire = v;
      partialUpdate.sire = v;
      if (value) {
        currentProps['studSire'] = value;
        currentProps['SIRE'] = value;
      } else {
        delete currentProps['studSire'];
        delete currentProps['SIRE'];
      }
    } else if (canonicalKey === 'canonical_stud_dam' || code === 'studDam' || codeUpper === 'DAM') {
      const v = value ? String(value) : '';
      partialUpdate.studDam = v;
      partialUpdate.dam = v;
      if (value) {
        currentProps['studDam'] = value;
        currentProps['DAM'] = value;
      } else {
        delete currentProps['studDam'];
        delete currentProps['DAM'];
      }
    } else if (canonicalKey === 'canonical_stud_damsire' || code === 'studDamSire' || code === 'studDamsire' || codeUpper === 'DAMSIRE') {
      const v = value ? String(value) : '';
      partialUpdate.studDamsire = v;
      partialUpdate.damsire = v;
      if (value) {
        currentProps['studDamSire'] = value;
        currentProps['studDamsire'] = value;
        currentProps['DAMSIRE'] = value;
      } else {
        delete currentProps['studDamSire'];
        delete currentProps['studDamsire'];
        delete currentProps['DAMSIRE'];
      }
    } else if (codeUpper === 'HEIGHT_CM') {
      partialUpdate.heightCm = String(value ?? '');
    } else if (codeUpper === 'BIRTH_DATE') {
      partialUpdate.birthDate = String(value ?? '');
    } else if (codeUpper === 'BREEDER') {
      partialUpdate.breeder = String(value ?? '');
    } else if (codeUpper === 'TRAINER') {
      partialUpdate.trainer = String(value ?? '');
    } else if (codeUpper === 'TJK_NUMBER') {
      partialUpdate.tjkNumber = String(value ?? '');
    } else if (codeUpper === 'OWNER') {
      partialUpdate.ownersText = String(value ?? '');
    } else if (canonicalKey === 'canonical_in_training' || codeUpper === 'IN_TRAINING' || code === 'inTraining') {
      partialUpdate.inTraining = Boolean(value);
    } else if (canonicalKey === 'canonical_is_for_rent' || codeUpper === 'IS_FOR_RENT' || code === 'isForRent') {
      partialUpdate.isForRent = Boolean(value);
    } else if (canonicalKey === 'canonical_is_race_ready' || codeUpper === 'IS_RACE_READY' || code === 'isRaceReady') {
      partialUpdate.isRaceReady = Boolean(value);
    } else if (code === 'serviceType' || code === 'service_type' || codeUpper === 'SERVICE_TYPE') {
      (partialUpdate as any).serviceType = String(value ?? '');
    }

    onUpdate(partialUpdate);
  };

  const getPropertyValue = (code: string): unknown => {
    if (d.properties) {
      if (d.properties[code] !== undefined && d.properties[code] !== '') {
        return d.properties[code];
      }
      const normTarget = code.replace(/[-_]/g, '').toLowerCase();
      for (const [k, v] of Object.entries(d.properties)) {
        if (k.replace(/[-_]/g, '').toLowerCase() === normTarget && v !== undefined && v !== '') {
          return v;
        }
      }
    }
    const codeUpper = code.toUpperCase();
    const canonicalKey = getCanonicalPropertyKey({ code });

    if ((canonicalKey === 'canonical_breed' || codeUpper === 'HORSE_BREED') && d.breed) return d.breed;
    if ((canonicalKey === 'canonical_coat_color' || codeUpper === 'COAT_COLOR' || code === 'studCoatColor') && (d.studCoatColor || d.coatColor)) return d.studCoatColor || d.coatColor;
    if ((canonicalKey === 'canonical_age' || codeUpper === 'HORSE_AGE') && d.age) return d.age;
    if ((canonicalKey === 'canonical_gender' || codeUpper === 'HORSE_GENDER') && d.gender) return d.gender;
    if ((canonicalKey === 'canonical_in_training' || codeUpper === 'IN_TRAINING' || code === 'inTraining') && d.inTraining !== undefined) return d.inTraining;
    if ((canonicalKey === 'canonical_is_for_rent' || codeUpper === 'IS_FOR_RENT' || code === 'isForRent') && d.isForRent !== undefined) return d.isForRent;
    if ((canonicalKey === 'canonical_is_race_ready' || codeUpper === 'IS_RACE_READY' || code === 'isRaceReady') && d.isRaceReady !== undefined) return d.isRaceReady;
    if ((canonicalKey === 'canonical_grass_paddock' || code === 'grassPaddock') && d.facilityGrassPaddock !== undefined) return d.facilityGrassPaddock;
    if ((canonicalKey === 'canonical_sand_paddock' || code === 'sandPaddock') && d.facilitySandPaddock !== undefined) return d.facilitySandPaddock;
    if ((canonicalKey === 'canonical_stallion_paddock' || code === 'stallionPaddock') && d.facilityStallionPaddock !== undefined) return d.facilityStallionPaddock;
    if ((canonicalKey === 'canonical_vet' || code === 'vet' || code === 'veterinarian') && d.facilityVeterinarian !== undefined) return d.facilityVeterinarian;
    if ((canonicalKey === 'canonical_farrier' || code === 'farrier') && d.facilityFarrier !== undefined) return d.facilityFarrier;
    if ((canonicalKey === 'canonical_foaling_barn' || code === 'foalingBarn' || code === 'maternity') && d.facilityFoalingBarn !== undefined) return d.facilityFoalingBarn;
    if (canonicalKey === 'canonical_training_track' || code === 'trainingTrack' || codeUpper === 'TRAINING_TRACK') {
      if (d.properties?.trainingTrack) return d.properties.trainingTrack;
      if (typeof d.facilityTrainingTrack === 'string') return d.facilityTrainingTrack;
    }
    if ((code === 'COMPANY_NAME' || code === 'companyName') && d.companyName) return d.companyName;
    if ((code === 'WEBSITE_URL' || code === 'websiteUrl') && d.websiteUrl) return d.websiteUrl;
    if ((code === 'STALLION_BREED' || code === 'studBreed') && (d.studBreed || d.breed)) return d.studBreed || d.breed;
    if ((code === 'STALLION_AGE' || code === 'studAge') && (d.studAge || d.age)) return d.studAge || d.age;
    if ((canonicalKey === 'canonical_stud_name' || code === 'studHorse' || code === 'studHorseName' || codeUpper === 'REGISTERED_NAME' || codeUpper === 'HORSE_NAME') && (d.studHorseName || d.registeredName)) return d.studHorseName || d.registeredName;
    if ((canonicalKey === 'canonical_stud_sire' || code === 'studSire' || codeUpper === 'SIRE') && (d.studSire || d.sire)) return d.studSire || d.sire;
    if ((canonicalKey === 'canonical_stud_dam' || code === 'studDam' || codeUpper === 'DAM') && (d.studDam || d.dam)) return d.studDam || d.dam;
    if ((canonicalKey === 'canonical_stud_damsire' || code === 'studDamSire' || code === 'studDamsire' || codeUpper === 'DAMSIRE') && (d.studDamsire || d.damsire)) return d.studDamsire || d.damsire;
    if (codeUpper === 'HEIGHT_CM' && d.heightCm) return d.heightCm;
    if (codeUpper === 'BIRTH_DATE' && d.birthDate) return d.birthDate;
    if (codeUpper === 'BREEDER' && d.breeder) return d.breeder;
    if (codeUpper === 'TRAINER' && d.trainer) return d.trainer;
    if (codeUpper === 'TJK_NUMBER' && d.tjkNumber) return d.tjkNumber;
    if (codeUpper === 'OWNER' && d.ownersText) return d.ownersText;
    return undefined;
  };

  // Group properties into toggles vs chips/inputs
  const { statusToggles, toggleProps, otherProps } = useMemo(() => {
    const status: CategoryPropertyPublic[] = [];
    const toggles: CategoryPropertyPublic[] = [];
    const others: CategoryPropertyPublic[] = [];

    const seenStatusKeys = new Set<string>();
    const seenToggleKeys = new Set<string>();
    const seenOtherKeys = new Set<string>();

    const STATUS_CODES = new Set(['IN_TRAINING', 'IS_FOR_RENT', 'IS_RACE_READY']);

    for (const prop of categoryProperties) {
      if (isExcludedProperty(prop)) continue;
      const canonicalKey = getCanonicalPropertyKey(prop);

      if (prop.dataType === 'BOOLEAN') {
        const codeUpper = String(prop.code || '').toUpperCase();
        if (STATUS_CODES.has(codeUpper) || (prop.uiMetadata as any)?.displayGroup === 'raceStatus') {
          if (!seenStatusKeys.has(canonicalKey)) {
            seenStatusKeys.add(canonicalKey);
            status.push(prop);
          }
        } else {
          if (!seenToggleKeys.has(canonicalKey)) {
            seenToggleKeys.add(canonicalKey);
            toggles.push(prop);
          }
        }
      } else {
        if (!seenOtherKeys.has(canonicalKey)) {
          seenOtherKeys.add(canonicalKey);
          others.push(prop);
        }
      }
    }

    return { statusToggles: status, toggleProps: toggles, otherProps: others };
  }, [categoryProperties]);

  if (categoryProperties.length === 0) {
    return null;
  }

  const categoryTitle = type?.categoryName
    ? `${type.categoryName} Özellikleri ve Bilgileri`
    : 'Kategori Özellikleri';

  return (
    <View
      style={[styles.card, { backgroundColor: surface, borderColor: border }]}
      onLayout={(e) =>
        onLayoutSection?.('categoryProperties', e.nativeEvent.layout.y)
      }
    >
      <Text style={[styles.section, { color: text }]}>{categoryTitle}</Text>
      <Text style={[styles.desc, { color: secondary }]}>
        Seçtiğiniz kategoriye özel alanları ve özellikleri eksiksiz doldurunuz.
      </Text>

      {/* 1. Chips and Input Fields */}
      {otherProps.map((prop) => {
        const propKey = prop.code;
        const val = getPropertyValue(prop.code);
        const err = errors[prop.code as keyof ListingFieldErrors];

        if (prop.options && prop.options.length > 0) {
          return (
            <View key={propKey} style={styles.fieldBlock}>
              <Text style={[styles.fieldLabel, { color: secondary }]}>
                {prop.title}
                {prop.isRequired ? (
                  <Text style={{ color: errorColor }}> *</Text>
                ) : null}
              </Text>
              <View style={styles.chips}>
                {prop.options.map((opt) => {
                  const optVal = opt.value || opt.label;
                  const strVal = String(val ?? '').toLocaleLowerCase('tr').trim();
                  const strOptVal = optVal.toLocaleLowerCase('tr').trim();
                  const strOptValue = (opt.value || '').toLocaleLowerCase('tr').trim();
                  const strOptLabel = (opt.label || '').toLocaleLowerCase('tr').trim();

                  const on =
                    strVal === strOptVal ||
                    strVal === strOptValue ||
                    strVal === strOptLabel ||
                    (strVal !== '' && (
                      (strVal.includes('ingiliz') && strOptVal.includes('ingiliz')) ||
                      (strVal.includes('arap') && strOptVal.includes('arap'))
                    ));


                  return (
                    <Pressable
                      key={optVal}
                      onPress={() => {
                        if (on && prop.isRequired) {
                          return;
                        }
                        handlePropertyChange(
                          prop.code,
                          on ? undefined : opt.value || optVal
                        );
                      }}
                      style={[
                        styles.chip,
                        {
                          borderColor: on ? header : border,
                          backgroundColor: on ? header : 'transparent',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.chipLabel,
                          { color: on ? '#fff' : text },
                        ]}
                      >
                        {opt.label || opt.value}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {err ? (
                <Text style={[styles.err, { color: errorColor }]}>{err}</Text>
              ) : null}
            </View>
          );
        }

        const isNumeric =
          prop.dataType === 'INTEGER' ||
          prop.dataType === 'DECIMAL' ||
          prop.dataType === 'YEAR';

        return (
          <PostField
            key={propKey}
            label={prop.title}
            required={prop.isRequired}
            value={val != null ? String(val) : ''}
            onChangeText={(textVal) => {
              let finalVal: unknown = textVal;
              if (isNumeric) {
                const cleaned = textVal.trim().replace(',', '.');
                if (cleaned !== '' && !isNaN(Number(cleaned))) {
                  finalVal =
                    prop.dataType === 'INTEGER' || prop.dataType === 'YEAR'
                      ? parseInt(cleaned, 10)
                      : parseFloat(cleaned);
                }
              }
              handlePropertyChange(prop.code, finalVal);
            }}
            placeholder={prop.helpText || `${prop.title} girin`}
            keyboardType={isNumeric ? 'numeric' : 'default'}
            error={err}
          />
        );
      })}

      {/* 2. Race Status Toggles (Switch) */}
      {statusToggles.length > 0 ? (
        <View style={styles.toggleSection}>
          <Text style={[styles.fieldLabel, { color: secondary, marginBottom: 4 }]}>
            Yarış ve İdman Durumu
          </Text>
          <View style={styles.toggleGrid}>
            {statusToggles.map((prop) => {
              const val = Boolean(getPropertyValue(prop.code));
              return (
                <ToggleItem
                  key={prop.code}
                  label={prop.title}
                  value={val}
                  onToggle={() => handlePropertyChange(prop.code, !val)}
                />
              );
            })}
          </View>
        </View>
      ) : null}

      {/* 3. Boolean Toggle Grid */}
      {toggleProps.length > 0 ? (
        <View style={styles.toggleSection}>
          <Text style={[styles.fieldLabel, { color: secondary, marginBottom: 4 }]}>
            Olanaklar & Hizmet Özellikleri
          </Text>
          <View style={styles.toggleGrid}>
            {toggleProps.map((prop) => {
              const val = Boolean(getPropertyValue(prop.code));
              return (
                <ToggleItem
                  key={prop.code}
                  label={prop.title}
                  value={val}
                  onToggle={() => handlePropertyChange(prop.code, !val)}
                />
              );
            })}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    gap: Spacing.md,
  },
  section: {
    ...Typography.h5,
    fontWeight: '700',
  },
  desc: {
    ...Typography.caption,
    marginTop: -4,
    marginBottom: 4,
  },
  fieldBlock: {
    gap: 6,
  },
  fieldLabel: {
    ...Typography.caption,
    fontWeight: '600',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipLabel: {
    ...Typography.caption,
    fontWeight: '600',
  },
  toggleSection: {
    gap: 6,
    marginTop: 4,
  },
  toggleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(150, 150, 150, 0.2)',
    minWidth: '47%',
    flex: 1,
  },
  toggleLabel: {
    ...Typography.caption,
    flex: 1,
    marginRight: 8,
  },
  switch: {
    width: 40,
    height: 24,
    borderRadius: 12,
    padding: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  err: {
    ...Typography.caption,
    marginTop: 2,
  },
});
