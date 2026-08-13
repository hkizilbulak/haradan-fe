import { phoneCountryCatalog } from './MockPhoneCountryCatalog';

export function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, '');
}

/** TR: 532 123 45 67 — yazdıkça gruplar. */
export function formatNationalPhone(iso: string, raw: string): string {
  const digits = digitsOnly(raw);
  if (iso === 'TR') {
    const d = digits.startsWith('0') ? digits.slice(1) : digits;
    const p = d.slice(0, 10);
    const a = p.slice(0, 3);
    const b = p.slice(3, 6);
    const c = p.slice(6, 8);
    const e = p.slice(8, 10);
    return [a, b, c, e].filter(Boolean).join(' ');
  }
  return digits;
}

export function isValidNationalPhone(iso: string, raw: string): boolean {
  const digits = digitsOnly(raw);
  if (iso === 'TR') {
    const d = digits.startsWith('0') ? digits.slice(1) : digits;
    return d.length === 10 && d.startsWith('5');
  }
  return digits.length >= 6 && digits.length <= 15;
}

export function composeInternationalPhone(
  iso: string,
  national: string
): string | null {
  const country = phoneCountryCatalog.getByIso(iso);
  if (!country) return null;
  const digits = digitsOnly(national);
  const local = iso === 'TR' && digits.startsWith('0') ? digits.slice(1) : digits;
  if (!local) return null;
  return `${country.dial}${local}`;
}

export function formatTlGrouped(raw: string): string {
  const digits = digitsOnly(raw);
  if (!digits) return '';
  const n = Number.parseInt(digits, 10);
  if (!Number.isFinite(n)) return '';
  return n.toLocaleString('tr-TR');
}

export function parseInternationalPhone(raw: string): {
  iso: string;
  national: string;
} {
  const trimmed = raw.trim();
  if (trimmed.startsWith('00')) {
    return parseInternationalPhone(`+${trimmed.slice(2)}`);
  }
  const countries = [...phoneCountryCatalog.list()].sort(
    (a, b) => b.dial.length - a.dial.length
  );
  for (const country of countries) {
    if (trimmed.startsWith(country.dial)) {
      return {
        iso: country.iso,
        national: formatNationalPhone(country.iso, trimmed.slice(country.dial.length)),
      };
    }
  }
  return {
    iso: 'TR',
    national: formatNationalPhone('TR', trimmed),
  };
}
