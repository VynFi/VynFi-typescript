import type { VynFiClient } from "../client.js";
import type {
  SectorSummary,
  Sector,
  CatalogItem,
  Fingerprint,
} from "../types.js";

export class Catalog {
  constructor(private readonly client: VynFiClient) {}

  /** List all available sectors (summary only). */
  async listSectors(): Promise<SectorSummary[]> {
    return this.client.requestList("GET", "/v1/catalog/sectors");
  }

  /** Get full details for a sector, including tables and columns. */
  async getSector(slug: string): Promise<Sector> {
    return this.client.request("GET", `/v1/catalog/sectors/${slug}`);
  }

  /** List all catalog items across every sector. */
  async list(): Promise<CatalogItem[]> {
    return this.client.requestList("GET", "/v1/catalog");
  }

  /** Get a fingerprint definition by sector and profile name. */
  async getFingerprint(sector: string, profile: string): Promise<Fingerprint> {
    return this.client.request(
      "GET",
      `/v1/catalog/sectors/${sector}/fingerprints/${profile}`
    );
  }
}
