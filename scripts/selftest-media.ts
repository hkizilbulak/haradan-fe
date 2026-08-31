/**
 * Medya kapak seçimi + URL mutlaklaştırma + canlı delivery smoke.
 * Çalıştır: npm run selftest:media
 */
import { mediaImageSource } from '../services/media/imageSource';
import {
  filterDeliverableMedia,
  pickDeliverableCover,
} from '../services/media/pickDeliverableCover';
import {
  mediaDeliveryUrl,
  resolvePublicMediaUrl,
} from '../services/media/publicUrl';
import { mapOwnerAdvertToCard } from '../services/my-listings/mapOwnerAdvert';

let failed = 0;
let passed = 0;

function assert(cond: unknown, name: string): void {
  if (cond) {
    passed += 1;
    console.log(`ok  ${name}`);
    return;
  }
  failed += 1;
  console.error(`FAIL ${name}`);
}

function assertEqual<T>(actual: T, expected: T, name: string): void {
  assert(actual === expected, `${name} (got ${JSON.stringify(actual)})`);
}

const apiBase = 'http://localhost:8080/api';

assertEqual(
  resolvePublicMediaUrl('/v1/media/a/DETAIL', apiBase),
  'http://localhost:8080/api/v1/media/a/DETAIL',
  'absolutize relative media'
);
assertEqual(
  mediaDeliveryUrl('asset-1', 'DETAIL', apiBase),
  'http://localhost:8080/api/v1/media/asset-1/DETAIL',
  'delivery url builder'
);

const mixed = [
  {
    assetId: 'pending-asset',
    displayOrder: 0,
    isCover: true,
    lifecycleStatus: 'UPLOAD_PENDING',
  },
  {
    assetId: 'ready-asset',
    displayOrder: 1,
    isCover: false,
    lifecycleStatus: 'MASTER_READY',
  },
];

const cover = pickDeliverableCover(mixed);
assertEqual(cover?.assetId, 'ready-asset', 'skip UPLOAD_PENDING cover');
assertEqual(
  filterDeliverableMedia(mixed).length,
  1,
  'filter only MASTER_READY'
);
assertEqual(pickDeliverableCover([]), null, 'empty media → null cover');
assertEqual(
  pickDeliverableCover([
    {
      assetId: 'x',
      displayOrder: 0,
      isCover: true,
      lifecycleStatus: 'UPLOAD_PENDING',
    },
  ]),
  null,
  'upload-pending only → null cover'
);

const card = mapOwnerAdvertToCard(
  {
    id: 1,
    status: 'PENDING_REVIEW',
    version: 1,
    mediaVersion: 1,
    categoryId: 'c',
    districtId: 'd',
    provinceId: 'p',
    horseId: null,
    title: 'Kapak testi',
    description: null,
    price: null,
    properties: {},
    media: mixed,
    updatedAt: '2026-08-15T10:00:00Z',
  },
  { apiBase, sellerId: 'u1' }
);
assert(
  card.cover?.publicUrl.includes('/v1/media/ready-asset/DETAIL') === true,
  'owner card uses deliverable cover url'
);

const withAuth = mediaImageSource(
  'http://localhost:8080/api/v1/media/x/DETAIL',
  'tok'
);
assert(
  typeof withAuth === 'object' &&
    withAuth !== null &&
    'headers' in withAuth &&
    withAuth.headers?.Authorization === 'Bearer tok',
  'mediaImageSource attaches Bearer'
);
assertEqual(
  mediaImageSource('http://x/y', null),
  'http://x/y',
  'mediaImageSource without token stays plain'
);

async function liveSmoke(): Promise<void> {
  const base = process.env.EXPO_PUBLIC_API_URL ?? apiBase;
  let healthOk = false;
  try {
    const h = await fetch(`${base}/health`);
    healthOk = h.ok;
  } catch {
    healthOk = false;
  }
  if (!healthOk) {
    console.log('skip live smoke (API down)');
    return;
  }

  const list = await fetch(`${base}/v1/adverts?limit=5`);
  assert(list.ok, 'GET /v1/adverts');
  const body = (await list.json()) as {
    items?: Array<{
      id: string;
      cover?: { publicUrl?: string; assetId?: string } | null;
    }>;
  };
  const withCover = (body.items ?? []).find((i) => i.cover?.publicUrl);
  if (!withCover?.cover?.publicUrl) {
    console.log('skip published media probe (no cover in search)');
    return;
  }

  const pubUrl = resolvePublicMediaUrl(withCover.cover.publicUrl, base);
  const pub = await fetch(pubUrl);
  assert(pub.status === 200, `published DETAIL anon → 200 (${pub.status})`);
  assert((await pub.arrayBuffer()).byteLength > 0, 'published body non-empty');

  // Attached advert media is publicly streamable (covers <img> tags in browser)
  const pendingAsset = 'd83f3265-30d0-40e3-b299-7f3f7a13385c';
  const pendingUrl = mediaDeliveryUrl(pendingAsset, 'DETAIL', base);
  const pendingAnon = await fetch(pendingUrl);
  assert(
    pendingAnon.status === 200,
    `pending DETAIL anon → 200 (${pendingAnon.status})`
  );
}

void liveSmoke()
  .catch((err) => {
    failed += 1;
    console.error('FAIL live smoke', err);
  })
  .finally(() => {
    console.log(`\n${passed} passed, ${failed} failed`);
    if (failed > 0) process.exit(1);
  });
