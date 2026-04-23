import type { VynFiClient } from "../client.js";
import type {
  CompanyConfigResponse,
  ComposeConfigResponse,
  DeletedResponse,
  EstimateCostResponse,
  EstimateSizeResponse,
  NlConfigResponse,
  RawConfigResponse,
  SavedConfig,
  ValidateConfigResponse,
} from "../types.js";

export interface CreateConfigRequest {
  name: string;
  config: Record<string, unknown>;
  description?: string;
  visibility?: string;
  tags?: string[];
  sourceTemplateId?: string;
}

export interface UpdateConfigRequest {
  name?: string;
  description?: string;
  config?: Record<string, unknown>;
  visibility?: string;
  tags?: string[];
}

export interface ListConfigsParams {
  limit?: number;
  offset?: number;
}

export interface FromCompanyRequest {
  uid?: string;
  name?: string;
  periods?: number;
  fraudRate?: number;
}

export class Configs {
  constructor(private readonly client: VynFiClient) {}

  async create(req: CreateConfigRequest): Promise<SavedConfig> {
    return this.client.request("POST", "/v1/configs", { body: req });
  }

  async list(params?: ListConfigsParams): Promise<SavedConfig[]> {
    const query: Record<string, string> = {};
    if (params?.limit !== undefined) query.limit = String(params.limit);
    if (params?.offset !== undefined) query.offset = String(params.offset);
    return this.client.requestList("GET", "/v1/configs", { query });
  }

  async get(configId: string): Promise<SavedConfig> {
    return this.client.request("GET", `/v1/configs/${configId}`);
  }

  async update(configId: string, req: UpdateConfigRequest): Promise<SavedConfig> {
    return this.client.request("PATCH", `/v1/configs/${configId}`, { body: req });
  }

  async delete(configId: string): Promise<DeletedResponse> {
    const data = await this.client.request<DeletedResponse | null>(
      "DELETE",
      `/v1/configs/${configId}`,
    );
    return data ?? { deleted: true };
  }

  async validate(config: Record<string, unknown>, opts?: { partial?: boolean; step?: string }): Promise<ValidateConfigResponse> {
    const body: Record<string, unknown> = { config };
    if (opts?.partial !== undefined) body.partial = opts.partial;
    if (opts?.step !== undefined) body.step = opts.step;
    return this.client.request("POST", "/v1/config/validate", { body });
  }

  async estimateCost(config: Record<string, unknown>): Promise<EstimateCostResponse> {
    return this.client.request("POST", "/v1/config/estimate-cost", { body: { config } });
  }

  async estimateSize(config: Record<string, unknown>): Promise<EstimateSizeResponse> {
    return this.client.request("POST", "/v1/configs/estimate-size", { body: { config } });
  }

  async compose(layers: Array<Record<string, unknown>>): Promise<ComposeConfigResponse> {
    return this.client.request("POST", "/v1/config/compose", { body: { layers } });
  }

  async submitRaw(yaml: string, name?: string): Promise<RawConfigResponse> {
    const body: Record<string, unknown> = { yaml };
    if (name) body.name = name;
    return this.client.request("POST", "/v1/configs/raw", { body });
  }

  /** Natural-language description → validated config (Scale+). */
  async fromDescription(description: string): Promise<NlConfigResponse> {
    return this.client.request("POST", "/v1/configs/from-description", {
      body: { description },
    });
  }

  /** Swiss VynCo company profile → config (Scale+). */
  async fromCompany(req: FromCompanyRequest): Promise<CompanyConfigResponse> {
    if (!req.uid && !req.name) {
      throw new Error("fromCompany() requires either uid or name");
    }
    return this.client.request("POST", "/v1/configs/from-company", { body: req });
  }
}
