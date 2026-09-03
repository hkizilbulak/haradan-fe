import { formatHorseAge, parseHorseInfo } from '../components/advert-detail/advertCategoryHelper';
import { mapPublishedDetailToAdvert } from '../services/advert/mapAdvertDetail';
import type { BePublishedAdvertDetail } from '../services/advert/mapAdvertDetail';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`PASS: ${msg}`);
}

// 1. Helper unit tests
assert(formatHorseAge('10-15 arası') === '10-15 Yaş arası', 'formatHorseAge(10-15 arası) -> 10-15 Yaş arası');
assert(formatHorseAge('1015') === '10-15 Yaş arası', 'formatHorseAge(1015) -> 10-15 Yaş arası');
assert(formatHorseAge('1015 Yaş') === '10-15 Yaş arası', 'formatHorseAge(1015 Yaş) -> 10-15 Yaş arası');
assert(formatHorseAge('15 üzeri') === '15 Yaş üzeri', 'formatHorseAge(15 üzeri) -> 15 Yaş üzeri');
assert(formatHorseAge('4') === '4 Yaş', 'formatHorseAge(4) -> 4 Yaş');
assert(formatHorseAge('1.5') === '1.5 Yaş', 'formatHorseAge(1.5) -> 1.5 Yaş');
assert(formatHorseAge('4 Yaş') === '4 Yaş', 'formatHorseAge(4 Yaş) -> 4 Yaş');

// 2. Advert 45 payload simulation (exactly what backend returned for advert 45)
const mockAdvert45: BePublishedAdvertDetail = {
  id: 45,
  title: 'binek at',
  description: 'hobi amaçlı binek atı',
  publishedAt: '2026-09-03T19:35:53.858559+03:00',
  viewCount: 3,
  price: { amountMinor: 200000000, currency: 'TRY' },
  category: { id: 'c1000000-0000-4000-8000-000000000014', name: 'Satılık Binek Atı', slug: 'satilik-binek-ati' },
  location: { districtId: 'e033596e-fdf4-5116-9ac5-2ccb74282c87', districtName: 'Karaisalı', provinceId: '802aa4c5-68d5-56e3-b5d8-c98b5d7f7874', provinceName: 'Adana' },
  horse: null,
  properties: [
    { code: 'REGISTERED_NAME', title: 'At Adı', value: 'inci' },
    { code: 'HORSE_BREED', displayValue: 'İngiliz (Thoroughbred)', title: 'At Irkı', value: 'İngiliz (Thoroughbred)' },
    { code: 'COAT_COLOR', displayValue: 'Beyaz', title: 'Donu (Renk)', value: 'Beyaz' },
    { code: 'HORSE_AGE', displayValue: '10-15 arası', title: 'Yaş', value: '10-15 arası' },
    { code: 'HORSE_GENDER', displayValue: 'Dişi', title: 'Cinsiyet', value: 'Dişi' },
    { code: 'BIRTH_DATE', title: 'Doğum Tarihi', value: '2005.06.17' },
  ],
  media: [],
};

const mappedAdvert = mapPublishedDetailToAdvert(mockAdvert45, 'http://localhost:8080/api');
assert(mappedAdvert.horse.age === '10-15 arası', `mappedAdvert.horse.age should be '10-15 arası', got '${mappedAdvert.horse.age}'`);

const parsedInfo = parseHorseInfo(mappedAdvert);
assert(parsedInfo.age === '10-15 Yaş arası', `parsedInfo.age should be '10-15 Yaş arası', got '${parsedInfo.age}'`);
assert(parsedInfo.name === 'inci', `parsedInfo.name should be 'inci', got '${parsedInfo.name}'`);
assert(parsedInfo.breed === 'İngiliz (Thoroughbred)', `parsedInfo.breed should be 'İngiliz (Thoroughbred)', got '${parsedInfo.breed}'`);
assert(parsedInfo.gender === 'Dişi', `parsedInfo.gender should be 'Dişi', got '${parsedInfo.gender}'`);
assert(parsedInfo.coatColor === 'Beyaz', `parsedInfo.coatColor should be 'Beyaz', got '${parsedInfo.coatColor}'`);

console.log('All age range verification tests passed successfully!');
