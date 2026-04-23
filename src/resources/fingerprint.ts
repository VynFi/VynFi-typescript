import type { VynFiClient } from "../client.js";
import type { FingerprintSynthesisResponse } from "../types.js";

export class Fingerprint {
  constructor(private readonly client: VynFiClient) {}

  async synthesize(body: Record<string, unknown>): Promise<FingerprintSynthesisResponse> {
    return this.client.request("POST", "/v1/fingerprint/synthesize", { body });
  }
}
