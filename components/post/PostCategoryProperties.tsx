import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PostField } from './PostField';
import { PostSelectSheet } from './PostSelectSheet';
import { catalogRepository } from '@/services/catalog';
import CATALOG_DATA from '@/data/catalog.json';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useIsWideLayout } from '@/hooks/useLayoutWidth';
import type { CategoryPropertyPublic } from '@/types';
import type { ListingDraft, ListingDraftDetails } from '@/types/listing';
import { setListingWizardState, type ListingFieldErrors } from '@/services/listing';

type PostCategoryPropertiesProps = {
  draft: ListingDraft;
  onUpdate: (partial: Partial<ListingDraftDetails>) => void;
  errors?: ListingFieldErrors;
  readOnly?: boolean;
  hideCard?: boolean;
  onLayoutSection?: (key: string, y: number) => void;
  onPropertiesLoaded?: (props: CategoryPropertyPublic[]) => void;
};



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
  if (
    code === 'ISPREGNANT' ||
    code === 'PREGNANT' ||
    title === 'gebemi' ||
    title === 'gebe'
  ) {
    return 'canonical_is_pregnant';
  }
  if (
    code === 'COVERINGSTALLION' ||
    code === 'PREGNANTSTALLION' ||
    title === 'gebeolduguaygir' ||
    title === 'gebeolduğuaygır'
  ) {
    return 'canonical_covering_stallion';
  }
  if (
    code === 'PREGNANCYSTAGE' ||
    code === 'PREGNANCYSTATUS' ||
    title === 'gebelikdurumu' ||
    title === 'gebelik'
  ) {
    return 'canonical_pregnancy_stage';
  }
  if (
    code === 'LASTCOVERINGDATE' ||
    code === 'COVERINGDATE' ||
    title === 'sonasimtarihi' ||
    title === 'sonaşımtarihi' ||
    title === 'sonaskimtarihi'
  ) {
    return 'canonical_last_covering_date';
  }

  return code || title;
}

export function PostCategoryProperties({
  draft,
  onUpdate,
  errors = {},
  readOnly = false,
  hideCard = false,
  onLayoutSection,
  onPropertiesLoaded,
}: PostCategoryPropertiesProps) {
  const text = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const header = useThemeColor('header');
  const errorColor = useThemeColor('error');
  const muted = useThemeColor('textMuted');
  const isWide = useIsWideLayout(600);

  const [activeSelectProp, setActiveSelectProp] = useState<CategoryPropertyPublic | null>(null);

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
    } else if (canonicalKey === 'canonical_is_pregnant' || codeUpper === 'IS_PREGNANT' || code === 'isPregnant') {
      const bVal = Boolean(value);
      partialUpdate.isPregnant = bVal;
      if (bVal) {
        currentProps['IS_PREGNANT'] = true;
      } else {
        currentProps['IS_PREGNANT'] = false;
        delete currentProps['COVERING_STALLION'];
        delete currentProps['PREGNANCY_STAGE'];
        delete currentProps['LAST_COVERING_DATE'];
        partialUpdate.coveringStallion = '';
        partialUpdate.pregnancyStage = '';
        partialUpdate.lastCoveringDate = '';
      }
    } else if (canonicalKey === 'canonical_covering_stallion' || codeUpper === 'COVERING_STALLION' || code === 'coveringStallion') {
      const v = String(value ?? '');
      partialUpdate.coveringStallion = v;
      if (v) currentProps['COVERING_STALLION'] = v;
      else delete currentProps['COVERING_STALLION'];
    } else if (canonicalKey === 'canonical_pregnancy_stage' || codeUpper === 'PREGNANCY_STAGE' || code === 'pregnancyStage') {
      const v = String(value ?? '');
      partialUpdate.pregnancyStage = v;
      if (v) currentProps['PREGNANCY_STAGE'] = v;
      else delete currentProps['PREGNANCY_STAGE'];
    } else if (canonicalKey === 'canonical_last_covering_date' || codeUpper === 'LAST_COVERING_DATE' || code === 'lastCoveringDate') {
      const v = String(value ?? '');
      partialUpdate.lastCoveringDate = v;
      if (v) currentProps['LAST_COVERING_DATE'] = v;
      else delete currentProps['LAST_COVERING_DATE'];
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
    if ((canonicalKey === 'canonical_is_pregnant' || codeUpper === 'IS_PREGNANT') && d.isPregnant !== undefined) return d.isPregnant;
    if ((canonicalKey === 'canonical_covering_stallion' || codeUpper === 'COVERING_STALLION') && d.coveringStallion) return d.coveringStallion;
    if ((canonicalKey === 'canonical_pregnancy_stage' || codeUpper === 'PREGNANCY_STAGE') && d.pregnancyStage) return d.pregnancyStage;
    if ((canonicalKey === 'canonical_last_covering_date' || codeUpper === 'LAST_COVERING_DATE') && d.lastCoveringDate) return d.lastCoveringDate;
    return undefined;
  };

  // Group properties into toggles vs chips/inputs
  const { statusToggles, toggleProps, otherProps, pregnancyProps } = useMemo(() => {
    const status: CategoryPropertyPublic[] = [];
    const toggles: CategoryPropertyPublic[] = [];
    const others: CategoryPropertyPublic[] = [];

    const seenStatusKeys = new Set<string>();
    const seenToggleKeys = new Set<string>();
    const seenOtherKeys = new Set<string>();

    const STATUS_CODES = new Set(['IN_TRAINING', 'IS_FOR_RENT', 'IS_RACE_READY']);
    const PREGNANCY_CODES = new Set([
      'IS_PREGNANT',
      'COVERING_STALLION',
      'PREGNANCY_STAGE',
      'LAST_COVERING_DATE',
    ]);

    let pregnantProp: CategoryPropertyPublic | undefined;
    let coveringStallionProp: CategoryPropertyPublic | undefined;
    let pregnancyStageProp: CategoryPropertyPublic | undefined;
    let lastCoveringDateProp: CategoryPropertyPublic | undefined;

    for (const prop of categoryProperties) {
      if (isExcludedProperty(prop)) continue;
      const codeUpper = String(prop.code || '').toUpperCase();
      const canonicalKey = getCanonicalPropertyKey(prop);

      if (PREGNANCY_CODES.has(codeUpper) || canonicalKey.startsWith('canonical_') && (
        canonicalKey === 'canonical_is_pregnant' ||
        canonicalKey === 'canonical_covering_stallion' ||
        canonicalKey === 'canonical_pregnancy_stage' ||
        canonicalKey === 'canonical_last_covering_date'
      )) {
        if (codeUpper === 'IS_PREGNANT' || canonicalKey === 'canonical_is_pregnant') pregnantProp = prop;
        else if (codeUpper === 'COVERING_STALLION' || canonicalKey === 'canonical_covering_stallion') coveringStallionProp = prop;
        else if (codeUpper === 'PREGNANCY_STAGE' || canonicalKey === 'canonical_pregnancy_stage') pregnancyStageProp = prop;
        else if (codeUpper === 'LAST_COVERING_DATE' || canonicalKey === 'canonical_last_covering_date') lastCoveringDateProp = prop;
        continue;
      }

      if (prop.dataType === 'BOOLEAN') {
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

    return {
      statusToggles: status,
      toggleProps: toggles,
      otherProps: others,
      pregnancyProps: {
        pregnantProp,
        coveringStallionProp,
        pregnancyStageProp,
        lastCoveringDateProp,
      },
    };
  }, [categoryProperties]);

  if (categoryProperties.length === 0) {
    return null;
  }

  const categoryTitle = type?.categoryName
    ? `${type.categoryName} Özellikleri ve Bilgileri`
    : 'Kategori Özellikleri';

  // Helper to get a human-readable display value for a property in readOnly mode
  const getDisplayLabel = (prop: CategoryPropertyPublic): string => {
    const val = getPropertyValue(prop.code);
    if (val === undefined || val === null || val === '') return '—';
    if (typeof val === 'boolean') return val ? 'Evet' : 'Hayır';
    if (val === 'true') return 'Evet';
    if (val === 'false') return 'Hayır';
    if (prop.options && prop.options.length > 0) {
      const strVal = String(val).toLocaleLowerCase('tr').trim();
      const found = prop.options.find(o => {
        const optVal = (o.value || o.label).toLocaleLowerCase('tr').trim();
        const optLabel = (o.label || '').toLocaleLowerCase('tr').trim();
        return optVal === strVal || optLabel === strVal;
      });
      return found?.label || found?.value || String(val);
    }
    return String(val);
  };

  const cardContent = (
    <>
      {!hideCard && (
        <View
          style={[
            styles.cardHeader,
            {
              borderBottomColor: border,
              flexDirection: 'row',
              alignItems: 'center',
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="options-outline" size={17} color={header} />
            <Text style={[styles.section, { color: text }]}>{categoryTitle}</Text>
          </View>
        </View>
      )}

      {/* ─── READ-ONLY MODE: label–value rows ─── */}
      {readOnly ? (
        <>
          {/* otherProps (chips + text inputs) — read-only label-value */}
          {otherProps.map((prop) => {
            const canonicalKey = getCanonicalPropertyKey(prop);
            const isHorseName =
              canonicalKey === 'canonical_stud_name' ||
              prop.code === 'HORSE_NAME' ||
              prop.code === 'REGISTERED_NAME' ||
              prop.code === 'studHorse';

            return (
              <React.Fragment key={prop.code}>
                <View style={[styles.readOnlyRow, { borderTopColor: border }]}>
                  <View style={styles.labelCol}>
                    <Text style={[styles.readOnlyLabel, { color: secondary }]}>{prop.title}</Text>
                  </View>
                  <View style={[styles.inputCol, { alignItems: 'flex-end' }]}>
                    <Text style={[styles.readOnlyValue, { color: text }]}>{getDisplayLabel(prop)}</Text>
                  </View>
                </View>

                {isHorseName && d.tjkNumber ? (
                  <View style={[styles.readOnlyRow, { borderTopColor: border }]}>
                    <View style={styles.labelCol}>
                      <Text style={[styles.readOnlyLabel, { color: secondary }]}>TJK No</Text>
                    </View>
                    <View style={[styles.inputCol, { alignItems: 'flex-end' }]}>
                      <Text style={[styles.readOnlyValue, { color: text }]}>{d.tjkNumber}</Text>
                    </View>
                  </View>
                ) : null}
              </React.Fragment>
            );
          })}

          {/* pregnancyProps — read-only */}
          {pregnancyProps.pregnantProp ? (
            <View style={[styles.readOnlyRow, { borderTopColor: border }]}>
              <View style={styles.labelCol}>
                <Text style={[styles.readOnlyLabel, { color: secondary }]}>
                  {pregnancyProps.pregnantProp.title || 'Gebe mi?'}
                </Text>
              </View>
              <View style={[styles.inputCol, { alignItems: 'flex-end' }]}>
                <Text style={[styles.readOnlyValue, { color: text }]}>
                  {getDisplayLabel(pregnancyProps.pregnantProp)}
                </Text>
              </View>
            </View>
          ) : null}

          {/* statusToggles: full-width rows on mobile, inline row on wide screens */}
          {statusToggles.length > 0 ? (
            !isWide ? (
              <View style={[styles.togglesMobileList, { borderTopColor: border }]}>
                {statusToggles.map((prop, idx) => {
                  const val = Boolean(getPropertyValue(prop.code));
                  return (
                    <Pressable
                      key={prop.code}
                      onPress={() => handlePropertyChange(prop.code, !val)}
                      style={[
                        styles.toggleMobileRow,
                        idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: border },
                      ]}
                      accessibilityRole="switch"
                      accessibilityState={{ checked: val }}
                    >
                      <Text style={[styles.toggleMobileLabel, { color: secondary }]}>
                        {prop.title}
                      </Text>
                      <View
                        style={[
                          styles.compactSwitch,
                          {
                            backgroundColor: val ? header : border,
                            justifyContent: val ? 'flex-end' : 'flex-start',
                          },
                        ]}
                      >
                        <View style={styles.compactSwitchKnob} />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={[styles.togglesInlineRow, { borderTopColor: border }]}>
                {statusToggles.map((prop) => {
                  const val = Boolean(getPropertyValue(prop.code));
                  return (
                    <Pressable
                      key={prop.code}
                      onPress={() => handlePropertyChange(prop.code, !val)}
                      style={styles.toggleInlineItem}
                      accessibilityRole="switch"
                      accessibilityState={{ checked: val }}
                    >
                      <Text style={[styles.toggleInlineLabel, { color: secondary }]} numberOfLines={1}>
                        {prop.title}
                      </Text>
                      <View
                        style={[
                          styles.compactSwitch,
                          {
                            backgroundColor: val ? header : border,
                            justifyContent: val ? 'flex-end' : 'flex-start',
                          },
                        ]}
                      >
                        <View style={styles.compactSwitchKnob} />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )
          ) : null}

          {/* toggleProps — still interactive (user must select) */}
          {toggleProps.length > 0 ? (
            <View style={[styles.sectionBlock, { borderTopColor: border }]}>
              <View style={styles.subHeaderRow}>
                <Text style={[styles.subHeaderText, { color: text }]}>
                  Olanaklar & Hizmet Özellikleri
                </Text>
              </View>
              {toggleProps.map((prop) => {
                const val = Boolean(getPropertyValue(prop.code));
                return (
                  <View key={prop.code} style={[styles.rowItem, { borderTopColor: border }]}>
                    <View style={styles.labelCol}>
                      <Text style={[styles.fieldLabel, { color: secondary }]}>
                        {prop.title}
                      </Text>
                    </View>
                    <View style={styles.switchCol}>
                      <Pressable
                        onPress={() => handlePropertyChange(prop.code, !val)}
                        accessibilityRole="switch"
                        accessibilityState={{ checked: val }}
                      >
                        <View
                          style={[
                            styles.switch,
                            {
                              backgroundColor: val ? header : border,
                              justifyContent: val ? 'flex-end' : 'flex-start',
                            },
                          ]}
                        >
                          <View style={styles.switchKnob} />
                        </View>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}
        </>
      ) : (
        <>
          {/* 1. Chips and Input Fields */}
          {otherProps.map((prop) => {
            const propKey = prop.code;
            const val = getPropertyValue(prop.code);
            const err = errors[prop.code as keyof ListingFieldErrors];

            if (prop.options && prop.options.length > 0) {
              const canonicalKey = getCanonicalPropertyKey(prop);
              const isDropdown =
                canonicalKey === 'canonical_breed' ||
                canonicalKey === 'canonical_coat_color' ||
                canonicalKey === 'canonical_age' ||
                prop.options.length > 4;

              if (isDropdown) {
                const hasValue = val !== undefined && val !== null && val !== '';
                const displayLabel = hasValue ? getDisplayLabel(prop) : '';

                return (
                  <View key={propKey} style={[styles.rowItem, { borderTopColor: border }]}>
                    <View style={styles.labelCol}>
                      <Text style={[styles.fieldLabel, { color: secondary }]}>
                        {prop.title}
                        {prop.isRequired ? (
                          <Text style={{ color: errorColor }}> *</Text>
                        ) : null}
                      </Text>
                    </View>
                    <View style={styles.inputCol}>
                      <Pressable
                        onPress={() => setActiveSelectProp(prop)}
                        style={[
                          styles.select,
                          {
                            borderColor: err ? errorColor : border,
                            backgroundColor: surface,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            color: displayLabel ? text : muted,
                            ...Typography.body,
                            fontSize: 14,
                            flex: 1,
                          }}
                          numberOfLines={1}
                        >
                          {displayLabel || `${prop.title} seçin`}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color={muted} />
                      </Pressable>
                      {err ? (
                        <Text style={[styles.err, { color: errorColor }]}>{err}</Text>
                      ) : null}
                    </View>
                  </View>
                );
              }

              return (
                <View key={propKey} style={[styles.rowItem, { borderTopColor: border }]}>
                  <View style={[styles.labelCol, { paddingTop: 6 }]}>
                    <Text style={[styles.fieldLabel, { color: secondary }]}>
                      {prop.title}
                      {prop.isRequired ? (
                        <Text style={{ color: errorColor }}> *</Text>
                      ) : null}
                    </Text>
                  </View>
                  <View style={styles.inputCol}>
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
                                backgroundColor: on ? header : surface,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.chipLabel,
                                { color: on ? '#fff' : text, fontWeight: on ? '700' : '500' },
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
                </View>
              );
            }

            const isNumeric =
              prop.dataType === 'INTEGER' ||
              prop.dataType === 'DECIMAL' ||
              prop.dataType === 'YEAR';

            const isBirthDate =
              prop.code.toUpperCase() === 'BIRTH_DATE' ||
              prop.code.toUpperCase() === 'BIRTHDATE' ||
              prop.title.toLowerCase().includes('doğum') ||
              prop.title.toLowerCase().includes('dogum');

            const placeholderText = isBirthDate
              ? 'YYYY-AA-GG (Örn: 2021)'
              : prop.helpText || `${prop.title} girin`;

            const canonicalKey = getCanonicalPropertyKey(prop);
            const isHorseName =
              canonicalKey === 'canonical_stud_name' ||
              prop.code === 'HORSE_NAME' ||
              prop.code === 'REGISTERED_NAME' ||
              prop.code === 'studHorse';

            return (
              <React.Fragment key={propKey}>
                <View style={[styles.rowItem, { borderTopColor: border }]}>
                  <PostField
                    label={prop.title}
                    required={prop.isRequired}
                    value={val != null ? String(val) : ''}
                    locked={Boolean(d.horseId) && isHorseName}
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
                    placeholder={placeholderText}
                    keyboardType={isNumeric ? 'numeric' : 'default'}
                    error={err}
                  />
                </View>

                {isHorseName && d.tjkNumber ? (
                  <View style={[styles.rowItem, { borderTopColor: border }]}>
                    <View style={styles.labelCol}>
                      <Text style={[styles.fieldLabel, { color: secondary }]}>TJK No</Text>
                    </View>
                    <View style={styles.inputCol}>
                      <View
                        style={[
                          styles.select,
                          {
                            backgroundColor: `${border}55`,
                            borderColor: border,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            ...Typography.body,
                            fontSize: 14,
                            color: text,
                            fontWeight: '600',
                          }}
                        >
                          {d.tjkNumber}
                        </Text>
                        <Text style={{ ...Typography.caption, fontSize: 11, color: muted, fontWeight: '700' }}>
                          TJK
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : null}
              </React.Fragment>
            );
          })}

          {/* 2. Kısrak Gebelik Durumu Özel Bölümü */}
          {pregnancyProps.pregnantProp ? (() => {
            const isPregnantVal = (() => {
              const raw = getPropertyValue('IS_PREGNANT');
              if (raw === true || raw === 'true' || raw === 1 || raw === '1') return true;
              if (raw === false || raw === 'false' || raw === 0 || raw === '0') return false;
              return undefined;
            })();

            return (
              <View style={[styles.sectionBlock, { borderTopColor: border }]}>
                <View style={styles.rowItem}>
                  <View style={styles.labelCol}>
                    <Text style={[styles.fieldLabel, { color: secondary }]}>
                      {pregnancyProps.pregnantProp.title || 'Gebe mi?'}
                    </Text>
                  </View>
                  <View style={styles.inputCol}>
                    <View style={styles.chips}>
                      <Pressable
                        onPress={() => handlePropertyChange('IS_PREGNANT', false)}
                        style={[
                          styles.chip,
                          {
                            borderColor: isPregnantVal === false ? header : border,
                            backgroundColor: isPregnantVal === false ? header : surface,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipLabel,
                            {
                              color: isPregnantVal === false ? '#fff' : text,
                              fontWeight: isPregnantVal === false ? '700' : '500',
                            },
                          ]}
                        >
                          Hayır
                        </Text>
                      </Pressable>

                      <Pressable
                        onPress={() => handlePropertyChange('IS_PREGNANT', true)}
                        style={[
                          styles.chip,
                          {
                            borderColor: isPregnantVal === true ? header : border,
                            backgroundColor: isPregnantVal === true ? header : surface,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipLabel,
                            {
                              color: isPregnantVal === true ? '#fff' : text,
                              fontWeight: isPregnantVal === true ? '700' : '500',
                            },
                          ]}
                        >
                          Evet
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>

                {isPregnantVal === true ? (
                  <>
                    <View style={[styles.rowItem, { borderTopColor: border }]}>
                      <PostField
                        label={pregnancyProps.coveringStallionProp?.title || 'Gebe Olduğu Aygır'}
                        required
                        value={String(getPropertyValue('COVERING_STALLION') ?? '')}
                        onChangeText={(textVal) => handlePropertyChange('COVERING_STALLION', textVal)}
                        placeholder={pregnancyProps.coveringStallionProp?.helpText || 'Aygır adını giriniz'}
                        error={errors.COVERING_STALLION || (errors as any).coveringStallion}
                      />
                    </View>

                    {pregnancyProps.pregnancyStageProp ? (
                      <View style={[styles.rowItem, { borderTopColor: border }]}>
                        <View style={styles.labelCol}>
                          <Text style={[styles.fieldLabel, { color: secondary }]}>
                            {pregnancyProps.pregnancyStageProp?.title || 'Gebelik Durumu'}
                            <Text style={{ color: errorColor }}> *</Text>
                          </Text>
                        </View>
                        <View style={styles.inputCol}>
                          <View style={styles.chips}>
                            {(pregnancyProps.pregnancyStageProp?.options && pregnancyProps.pregnancyStageProp.options.length > 0
                              ? pregnancyProps.pregnancyStageProp.options
                              : [{ value: 'K1', label: 'K1' }, { value: 'K2', label: 'K2' }, { value: 'K3', label: 'K3' }]
                            ).map((opt) => {
                              const optVal = opt.value || opt.label;
                              const currentVal = String(getPropertyValue('PREGNANCY_STAGE') ?? '').toUpperCase().trim();
                              const on = currentVal === String(optVal).toUpperCase().trim();

                              return (
                                <Pressable
                                  key={optVal}
                                  onPress={() => handlePropertyChange('PREGNANCY_STAGE', opt.value || optVal)}
                                  style={[
                                    styles.chip,
                                    {
                                      borderColor: on ? header : border,
                                      backgroundColor: on ? header : surface,
                                    },
                                  ]}
                                >
                                  <Text style={[styles.chipLabel, { color: on ? '#fff' : text, fontWeight: on ? '700' : '500' }]}>
                                    {opt.label || opt.value}
                                  </Text>
                                </Pressable>
                              );
                            })}
                          </View>
                          {(errors.PREGNANCY_STAGE || (errors as any).pregnancyStage) ? (
                            <Text style={[styles.err, { color: errorColor }]}>
                              {errors.PREGNANCY_STAGE || (errors as any).pregnancyStage}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    ) : null}

                    {pregnancyProps.lastCoveringDateProp ? (
                      <View style={[styles.rowItem, { borderTopColor: border }]}>
                        <PostField
                          label={pregnancyProps.lastCoveringDateProp.title || 'Son Aşım Tarihi'}
                          value={String(getPropertyValue('LAST_COVERING_DATE') ?? '')}
                          onChangeText={(textVal) => handlePropertyChange('LAST_COVERING_DATE', textVal)}
                          placeholder={pregnancyProps.lastCoveringDateProp.helpText || 'GG.AA.YYYY (Örn: 20.04.2024)'}
                          error={errors.LAST_COVERING_DATE || (errors as any).lastCoveringDate}
                        />
                      </View>
                    ) : null}
                  </>
                ) : null}
              </View>
            );
          })() : null}

          {/* 3. Race Status Toggles: full-width rows on mobile, inline row on wide screens */}
          {statusToggles.length > 0 ? (
            !isWide ? (
              <View style={[styles.togglesMobileList, { borderTopColor: border }]}>
                {statusToggles.map((prop, idx) => {
                  const val = Boolean(getPropertyValue(prop.code));
                  return (
                    <Pressable
                      key={prop.code}
                      onPress={() => handlePropertyChange(prop.code, !val)}
                      style={[
                        styles.toggleMobileRow,
                        idx > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: border },
                      ]}
                      accessibilityRole="switch"
                      accessibilityState={{ checked: val }}
                    >
                      <Text style={[styles.toggleMobileLabel, { color: secondary }]}>
                        {prop.title}
                      </Text>
                      <View
                        style={[
                          styles.compactSwitch,
                          {
                            backgroundColor: val ? header : border,
                            justifyContent: val ? 'flex-end' : 'flex-start',
                          },
                        ]}
                      >
                        <View style={styles.compactSwitchKnob} />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View style={[styles.togglesInlineRow, { borderTopColor: border }]}>
                {statusToggles.map((prop) => {
                  const val = Boolean(getPropertyValue(prop.code));
                  return (
                    <Pressable
                      key={prop.code}
                      onPress={() => handlePropertyChange(prop.code, !val)}
                      style={styles.toggleInlineItem}
                      accessibilityRole="switch"
                      accessibilityState={{ checked: val }}
                    >
                      <Text style={[styles.toggleInlineLabel, { color: secondary }]} numberOfLines={1}>
                        {prop.title}
                      </Text>
                      <View
                        style={[
                          styles.compactSwitch,
                          {
                            backgroundColor: val ? header : border,
                            justifyContent: val ? 'flex-end' : 'flex-start',
                          },
                        ]}
                      >
                        <View style={styles.compactSwitchKnob} />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )
          ) : null}

          {/* 4. Boolean Toggle Grid */}
          {toggleProps.length > 0 ? (
            <View style={[styles.sectionBlock, { borderTopColor: border }]}>
              <View style={styles.subHeaderRow}>
                <Text style={[styles.subHeaderText, { color: text }]}>
                  Olanaklar & Hizmet Özellikleri
                </Text>
              </View>
              {toggleProps.map((prop) => {
                const val = Boolean(getPropertyValue(prop.code));
                return (
                  <View key={prop.code} style={[styles.rowItem, { borderTopColor: border }]}>
                    <View style={styles.labelCol}>
                      <Text style={[styles.fieldLabel, { color: secondary }]}>
                        {prop.title}
                      </Text>
                    </View>
                    <View style={styles.switchCol}>
                      <Pressable
                        onPress={() => handlePropertyChange(prop.code, !val)}
                        accessibilityRole="switch"
                        accessibilityState={{ checked: val }}
                      >
                        <View
                          style={[
                            styles.switch,
                            {
                              backgroundColor: val ? header : border,
                              justifyContent: val ? 'flex-end' : 'flex-start',
                            },
                          ]}
                        >
                          <View style={styles.switchKnob} />
                        </View>
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : null}
        </>
      )}

      {activeSelectProp && activeSelectProp.options && (
        <PostSelectSheet
          visible={Boolean(activeSelectProp)}
          title={`${activeSelectProp.title} Seçin`}
          options={activeSelectProp.options.map((o) => ({
            label: o.label || o.value,
            value: o.value || o.label,
          }))}
          selectedValue={getPropertyValue(activeSelectProp.code)}
          onClose={() => setActiveSelectProp(null)}
          onSelect={(optVal) => {
            handlePropertyChange(activeSelectProp.code, optVal);
            setActiveSelectProp(null);
          }}
        />
      )}
    </>
  );

  if (hideCard) {
    return cardContent;
  }

  return (
    <View
      style={[styles.card, { backgroundColor: surface, borderColor: border }]}
      onLayout={(e) =>
        onLayoutSection?.('categoryProperties', e.nativeEvent.layout.y)
      }
    >
      {cardContent}
    </View>
  );
}

const styles = StyleSheet.create({
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
  section: {
    ...Typography.h5,
    fontWeight: '700',
  },
  cardDesc: {
    ...Typography.caption,
    fontSize: 12.5,
    marginTop: 3,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  labelCol: {
    width: 110,
    flexShrink: 0,
    minHeight: 46,
    justifyContent: 'center',
  },
  fieldLabel: {
    ...Typography.caption,
    fontSize: 13.5,
    fontWeight: '600',
    letterSpacing: 0.2,
    lineHeight: 18,
  },
  inputCol: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  select: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchCol: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    minHeight: 46,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingVertical: 4,
  },
  chip: {
    minHeight: 34,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: {
    ...Typography.small,
    fontSize: 13,
    fontWeight: '600',
  },
  sectionBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  subHeaderRow: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 12,
    paddingBottom: 4,
  },
  subHeaderText: {
    ...Typography.caption,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  readOnlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  readOnlyLabel: {
    ...Typography.caption,
    fontSize: 13.5,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  readOnlyValue: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
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
  togglesMobileList: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.lg,
  },
  toggleMobileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    minHeight: 46,
  },
  toggleMobileLabel: {
    ...Typography.body,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    paddingRight: 12,
  },
  togglesInlineRow: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  toggleInlineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleInlineLabel: {
    ...Typography.caption,
    fontSize: 13.5,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  compactSwitch: {
    width: 44,
    height: 26,
    borderRadius: 13,
    padding: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  compactSwitchKnob: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
  },
  err: {
    ...Typography.caption,
    fontSize: 12,
  },
  pregnancyCard: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  pregnancyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
  },
  pregnancyTitle: {
    ...Typography.body,
    fontWeight: '700',
  },
  pregnantToggleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pregnantChip: {
    minHeight: 34,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pregnantChipText: {
    ...Typography.caption,
    fontSize: 13,
    fontWeight: '600',
  },
  pregnancySubFields: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
