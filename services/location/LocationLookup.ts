/**
 * Konum etiketleri — BE yalnızca UUID döner.
 * Gerçek entegrasyonda GET /v1/provinces yanıtı cache'lenir.
 */
export type ProvinceOption = { id: string; name: string };

export interface ILocationLookup {
  getProvinceName(provinceId: string): string;
  getDistrictName(districtId: string): string;
  listProvinces(): ProvinceOption[];
}

/** Plaka kodu → il. Mock id: prov-34 */
const PROVINCES: Record<string, string> = {
  'prov-01': 'Adana',
  'prov-02': 'Adıyaman',
  'prov-03': 'Afyonkarahisar',
  'prov-04': 'Ağrı',
  'prov-05': 'Amasya',
  'prov-06': 'Ankara',
  'prov-07': 'Antalya',
  'prov-08': 'Artvin',
  'prov-09': 'Aydın',
  'prov-10': 'Balıkesir',
  'prov-11': 'Bilecik',
  'prov-12': 'Bingöl',
  'prov-13': 'Bitlis',
  'prov-14': 'Bolu',
  'prov-15': 'Burdur',
  'prov-16': 'Bursa',
  'prov-17': 'Çanakkale',
  'prov-18': 'Çankırı',
  'prov-19': 'Çorum',
  'prov-20': 'Denizli',
  'prov-21': 'Diyarbakır',
  'prov-22': 'Edirne',
  'prov-23': 'Elazığ',
  'prov-24': 'Erzincan',
  'prov-25': 'Erzurum',
  'prov-26': 'Eskişehir',
  'prov-27': 'Gaziantep',
  'prov-28': 'Giresun',
  'prov-29': 'Gümüşhane',
  'prov-30': 'Hakkari',
  'prov-31': 'Hatay',
  'prov-32': 'Isparta',
  'prov-33': 'Mersin',
  'prov-34': 'İstanbul',
  'prov-35': 'İzmir',
  'prov-36': 'Kars',
  'prov-37': 'Kastamonu',
  'prov-38': 'Kayseri',
  'prov-39': 'Kırklareli',
  'prov-40': 'Kırşehir',
  'prov-41': 'Kocaeli',
  'prov-42': 'Konya',
  'prov-43': 'Kütahya',
  'prov-44': 'Malatya',
  'prov-45': 'Manisa',
  'prov-46': 'Kahramanmaraş',
  'prov-47': 'Mardin',
  'prov-48': 'Muğla',
  'prov-49': 'Muş',
  'prov-50': 'Nevşehir',
  'prov-51': 'Niğde',
  'prov-52': 'Ordu',
  'prov-53': 'Rize',
  'prov-54': 'Sakarya',
  'prov-55': 'Samsun',
  'prov-56': 'Siirt',
  'prov-57': 'Sinop',
  'prov-58': 'Sivas',
  'prov-59': 'Tekirdağ',
  'prov-60': 'Tokat',
  'prov-61': 'Trabzon',
  'prov-62': 'Tunceli',
  'prov-63': 'Şanlıurfa',
  'prov-64': 'Uşak',
  'prov-65': 'Van',
  'prov-66': 'Yozgat',
  'prov-67': 'Zonguldak',
  'prov-68': 'Aksaray',
  'prov-69': 'Bayburt',
  'prov-70': 'Karaman',
  'prov-71': 'Kırıkkale',
  'prov-72': 'Batman',
  'prov-73': 'Şırnak',
  'prov-74': 'Bartın',
  'prov-75': 'Ardahan',
  'prov-76': 'Iğdır',
  'prov-77': 'Yalova',
  'prov-78': 'Karabük',
  'prov-79': 'Kilis',
  'prov-80': 'Osmaniye',
  'prov-81': 'Düzce',
};

const DISTRICTS: Record<string, string> = {
  'dist-34-cek': 'Çekmeköy',
  'dist-34-sil': 'Silivri',
  'dist-06-cub': 'Çubuk',
  'dist-35-tor': 'Torbalı',
  'dist-16-nil': 'Nilüfer',
  'dist-07-kas': 'Kaş',
  'dist-42-sel': 'Selçuklu',
};

export class StaticLocationLookup implements ILocationLookup {
  getProvinceName(provinceId: string): string {
    return PROVINCES[provinceId] ?? 'Türkiye';
  }

  getDistrictName(districtId: string): string {
    return DISTRICTS[districtId] ?? '';
  }

  listProvinces(): ProvinceOption[] {
    return Object.entries(PROVINCES)
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }
}

export const locationLookup: ILocationLookup = new StaticLocationLookup();
