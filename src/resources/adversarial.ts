import type { VynFiClient } from "../client.js";
import type {
  AdversarialProbeResponse,
  AdversarialProbeResults,
} from "../types.js";

export class Adversarial {
  constructor(private readonly client: VynFiClient) {}

  async probe(body: Record<string, unknown>): Promise<AdversarialProbeResponse> {
    return this.client.request("POST", "/v1/adversarial/probe", { body });
  }

  async results(probeId: string): Promise<AdversarialProbeResults> {
    return this.client.request("GET", `/v1/adversarial/${probeId}/results`);
  }
}
