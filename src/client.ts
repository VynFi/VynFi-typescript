import {
  VynFiError,
  AuthenticationError,
  InsufficientCreditsError,
  NotFoundError,
  ConflictError,
  ValidationError,
  RateLimitError,
  ServerError,
  type ErrorBody,
} from "./errors.js";

export interface VynFiClientOptions {
  /** API key (required). */
  apiKey: string;
  /** Base URL (default: "https://api.vynfi.com"). */
  baseUrl?: string;
  /** Request timeout in milliseconds (default: 30000). */
  timeout?: number;
  /** Maximum retries on 429/5xx (default: 2). */
  maxRetries?: number;
}

// ---------------------------------------------------------------------------
// Case conversion helpers
// ---------------------------------------------------------------------------

function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

function convertKeys(obj: unknown, converter: (s: string) => string): unknown {
  if (obj === null || obj === undefined || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map((item) => convertKeys(item, converter));
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    result[converter(key)] = convertKeys(value, converter);
  }
  return result;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

export class VynFiClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor(options: VynFiClientOptions) {
    if (!options.apiKey) {
      throw new VynFiError("API key is required", 0);
    }
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? "https://api.vynfi.com").replace(/\/+$/, "");
    this.timeout = options.timeout ?? 30_000;
    this.maxRetries = options.maxRetries ?? 2;
  }

  /** Build a full URL for the given path. */
  url(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  /** Make a JSON API request with automatic retry and error handling. */
  async request<T>(method: string, path: string, options?: {
    body?: unknown;
    query?: Record<string, string>;
  }): Promise<T> {
    let url = this.url(path);
    if (options?.query) {
      const params = new URLSearchParams(options.query);
      url += `?${params.toString()}`;
    }

    const headers: Record<string, string> = {
      "Authorization": `Bearer ${this.apiKey}`,
      "User-Agent": "vynfi-typescript/0.1.0",
      "Accept": "application/json",
    };

    let fetchBody: string | undefined;
    if (options?.body) {
      headers["Content-Type"] = "application/json";
      // Pass body through verbatim — server accepts camelCase aliases on
      // most fields; some paths (e.g. `exportFormat: "sap"`) only fire
      // under camelCase. Matches the Python SDK's pass-through semantics.
      fetchBody = JSON.stringify(options.body);
    }

    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0 && lastError) {
        // Exponential backoff
        const delay = Math.min(1000 * 2 ** (attempt - 1), 10_000);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeout);

      try {
        const response = await fetch(url, {
          method,
          headers,
          body: fetchBody,
          signal: controller.signal,
        });

        clearTimeout(timer);

        if (response.ok) {
          const text = await response.text();
          if (!text) return undefined as T;
          const json = JSON.parse(text);
          return convertKeys(json, toCamelCase) as T;
        }

        // Parse error body
        let errorBody: ErrorBody | undefined;
        try {
          const errorJson = await response.json();
          errorBody = convertKeys(errorJson, toCamelCase) as ErrorBody;
        } catch {
          // ignore parse errors
        }

        // Retryable?
        if ((response.status === 429 || response.status >= 500) && attempt < this.maxRetries) {
          const retryAfter = response.headers.get("retry-after");
          if (retryAfter) {
            const seconds = parseInt(retryAfter, 10);
            if (!isNaN(seconds)) {
              await new Promise((resolve) => setTimeout(resolve, seconds * 1000));
            }
          }
          lastError = this.mapError(response.status, errorBody);
          continue;
        }

        throw this.mapError(response.status, errorBody);
      } catch (err) {
        clearTimeout(timer);
        if (err instanceof VynFiError) throw err;
        if (err instanceof DOMException && err.name === "AbortError") {
          lastError = new VynFiError("Request timed out", 0);
          if (attempt < this.maxRetries) continue;
          throw lastError;
        }
        throw new VynFiError(
          err instanceof Error ? err.message : "Unknown error",
          0
        );
      }
    }

    throw lastError ?? new VynFiError("Max retries exceeded", 0);
  }

  /** Make a raw request (for binary downloads). */
  async requestRaw(method: string, path: string): Promise<ArrayBuffer> {
    const headers: Record<string, string> = {
      "Authorization": `Bearer ${this.apiKey}`,
      "User-Agent": "vynfi-typescript/0.1.0",
    };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.url(path), {
        method,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!response.ok) {
        let errorBody: ErrorBody | undefined;
        try {
          errorBody = await response.json();
        } catch {
          // ignore
        }
        throw this.mapError(response.status, errorBody);
      }

      return await response.arrayBuffer();
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof VynFiError) throw err;
      throw new VynFiError(
        err instanceof Error ? err.message : "Unknown error",
        0
      );
    }
  }

  /** Extract a list from a `{ data: [...] }` wrapper. */
  async requestList<T>(method: string, path: string, options?: {
    query?: Record<string, string>;
  }): Promise<T[]> {
    const result = await this.request<any>(method, path, options);
    if (Array.isArray(result)) return result;
    if (result && typeof result === "object") {
      if (Array.isArray(result.data)) return result.data;
      // First array value in the object
      for (const value of Object.values(result)) {
        if (Array.isArray(value)) return value as T[];
      }
    }
    return [];
  }

  private mapError(status: number, body?: ErrorBody): VynFiError {
    switch (status) {
      case 401: return new AuthenticationError(body);
      case 402: return new InsufficientCreditsError(body);
      case 404: return new NotFoundError(body);
      case 409: return new ConflictError(body);
      case 422: return new ValidationError(body);
      case 429: return new RateLimitError(body);
      default:
        if (status >= 500) return new ServerError(status, body);
        return new VynFiError(body?.error ?? `HTTP ${status}`, status, body);
    }
  }
}
