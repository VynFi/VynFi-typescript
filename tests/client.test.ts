import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { VynFi } from "../src/index.js";
import {
  VynFiError,
  AuthenticationError,
  NotFoundError,
  RateLimitError,
  ServerError,
  ValidationError,
  InsufficientCreditsError,
} from "../src/errors.js";

const BASE = "https://test-api.vynfi.com";

const server = setupServer();

beforeEach(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => {
  server.resetHandlers();
  server.close();
});

function client() {
  return new VynFi({ apiKey: "vf_test_abc123", baseUrl: BASE, maxRetries: 0 });
}

// ---------------------------------------------------------------------------
// Constructor
// ---------------------------------------------------------------------------

describe("constructor", () => {
  it("requires an API key", () => {
    expect(() => new VynFi({ apiKey: "" })).toThrow(VynFiError);
  });

  it("accepts a string shorthand", () => {
    const c = new VynFi("vf_test_key");
    expect(c).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Auth header
// ---------------------------------------------------------------------------

describe("authentication", () => {
  it("sends Bearer token", async () => {
    let captured = "";
    server.use(
      http.get(`${BASE}/v1/usage`, ({ request }) => {
        captured = request.headers.get("authorization") ?? "";
        return HttpResponse.json({ balance: 100, total_used: 0, total_reserved: 0, total_refunded: 0, burn_rate: 0, period_days: 30 });
      })
    );

    const c = client();
    await c.usage.summary();
    expect(captured).toBe("Bearer vf_test_abc123");
  });
});

// ---------------------------------------------------------------------------
// Error mapping
// ---------------------------------------------------------------------------

describe("error mapping", () => {
  it("throws NotFoundError on 404", async () => {
    server.use(
      http.get(`${BASE}/v1/jobs/bad`, () =>
        HttpResponse.json({ error: "Not found" }, { status: 404 })
      )
    );

    await expect(client().jobs.get("bad")).rejects.toThrow(NotFoundError);
  });

  it("throws AuthenticationError on 401", async () => {
    server.use(
      http.get(`${BASE}/v1/usage`, () =>
        HttpResponse.json({ error: "Unauthorized" }, { status: 401 })
      )
    );

    await expect(client().usage.summary()).rejects.toThrow(AuthenticationError);
  });

  it("throws InsufficientCreditsError on 402", async () => {
    server.use(
      http.post(`${BASE}/v1/generate`, () =>
        HttpResponse.json({ error: "Insufficient credits" }, { status: 402 })
      )
    );

    await expect(
      client().jobs.generate({ tables: [{ name: "t", rows: 1 }], sectorSlug: "retail" })
    ).rejects.toThrow(InsufficientCreditsError);
  });

  it("throws ValidationError on 422", async () => {
    server.use(
      http.post(`${BASE}/v1/generate`, () =>
        HttpResponse.json({ error: "Invalid" }, { status: 422 })
      )
    );

    await expect(
      client().jobs.generate({ tables: [], sectorSlug: "x" })
    ).rejects.toThrow(ValidationError);
  });

  it("throws RateLimitError on 429", async () => {
    server.use(
      http.get(`${BASE}/v1/usage`, () =>
        HttpResponse.json({ error: "Rate limited" }, { status: 429 })
      )
    );

    await expect(client().usage.summary()).rejects.toThrow(RateLimitError);
  });

  it("throws ServerError on 500", async () => {
    server.use(
      http.get(`${BASE}/v1/usage`, () =>
        HttpResponse.json({ error: "Internal error" }, { status: 500 })
      )
    );

    await expect(client().usage.summary()).rejects.toThrow(ServerError);
  });
});

// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

describe("jobs", () => {
  it("generate sends POST and returns job response", async () => {
    server.use(
      http.post(`${BASE}/v1/generate`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        // v1.8.0+ — body passed through verbatim (camelCase matches the
        // Python SDK's convention, which the server accepts via aliases).
        expect(body.sectorSlug).toBe("banking");
        return HttpResponse.json({
          id: "job_1",
          status: "queued",
          credits_reserved: 10,
          estimated_duration_seconds: 5,
        });
      })
    );

    const resp = await client().jobs.generate({
      tables: [{ name: "transactions", rows: 100 }],
      sectorSlug: "banking",
    });
    expect(resp.id).toBe("job_1");
    expect(resp.creditsReserved).toBe(10);
  });

  it("get returns a job", async () => {
    server.use(
      http.get(`${BASE}/v1/jobs/job_1`, () =>
        HttpResponse.json({
          id: "job_1",
          status: "completed",
          format: "json",
          sector_slug: "banking",
        })
      )
    );

    const job = await client().jobs.get("job_1");
    expect(job.id).toBe("job_1");
    expect(job.sectorSlug).toBe("banking");
  });

  it("list with params sends query string", async () => {
    let capturedUrl = "";
    server.use(
      http.get(`${BASE}/v1/jobs`, ({ request }) => {
        capturedUrl = request.url;
        return HttpResponse.json({
          data: [{ id: "j1", status: "completed", format: "json", sector_slug: "retail" }],
          has_more: false,
        });
      })
    );

    const result = await client().jobs.list({ limit: 5, status: "completed" });
    expect(capturedUrl).toContain("limit=5");
    expect(capturedUrl).toContain("status=completed");
    expect(result.jobs).toHaveLength(1);
  });

  it("cancel sends DELETE", async () => {
    server.use(
      http.delete(`${BASE}/v1/jobs/job_1`, () =>
        HttpResponse.json({
          id: "job_1",
          status: "cancelled",
          format: "json",
          sector_slug: "retail",
        })
      )
    );

    const job = await client().jobs.cancel("job_1");
    expect(job.status).toBe("cancelled");
  });
});

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

describe("catalog", () => {
  it("listSectors extracts data array", async () => {
    server.use(
      http.get(`${BASE}/v1/catalog/sectors`, () =>
        HttpResponse.json({
          data: [
            { slug: "banking", name: "Banking", description: "Bank data", icon: "bank", table_count: 5 },
          ],
        })
      )
    );

    const sectors = await client().catalog.listSectors();
    expect(sectors).toHaveLength(1);
    expect(sectors[0].slug).toBe("banking");
    expect(sectors[0].tableCount).toBe(5);
  });

  it("getSector returns full sector", async () => {
    server.use(
      http.get(`${BASE}/v1/catalog/sectors/banking`, () =>
        HttpResponse.json({
          slug: "banking",
          name: "Banking",
          description: "Bank data",
          icon: "bank",
          multiplier: 1.0,
          quality_score: 0.95,
          popularity: 100,
          tables: [],
        })
      )
    );

    const sector = await client().catalog.getSector("banking");
    expect(sector.qualityScore).toBe(0.95);
  });
});

// ---------------------------------------------------------------------------
// Usage
// ---------------------------------------------------------------------------

describe("usage", () => {
  it("summary returns usage data", async () => {
    server.use(
      http.get(`${BASE}/v1/usage`, () =>
        HttpResponse.json({
          balance: 5000,
          total_used: 1000,
          total_reserved: 200,
          total_refunded: 50,
          burn_rate: 33.3,
          period_days: 30,
        })
      )
    );

    const usage = await client().usage.summary();
    expect(usage.balance).toBe(5000);
    expect(usage.burnRate).toBe(33.3);
  });
});

// ---------------------------------------------------------------------------
// API Keys
// ---------------------------------------------------------------------------

describe("apiKeys", () => {
  it("create sends POST with body passed through verbatim (v1.8.0+)", async () => {
    server.use(
      http.post(`${BASE}/v1/api-keys`, async ({ request }) => {
        const body = (await request.json()) as Record<string, unknown>;
        expect(body.expiresInDays).toBe(90);
        return HttpResponse.json({
          id: "key_1",
          name: "Test Key",
          key: "vf_test_xxx",
          prefix: "vf_test_",
          scopes: ["read"],
        });
      })
    );

    const key = await client().apiKeys.create({
      name: "Test Key",
      scopes: ["read"],
      expiresInDays: 90,
    });
    expect(key.id).toBe("key_1");
    expect(key.key).toBe("vf_test_xxx");
  });
});

// ---------------------------------------------------------------------------
// Quality
// ---------------------------------------------------------------------------

describe("quality", () => {
  it("scores returns list", async () => {
    server.use(
      http.get(`${BASE}/v1/quality/scores`, () =>
        HttpResponse.json({
          data: [
            {
              id: "qs_1",
              job_id: "j1",
              table_type: "transactions",
              rows: 1000,
              overall_score: 0.92,
              benford_score: 0.88,
              correlation_score: 0.95,
              distribution_score: 0.93,
            },
          ],
        })
      )
    );

    const scores = await client().quality.scores();
    expect(scores).toHaveLength(1);
    expect(scores[0].overallScore).toBe(0.92);
  });
});

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

describe("webhooks", () => {
  it("create sends POST", async () => {
    server.use(
      http.post(`${BASE}/v1/webhooks`, () =>
        HttpResponse.json({
          id: "wh_1",
          url: "https://example.com/hook",
          events: ["job.completed"],
          secret: "whsec_xxx",
        })
      )
    );

    const wh = await client().webhooks.create({
      url: "https://example.com/hook",
      events: ["job.completed"],
    });
    expect(wh.id).toBe("wh_1");
    expect(wh.secret).toBe("whsec_xxx");
  });
});

// ---------------------------------------------------------------------------
// Billing
// ---------------------------------------------------------------------------

describe("billing", () => {
  it("subscription returns plan details", async () => {
    server.use(
      http.get(`${BASE}/v1/billing/subscription`, () =>
        HttpResponse.json({
          tier: "developer",
          status: "active",
          current_period_end: "2026-04-01T00:00:00Z",
          cancel_at_period_end: false,
        })
      )
    );

    const sub = await client().billing.subscription();
    expect(sub.tier).toBe("developer");
    expect(sub.cancelAtPeriodEnd).toBe(false);
  });

  it("invoices returns list", async () => {
    server.use(
      http.get(`${BASE}/v1/billing/invoices`, () =>
        HttpResponse.json({
          data: [
            { id: "inv_1", amount: 4900, currency: "usd", status: "paid" },
          ],
        })
      )
    );

    const invoices = await client().billing.invoices();
    expect(invoices).toHaveLength(1);
    expect(invoices[0].amount).toBe(4900);
  });
});
