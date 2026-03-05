# VynFi TypeScript SDK

Official TypeScript/JavaScript client for the [VynFi](https://vynfi.com) synthetic financial data API.

## Installation

```bash
npm install vynfi
```

## Quick Start

```typescript
import { VynFi } from "vynfi";

const client = new VynFi("vf_live_...");

// Generate synthetic data
const job = await client.jobs.generate({
  tables: [{ name: "transactions", rows: 1000 }],
  sectorSlug: "banking",
});
console.log(`Job submitted: ${job.id}`);

// Browse catalog
const sectors = await client.catalog.listSectors();
for (const s of sectors) {
  console.log(`${s.slug}: ${s.name}`);
}

// Check usage
const usage = await client.usage.summary();
console.log(`Balance: ${usage.balance} credits`);
```

## Resources

| Resource | Methods |
|----------|---------|
| `client.jobs` | `generate`, `generateQuick`, `list`, `get`, `cancel`, `download`, `streamUrl` |
| `client.catalog` | `listSectors`, `getSector`, `list`, `getFingerprint` |
| `client.usage` | `summary`, `daily` |
| `client.apiKeys` | `create`, `list`, `get`, `update`, `revoke` |
| `client.quality` | `scores`, `timeline` |
| `client.webhooks` | `create`, `list`, `get`, `update`, `delete`, `test` |
| `client.billing` | `subscription`, `invoices`, `paymentMethod` |

All methods return Promises.

## Error Handling

```typescript
import { NotFoundError, RateLimitError, VynFiError } from "vynfi";

try {
  const job = await client.jobs.get("bad-id");
} catch (err) {
  if (err instanceof NotFoundError) {
    console.log("Job not found");
  } else if (err instanceof RateLimitError) {
    console.log("Rate limited, retry later");
  } else if (err instanceof VynFiError) {
    console.log(`API error: ${err.message} (HTTP ${err.statusCode})`);
  }
}
```

## Configuration

```typescript
const client = new VynFi({
  apiKey: "vf_live_...",
  baseUrl: "https://api.vynfi.com", // default
  maxRetries: 2, // default, retries on 429/5xx
  timeout: 30_000, // default, in milliseconds
});
```

Or pass just the API key string:

```typescript
const client = new VynFi("vf_live_...");
```

## Requirements

- Node.js 18+ (uses built-in `fetch`)
- TypeScript 5.0+ (for type definitions)

## License

Apache-2.0
