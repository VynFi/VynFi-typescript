// ---------------------------------------------------------------------------
// Jobs
// ---------------------------------------------------------------------------

export interface JobLinks {
  self: string;
  stream: string;
  cancel: string;
  download: string;
}

export interface JobProgress {
  percent: number;
  rowsGenerated: number;
  rowsTotal: number;
}

export interface Job {
  id: string;
  status: string;
  tables?: unknown;
  format: string;
  creditsReserved?: number;
  creditsUsed?: number;
  sectorSlug: string;
  progress?: JobProgress;
  outputPath?: string;
  error?: string;
  createdAt?: string;
  completedAt?: string;
}

export interface SubmitJobResponse {
  id: string;
  status: string;
  creditsReserved: number;
  estimatedDurationSeconds: number;
  links?: JobLinks;
}

export interface JobList {
  jobs: Job[];
  hasMore: boolean;
  nextCursor?: string;
}

export interface TableSpec {
  name: string;
  rows: number;
}

export interface GenerateRequest {
  tables: TableSpec[];
  format?: string;
  sectorSlug: string;
}

export interface ListJobsParams {
  limit?: number;
  status?: string;
  after?: string;
  before?: string;
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

export interface Column {
  name: string;
  dataType: string;
  description: string;
  nullable: boolean;
}

export interface TableDef {
  name: string;
  description: string;
  baseRate: number;
  columns: Column[];
}

export interface Sector {
  slug: string;
  name: string;
  description: string;
  icon: string;
  multiplier: number;
  qualityScore: number;
  popularity: number;
  tables: TableDef[];
}

export interface SectorSummary {
  slug: string;
  name: string;
  description: string;
  icon: string;
  tableCount: number;
}

export interface CatalogItem {
  sector: string;
  profile: string;
  name: string;
  description: string;
  source: string;
}

export interface Fingerprint {
  sector: string;
  profile: string;
  name: string;
  description: string;
  source: string;
  columns: Column[];
}

// ---------------------------------------------------------------------------
// Usage
// ---------------------------------------------------------------------------

export interface UsageSummary {
  balance: number;
  totalUsed: number;
  totalReserved: number;
  totalRefunded: number;
  burnRate: number;
  periodDays: number;
}

export interface DailyUsage {
  date: string;
  credits: number;
}

export interface DailyUsageResponse {
  daily: DailyUsage[];
  byTable: Record<string, number>;
}

// ---------------------------------------------------------------------------
// API Keys
// ---------------------------------------------------------------------------

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  status: string;
  lastUsedAt?: string;
  expiresAt?: string;
  createdAt?: string;
}

export interface ApiKeyCreated {
  id: string;
  name: string;
  key: string;
  prefix: string;
  scopes: string[];
  expiresAt?: string;
  createdAt?: string;
}

export interface CreateApiKeyRequest {
  name: string;
  scopes?: string[];
  expiresInDays?: number;
}

export interface UpdateApiKeyRequest {
  name?: string;
  scopes?: string[];
}

// ---------------------------------------------------------------------------
// Quality
// ---------------------------------------------------------------------------

export interface QualityScore {
  id: string;
  jobId: string;
  tableType: string;
  rows: number;
  overallScore: number;
  benfordScore: number;
  correlationScore: number;
  distributionScore: number;
  createdAt?: string;
}

export interface DailyQuality {
  date: string;
  score: number;
}

// ---------------------------------------------------------------------------
// Webhooks
// ---------------------------------------------------------------------------

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  status: string;
  secret?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WebhookCreated {
  id: string;
  url: string;
  events: string[];
  secret: string;
  createdAt?: string;
}

export interface CreateWebhookRequest {
  url: string;
  events: string[];
}

export interface UpdateWebhookRequest {
  url?: string;
  events?: string[];
  status?: string;
}

// ---------------------------------------------------------------------------
// Billing
// ---------------------------------------------------------------------------

export interface Subscription {
  tier: string;
  status: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
}

export interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt?: string;
  pdfUrl?: string;
}

export interface PaymentMethod {
  type: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}
