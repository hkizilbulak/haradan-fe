import { HttpClient } from '@/services/http';
import type {
  DistrictOption,
  ILocationLookup,
  ProvinceOption,
} from './LocationLookup';

type Province = { id: string; name: string; sortOrder?: number };
type District = {
  id: string;
  provinceId: string;
  name: string;
  sortOrder?: number;
};

const CACHE_TTL_MS = 60 * 60 * 1000;

/** GEO-01 / GEO-03 — BE live catalog (Türkiye API materialized server-side). */
export class HttpLocationLookup implements ILocationLookup {
  private readonly http: HttpClient;
  private provinces: ProvinceOption[] | null = null;
  private provincesFetchedAt = 0;
  private readonly provinceNames = new Map<string, string>();
  private readonly districtNames = new Map<string, string>();
  private readonly districtsByProvince = new Map<string, DistrictOption[]>();

  constructor(baseUrl: string) {
    this.http = new HttpClient(baseUrl);
  }

  invalidate(): void {
    this.provinces = null;
    this.provincesFetchedAt = 0;
    this.districtsByProvince.clear();
  }

  getProvinceName(provinceId: string): string {
    return this.provinceNames.get(provinceId) ?? '';
  }

  getDistrictName(districtId: string): string {
    return this.districtNames.get(districtId) ?? '';
  }

  async listProvinces(): Promise<ProvinceOption[]> {
    if (
      this.provinces &&
      this.provinces.length > 0 &&
      Date.now() - this.provincesFetchedAt < CACHE_TTL_MS
    ) {
      return this.provinces;
    }
    const res = await this.http.request<{ items: Province[] }>('/v1/provinces', {
      method: 'GET',
    });
    const items = (res.items ?? []).map((p) => ({ id: p.id, name: p.name }));
    items.forEach((p) => this.provinceNames.set(p.id, p.name));
    if (items.length === 0) {
      this.provinces = null;
      this.provincesFetchedAt = 0;
      return items;
    }
    this.provinces = items;
    this.provincesFetchedAt = Date.now();
    return items;
  }

  async listDistricts(provinceId: string): Promise<DistrictOption[]> {
    const cached = this.districtsByProvince.get(provinceId);
    if (cached && cached.length > 0) return cached;
    const res = await this.http.request<{ items: District[] }>(
      `/v1/provinces/${encodeURIComponent(provinceId)}/districts`,
      { method: 'GET' }
    );
    const items = (res.items ?? []).map((d) => ({
      id: d.id,
      provinceId: d.provinceId,
      name: d.name,
    }));
    items.forEach((d) => this.districtNames.set(d.id, d.name));
    if (items.length > 0) {
      this.districtsByProvince.set(provinceId, items);
    }
    return items;
  }
}
