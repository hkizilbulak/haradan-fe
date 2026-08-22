import type {
  AdvertDetail,
  AdvertReview,
  CatalogProductCard,
  HorseProfile,
  Money,
} from '@/types';
import { MOCK_HOMEPAGE } from '@/mocks/homepage';
import { DEMO_SELLER_ID, MY_LISTING_IDS } from '@/mocks/myListings';

const img = (id: string, w = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const H = {
  race: 'photo-1553284965-83fd3e82fa5a',
  mare: 'photo-1598974357801-cbca100e65d3',
  field: 'photo-1450101499163-c8848c66ca85',
  portrait: 'photo-1493962853295-0fd70327578a',
  prairie: 'photo-1769251847366-6b49e30d31e2',
  jump: 'photo-1605559424843-9e4c228bf1c2',
  stable: 'photo-1766524872796-ff2a543004bb',
  close: 'photo-1544967082-d9d25d867d66',
} as const;

const tryPrice = (tl: number): Money => ({
  amountMinor: Math.round(tl * 100),
  currency: 'TRY',
});

function media(url: string, assetId: string, order: number) {
  return {
    assetId,
    displayOrder: order,
    isCover: order === 0,
    publicUrl: url,
    usage: order === 0 ? ('cover' as const) : ('gallery' as const),
  };
}

function cardsFromHome(): CatalogProductCard[] {
  return [
    ...MOCK_HOMEPAGE.trending,
    ...MOCK_HOMEPAGE.specialOffers,
  ].filter(
    (item, index, arr) => arr.findIndex((x) => x.id === item.id) === index
  );
}

function formatTl(m: Money): string {
  const major = m.amountMinor / 100;
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(major);
}

function formatStats(s: HorseProfile['career']): string {
  return `${s.starts} start · ${s.first}-${s.second}-${s.third}-${s.fourth}-${s.fifth}`;
}

function buildHorse(base: CatalogProductCard): HorseProfile {
  const isMare =
    base.categoryId === 'cat-kisrak' ||
    /kısrak/i.test(base.title);
  const gender = isMare ? 'Dişi' : base.categoryId === 'cat-pony' ? 'İğdiş' : 'Erkek';
  const coat =
    gender === 'Dişi' ? 'Kır' : gender === 'İğdiş' ? 'Al' : 'Doru';
  const name =
    base.title.split('—')[0]?.trim().slice(0, 42) ||
    base.title.slice(0, 42);

  return {
    registeredName: name,
    age: 5,
    birthDate: '2021-03-14',
    gender,
    coatColor: coat,
    heightCm: 162,
    breed: base.brand ?? 'İngiliz',
    sire: 'SEA THE STARS',
    dam: 'GALIPOLI QUEEN',
    damsire: 'GALILEO',
    owners: ['Karadeniz Harası', 'M. Yılmaz'],
    breeder: 'Karacabey Harası',
    trainer: 'Ahmet Demir',
    career: {
      starts: 24,
      first: 6,
      second: 4,
      third: 3,
      fourth: 2,
      fifth: 1,
    },
    yearly: [
      {
        year: 2025,
        stats: { starts: 8, first: 2, second: 2, third: 1, fourth: 1, fifth: 0 },
        earnings: tryPrice(1_850_000),
      },
      {
        year: 2024,
        stats: { starts: 10, first: 3, second: 1, third: 2, fourth: 1, fifth: 1 },
        earnings: tryPrice(2_420_000),
      },
      {
        year: 2023,
        stats: { starts: 6, first: 1, second: 1, third: 0, fourth: 0, fifth: 0 },
        earnings: tryPrice(980_000),
      },
    ],
    careerEarnings: tryPrice(5_250_000),
    handicap: 78,
    races: [
      {
        id: 'race-1',
        date: '2025-11-02',
        venue: 'İstanbul · Veliefendi',
        distance: '1600 m',
        surface: 'Çim',
        finishTime: '1.36.42',
        place: 1,
        jockey: 'H. Karataş',
        videoUrl: 'https://example.com/race/1',
      },
      {
        id: 'race-2',
        date: '2025-09-18',
        venue: 'Ankara · 75. Yıl',
        distance: '1400 m',
        surface: 'Kum',
        finishTime: '1.24.10',
        place: 2,
        jockey: 'A. Çelik',
        videoUrl: 'https://example.com/race/2',
      },
      {
        id: 'race-3',
        date: '2025-07-05',
        venue: 'İzmir · Şirinyer',
        distance: '1800 m',
        surface: 'Sentetik',
        finishTime: '1.52.88',
        place: 3,
        jockey: 'M. Kaya',
        videoUrl: null,
      },
      {
        id: 'race-4',
        date: '2024-12-14',
        venue: 'İstanbul · Veliefendi',
        distance: '2000 m',
        surface: 'Çim',
        finishTime: '2.05.21',
        place: 1,
        jockey: 'H. Karataş',
        videoUrl: 'https://example.com/race/4',
      },
      {
        id: 'race-5',
        date: '2024-08-22',
        venue: 'Bursa · Osmangazi',
        distance: '1200 m',
        surface: 'Kum',
        finishTime: '1.12.05',
        place: 4,
        jockey: 'S. Yıldız',
        videoUrl: 'https://example.com/race/5',
      },
    ],
    offspring:
      gender === 'Erkek' || gender === 'Dişi'
        ? [
            {
              id: 'off-1',
              name: 'NIGHT GALAXY',
              birthYear: 2024,
              performanceSummary: '4 start · 1-1-0-0-0',
              earnings: tryPrice(420_000),
            },
            {
              id: 'off-2',
              name: 'GOLDEN MEADOW',
              birthYear: 2023,
              performanceSummary: '7 start · 2-1-1-0-0',
              earnings: tryPrice(860_000),
            },
          ]
        : null,
  };
}

function buildSpecs(horse: HorseProfile): AdvertDetail['specs'] {
  const groups: AdvertDetail['specs'] = [
    {
      id: 'identity',
      title: '1. Kimlik ve fiziksel bilgiler',
      rows: [
        { label: 'İsim', value: horse.registeredName },
        {
          label: 'Yaş / doğum',
          value: `${horse.age} yaş`,
          hint: horse.birthDate,
        },
        { label: 'Cinsiyet', value: horse.gender },
        { label: 'Don', value: horse.coatColor },
        { label: 'Cins', value: horse.breed },
        ...(horse.heightCm
          ? [{ label: 'Cidago', value: `${horse.heightCm} cm` }]
          : []),
      ],
    },
    {
      id: 'pedigree',
      title: '2. Orijin (soy ağacı)',
      rows: [
        { label: 'Baba', value: horse.sire },
        { label: 'Anne', value: horse.dam },
        { label: 'Kısrak babası', value: horse.damsire },
      ],
    },
    {
      id: 'people',
      title: '3. İlgili kişiler',
      rows: [
        { label: 'Sahip', value: horse.owners.join(', ') },
        { label: 'Yetiştirici', value: horse.breeder },
        { label: 'Antrenör', value: horse.trainer },
      ],
    },
    {
      id: 'performance',
      title: '4. Performans ve kazanç',
      rows: [
        { label: 'Kariyer', value: formatStats(horse.career) },
        { label: 'Toplam kazanç', value: formatTl(horse.careerEarnings) },
        { label: 'Handikap', value: String(horse.handicap) },
        ...horse.yearly.map((y) => ({
          label: `${y.year}`,
          value: `${formatStats(y.stats)} · ${formatTl(y.earnings)}`,
        })),
      ],
    },
    {
      id: 'races',
      title: '5. Detaylı yarış geçmişi',
      rows: horse.races.map((r) => ({
        label: r.date,
        value: `${r.venue} · ${r.distance} ${r.surface} · ${r.place}. · ${r.finishTime} · ${r.jockey}`,
        hint: r.videoUrl ? 'Video mevcut' : undefined,
      })),
    },
  ];

  if (horse.offspring && horse.offspring.length > 0) {
    groups.push({
      id: 'offspring',
      title: '6. Üreme ve tay bilgileri',
      rows: horse.offspring.map((o) => ({
        label: o.name,
        value: `${o.birthYear} · ${o.performanceSummary}`,
        hint: o.earnings ? formatTl(o.earnings) : undefined,
      })),
    });
  }

  return groups;
}

const MORE_REVIEWS: AdvertReview[] = [
  {
    id: 'r3',
    author: 'Can Öztürk',
    verified: true,
    createdAt: '2026-04-02T10:00:00.000Z',
    rating: 5,
    meta: 'Yerinde inceleme · Veliefendi',
    body: 'Handikap ve kariyer istatistikleri şeffaf paylaşılmıştı. Antrenör ile görüşme çok verimli geçti.',
    pros: 'Şeffaflık, performans verisi',
    cons: 'Yok',
    helpful: 5,
    notHelpful: 0,
  },
  {
    id: 'r4',
    author: 'Elif Demir',
    verified: false,
    createdAt: '2026-03-11T10:00:00.000Z',
    rating: 4,
    meta: 'Nakliye ile teslim',
    body: 'Soy ağacı belgeleri tamdı. Nakliye sürecinde Haradan üzerinden iletişim kolay oldu.',
    pros: 'Belge, nakliye',
    cons: 'Biraz uzun randevu',
    helpful: 3,
    notHelpful: 0,
  },
  {
    id: 'r5',
    author: 'Serkan Aydın',
    verified: true,
    createdAt: '2026-02-20T10:00:00.000Z',
    rating: 5,
    meta: 'Damızlık değerlendirme',
    body: 'Tay performansları ve kazanç dökümü net. Damızlık potansiyeli için yeterli veri vardı.',
    pros: 'Üreme verisi, iletişim',
    cons: 'Yok',
    helpful: 9,
    notHelpful: 1,
  },
];

function buildDetail(base: CatalogProductCard): AdvertDetail {
  const galleryUrls = [
    base.cover?.publicUrl ?? img(H.race),
    img(H.mare),
    img(H.field),
    img(H.portrait),
    img(H.prairie),
    img(H.jump),
  ];

  const horse = buildHorse(base);

  const ratingBreakdown = [
    { stars: 5 as const, count: 28 },
    { stars: 4 as const, count: 18 },
    { stars: 3 as const, count: 8 },
    { stars: 2 as const, count: 3 },
    { stars: 1 as const, count: 2 },
  ];

  const reviews: AdvertReview[] = [
    {
      id: 'r1',
      author: 'Mehmet Yılmaz',
      verified: true,
      createdAt: '2026-06-28T10:00:00.000Z',
      rating: 5,
      meta: `${horse.breed} · ${horse.coatColor}`,
      body: 'İlan sahibi çok ilgiliydi. Atı yerinde gördük, belgeleri eksiksizdi. Teslimat sürecinde nakliye de sorunsuz ayarlandı.',
      pros: 'Belgeler, mizaç, iletişim',
      cons: 'Randevu yoğunluğu',
      helpful: 12,
      notHelpful: 0,
    },
    {
      id: 'r2',
      author: 'Ayşe Kaya',
      verified: true,
      createdAt: '2026-05-14T10:00:00.000Z',
      rating: 4,
      meta: `${horse.gender} · Handikap ${horse.handicap}`,
      body: 'Beklediğimiz gibi sakin bir karakter. Ahır koşulları iyi, veteriner raporu paylaşılmıştı.',
      pros: 'Sağlık, fiyat/performans',
      cons: 'Fotoğraflar biraz eskiydi',
      helpful: 8,
      notHelpful: 1,
    },
    ...MORE_REVIEWS,
  ];

  return {
    ...base,
    slug: base.id,
    rating: base.rating || 4.5,
    reviewCount: reviews.length,
    description:
      'Profesyonel bakım altında, sağlık kontrolleri güncel. Veteriner raporu, nalbant takvimi ve şecere belgeleri ilan sahibinden talep edilebilir. Yerinde inceleme ve deneme binisi randevu ile yapılır.',
    available: true,
    sellerPhone: '+90 555 123 45 67',
    sellerId: MY_LISTING_IDS.has(base.id) ? DEMO_SELLER_ID : 'user-other',
    gallery: galleryUrls.map((url, i) => media(url, `${base.id}-g${i}`, i)),
    breadcrumbs: [
      { label: 'Ana sayfa', href: '/' },
      { label: 'İlanlar', href: '/' },
      { label: base.title },
    ],
    horse,
    shipping: [
      {
        id: 's1',
        service: 'Haradan anlaşmalı nakliye',
        timing: '2–4 gün',
        cost: 'Teklif',
      },
      {
        id: 's2',
        service: 'Satıcı teslimi',
        timing: 'Randevu ile',
        cost: 'Ücretsiz',
      },
      {
        id: 's3',
        service: 'Alıcı alır',
        timing: 'Aynı gün',
        cost: 'Ücretsiz',
      },
    ],
    warranties: [
      {
        id: 'w1',
        title: 'Sağlık ve belge bilgisi',
        body: 'Aşı kartı, son veteriner kontrolü ve kimlik belgeleri satış öncesi paylaşılır. Eksik belge durumunda ilan sahibi bilgilendirilir.',
      },
      {
        id: 'w2',
        title: 'Ödeme ve güvenli işlem',
        body: 'Haradan üzerinden mesajlaşın, yerinde inceleme yapın. Ödeme şartları taraflar arasında yazılı olarak netleştirilir.',
      },
    ],
    specs: buildSpecs(horse),
    bundleTitle: 'Birlikte avantajlı',
    bundleItems: [
      {
        id: 'b-main',
        title: base.title,
        price: base.price ?? tryPrice(0),
        oldPrice: base.oldPrice,
        discountLabel: null,
        coverUrl: galleryUrls[0],
        selectedByDefault: true,
      },
      {
        id: 'b-saddle',
        title: 'İngiliz binicilik eyeri — Prestige',
        price: tryPrice(48_500),
        oldPrice: tryPrice(62_000),
        discountLabel: '-22%',
        coverUrl: img(H.close, 400),
        selectedByDefault: true,
      },
      {
        id: 'b-board',
        title: '1 aylık pansiyon hara paketi',
        price: tryPrice(18_500),
        oldPrice: tryPrice(22_000),
        discountLabel: '-16%',
        coverUrl: img(H.stable, 400),
        selectedByDefault: false,
      },
    ],
    reviews,
    ratingBreakdown,
    viewed: cardsFromHome().filter((c) => c.id !== base.id).slice(0, 8),
    related: cardsFromHome()
      .filter((c) => c.id !== base.id)
      .slice(0, 9),
  };
}

function buildDetailFromStored(id: string): AdvertDetail | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return null;
  }
  try {
    const rawDrafts = localStorage.getItem('haradan.mockMyListings.drafts');
    const drafts = rawDrafts ? (JSON.parse(rawDrafts) as Record<string, any>) : {};
    const rawItems = localStorage.getItem('haradan.mockMyListings.items');
    const items = rawItems ? (JSON.parse(rawItems) as any[]) : [];
    const draft = drafts[id];
    const card = Array.isArray(items) ? items.find((x) => x.id === id) : null;

    if (!draft && !card) return null;

    const title = (draft?.details?.title || card?.title || 'İlan').trim();
    const mediaList: any[] = draft?.media ?? [];
    const gallery =
      mediaList.length > 0
        ? mediaList.map((m, i) => ({
            assetId: m.assetId ?? m.localId ?? `g-${i}`,
            displayOrder: i,
            isCover: Boolean(
              m.isCover || (i === 0 && !mediaList.some((x) => x.isCover))
            ),
            publicUrl: m.uri,
            usage: m.isCover ? ('cover' as const) : ('gallery' as const),
          }))
        : card?.cover
          ? [card.cover]
          : [media(img(H.race), `${id}-g0`, 0)];

    const cover =
      gallery.find((m) => m.isCover) ?? gallery[0] ?? card?.cover ?? null;
    const price =
      card?.price ??
      (draft?.details?.priceTl
        ? tryPrice(Number(draft.details.priceTl.replace(/\D/g, '')) || 0)
        : tryPrice(0));

    const horse: HorseProfile = {
      registeredName: draft?.details?.registeredName || title,
      age: Number(draft?.details?.age) || 5,
      birthDate: draft?.details?.birthDate || '2021-03-14',
      gender: draft?.details?.gender || 'Erkek',
      coatColor: draft?.details?.coatColor || 'Doru',
      heightCm: Number(draft?.details?.heightCm) || 160,
      breed: draft?.details?.breed || draft?.details?.studBreed || 'İngiliz',
      sire: draft?.details?.sire || draft?.details?.studSire || '',
      dam: draft?.details?.dam || draft?.details?.studDam || '',
      damsire: draft?.details?.damsire || draft?.details?.studDamsire || '',
      owners: draft?.details?.ownersText
        ? [draft.details.ownersText]
        : ['İlan Sahibi'],
      breeder: draft?.details?.breeder || '',
      trainer: draft?.details?.trainer || '',
      career: { starts: 0, first: 0, second: 0, third: 0, fourth: 0, fifth: 0 },
      yearly: [],
      careerEarnings: { amountMinor: 0, currency: 'TRY' },
      handicap: 0,
      races: [],
      offspring: null,
    };

    return {
      id,
      slug: id,
      title,
      description:
        draft?.details?.description?.trim() || 'Açıklama belirtilmemiş.',
      price,
      oldPrice: null,
      categoryId:
        draft?.type?.categorySlug ||
        draft?.type?.categoryId ||
        card?.categoryId ||
        'satilik-yaris-ati',
      districtId: draft?.details?.districtId || card?.districtId || '3401',
      provinceId: draft?.details?.provinceId || card?.provinceId || '34',
      horseId: draft?.details?.horseId ?? null,
      cover,
      gallery,
      isFavorite: false,
      packageCode: card?.packageCode ?? draft?.packageCode ?? 'STANDARD',
      packageDisplayName: card?.packageDisplayName ?? 'Standart',
      packageBadgeText: card?.packageBadgeText ?? null,
      isUrgent: Boolean(card?.isUrgent),
      urgentActivatedAt: card?.urgentActivatedAt ?? null,
      isFeatured: Boolean(card?.isFeatured),
      featuredUntil: card?.featuredUntil ?? null,
      rating: card?.rating ?? 5,
      reviewCount: 0,
      viewCount: card?.viewCount ?? 0,
      available: true,
      brand: horse.breed,
      publishedAt: card?.publishedAt ?? new Date().toISOString(),
      sellerPhone: draft?.details?.sellerPhone
        ? `+90 ${draft.details.sellerPhone}`
        : '+90 555 123 45 67',
      sellerId: card?.sellerId ?? DEMO_SELLER_ID,
      breadcrumbs: [
        { label: 'Ana sayfa', href: '/' },
        { label: 'İlanlar', href: '/listings' },
        { label: title },
      ],
      horse,
      specs: buildSpecs(horse),
      shipping: [
        {
          id: 's1',
          service: 'Haradan anlaşmalı nakliye',
          timing: '2–4 gün',
          cost: 'Teklif',
        },
        {
          id: 's2',
          service: 'Satıcı teslimi',
          timing: 'Randevu ile',
          cost: 'Ücretsiz',
        },
      ],
      warranties: [
        {
          id: 'w1',
          title: 'Sağlık ve belge bilgisi',
          body: 'Aşı kartı ve veteriner kontrolü satış öncesi paylaşılır.',
        },
      ],
      bundleTitle: 'Birlikte avantajlı',
      bundleItems: [],
      reviews: [],
      ratingBreakdown: [],
      viewed: [],
      related: [],
    };
  } catch {
    return null;
  }
}

const DETAIL_BY_ID: Record<string, AdvertDetail> = Object.fromEntries(
  cardsFromHome().map((card) => [card.id, buildDetail(card)])
);

export const MOCK_ADVERT_FALLBACK = buildDetail(
  MOCK_HOMEPAGE.trending[0] ?? MOCK_HOMEPAGE.newAdverts[0]
);

export function getMockAdvertDetail(id: string): AdvertDetail {
  if (DETAIL_BY_ID[id]) return DETAIL_BY_ID[id];
  const userDetail = buildDetailFromStored(id);
  if (userDetail) return userDetail;
  return { ...MOCK_ADVERT_FALLBACK, id };
}
