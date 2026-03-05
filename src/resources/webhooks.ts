import type { VynFiClient } from "../client.js";
import type {
  Webhook,
  WebhookCreated,
  CreateWebhookRequest,
  UpdateWebhookRequest,
} from "../types.js";

export class Webhooks {
  constructor(private readonly client: VynFiClient) {}

  /** Create a new webhook endpoint. */
  async create(req: CreateWebhookRequest): Promise<WebhookCreated> {
    return this.client.request("POST", "/v1/webhooks", { body: req });
  }

  /** List all webhooks. */
  async list(): Promise<Webhook[]> {
    return this.client.requestList("GET", "/v1/webhooks");
  }

  /** Get a single webhook by ID. */
  async get(webhookId: string): Promise<Webhook> {
    return this.client.request("GET", `/v1/webhooks/${webhookId}`);
  }

  /** Update a webhook's URL, events, or status. */
  async update(
    webhookId: string,
    req: UpdateWebhookRequest
  ): Promise<Webhook> {
    return this.client.request("PATCH", `/v1/webhooks/${webhookId}`, {
      body: req,
    });
  }

  /** Delete a webhook. */
  async delete(webhookId: string): Promise<void> {
    await this.client.request("DELETE", `/v1/webhooks/${webhookId}`);
  }

  /** Send a test event to a webhook endpoint. */
  async test(webhookId: string): Promise<unknown> {
    return this.client.request("POST", `/v1/webhooks/${webhookId}/test`);
  }
}
