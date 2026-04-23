import type { VynFiClient } from "../client.js";
import type { OptimizerResponse } from "../types.js";

export class Optimizer {
  constructor(private readonly client: VynFiClient) {}

  async riskScope(engagement: unknown, topN?: number): Promise<OptimizerResponse> {
    const body: Record<string, unknown> = { engagement };
    if (topN !== undefined) body.topN = topN;
    return this.client.request("POST", "/v1/optimizer/risk-scope", { body });
  }

  async portfolio(candidates: unknown, budgetHours: number): Promise<OptimizerResponse> {
    return this.client.request("POST", "/v1/optimizer/portfolio", {
      body: { candidates, budgetHours },
    });
  }

  async resources(schedule: unknown): Promise<OptimizerResponse> {
    return this.client.request("POST", "/v1/optimizer/resources", { body: { schedule } });
  }

  async conformance(trace: unknown, blueprint: unknown): Promise<OptimizerResponse> {
    return this.client.request("POST", "/v1/optimizer/conformance", {
      body: { trace, blueprint },
    });
  }

  async monteCarlo(
    engagement: unknown,
    opts?: { runs?: number; seed?: number },
  ): Promise<OptimizerResponse> {
    const body: Record<string, unknown> = { engagement };
    if (opts?.runs !== undefined) body.runs = opts.runs;
    if (opts?.seed !== undefined) body.seed = opts.seed;
    return this.client.request("POST", "/v1/optimizer/monte-carlo", { body });
  }

  async calibration(findings: unknown): Promise<OptimizerResponse> {
    return this.client.request("POST", "/v1/optimizer/calibration", { body: { findings } });
  }
}
