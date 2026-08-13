export type { IPhoneCountryCatalog, PhoneCountry } from '@/types/phone';
export { MockPhoneCountryCatalog, phoneCountryCatalog } from './MockPhoneCountryCatalog';
export {
  digitsOnly,
  formatNationalPhone,
  isValidNationalPhone,
  composeInternationalPhone,
  formatTlGrouped,
  parseInternationalPhone,
} from './formatPhone';
