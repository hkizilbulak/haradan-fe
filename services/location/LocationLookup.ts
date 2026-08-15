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
  invalidate(): void;
}
