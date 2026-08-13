import type { IPhoneCountryCatalog, PhoneCountry } from '@/types/phone';

const COUNTRIES: PhoneCountry[] = [
  { iso: 'TR', name: 'Türkiye', dial: '+90', flag: '🇹🇷' },
  { iso: 'AZ', name: 'Azerbaycan', dial: '+994', flag: '🇦🇿' },
  { iso: 'DE', name: 'Almanya', dial: '+49', flag: '🇩🇪' },
  { iso: 'NL', name: 'Hollanda', dial: '+31', flag: '🇳🇱' },
  { iso: 'GB', name: 'Birleşik Krallık', dial: '+44', flag: '🇬🇧' },
  { iso: 'US', name: 'ABD', dial: '+1', flag: '🇺🇸' },
  { iso: 'FR', name: 'Fransa', dial: '+33', flag: '🇫🇷' },
  { iso: 'IT', name: 'İtalya', dial: '+39', flag: '🇮🇹' },
  { iso: 'AE', name: 'BAE', dial: '+971', flag: '🇦🇪' },
  { iso: 'QA', name: 'Katar', dial: '+974', flag: '🇶🇦' },
];

export class MockPhoneCountryCatalog implements IPhoneCountryCatalog {
  list(): PhoneCountry[] {
    return COUNTRIES;
  }

  getByIso(iso: string): PhoneCountry | null {
    return COUNTRIES.find((c) => c.iso === iso) ?? null;
  }

  defaultIso(): string {
    return 'TR';
  }
}

export const phoneCountryCatalog: IPhoneCountryCatalog =
  new MockPhoneCountryCatalog();
