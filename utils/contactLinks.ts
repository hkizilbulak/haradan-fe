import { Linking, Platform } from 'react-native';

const WA_GREEN = '#25D366';

/** WhatsApp marka yeşili — CTA’larda kullan. */
export const WHATSAPP_GREEN = WA_GREEN;

/** Telefonu tel: / wa.me için normalize eder. */
export function digitsOnlyPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 11) {
    return `90${digits.slice(1)}`;
  }
  return digits;
}

export async function openPhoneCall(phone: string): Promise<void> {
  const url = `tel:${phone}`;
  const can = await Linking.canOpenURL(url);
  if (can || Platform.OS === 'web') {
    await Linking.openURL(url);
  }
}

export async function openWhatsApp(
  phone: string,
  message?: string
): Promise<void> {
  const n = digitsOnlyPhone(phone);
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  const appUrl = `whatsapp://send?phone=${n}${message ? `&text=${encodeURIComponent(message)}` : ''}`;
  const webUrl = `https://wa.me/${n}${text}`;

  try {
    if (Platform.OS !== 'web') {
      const canApp = await Linking.canOpenURL(appUrl);
      if (canApp) {
        await Linking.openURL(appUrl);
        return;
      }
    }
  } catch {
    // fall through to web
  }
  await Linking.openURL(webUrl);
}
