import type { VynFiClient } from "../client.js";
import type { UsageSummary, DailyUsageResponse } from "../types.js";

export class Usage {
  constructor(private readonly client: VynFiClient) {}

  /** Get a summary of credit balance and usage statistics. */
  async summary(): Promise<UsageSummary> {
    return this.client.request("GET", "/v1/usage");
  }

  /** Get daily usage breakdown with per-table totals. */
  async daily(days?: number): Promise<DailyUsageResponse> {
    const query: Record<string, string> = {};
    if (days !== undefined) query.days = String(days);
    return this.client.request("GET", "/v1/usage/daily", { query });
  }
}
