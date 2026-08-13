import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import type { ListingMediaSlot } from '@/types/listing';

type Picked = Omit<ListingMediaSlot, 'isCover' | 'assetId'>;

function newId(): string {
  return `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function pickWeb(remaining: number): Promise<Picked[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = remaining > 1;
    input.onchange = () => {
      const files = Array.from(input.files ?? []).slice(0, remaining);
      resolve(
        files.map((file) => ({
          localId: newId(),
          uri: URL.createObjectURL(file),
          mimeType: file.type || 'image/jpeg',
          fileName: file.name || 'photo.jpg',
        }))
      );
    };
    input.click();
  });
}

/**
 * Platform görsel seçici.
 * Web: file input. Native: expo-image-picker.
 */
export async function pickLocalImages(remaining: number): Promise<Picked[]> {
  if (remaining <= 0) return [];
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return pickWeb(remaining);
  }

  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return [];
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: remaining > 1,
    selectionLimit: remaining,
    quality: 0.85,
  });
  if (result.canceled) return [];
  return result.assets.slice(0, remaining).map((asset) => ({
    localId: newId(),
    uri: asset.uri,
    mimeType: asset.mimeType ?? 'image/jpeg',
    fileName: asset.fileName ?? 'photo.jpg',
  }));
}
