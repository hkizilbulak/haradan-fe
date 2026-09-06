import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { ListingMediaSlot } from '@/types/listing';

export type Picked = Omit<ListingMediaSlot, 'isCover' | 'assetId'>;

export type PickImagesResult = {
  items: Picked[];
  error?: string | null;
};

import {
  ACCEPTED_IMAGE_TYPES,
  isAllowedImageFormat,
  resolveImageMimeType,
} from '@/utils/mediaValidation';

export { ACCEPTED_IMAGE_TYPES, isAllowedImageFormat, resolveImageMimeType };

function newId(): string {
  return `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function pickWeb(remaining: number): Promise<PickImagesResult> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = ACCEPTED_IMAGE_TYPES;
    input.multiple = remaining > 1;
    input.onchange = () => {
      const allFiles = Array.from(input.files ?? []);
      const validFiles: File[] = [];
      let rejected = 0;

      for (const file of allFiles) {
        if (isAllowedImageFormat(file.type, file.name)) {
          validFiles.push(file);
        } else {
          rejected++;
        }
      }

      const files = validFiles.slice(0, remaining);
      let error: string | null = null;
      if (rejected > 0) {
        error = 'Yalnızca JPEG, PNG veya WebP formatında fotoğraflar yükleyebilirsiniz.';
      }

      resolve({
        items: files.map((file) => ({
          localId: newId(),
          uri: URL.createObjectURL(file),
          mimeType: resolveImageMimeType(file.type, file.name),
          fileName: file.name || 'photo.jpg',
        })),
        error,
      });
    };
    input.click();
  });
}

/**
 * Platform görsel seçici.
 * Web: file input. Native: expo-image-picker.
 * Desteklenen formatlar: JPEG, PNG, WebP.
 */
export async function pickLocalImages(remaining: number): Promise<PickImagesResult> {
  if (remaining <= 0) return { items: [], error: null };
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return pickWeb(remaining);
  }

  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { items: [], error: 'Galeriye erişim izni verilmedi.' };
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: remaining > 1,
    selectionLimit: remaining,
    quality: 0.85,
  });
  if (result.canceled) return { items: [], error: null };

  const validAssets: ImagePicker.ImagePickerAsset[] = [];
  let rejected = 0;
  for (const asset of result.assets) {
    if (isAllowedImageFormat(asset.mimeType, asset.fileName || asset.uri)) {
      validAssets.push(asset);
    } else {
      rejected++;
    }
  }

  let error: string | null = null;
  if (rejected > 0) {
    error = 'Yalnızca JPEG, PNG veya WebP formatında fotoğraflar yükleyebilirsiniz.';
  }

  return {
    items: validAssets.slice(0, remaining).map((asset) => ({
      localId: newId(),
      uri: asset.uri,
      mimeType: resolveImageMimeType(asset.mimeType, asset.fileName || asset.uri),
      fileName: asset.fileName ?? 'photo.jpg',
    })),
    error,
  };
}
