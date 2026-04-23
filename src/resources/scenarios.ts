import type { VynFiClient } from "../client.js";
import type {
  Scenario,
  ScenarioPack,
  ScenarioPackList,
  ScenarioTemplate,
} from "../types.js";

export interface CreateScenarioRequest {
  name: string;
  generationConfig: Record<string, unknown>;
  templateId?: string;
  /** Legacy field; SDK folds into generationConfig.scenarios.interventions. */
  interventions?: unknown[] | Record<string, unknown>;
}

export class Scenarios {
  constructor(private readonly client: VynFiClient) {}

  async list(): Promise<Scenario[]> {
    return this.client.requestList("GET", "/v1/scenarios");
  }

  async create(req: CreateScenarioRequest): Promise<Scenario> {
    // Backward-compat: fold legacy top-level interventions into
    // generationConfig.scenarios.interventions. DS 3.1+ rejects the
    // top-level field.
    let genConfig = { ...(req.generationConfig ?? {}) };
    if (req.interventions !== undefined) {
      const existing = (genConfig.scenarios as Record<string, unknown> | undefined) ?? {};
      genConfig = {
        ...genConfig,
        scenarios: {
          enabled: true,
          ...existing,
          interventions: req.interventions,
        },
      };
    }
    const body: Record<string, unknown> = {
      name: req.name,
      generationConfig: genConfig,
      templateId: req.templateId ?? "tpl_financial_process_17",
    };
    return this.client.request("POST", "/v1/scenarios", { body });
  }

  async run(scenarioId: string): Promise<Scenario> {
    return this.client.request("POST", `/v1/scenarios/${scenarioId}/run`);
  }

  async diff(scenarioId: string): Promise<Scenario> {
    return this.client.request("GET", `/v1/scenarios/${scenarioId}/diff`);
  }

  async templates(): Promise<ScenarioTemplate[]> {
    return this.client.requestList("GET", "/v1/scenarios/templates");
  }

  async packs(): Promise<ScenarioPack[]> {
    const raw = await this.client.request<ScenarioPack[] | ScenarioPackList>(
      "GET",
      "/v1/scenarios/packs",
    );
    if (Array.isArray(raw)) return raw;
    return raw.packs ?? [];
  }
}
