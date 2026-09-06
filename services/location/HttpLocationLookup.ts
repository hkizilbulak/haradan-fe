import { HttpClient } from '@/services/http';
import type {
  DistrictOption,
  ILocationLookup,
  ProvinceOption,
} from './LocationLookup';
import { StaticLocationLookup } from './StaticLocationLookup';

type Province = { id: string; name: string; sortOrder?: number };
type District = {
  id: string;
  provinceId: string;
  name: string;
  sortOrder?: number;
};

const CACHE_TTL_MS = 60 * 60 * 1000;

/** GEO-01 / GEO-03 — BE live catalog with static offline fallback and dynamic registration. */
export class HttpLocationLookup implements ILocationLookup {
  private readonly http: HttpClient;
  private readonly staticLookup: StaticLocationLookup;
  private provinces: ProvinceOption[] | null = null;
  private provincesFetchedAt = 0;
  private provincesInflight: Promise<ProvinceOption[]> | null = null;
  private readonly provinceNames = new Map<string, string>();
  private readonly districtNames = new Map<string, string>();
  private readonly districtsByProvince = new Map<string, DistrictOption[]>();
  private readonly districtsInflight = new Map<string, Promise<DistrictOption[]>>();
  private readonly listeners = new Set<() => void>();

  constructor(baseUrl: string) {
    this.http = new HttpClient(baseUrl);
    this.staticLookup = new StaticLocationLookup();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch {
        // ignore listener errors
      }
    });
  }

  registerProvince(provinceId: string, name: string): void {
    if (!provinceId || !name) return;
    const cleanId = provinceId.trim();
    const cleanName = name.trim();
    if (cleanId && cleanName) {
      this.provinceNames.set(cleanId, cleanName);
      this.provinceNames.set(cleanId.toLowerCase(), cleanName);
      this.staticLookup.registerProvince(cleanId, cleanName);
      this.notifyListeners();
    }
  }

  registerDistrict(districtId: string, name: string, provinceId?: string): void {
    if (!districtId || !name) return;
    const cleanId = districtId.trim();
    const cleanName = name.trim();
    if (cleanId && cleanName) {
      this.districtNames.set(cleanId, cleanName);
      this.districtNames.set(cleanId.toLowerCase(), cleanName);
      this.staticLookup.registerDistrict(cleanId, cleanName, provinceId);
      this.notifyListeners();
    }
  }

  getProvinceName(provinceId: string | null | undefined): string {
    if (!provinceId) return '';
    const key = String(provinceId).trim();
    if (!key) return '';

    if (this.provinceNames.has(key)) return this.provinceNames.get(key)!;
    if (this.provinceNames.has(key.toLowerCase())) return this.provinceNames.get(key.toLowerCase())!;

    return this.staticLookup.getProvinceName(key);
  }

  getDistrictName(districtId: string | null | undefined): string {
    if (!districtId) return '';
    const key = String(districtId).trim();
    if (!key) return '';

    if (this.districtNames.has(key)) return this.districtNames.get(key)!;
    if (this.districtNames.has(key.toLowerCase())) return this.districtNames.get(key.toLowerCase())!;

    return this.staticLookup.getDistrictName(key);
  }

  formatLocation(
    districtId?: string | null,
    provinceId?: string | null,
    districtName?: string | null,
    provinceName?: string | null
  ): string {
    if (provinceId && provinceName) {
      this.registerProvince(provinceId, provinceName);
    }
    if (districtId && districtName) {
      this.registerDistrict(districtId, districtName, provinceId ?? undefined);
    }

    const dist = (districtName && districtName.trim()) || this.getDistrictName(districtId);
    const prov = (provinceName && provinceName.trim()) || this.getProvinceName(provinceId);

    if (dist && prov) {
      if (dist.toLowerCase() === prov.toLowerCase()) return prov;
      return `${dist}, ${prov}`;
    }
    if (dist) return dist;
    if (prov) return prov;
    return '';
  }

  invalidate(): void {
    this.provinces = null;
    this.provincesFetchedAt = 0;
    this.provincesInflight = null;
    this.districtsByProvince.clear();
    this.districtsInflight.clear();
    this.staticLookup.invalidate();
  }

  async listProvinces(): Promise<ProvinceOption[]> {
    if (
      this.provinces &&
      this.provinces.length > 0 &&
      Date.now() - this.provincesFetchedAt < CACHE_TTL_MS
    ) {
      return this.provinces;
    }
    if (this.provincesInflight) {
      return this.provincesInflight;
    }
    this.provincesInflight = this.fetchProvinces().finally(() => {
      this.provincesInflight = null;
    });
    return this.provincesInflight;
  }

  private async fetchProvinces(): Promise<ProvinceOption[]> {
    try {
      const res = await this.http.request<{ items: Province[] }>('/v1/provinces', {
        method: 'GET',
      });
      const items = (res.items ?? []).map((p) => ({ id: p.id, name: p.name }));
      items.forEach((p) => {
        this.provinceNames.set(p.id, p.name);
        this.provinceNames.set(p.id.toLowerCase(), p.name);
        this.staticLookup.registerProvince(p.id, p.name);
      });
      this.provinces = items;
      this.provincesFetchedAt = Date.now();
      return items;
    } catch {
      return await this.staticLookup.listProvinces();
    }
  }

  resolveProvinceUuid(provinceId?: string | null): string | null {
    if (!provinceId) return null;
    const cleanId = String(provinceId).trim();
    if (!cleanId) return null;
    return this.staticLookup.resolveProvinceUuid(cleanId);
  }

  async listDistricts(provinceId: string): Promise<DistrictOption[]> {
    const cleanId = (provinceId || '').trim();
    if (!cleanId) return [];
    const targetProvinceId = this.resolveProvinceUuid(cleanId) || cleanId;
    const cached =
      this.districtsByProvince.get(targetProvinceId) ||
      this.districtsByProvince.get(cleanId);
    if (cached && cached.length > 0) return cached;
    const inflight =
      this.districtsInflight.get(targetProvinceId) ||
      this.districtsInflight.get(cleanId);
    if (inflight) return inflight;
    const promise = this.fetchDistricts(cleanId, targetProvinceId).finally(() => {
      this.districtsInflight.delete(targetProvinceId);
      this.districtsInflight.delete(cleanId);
    });
    this.districtsInflight.set(targetProvinceId, promise);
    this.districtsInflight.set(cleanId, promise);
    return promise;
  }

  private async fetchDistricts(cleanId: string, targetProvinceId: string): Promise<DistrictOption[]> {
    try {
      const res = await this.http.request<{ items: District[] }>(
        `/v1/provinces/${encodeURIComponent(targetProvinceId)}/districts`,
        { method: 'GET' }
      );
      const items = (res.items ?? []).map((d) => ({
        id: d.id,
        provinceId: d.provinceId,
        name: d.name,
      }));
      items.forEach((d) => {
        this.districtNames.set(d.id, d.name);
        this.districtNames.set(d.id.toLowerCase(), d.name);
        this.staticLookup.registerDistrict(d.id, d.name, d.provinceId);
      });
      this.notifyListeners();
      if (items.length > 0) {
        this.districtsByProvince.set(targetProvinceId, items);
        this.districtsByProvince.set(cleanId, items);
        return items;
      }
      return await this.staticLookup.listDistricts(cleanId);
    } catch {
      return await this.staticLookup.listDistricts(cleanId);
    }
  }
}
