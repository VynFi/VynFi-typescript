import type { VynFiClient } from "../client.js";
import type {
  DeletedResponse,
  TemplatePack,
  TemplatePackCategoryContent,
  TemplatePackCategorySummary,
  TemplatePackEnrichResponse,
  TemplatePackList,
  TemplatePackValidation,
} from "../types.js";

export interface CreatePackRequest {
  name: string;
  description?: string;
  mergeStrategy?: string;
}

export interface UpdatePackRequest {
  name?: string;
  description?: string;
  mergeStrategy?: string;
}

export interface EnrichCategoryRequest {
  category: string;
  industry?: string;
  region?: string;
  subCategory?: string;
  count?: number;
  model?: string;
  seed?: number;
  targetPackCategory?: string;
}

export class TemplatePacks {
  constructor(private readonly client: VynFiClient) {}

  async list(): Promise<TemplatePackList> {
    return this.client.request("GET", "/v1/template-packs");
  }

  async create(req: CreatePackRequest): Promise<TemplatePack> {
    return this.client.request("POST", "/v1/template-packs", { body: req });
  }

  async categories(): Promise<string[]> {
    const raw = await this.client.request<string[] | { data?: string[] }>(
      "GET",
      "/v1/template-packs/categories",
    );
    if (Array.isArray(raw)) return raw;
    return raw?.data ?? [];
  }

  async get(packId: string): Promise<TemplatePack> {
    return this.client.request("GET", `/v1/template-packs/${packId}`);
  }

  async update(packId: string, req: UpdatePackRequest): Promise<TemplatePack> {
    return this.client.request("PUT", `/v1/template-packs/${packId}`, { body: req });
  }

  async delete(packId: string): Promise<DeletedResponse> {
    const data = await this.client.request<DeletedResponse | null>(
      "DELETE",
      `/v1/template-packs/${packId}`,
    );
    return data ?? { deleted: true };
  }

  async validate(packId: string): Promise<TemplatePackValidation> {
    return this.client.request("POST", `/v1/template-packs/${packId}/validate`);
  }

  async getCategory(packId: string, category: string): Promise<TemplatePackCategoryContent> {
    return this.client.request("GET", `/v1/template-packs/${packId}/categories/${category}`);
  }

  async upsertCategory(
    packId: string,
    category: string,
    contentYaml: string,
  ): Promise<TemplatePackCategorySummary> {
    return this.client.request("PUT", `/v1/template-packs/${packId}/categories/${category}`, {
      body: { contentYaml },
    });
  }

  async deleteCategory(packId: string, category: string): Promise<DeletedResponse> {
    const data = await this.client.request<DeletedResponse | null>(
      "DELETE",
      `/v1/template-packs/${packId}/categories/${category}`,
    );
    return data ?? { deleted: true };
  }

  async enrichCategory(packId: string, req: EnrichCategoryRequest): Promise<TemplatePackEnrichResponse> {
    return this.client.request("POST", `/v1/template-packs/${packId}/enrich`, { body: req });
  }
}
