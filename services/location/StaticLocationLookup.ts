import type {
  DistrictOption,
  ILocationLookup,
  ProvinceOption,
} from './LocationLookup';

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

const DISTRICTS: Record<string, { name: string; provinceId: string }> = {
  // 01 Adana
  'dist-01-sey': { name: 'Seyhan', provinceId: 'prov-01' },
  'dist-01-cuk': { name: 'Çukurova', provinceId: 'prov-01' },
  'dist-01-yur': { name: 'Yüreğir', provinceId: 'prov-01' },
  'dist-01-cey': { name: 'Ceyhan', provinceId: 'prov-01' },
  'dist-01-koz': { name: 'Kozan', provinceId: 'prov-01' },

  // 02 Adıyaman
  'dist-02-mer': { name: 'Merkez', provinceId: 'prov-02' },
  'dist-02-kah': { name: 'Kahta', provinceId: 'prov-02' },
  'dist-02-bes': { name: 'Besni', provinceId: 'prov-02' },

  // 03 Afyonkarahisar
  'dist-03-mer': { name: 'Merkez', provinceId: 'prov-03' },
  'dist-03-san': { name: 'Sandıklı', provinceId: 'prov-03' },
  'dist-03-din': { name: 'Dinar', provinceId: 'prov-03' },

  // 04 Ağrı
  'dist-04-mer': { name: 'Merkez', provinceId: 'prov-04' },
  'dist-04-dog': { name: 'Doğubayazıt', provinceId: 'prov-04' },
  'dist-04-pat': { name: 'Patnos', provinceId: 'prov-04' },

  // 05 Amasya
  'dist-05-mer': { name: 'Merkez', provinceId: 'prov-05' },
  'dist-05-mrz': { name: 'Merzifon', provinceId: 'prov-05' },
  'dist-05-sul': { name: 'Suluova', provinceId: 'prov-05' },
  'dist-05-tas': { name: 'Taşova', provinceId: 'prov-05' },

  // 06 Ankara
  'dist-06-can': { name: 'Çankaya', provinceId: 'prov-06' },
  'dist-06-kec': { name: 'Keçiören', provinceId: 'prov-06' },
  'dist-06-yen': { name: 'Yenimahalle', provinceId: 'prov-06' },
  'dist-06-mam': { name: 'Mamak', provinceId: 'prov-06' },
  'dist-06-eti': { name: 'Etimesgut', provinceId: 'prov-06' },
  'dist-06-sin': { name: 'Sincan', provinceId: 'prov-06' },
  'dist-06-gol': { name: 'Gölbaşı', provinceId: 'prov-06' },
  'dist-06-cub': { name: 'Çubuk', provinceId: 'prov-06' },
  'dist-06-pol': { name: 'Polatlı', provinceId: 'prov-06' },

  // 07 Antalya
  'dist-07-mur': { name: 'Muratpaşa', provinceId: 'prov-07' },
  'dist-07-kep': { name: 'Kepez', provinceId: 'prov-07' },
  'dist-07-kon': { name: 'Konyaaltı', provinceId: 'prov-07' },
  'dist-07-ala': { name: 'Alanya', provinceId: 'prov-07' },
  'dist-07-man': { name: 'Manavgat', provinceId: 'prov-07' },
  'dist-07-ser': { name: 'Serik', provinceId: 'prov-07' },
  'dist-07-kas': { name: 'Kaş', provinceId: 'prov-07' },
  'dist-07-kem': { name: 'Kemer', provinceId: 'prov-07' },

  // 08 Artvin
  'dist-08-mer': { name: 'Merkez', provinceId: 'prov-08' },
  'dist-08-hop': { name: 'Hopa', provinceId: 'prov-08' },

  // 09 Aydın
  'dist-09-efe': { name: 'Efeler', provinceId: 'prov-09' },
  'dist-09-kus': { name: 'Kuşadası', provinceId: 'prov-09' },
  'dist-09-sok': { name: 'Söke', provinceId: 'prov-09' },
  'dist-09-naz': { name: 'Nazilli', provinceId: 'prov-09' },

  // 10 Balıkesir
  'dist-10-kar': { name: 'Karesi', provinceId: 'prov-10' },
  'dist-10-alt': { name: 'Altıeylül', provinceId: 'prov-10' },
  'dist-10-ban': { name: 'Bandırma', provinceId: 'prov-10' },
  'dist-10-edr': { name: 'Edremit', provinceId: 'prov-10' },
  'dist-10-ayv': { name: 'Ayvalık', provinceId: 'prov-10' },

  // 16 Bursa
  'dist-16-osm': { name: 'Osmangazi', provinceId: 'prov-16' },
  'dist-16-yil': { name: 'Yıldırım', provinceId: 'prov-16' },
  'dist-16-nil': { name: 'Nilüfer', provinceId: 'prov-16' },
  'dist-16-ine': { name: 'İnegöl', provinceId: 'prov-16' },
  'dist-16-gem': { name: 'Gemlik', provinceId: 'prov-16' },
  'dist-16-mud': { name: 'Mudanya', provinceId: 'prov-16' },

  // 20 Denizli
  'dist-20-pam': { name: 'Pamukkale', provinceId: 'prov-20' },
  'dist-20-mer': { name: 'Merkezefendi', provinceId: 'prov-20' },

  // 21 Diyarbakır
  'dist-21-kay': { name: 'Kayapınar', provinceId: 'prov-21' },
  'dist-21-bag': { name: 'Bağlar', provinceId: 'prov-21' },
  'dist-21-yen': { name: 'Yenişehir', provinceId: 'prov-21' },

  // 25 Erzurum
  'dist-25-yak': { name: 'Yakutiye', provinceId: 'prov-25' },
  'dist-25-pal': { name: 'Palandöken', provinceId: 'prov-25' },

  // 26 Eskişehir
  'dist-26-odu': { name: 'Odunpazarı', provinceId: 'prov-26' },
  'dist-26-tep': { name: 'Tepebaşı', provinceId: 'prov-26' },

  // 27 Gaziantep
  'dist-27-sah': { name: 'Şahinbey', provinceId: 'prov-27' },
  'dist-27-seh': { name: 'Şehitkamil', provinceId: 'prov-27' },
  'dist-27-niz': { name: 'Nizip', provinceId: 'prov-27' },

  // 31 Hatay
  'dist-31-ant': { name: 'Antakya', provinceId: 'prov-31' },
  'dist-31-isk': { name: 'İskenderun', provinceId: 'prov-31' },

  // 33 Mersin
  'dist-33-yen': { name: 'Yenişehir', provinceId: 'prov-33' },
  'dist-33-tor': { name: 'Toroslar', provinceId: 'prov-33' },
  'dist-33-mez': { name: 'Mezitli', provinceId: 'prov-33' },
  'dist-33-tar': { name: 'Tarsus', provinceId: 'prov-33' },

  // 34 İstanbul
  'dist-34-kad': { name: 'Kadıköy', provinceId: 'prov-34' },
  'dist-34-bes': { name: 'Beşiktaş', provinceId: 'prov-34' },
  'dist-34-sis': { name: 'Şişli', provinceId: 'prov-34' },
  'dist-34-usk': { name: 'Üsküdar', provinceId: 'prov-34' },
  'dist-34-cek': { name: 'Çekmeköy', provinceId: 'prov-34' },
  'dist-34-sil': { name: 'Silivri', provinceId: 'prov-34' },
  'dist-34-bak': { name: 'Bakırköy', provinceId: 'prov-34' },
  'dist-34-mal': { name: 'Maltepe', provinceId: 'prov-34' },
  'dist-34-pen': { name: 'Pendik', provinceId: 'prov-34' },
  'dist-34-fat': { name: 'Fatih', provinceId: 'prov-34' },
  'dist-34-bey': { name: 'Beyoğlu', provinceId: 'prov-34' },
  'dist-34-sar': { name: 'Sarıyer', provinceId: 'prov-34' },
  'dist-34-ata': { name: 'Ataşehir', provinceId: 'prov-34' },
  'dist-34-umr': { name: 'Ümraniye', provinceId: 'prov-34' },
  'dist-34-bas': { name: 'Başakşehir', provinceId: 'prov-34' },
  'dist-34-bld': { name: 'Beylikdüzü', provinceId: 'prov-34' },

  // 35 İzmir
  'dist-35-kon': { name: 'Konak', provinceId: 'prov-35' },
  'dist-35-ksk': { name: 'Karşıyaka', provinceId: 'prov-35' },
  'dist-35-bor': { name: 'Bornova', provinceId: 'prov-35' },
  'dist-35-buc': { name: 'Buca', provinceId: 'prov-35' },
  'dist-35-tor': { name: 'Torbalı', provinceId: 'prov-35' },
  'dist-35-ces': { name: 'Çeşme', provinceId: 'prov-35' },
  'dist-35-url': { name: 'Urla', provinceId: 'prov-35' },

  // 38 Kayseri
  'dist-38-mel': { name: 'Melikgazi', provinceId: 'prov-38' },
  'dist-38-koc': { name: 'Kocasinan', provinceId: 'prov-38' },
  'dist-38-tal': { name: 'Talas', provinceId: 'prov-38' },

  // 41 Kocaeli
  'dist-41-izm': { name: 'İzmit', provinceId: 'prov-41' },
  'dist-41-geb': { name: 'Gebze', provinceId: 'prov-41' },
  'dist-41-dar': { name: 'Darıca', provinceId: 'prov-41' },
  'dist-41-gol': { name: 'Gölcük', provinceId: 'prov-41' },

  // 42 Konya
  'dist-42-sel': { name: 'Selçuklu', provinceId: 'prov-42' },
  'dist-42-mer': { name: 'Meram', provinceId: 'prov-42' },
  'dist-42-kar': { name: 'Karatay', provinceId: 'prov-42' },
  'dist-42-ere': { name: 'Ereğli', provinceId: 'prov-42' },

  // 44 Malatya
  'dist-44-yes': { name: 'Yeşilyurt', provinceId: 'prov-44' },
  'dist-44-bat': { name: 'Battalgazi', provinceId: 'prov-44' },

  // 45 Manisa
  'dist-45-yun': { name: 'Yunusemre', provinceId: 'prov-45' },
  'dist-45-seh': { name: 'Şehzadeler', provinceId: 'prov-45' },
  'dist-45-akh': { name: 'Akhisar', provinceId: 'prov-45' },

  // 46 Kahramanmaraş
  'dist-46-oni': { name: 'Onikişubat', provinceId: 'prov-46' },
  'dist-46-dul': { name: 'Dulkadiroğlu', provinceId: 'prov-46' },

  // 47 Mardin
  'dist-47-art': { name: 'Artuklu', provinceId: 'prov-47' },
  'dist-47-kiz': { name: 'Kızıltepe', provinceId: 'prov-47' },
  'dist-47-mid': { name: 'Midyat', provinceId: 'prov-47' },

  // 48 Muğla
  'dist-48-men': { name: 'Menteşe', provinceId: 'prov-48' },
  'dist-48-bod': { name: 'Bodrum', provinceId: 'prov-48' },
  'dist-48-fet': { name: 'Fethiye', provinceId: 'prov-48' },
  'dist-48-mar': { name: 'Marmaris', provinceId: 'prov-48' },

  // 54 Sakarya
  'dist-54-ada': { name: 'Adapazarı', provinceId: 'prov-54' },
  'dist-54-ser': { name: 'Serdivan', provinceId: 'prov-54' },

  // 55 Samsun
  'dist-55-ata': { name: 'Atakum', provinceId: 'prov-55' },
  'dist-55-ilk': { name: 'İlkadım', provinceId: 'prov-55' },
  'dist-55-baf': { name: 'Bafra', provinceId: 'prov-55' },

  // 59 Tekirdağ
  'dist-59-sul': { name: 'Süleymanpaşa', provinceId: 'prov-59' },
  'dist-59-cor': { name: 'Çorlu', provinceId: 'prov-59' },
  'dist-59-cer': { name: 'Çerkezköy', provinceId: 'prov-59' },

  // 61 Trabzon
  'dist-61-ort': { name: 'Ortahisar', provinceId: 'prov-61' },
  'dist-61-akc': { name: 'Akçaabat', provinceId: 'prov-61' },

  // 63 Şanlıurfa
  'dist-63-hal': { name: 'Haliliye', provinceId: 'prov-63' },
  'dist-63-eyy': { name: 'Eyyübiye', provinceId: 'prov-63' },
  'dist-63-kar': { name: 'Karaköprü', provinceId: 'prov-63' },
  'dist-63-siv': { name: 'Siverek', provinceId: 'prov-63' },

  // 65 Van
  'dist-65-ipe': { name: 'İpekyolu', provinceId: 'prov-65' },
  'dist-65-tus': { name: 'Tuşba', provinceId: 'prov-65' },

  // 67 Zonguldak
  'dist-67-mer': { name: 'Merkez', provinceId: 'prov-67' },
  'dist-67-ere': { name: 'Ereğli', provinceId: 'prov-67' },

  // 77 Yalova
  'dist-77-mer': { name: 'Merkez', provinceId: 'prov-77' },
  'dist-77-cin': { name: 'Çınarcık', provinceId: 'prov-77' },

  // 81 Düzce
  'dist-81-mer': { name: 'Merkez', provinceId: 'prov-81' },
  'dist-81-akc': { name: 'Akçakoca', provinceId: 'prov-81' },
};

export class StaticLocationLookup implements ILocationLookup {
  getProvinceName(provinceId: string): string {
    return PROVINCES[provinceId] ?? 'Türkiye';
  }

  getDistrictName(districtId: string): string {
    if (DISTRICTS[districtId]) return DISTRICTS[districtId].name;
    if (districtId.startsWith('dist-')) {
      const parts = districtId.split('-');
      if (parts.length >= 3) {
        const provKey = `prov-${parts[1]}`;
        const provName = PROVINCES[provKey];
        if (provName) return `${provName} Merkez`;
      }
    }
    return '';
  }

  async listProvinces(): Promise<ProvinceOption[]> {
    return Object.entries(PROVINCES)
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }

  async listDistricts(provinceId: string): Promise<DistrictOption[]> {
    const list = Object.entries(DISTRICTS)
      .filter(([, d]) => d.provinceId === provinceId)
      .map(([id, d]) => ({ id, provinceId: d.provinceId, name: d.name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'));

    if (list.length > 0) return list;

    const provinceName = PROVINCES[provinceId];
    if (provinceName) {
      return [{ id: `dist-${provinceId}-merkez`, provinceId, name: `${provinceName} Merkez` }];
    }
    return [];
  }

  invalidate(): void {}
}
