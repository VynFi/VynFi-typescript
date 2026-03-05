import type { VynFiClient } from "../client.js";
import type { QualityScore, DailyQuality } from "../types.js";

export class Quality {
  constructor(private readonly client: VynFiClient) {}

  /** Get quality scores for all jobs. */
  async scores(): Promise<QualityScore[]> {
    return this.client.requestList("GET", "/v1/quality/scores");
  }

  /** Get a daily quality score timeline. */
  async timeline(days?: number): Promise<DailyQuality[]> {
    const query: Record<string, string> = {};
    if (days !== undefined) query.days = String(days);
    return this.client.requestList("GET", "/v1/quality/timeline", { query });
  }
}
