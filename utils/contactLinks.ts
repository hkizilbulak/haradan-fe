const WA_GREEN = '#25D366';

/** WhatsApp marka yeşili — CTA’larda kullan. */
export const WHATSAPP_GREEN = WA_GREEN;

export function digitsOnlyPhone(phone: string): string {
  const digits = (phone ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('90') && digits.length === 12) {
    return digits;
  }
  if (digits.startsWith('0') && digits.length === 11) {
    return `90${digits.slice(1)}`;
  }
  if (digits.length === 10) {
    return `90${digits}`;
  }
  return digits;
}

export async function openPhoneCall(phone: string): Promise<void> {
  const n = digitsOnlyPhone(phone);
  if (!n) return;
  const url = `tel:+${n}`;

  try {
    const { Linking, Platform } = require('react-native');
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.location.href = url;
      }
      return;
    }
    const can = await Linking.canOpenURL(url);
    if (can) {
      await Linking.openURL(url);
    } else {
      await Linking.openURL(url);
    }
  } catch {
    // ignore
  }
}

export async function openWhatsApp(
  phone: string,
  message?: string
): Promise<void> {
  const n = digitsOnlyPhone(phone);
  if (!n) return;
  const encodedText = message ? encodeURIComponent(message) : '';
  const webUrl = encodedText
    ? `https://api.whatsapp.com/send?phone=${n}&text=${encodedText}`
    : `https://api.whatsapp.com/send?phone=${n}`;
  const appUrl = encodedText
    ? `whatsapp://send?phone=${n}&text=${encodedText}`
    : `whatsapp://send?phone=${n}`;

  try {
    const { Linking, Platform } = require('react-native');
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.open(webUrl, '_blank');
      }
      return;
    }

    const canApp = await Linking.canOpenURL(appUrl);
    if (canApp) {
      await Linking.openURL(appUrl);
      return;
    }
    await Linking.openURL(webUrl);
  } catch {
    // ignore
  }
}
