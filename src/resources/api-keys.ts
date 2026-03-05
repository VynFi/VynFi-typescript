import type { VynFiClient } from "../client.js";
import type {
  ApiKey,
  ApiKeyCreated,
  CreateApiKeyRequest,
  UpdateApiKeyRequest,
} from "../types.js";

export class ApiKeys {
  constructor(private readonly client: VynFiClient) {}

  /** Create a new API key. */
  async create(req: CreateApiKeyRequest): Promise<ApiKeyCreated> {
    return this.client.request("POST", "/v1/api-keys", { body: req });
  }

  /** List all API keys for the authenticated user. */
  async list(): Promise<ApiKey[]> {
    return this.client.requestList("GET", "/v1/api-keys");
  }

  /** Get a single API key by ID. */
  async get(keyId: string): Promise<ApiKey> {
    return this.client.request("GET", `/v1/api-keys/${keyId}`);
  }

  /** Update an API key's name or scopes. */
  async update(keyId: string, req: UpdateApiKeyRequest): Promise<ApiKey> {
    return this.client.request("PATCH", `/v1/api-keys/${keyId}`, { body: req });
  }

  /** Revoke (delete) an API key. */
  async revoke(keyId: string): Promise<void> {
    await this.client.request("DELETE", `/v1/api-keys/${keyId}`);
  }
}
