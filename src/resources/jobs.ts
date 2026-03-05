import type { VynFiClient } from "../client.js";
import type {
  Job,
  SubmitJobResponse,
  JobList,
  GenerateRequest,
  ListJobsParams,
} from "../types.js";

export class Jobs {
  constructor(private readonly client: VynFiClient) {}

  /** Submit an asynchronous generation job. */
  async generate(req: GenerateRequest): Promise<SubmitJobResponse> {
    return this.client.request("POST", "/v1/generate", { body: req });
  }

  /** Submit a synchronous ("quick") generation job. */
  async generateQuick(req: GenerateRequest): Promise<Job> {
    return this.client.request("POST", "/v1/generate/quick", { body: req });
  }

  /** List jobs with optional filtering and pagination. */
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

  /** Get a single job by ID. */
  async get(jobId: string): Promise<Job> {
    return this.client.request("GET", `/v1/jobs/${jobId}`);
  }

  /** Cancel a running job. */
  async cancel(jobId: string): Promise<Job> {
    return this.client.request("DELETE", `/v1/jobs/${jobId}`);
  }

  /** Download the output of a completed job as raw bytes. */
  async download(jobId: string): Promise<ArrayBuffer> {
    return this.client.requestRaw("GET", `/v1/jobs/${jobId}/download`);
  }

  /**
   * Open an SSE stream for real-time job progress.
   * Returns a ReadableStream of server-sent events.
   * Uses the built-in fetch streaming API.
   */
  streamUrl(jobId: string): string {
    return this.client.url(`/v1/jobs/${jobId}/stream`);
  }
}
