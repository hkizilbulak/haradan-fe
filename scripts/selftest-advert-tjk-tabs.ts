import assert from 'node:assert/strict';
import { mapHorseDetail, type HorsePublicDetailResponse } from '../services/tjk/mapHorse';
import { mapPublishedDetailToAdvert, type BePublishedAdvertDetail } from '../services/advert/mapAdvertDetail';

console.log('[Selftest] Running TJK Data & Advert Detail synchronization tests...');

// 1. Live BE horse sample provided by the user
const rawHorsePayload: HorsePublicDetailResponse = {
  id: '97a7b7cb-6f82-4c52-9043-01f85efeb4dd',
  originalName: 'ADAAĞASI',
  tjkNumber: '48990',
  birthYear: 2011,
  breed: 'Arap\nErkek\n15 y k a',
  coat: 'k',
  damName: 'ADAGÜLÜ',
  sireName: 'AĞA KARACA',
  detail: {
    pedigree: [
      {
        Father: 'AĞA KARACA k a (1995)',
        Mother: 'ADAGÜLÜ k k (2004)',
      },
      {
        Father: 'VOLGA.2 k a (1983)',
        Mother: 'SAHRA.25',
      },
      {
        Father: 'BOZDAĞ k a (1992)',
        Mother: 'ADAKIZI k k (1995)',
      },
      {
        Father: 'HİLALÜZZAMAN.25 k a (1975)',
        Mother: 'GUFRE.31 k k (1976)',
      },
      {
        Father: 'SERVET.2 k a (1959)',
        Mother: 'SAHRA.22',
      },
      {
        Father: 'TUNCA a a (1983)',
        Mother: 'AJDA k k (1982)',
      },
      {
        Father: 'UMUTBEY k a (1984)',
        Mother: 'NECME.31',
      },
    ],
    profile: {
      ageText: '15 y k a',
      birthDate: '9.03.2011',
      handicapPoint: '65',
      maidenSire: 'BOZDAĞ',
      owner: 'HÜSEYİN KÖKLÜ (%100)',
      sourceName: 'ADAAĞASI',
    },
    siblings: [
      {
        Earning: '0 t',
        FatherName: 'DEVİRHAN',
        First: '0',
        Fourth: '0',
        Name: 'ADALARPRENSESİ',
        RaceCount: '3',
        Second: '0',
        Third: '0',
      },
    ],
    statistics: [
      {
        Earning: '498.920 t',
        Fifth: '0',
        First: '6',
        Fourth: '6',
        RaceCount: '48',
        Second: '7',
        Third: '4',
        YearLabel: 'TOPLAM',
      },
      {
        Earning: '168.950 t',
        Fifth: '0',
        First: '0',
        Fourth: '4',
        RaceCount: '25',
        Second: '4',
        Third: '3',
        YearLabel: 'Çim',
      },
      {
        Earning: '69.900 t',
        Fifth: '0',
        First: '1',
        Fourth: '0',
        RaceCount: '5',
        Second: '1',
        Third: '0',
        YearLabel: 'Kum',
      },
      {
        Earning: '260.070 t',
        Fifth: '0',
        First: '5',
        Fourth: '2',
        RaceCount: '18',
        Second: '2',
        Third: '1',
        YearLabel: 'Sentetik',
      },
    ],
  },
};

// 2. Test mapHorseDetail
const mappedTjkHorse = mapHorseDetail(rawHorsePayload);

assert.equal(mappedTjkHorse.registeredName, 'ADAAĞASI');
assert.equal(mappedTjkHorse.tjkNumber, '48990');
assert.equal(mappedTjkHorse.sire, 'AĞA KARACA');
assert.equal(mappedTjkHorse.dam, 'ADAGÜLÜ');
assert.equal(mappedTjkHorse.damsire, 'BOZDAĞ');
assert.equal(mappedTjkHorse.handicap, 65);
assert.equal(mappedTjkHorse.coatColor, 'Kır');
assert.ok(mappedTjkHorse.gender === null || mappedTjkHorse.gender === 'Erkek');
assert.equal(mappedTjkHorse.owners[0], 'HÜSEYİN KÖKLÜ (%100)');

// Pedigree verification
assert.ok(mappedTjkHorse.pedigree, 'Pedigree should exist');
assert.equal(mappedTjkHorse.pedigree?.length, 7);
assert.equal(mappedTjkHorse.pedigree?.[0].father, 'AĞA KARACA k a (1995)');
assert.equal(mappedTjkHorse.pedigree?.[0].mother, 'ADAGÜLÜ k k (2004)');
assert.equal(mappedTjkHorse.pedigree?.[1].father, 'VOLGA.2 k a (1983)');
assert.equal(mappedTjkHorse.pedigree?.[2].father, 'BOZDAĞ k a (1992)');

// Siblings verification
assert.ok(mappedTjkHorse.siblings, 'Siblings should exist');
assert.equal(mappedTjkHorse.siblings?.length, 1);
assert.equal(mappedTjkHorse.siblings?.[0].name, 'ADALARPRENSESİ');
assert.equal(mappedTjkHorse.siblings?.[0].fatherName, 'DEVİRHAN');
assert.equal(mappedTjkHorse.siblings?.[0].raceCount, '3');

// Statistics verification
assert.ok(mappedTjkHorse.statistics, 'Statistics should exist');
assert.equal(mappedTjkHorse.statistics?.length, 4);
assert.equal(mappedTjkHorse.statistics?.[0].yearLabel, 'Genel Toplam');
assert.equal(mappedTjkHorse.statistics?.[0].first, '6');
assert.equal(mappedTjkHorse.statistics?.[0].earning, '498.920 t');
assert.equal(mappedTjkHorse.statistics?.[1].yearLabel, 'Çim');
assert.equal(mappedTjkHorse.statistics?.[2].yearLabel, 'Kum');
assert.equal(mappedTjkHorse.statistics?.[3].yearLabel, 'Sentetik');

console.log('✓ mapHorseDetail successfully mapped all profile, pedigree, siblings, and statistics fields.');

// 3. Test mapPublishedDetailToAdvert with TJK Horse
const sampleAdvertDto: BePublishedAdvertDetail = {
  id: 101,
  title: 'Satılık Şampiyon Adayı Arap Atı',
  description: 'Geniş pedigrili ve koşu istatistikli safkan.',
  publishedAt: '2026-09-02T10:00:00Z',
  price: { amountMinor: 50000000, currency: 'TRY' },
  category: { id: 'cat-arap', name: 'Arap Atı', slug: 'arap-ati' },
  location: {
    districtId: '34-kadikoy',
    districtName: 'Kadıköy',
    provinceId: '34',
    provinceName: 'İstanbul',
  },
  horse: {
    id: rawHorsePayload.id,
    originalName: rawHorsePayload.originalName,
    tjkNumber: rawHorsePayload.tjkNumber,
  },
  media: [],
  properties: [],
  isFavorite: false,
  isUrgent: false,
};

const mappedAdvert = mapPublishedDetailToAdvert(
  sampleAdvertDto,
  'https://api.haradan.com',
  null,
  mappedTjkHorse
);

assert.equal(mappedAdvert.horse.registeredName, 'ADAAĞASI');
assert.equal(mappedAdvert.horse.tjkNumber, '48990');
assert.equal(mappedAdvert.horse.sire, 'AĞA KARACA');
assert.equal(mappedAdvert.horse.dam, 'ADAGÜLÜ');
assert.equal(mappedAdvert.horse.damsire, 'BOZDAĞ');
assert.equal(mappedAdvert.horse.handicap, 65);
assert.equal(mappedAdvert.horse.pedigree?.length, 7);
assert.equal(mappedAdvert.horse.siblings?.length, 1);
assert.equal(mappedAdvert.horse.statistics?.length, 4);
assert.equal(mappedAdvert.horse.detailProfile?.handicapPoint, '65');
assert.equal(mappedAdvert.horse.detailProfile?.owner, 'HÜSEYİN KÖKLÜ (%100)');

console.log('✓ mapPublishedDetailToAdvert populated AdvertDetail.horse with rich TJK data.');

// 4. Test getTjkHorseUrl for direct TJK querying
import { getTjkHorseUrl } from '../utils/tjkLinks';

assert.equal(
  getTjkHorseUrl('SRI PEKAN'),
  'https://www.tjk.org/TR/YarisSever/Query/Page/Atlar?1=1&QueryParameter_AtIsmi=SRI%20PEKAN'
);
assert.equal(
  getTjkHorseUrl('SRI PEKAN (USA) d a (1992)'),
  'https://www.tjk.org/TR/YarisSever/Query/Page/Atlar?1=1&QueryParameter_AtIsmi=SRI%20PEKAN'
);
assert.equal(
  getTjkHorseUrl('AĞA KARACA k a (1995)'),
  'https://www.tjk.org/TR/YarisSever/Query/Page/Atlar?1=1&QueryParameter_AtIsmi=A%C4%9EA%20KARACA'
);
assert.equal(
  getTjkHorseUrl('ADAGÜLÜ kk (2004)'),
  'https://www.tjk.org/TR/YarisSever/Query/Page/Atlar?1=1&QueryParameter_AtIsmi=ADAG%C3%9CL%C3%9C'
);
assert.equal(getTjkHorseUrl('-'), null);
assert.equal(getTjkHorseUrl(''), null);
console.log('✓ getTjkHorseUrl correctly cleans names and generates official TJK query URLs.');

console.log('\nAll TJK data mapping and synchronization tests PASSED! 🎉');
