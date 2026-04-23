import type { VynFiClient } from "../client.js";
import { NotFoundError } from "../errors.js";
import type {
  AiTuneResponse,
  AuditArtifacts,
  CancelJobResponse,
  FraudSplit,
  GenerateRequest,
  Job,
  JobAnalytics,
  JobFileList,
  JobList,
  ListJobsParams,
  NdjsonStreamParams,
  SubmitJobResponse,
} from "../types.js";
import { JobArchive } from "../archive.js";

export interface GenerateConfigRequest {
  config: Record<string, unknown>;
  configId?: string;
}

export interface WaitOptions {
  pollIntervalMs?: number;
  timeoutMs?: number;
}

export interface TuneRequest {
  targetScores?: Record<string, unknown>;
  maxIterations?: number;
}

const TERMINAL = ["completed", "failed", "cancelled"];

export class Jobs {
  constructor(private readonly client: VynFiClient) {}

  /** Submit an asynchronous generation job (legacy tables format). */
  async generate(req: GenerateRequest): Promise<SubmitJobResponse> {
    return this.client.request("POST", "/v1/generate", { body: req });
  }

  /** Submit an asynchronous generation job using a config object. */
  async generateConfig(req: GenerateConfigRequest): Promise<SubmitJobResponse> {
    return this.client.request("POST", "/v1/generate", { body: req });
  }

  /** Submit a synchronous ("quick") generation job. Max 10,000 rows / 30s. */
  async generateQuick(req: GenerateRequest): Promise<Job> {
    return this.client.request("POST", "/v1/generate/quick", { body: req });
  }

  async list(params?: ListJobsParams): Promise<JobList> {
    const query: Record<string, string> = {};
    if (params?.limit !== undefined) query.limit = String(params.limit);
    if (params?.status) query.status = params.status;
    if (params?.after) query.after = params.after;
    if (params?.before) query.before = params.before;
    const raw = await this.client.request<any>("GET", "/v1/jobs", { query });
    return {
      jobs: raw.data ?? raw.jobs ?? [],
      hasMore: raw.hasMore ?? false,
      nextCursor: raw.nextCursor ?? undefined,
    };
  }

  async get(jobId: string): Promise<Job> {
    return this.client.request("GET", `/v1/jobs/${jobId}`);
  }

  async cancel(jobId: string): Promise<CancelJobResponse> {
    return this.client.request("DELETE", `/v1/jobs/${jobId}`);
  }

  /** Download the full job archive as raw bytes. */
  async download(jobId: string): Promise<ArrayBuffer> {
    return this.client.requestRaw("GET", `/v1/jobs/${jobId}/download`);
  }

  /** Download a single file out of the archive. */
  async downloadFile(jobId: string, file: string): Promise<ArrayBuffer> {
    return this.client.requestRaw("GET", `/v1/jobs/${jobId}/download/${file}`);
  }

  /** Download the full archive and return a [`JobArchive`] wrapper. */
  async downloadArchive(jobId: string): Promise<JobArchive> {
    const buf = await this.download(jobId);
    return JobArchive.fromBytes(new Uint8Array(buf));
  }

  /** List archive files with per-file size + schema metadata. Retries on 404. */
  async listFiles(jobId: string): Promise<JobFileList> {
    const delays = [0, 1500, 3000];
    let lastError: unknown;
    for (const delay of delays) {
      if (delay > 0) await new Promise((r) => setTimeout(r, delay));
      try {
        return await this.client.request<JobFileList>("GET", `/v1/jobs/${jobId}/files`);
      } catch (err) {
        if (err instanceof NotFoundError) {
          lastError = err;
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  }

  /** Pre-built job analytics (Benford, amount distribution, variants, banking). */
  async analytics(jobId: string): Promise<JobAnalytics> {
    return this.client.request("GET", `/v1/jobs/${jobId}/analytics`);
  }

  /** Scheme-vs-direct fraud origin split (DS 3.1.1+). */
  async fraudSplit(jobId: string): Promise<FraudSplit> {
    return this.client.request("GET", `/v1/jobs/${jobId}/fraud-split`);
  }

  /** Aggregated audit + anomaly artifacts (API 4.1+). */
  async auditArtifacts(jobId: string): Promise<AuditArtifacts> {
    return this.client.request("GET", `/v1/jobs/${jobId}/audit-artifacts`);
  }

  /** AI config tuner (Scale+, DS 3.0+). */
  async tune(jobId: string, req?: TuneRequest): Promise<AiTuneResponse> {
    return this.client.request("POST", `/v1/jobs/${jobId}/tune`, { body: req ?? {} });
  }

  /** Build the SSE stream URL for `EventSource`. */
  streamUrl(jobId: string): string {
    return this.client.url(`/v1/jobs/${jobId}/stream`);
  }

  /** Build the NDJSON stream URL. Use `fetch` + `ReadableStream` to consume. */
  streamNdjsonUrl(jobId: string, params?: NdjsonStreamParams): string {
    const query: string[] = [];
    if (params?.rate !== undefined) query.push(`rate=${params.rate}`);
    if (params?.burst !== undefined) query.push(`burst=${params.burst}`);
    if (params?.progressInterval !== undefined)
      query.push(`progress_interval=${params.progressInterval}`);
    if (params?.file) query.push(`file=${encodeURIComponent(params.file)}`);
    const qs = query.length ? `?${query.join("&")}` : "";
    return this.client.url(`/v1/jobs/${jobId}/stream/ndjson${qs}`);
  }

  /** Poll until the job reaches a terminal state. */
  async wait(jobId: string, opts?: WaitOptions): Promise<Job> {
    const pollMs = opts?.pollIntervalMs ?? 2000;
    const deadline = Date.now() + (opts?.timeoutMs ?? 300_000);
    while (true) {
      const job = await this.get(jobId);
      if (TERMINAL.includes(job.status)) return job;
      if (Date.now() >= deadline) return job;
      await new Promise((r) => setTimeout(r, pollMs));
    }
  }

  /** Poll until every job in `jobIds` reaches a terminal state. */
  async waitForMany(jobIds: string[], opts?: WaitOptions): Promise<Job[]> {
    const pollMs = opts?.pollIntervalMs ?? 2000;
    const deadline = Date.now() + (opts?.timeoutMs ?? 600_000);
    const results = new Map<string, Job>();
    let pending = [...jobIds];
    while (pending.length > 0 && Date.now() < deadline) {
      const stillPending: string[] = [];
      for (const jid of pending) {
        try {
          const job = await this.get(jid);
          results.set(jid, job);
          if (!TERMINAL.includes(job.status)) stillPending.push(jid);
        } catch {
          stillPending.push(jid);
        }
      }
      pending = stillPending;
      if (pending.length > 0) await new Promise((r) => setTimeout(r, pollMs));
    }
    // Best-effort final capture.
    for (const jid of pending) {
      if (!results.has(jid)) {
        try {
          results.set(jid, await this.get(jid));
        } catch {
          /* ignore */
        }
      }
    }
    return jobIds.flatMap((j) => {
      const r = results.get(j);
      return r ? [r] : [];
    });
  }
}
