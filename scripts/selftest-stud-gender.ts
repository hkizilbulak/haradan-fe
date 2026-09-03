import { getAdvertCategoryKind, parseHorseInfo, parseStudInfo } from '../components/advert-detail/advertCategoryHelper';
import { mapPublishedDetailToAdvert } from '../services/advert/mapAdvertDetail';
import type { BePublishedAdvertDetail } from '../services/advert/mapAdvertDetail';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`PASS: ${msg}`);
}

// Exactly what backend returned for advert 76:
const mockAdvert76: BePublishedAdvertDetail = {
  id: 76,
  title: 'ABARİS',
  isFavorite: false,
  isUrgent: false,
  description: '',
  publishedAt: '2026-09-03T21:37:52.607834+03:00',
  viewCount: 3,
  price: { amountMinor: 25000000, currency: 'TRY' },
  category: {
    id: 'c1000000-0000-4000-8000-000000000032',
    name: 'İngiliz Aygır',
    slug: 'ingiliz-aygir',
  },
  location: {
    districtId: '0113e320-0f40-5b8d-aa17-98aa71338c3a',
    districtName: 'Çay',
    provinceId: 'c6cb4581-16fa-5faf-a4be-4c903baea061',
    provinceName: 'Afyonkarahisar',
  },
  horse: {
    id: '2cb33614-02a5-4afd-a45d-460234f6e85a',
    originalName: 'ABARİS',
    tjkNumber: '127181',
  },
  properties: [
    { code: 'studHorse', title: 'Aygır Adı', value: 'ABARİS' },
    { code: 'studBreed', title: 'Irkı', value: 'Safkan Arap' },
    { code: 'studAge', displayValue: '1', title: 'Yaş', value: '1' },
    { code: 'studCoatColor', displayValue: 'Al', title: 'Donu (Renk)', value: 'Al' },
    { code: 'studHorseName', title: 'Aygır Adı', value: 'ABARİS' },
    { code: 'studSire', title: 'Baba (Sire)', value: 'GÜNTAY' },
    { code: 'studDam', title: 'Anne (Dam)', value: 'ALTINÖKÇE' },
    { code: 'studDamSire', title: 'Annesinin Babası (Dam\'s Sire)', value: 'HABERBATUR' },
    { code: 'studDamsire', title: 'Annenin Babası (Damsire)', value: 'HABERBATUR' },
    { code: 'TJK_NUMBER', title: 'TJK No', value: '127181' },
  ],
  media: [],
};

const mappedAdvert = mapPublishedDetailToAdvert(mockAdvert76, 'http://localhost:8080/api');

// 1. Check category recognition
const categoryKind = getAdvertCategoryKind(mappedAdvert);
assert(categoryKind === 'stud', `Category kind should be 'stud', got '${categoryKind}'`);

// 2. Check horse profile gender
assert(mappedAdvert.horse.gender === 'Erkek', `mappedAdvert.horse.gender should be 'Erkek', got '${mappedAdvert.horse.gender}'`);

// 3. Check parseStudInfo
const studInfo = parseStudInfo(mappedAdvert);
assert(studInfo.name === 'ABARİS', `studInfo.name should be 'ABARİS', got '${studInfo.name}'`);
assert(studInfo.gender === 'Erkek', `studInfo.gender should be 'Erkek', got '${studInfo.gender}'`);
assert(studInfo.breed === 'Arap' || studInfo.breed === 'Safkan Arap', `studInfo.breed should be Arap, got '${studInfo.breed}'`);
assert(studInfo.age === '1 Yaş', `studInfo.age should be '1 Yaş', got '${studInfo.age}'`);
assert(studInfo.sire === 'GÜNTAY', `studInfo.sire should be 'GÜNTAY', got '${studInfo.sire}'`);
assert(studInfo.dam === 'ALTINÖKÇE', `studInfo.dam should be 'ALTINÖKÇE', got '${studInfo.dam}'`);
assert(studInfo.damsire === 'HABERBATUR', `studInfo.damsire should be 'HABERBATUR', got '${studInfo.damsire}'`);

// 4. Check parseHorseInfo fallback
const horseInfo = parseHorseInfo(mappedAdvert);
assert(horseInfo.gender === 'Erkek', `horseInfo.gender should be 'Erkek', got '${horseInfo.gender}'`);

console.log('All stud gender self-tests passed successfully! 🎉');
