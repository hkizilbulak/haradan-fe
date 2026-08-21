import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PostField } from './PostField';
import {
  isFarrierListing,
  isPansiyonListing,
  isStudServiceListing,
  isTransportListing,
} from '@/services/listing';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { useThemeColor } from '@/hooks/useThemeColor';
import type { ListingDraft, ListingDraftDetails } from '@/types/listing';

const STUD_BREEDS = ['Arap', 'İngiliz'];
const COAT_COLORS = [
  'Doru',
  'Al',
  'Kır',
  'Beyaz',
  'Yağız',
  'Kula',
  'Boz',
];

type PostCategoryPropertiesProps = {
  draft: ListingDraft;
  onUpdate: (partial: Partial<ListingDraftDetails>) => void;
  onLayoutSection?: (key: string, y: number) => void;
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

export function PostCategoryProperties({
  draft,
  onUpdate,
  onLayoutSection,
}: PostCategoryPropertiesProps) {
  const text = useThemeColor('text');
  const secondary = useThemeColor('textSecondary');
  const surface = useThemeColor('surface');
  const border = useThemeColor('border');
  const header = useThemeColor('header');

  const d = draft.details;
  const type = draft.type;

  // 1. Pansiyon Haralar
  if (isPansiyonListing(type)) {
    return (
      <View
        style={[styles.card, { backgroundColor: surface, borderColor: border }]}
        onLayout={(e) => onLayoutSection?.('facilities', e.nativeEvent.layout.y)}
      >
        <Text style={[styles.section, { color: text }]}>
          Tesis & Hizmet Bilgileri
        </Text>
        <Text style={[styles.desc, { color: secondary }]}>
          Tesisinizde sağladığınız padok, bakım ve hizmet olanaklarını belirtin.
        </Text>

        <View style={styles.toggleGrid}>
          <ToggleItem
            label="Çim Padok"
            value={Boolean(d.facilityGrassPaddock)}
            onToggle={() =>
              onUpdate({ facilityGrassPaddock: !d.facilityGrassPaddock })
            }
          />
          <ToggleItem
            label="Kum Padok"
            value={Boolean(d.facilitySandPaddock)}
            onToggle={() =>
              onUpdate({ facilitySandPaddock: !d.facilitySandPaddock })
            }
          />
          <ToggleItem
            label="Aygır Padoğu"
            value={Boolean(d.facilityStallionPaddock)}
            onToggle={() =>
              onUpdate({ facilityStallionPaddock: !d.facilityStallionPaddock })
            }
          />
          <ToggleItem
            label="Veteriner"
            value={Boolean(d.facilityVeterinarian)}
            onToggle={() =>
              onUpdate({ facilityVeterinarian: !d.facilityVeterinarian })
            }
          />
          <ToggleItem
            label="Nalbant"
            value={Boolean(d.facilityFarrier)}
            onToggle={() =>
              onUpdate({ facilityFarrier: !d.facilityFarrier })
            }
          />
          <ToggleItem
            label="Doğumhane"
            value={Boolean(d.facilityFoalingBarn)}
            onToggle={() =>
              onUpdate({ facilityFoalingBarn: !d.facilityFoalingBarn })
            }
          />
        </View>

        <PostField
          label="İdman Pisti"
          value={d.facilityTrainingTrack ?? ''}
          onChangeText={(facilityTrainingTrack) =>
            onUpdate({ facilityTrainingTrack })
          }
          placeholder="Örn: 1200m Kum Pist, Sentetik Pist..."
          hint="Mevcut idman pisti özelliklerini ve uzunluğunu yazabilirsiniz."
        />
      </View>
    );
  }

  // 2. At Nakliyesi
  if (isTransportListing(type)) {
    return (
      <View
        style={[styles.card, { backgroundColor: surface, borderColor: border }]}
        onLayout={(e) => onLayoutSection?.('transport', e.nativeEvent.layout.y)}
      >
        <Text style={[styles.section, { color: text }]}>
          Firma ve Hizmet Bilgileri
        </Text>
        <Text style={[styles.desc, { color: secondary }]}>
          Nakliye firmanız veya web siteniz varsa bilgilerini ekleyebilirsiniz.
        </Text>

        <PostField
          label="Firma Adı"
          value={d.companyName ?? ''}
          onChangeText={(companyName) => onUpdate({ companyName })}
          placeholder="Örn: Anadolu At Taşımacılığı Ltd."
        />

        <PostField
          label="Web Sitesi"
          value={d.websiteUrl ?? ''}
          onChangeText={(websiteUrl) => onUpdate({ websiteUrl })}
          placeholder="https://www.firmaadi.com"
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
    );
  }

  // 3. Aşım Hizmetleri (Arap / İngiliz)
  if (isStudServiceListing(type)) {
    return (
      <>
        {/* At Bilgileri */}
        <View
          style={[styles.card, { backgroundColor: surface, borderColor: border }]}
          onLayout={(e) => onLayoutSection?.('studInfo', e.nativeEvent.layout.y)}
        >
          <Text style={[styles.section, { color: text }]}>Aygır Bilgileri</Text>
          <Text style={[styles.desc, { color: secondary }]}>
            Aşım hizmeti sunulan aygırın ırk, yaş ve don bilgilerini girin.
          </Text>

          <PostField
            label="Aygır Adı"
            required
            value={d.registeredName || (d.studHorseName ?? '')}
            onChangeText={(val) =>
              onUpdate({ registeredName: val, studHorseName: val })
            }
            placeholder="Aygırın adı"
          />

          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: secondary }]}>
              At Irkı
            </Text>
            <View style={styles.chips}>
              {STUD_BREEDS.map((breed) => {
                const on =
                  (d.studBreed ?? '').toLocaleLowerCase('tr') ===
                  breed.toLocaleLowerCase('tr');
                return (
                  <Pressable
                    key={breed}
                    onPress={() => onUpdate({ studBreed: breed })}
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
                      {breed}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <PostField
            label="Yaş"
            value={d.studAge || d.age || ''}
            onChangeText={(studAge) => onUpdate({ studAge, age: studAge })}
            placeholder="Örn: 8"
            keyboardType="number-pad"
          />

          <View style={styles.fieldBlock}>
            <Text style={[styles.fieldLabel, { color: secondary }]}>
              Donu (Renk)
            </Text>
            <View style={styles.chips}>
              {COAT_COLORS.map((color) => {
                const on =
                  (d.studCoatColor || d.coatColor || '').toLocaleLowerCase('tr') ===
                  color.toLocaleLowerCase('tr');
                return (
                  <Pressable
                    key={color}
                    onPress={() =>
                      onUpdate({ studCoatColor: color, coatColor: color })
                    }
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
                      {color}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>

        {/* Soy Kütüğü */}
        <View
          style={[styles.card, { backgroundColor: surface, borderColor: border }]}
          onLayout={(e) =>
            onLayoutSection?.('studPedigree', e.nativeEvent.layout.y)
          }
        >
          <Text style={[styles.section, { color: text }]}>
            Soy Kütüğü (Pedigree)
          </Text>
          <Text style={[styles.desc, { color: secondary }]}>
            Aygırın soy kütüğü / anne, baba ve anne babası bilgileri.
          </Text>

          <PostField
            label="Baba"
            value={d.studSire || d.sire || ''}
            onChangeText={(studSire) => onUpdate({ studSire, sire: studSire })}
            placeholder="Baba adı"
          />

          <PostField
            label="Anne"
            value={d.studDam || d.dam || ''}
            onChangeText={(studDam) => onUpdate({ studDam, dam: studDam })}
            placeholder="Anne adı"
          />

          <PostField
            label="Annesinin Babası"
            value={d.studDamsire || d.damsire || ''}
            onChangeText={(studDamsire) =>
              onUpdate({ studDamsire, damsire: studDamsire })
            }
            placeholder="Annesinin babası"
          />
        </View>
      </>
    );
  }

  // 4. Nalbantlar (yalnızca standart alanlar vardır)
  if (isFarrierListing(type)) {
    return null;
  }

  return null;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  section: { ...Typography.h5, fontWeight: '700' },
  desc: { ...Typography.caption },
  toggleGrid: {
    gap: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    paddingVertical: 6,
  },
  toggleLabel: {
    ...Typography.body,
    flex: 1,
  },
  switch: {
    width: 44,
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
  fieldBlock: { gap: 6 },
  fieldLabel: {
    ...Typography.caption,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    minHeight: 38,
    paddingHorizontal: 16,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipLabel: { ...Typography.small, fontWeight: '600' },
});
