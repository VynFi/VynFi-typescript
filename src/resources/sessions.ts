import type { VynFiClient } from "../client.js";
import type {
  GenerateSessionResponse,
  GenerationSession,
} from "../types.js";

export interface CreateSessionRequest {
  name: string;
  fiscalYearStart?: string;
  periodLengthMonths?: number;
  periods: number;
  generationConfig: Record<string, unknown>;
}

export class Sessions {
  constructor(private readonly client: VynFiClient) {}

  async create(req: CreateSessionRequest): Promise<GenerationSession> {
    return this.client.request("POST", "/v1/sessions", { body: req });
  }

  async list(): Promise<GenerationSession[]> {
    return this.client.requestList("GET", "/v1/sessions");
  }

  async extend(sessionId: string, additionalPeriods: number): Promise<GenerationSession> {
    return this.client.request("POST", `/v1/sessions/${sessionId}/extend`, {
      body: { additionalPeriods },
    });
  }

  async generateNext(sessionId: string): Promise<GenerateSessionResponse> {
    return this.client.request("POST", `/v1/sessions/${sessionId}/generate`);
  }
}
