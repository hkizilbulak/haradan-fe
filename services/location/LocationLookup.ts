export type ProvinceOption = { id: string; name: string };
export type DistrictOption = {
  id: string;
  provinceId: string;
  name: string;
};

export interface ILocationLookup {
  getProvinceName(provinceId: string): string;
  getDistrictName(districtId: string): string;
  listProvinces(): Promise<ProvinceOption[]>;
  listDistricts(provinceId: string): Promise<DistrictOption[]>;
  registerProvince(provinceId: string, name: string): void;
  registerDistrict(districtId: string, name: string, provinceId?: string): void;
  formatLocation(
    districtId?: string | null,
    provinceId?: string | null,
    districtName?: string | null,
    provinceName?: string | null
  ): string;
  subscribe?(listener: () => void): () => void;
  invalidate(): void;
}

