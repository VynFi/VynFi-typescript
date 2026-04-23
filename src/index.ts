import { VynFiClient, type VynFiClientOptions } from "./client.js";
import { Adversarial } from "./resources/adversarial.js";
import { Ai } from "./resources/ai.js";
import { ApiKeys } from "./resources/api-keys.js";
import { Billing } from "./resources/billing.js";
import { Catalog } from "./resources/catalog.js";
import { Configs } from "./resources/configs.js";
import { Credits } from "./resources/credits.js";
import { Fingerprint } from "./resources/fingerprint.js";
import { Jobs } from "./resources/jobs.js";
import { Notifications } from "./resources/notifications.js";
import { Optimizer } from "./resources/optimizer.js";
import { Quality } from "./resources/quality.js";
import { Scenarios } from "./resources/scenarios.js";
import { Sessions } from "./resources/sessions.js";
import { TemplatePacks } from "./resources/template-packs.js";
import { Usage } from "./resources/usage.js";
import { Webhooks } from "./resources/webhooks.js";

export class VynFi {
  private readonly client: VynFiClient;

  public readonly jobs: Jobs;
  public readonly catalog: Catalog;
  public readonly usage: Usage;
  public readonly apiKeys: ApiKeys;
  public readonly quality: Quality;
  public readonly webhooks: Webhooks;
  public readonly billing: Billing;
  public readonly configs: Configs;
  public readonly credits: Credits;
  public readonly sessions: Sessions;
  public readonly scenarios: Scenarios;
  public readonly notifications: Notifications;
  public readonly adversarial: Adversarial;
  public readonly ai: Ai;
  public readonly fingerprint: Fingerprint;
  public readonly optimizer: Optimizer;
  public readonly templatePacks: TemplatePacks;

  constructor(options: VynFiClientOptions);
  constructor(apiKey: string);
  constructor(optionsOrKey: VynFiClientOptions | string) {
    const options =
      typeof optionsOrKey === "string" ? { apiKey: optionsOrKey } : optionsOrKey;

    this.client = new VynFiClient(options);
    this.jobs = new Jobs(this.client);
    this.catalog = new Catalog(this.client);
    this.usage = new Usage(this.client);
    this.apiKeys = new ApiKeys(this.client);
    this.quality = new Quality(this.client);
    this.webhooks = new Webhooks(this.client);
    this.billing = new Billing(this.client);
    this.configs = new Configs(this.client);
    this.credits = new Credits(this.client);
    this.sessions = new Sessions(this.client);
    this.scenarios = new Scenarios(this.client);
    this.notifications = new Notifications(this.client);
    this.adversarial = new Adversarial(this.client);
    this.ai = new Ai(this.client);
    this.fingerprint = new Fingerprint(this.client);
    this.optimizer = new Optimizer(this.client);
    this.templatePacks = new TemplatePacks(this.client);
  }
}

// Re-export everything
export { VynFiClient, type VynFiClientOptions } from "./client.js";
export * from "./types.js";
export * from "./errors.js";
export { JobArchive } from "./archive.js";
export { Jobs } from "./resources/jobs.js";
export { Catalog } from "./resources/catalog.js";
export { Usage } from "./resources/usage.js";
export { ApiKeys } from "./resources/api-keys.js";
export { Quality } from "./resources/quality.js";
export { Webhooks } from "./resources/webhooks.js";
export { Billing } from "./resources/billing.js";
export { Configs } from "./resources/configs.js";
export { Credits } from "./resources/credits.js";
export { Sessions } from "./resources/sessions.js";
export { Scenarios } from "./resources/scenarios.js";
export { Notifications } from "./resources/notifications.js";
export { Adversarial } from "./resources/adversarial.js";
export { Ai } from "./resources/ai.js";
export { Fingerprint } from "./resources/fingerprint.js";
export { Optimizer } from "./resources/optimizer.js";
export { TemplatePacks } from "./resources/template-packs.js";
