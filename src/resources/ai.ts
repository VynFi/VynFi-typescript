import type { VynFiClient } from "../client.js";
import type { AiChatResponse } from "../types.js";

export class Ai {
  constructor(private readonly client: VynFiClient) {}

  async chat(message: string, page?: string): Promise<AiChatResponse> {
    const body: Record<string, unknown> = { message };
    if (page) body.page = page;
    return this.client.request("POST", "/v1/ai/chat", { body });
  }
}
