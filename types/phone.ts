export type PhoneCountry = {
  iso: string;
  name: string;
  dial: string;
  flag: string;
};

export interface IPhoneCountryCatalog {
  list(): PhoneCountry[];
  getByIso(iso: string): PhoneCountry | null;
  defaultIso(): string;
}
