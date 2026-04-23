import type { VynFiClient } from "../client.js";
import type {
  PrepaidBalanceResponse,
  PrepaidHistoryResponse,
  PurchaseCreditsResponse,
} from "../types.js";

export class Credits {
  constructor(private readonly client: VynFiClient) {}

  async purchase(packSlug: string): Promise<PurchaseCreditsResponse> {
    return this.client.request("POST", "/v1/credits/purchase", { body: { packSlug } });
  }

  async balance(): Promise<PrepaidBalanceResponse> {
    return this.client.request("GET", "/v1/credits/balance");
  }

  async history(): Promise<PrepaidHistoryResponse> {
    return this.client.request("GET", "/v1/credits/history");
  }
}
