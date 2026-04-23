# Changelog

## [1.8.0] - 2026-04-23

Bulk catch-up to the Python SDK master (v1.8.0). Every resource and
type the Python SDK exposes is now on the TypeScript side.

### Added — new resources

- **`Configs`** (`client.configs`) — saved configs + `validate` /
  `estimateCost` / `estimateSize` / `compose` / `submitRaw` /
  `fromDescription` (Scale+) / `fromCompany` (Scale+).
- **`Credits`** (`client.credits`) — prepaid credit packs, balance,
  history.
- **`Sessions`** (`client.sessions`) — multi-period generation sessions.
- **`Scenarios`** (`client.scenarios`) — scenarios + templates + packs.
  Handles the DS 3.1 top-level `interventions` removal by folding into
  `generationConfig.scenarios.interventions` automatically.
- **`Notifications`** (`client.notifications`).
- **`Adversarial`** (`client.adversarial`, Enterprise).
- **`Ai`** (`client.ai`, Scale+) — dashboard co-pilot `chat()`.
- **`Fingerprint`** (`client.fingerprint`, Team+) — `.dsf` synthesis.
- **`Optimizer`** (`client.optimizer`, Scale+) — six
  `POST /v1/optimizer/*` wrappers.
- **`TemplatePacks`** (`client.templatePacks`, Team+) — CRUD +
  `validate` + `getCategory` / `upsertCategory` / `deleteCategory` +
  `enrichCategory` (Scale+) + `categories`.

### Added — Jobs gap-filling

- `generateConfig()` — config-object form of `POST /v1/generate`
- `analytics()`, `fraudSplit()`, `auditArtifacts()`
- `listFiles()` (with 404-retry for managed_blob index lag)
- `downloadArchive()` returning a `JobArchive` wrapper
- `downloadFile(path)` — single-file download
- `streamNdjsonUrl()` — constructs the Scale-tier NDJSON URL
- `tune()` — AI quality-tuner
- `wait()` and `waitForMany()` — terminal-state pollers

### Added — `JobArchive`

Handles both zip and managed_blob backends. Hand-rolled minimal zip
central-directory parser + `DecompressionStream("deflate-raw")` for
method 8; lazy `fetch()` for managed_blob. API:

- `files()`, `find(pattern)`, `categories()`, `read()`, `text()`,
  `json()`, `size()`, `url()`, `ttlSeconds()`
- `auditOpinions()`, `keyAuditMatters()` (DS 3.1+)
- `sapTables()`, `sapTable(name)` (DS 4.3+)
- `saftFile(jurisdiction)` (DS 4.3.1+; root first, legacy nested fallback)
- `coaMeta()` (DS 4.4.1+)

### Added — types

~500 lines of new interfaces covering every v1.6–v1.8 payload. Plus
`SAP_DEFAULT_TABLES` / `SAP_ALL_TABLES` constants and
`SapDialect` / `SaftJurisdiction` string-literal unions.

### Added — examples

- `examples/sap_export.ts` — generate → parse BKPF/BSEG → FK check
- `examples/saft_export.ts` — PT SAF-T with company metadata

## [0.1.0] - 2026-04-10

Initial release.
