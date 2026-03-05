import { VynFiClient, type VynFiClientOptions } from "./client.js";
import { Jobs } from "./resources/jobs.js";
import { Catalog } from "./resources/catalog.js";
import { Usage } from "./resources/usage.js";
import { ApiKeys } from "./resources/api-keys.js";
import { Quality } from "./resources/quality.js";
import { Webhooks } from "./resources/webhooks.js";
import { Billing } from "./resources/billing.js";

export class VynFi {
  private readonly client: VynFiClient;

  /** Jobs resource — submit, list, get, cancel, and download generation jobs. */
  public readonly jobs: Jobs;
  /** Catalog resource — list sectors, tables, and fingerprints. */
  public readonly catalog: Catalog;
  /** Usage resource — credit balance and daily usage breakdown. */
  public readonly usage: Usage;
  /** API-key management resource. */
  public readonly apiKeys: ApiKeys;
  /** Quality metrics resource. */
  public readonly quality: Quality;
  /** Webhooks resource — CRUD and delivery history. */
  public readonly webhooks: Webhooks;
  /** Billing resource — subscription, invoices, payment methods. */
  public readonly billing: Billing;

  constructor(options: VynFiClientOptions);
  constructor(apiKey: string);
  constructor(optionsOrKey: VynFiClientOptions | string) {
    const options =
      typeof optionsOrKey === "string"
        ? { apiKey: optionsOrKey }
        : optionsOrKey;

    this.client = new VynFiClient(options);
    this.jobs = new Jobs(this.client);
    this.catalog = new Catalog(this.client);
    this.usage = new Usage(this.client);
    this.apiKeys = new ApiKeys(this.client);
    this.quality = new Quality(this.client);
    this.webhooks = new Webhooks(this.client);
    this.billing = new Billing(this.client);
  }
}

// Re-export everything
export { VynFiClient, type VynFiClientOptions } from "./client.js";
export * from "./types.js";
export * from "./errors.js";
export { Jobs } from "./resources/jobs.js";
export { Catalog } from "./resources/catalog.js";
export { Usage } from "./resources/usage.js";
export { ApiKeys } from "./resources/api-keys.js";
export { Quality } from "./resources/quality.js";
export { Webhooks } from "./resources/webhooks.js";
export { Billing } from "./resources/billing.js";
