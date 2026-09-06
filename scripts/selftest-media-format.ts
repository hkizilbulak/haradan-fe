import { isAllowedImageFormat, resolveImageMimeType } from '../utils/mediaValidation';
import { detailsErrors, detailsStepComplete } from '../services/listing/validateListingDraft';
import type { ListingDraft } from '../types/listing';

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`Assertion failed: ${msg}`);
  console.log(`ok  ${msg}`);
}

assert(isAllowedImageFormat('image/jpeg', 'photo.jpg') === true, 'JPEG format allowed');
assert(isAllowedImageFormat('image/png', 'photo.png') === true, 'PNG format allowed');
assert(isAllowedImageFormat('image/webp', 'photo.webp') === true, 'WebP format allowed');
assert(isAllowedImageFormat('image/jpg', 'photo.jpg') === true, 'JPG format allowed');

assert(isAllowedImageFormat('image/gif', 'anim.gif') === false, 'GIF rejected');
assert(isAllowedImageFormat('image/bmp', 'photo.bmp') === false, 'BMP rejected');
assert(isAllowedImageFormat('image/svg+xml', 'draw.svg') === false, 'SVG rejected');
assert(isAllowedImageFormat('image/tiff', 'photo.tiff') === false, 'TIFF rejected');
assert(isAllowedImageFormat('application/pdf', 'doc.pdf') === false, 'PDF rejected');

assert(resolveImageMimeType('image/jpg', 'x.jpg') === 'image/jpeg', 'JPG normalized to image/jpeg');
assert(resolveImageMimeType(undefined, 'x.webp') === 'image/webp', 'Filename extension webp resolved');
assert(resolveImageMimeType(undefined, 'x.png') === 'image/png', 'Filename extension png resolved');

const draftWithGif: ListingDraft = {
  advertId: null,
  type: 'satilik-yaris-ati',
  breed: null,
  selectedPackage: null,
  packageCode: 'STANDARD',
  tjkApplied: false,
  details: {
    title: 'Test Başlık',
    description: 'Açıklama',
    priceTl: '150000',
    provinceId: '34',
    districtId: '123',
    address: 'Açık adres burada',
    gender: null,
    sellerPhone: '5551112233',
    phoneCountryIso: 'TR',
  },
  media: [
    {
      localId: 'm-1',
      uri: 'blob:http://localhost:8081/123',
      mimeType: 'image/gif',
      fileName: 'animated.gif',
      isCover: true,
      assetId: null,
    },
  ],
};

const errs = detailsErrors(draftWithGif);
assert(Boolean(errs.media), 'draftWithGif has media error');
assert(
  errs.media === 'Yalnızca JPEG, PNG veya WebP formatında fotoğraflar yükleyebilirsiniz.',
  'draftWithGif error message is correct'
);
assert(!detailsStepComplete(draftWithGif), 'draftWithGif detailsStepComplete is false');

// Now test with valid JPEG
const draftWithJpeg: ListingDraft = {
  ...draftWithGif,
  media: [
    {
      localId: 'm-2',
      uri: 'blob:http://localhost:8081/456',
      mimeType: 'image/jpeg',
      fileName: 'photo.jpg',
      isCover: true,
      assetId: null,
    },
  ],
};

const okErrs = detailsErrors(draftWithJpeg);
assert(!okErrs.media, 'draftWithJpeg has no media error');

console.log('\nAll media format validation tests passed successfully!');
