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

// ---------------------------------------------------------------------------
// Configs
// ---------------------------------------------------------------------------

export interface SavedConfig {
  id: string;
  name: string;
  description?: string;
  config: Record<string, unknown>;
  visibility?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ValidationIssue {
  severity: string;
  message: string;
  path?: string;
}

export interface ValidationFix {
  message: string;
  patch: Record<string, unknown>;
}

export interface ValidateConfigResponse {
  valid: boolean;
  issues?: ValidationIssue[];
  fixes?: ValidationFix[];
}

export interface MultiplierEntry {
  source: string;
  multiplier: number;
}

export interface EstimateCostResponse {
  credits: number;
  multiplierEntries?: MultiplierEntry[];
  warnings?: string[];
}

export interface ComposeConfigResponse {
  config: Record<string, unknown>;
  warnings?: string[];
}

export interface SizeBucket {
  domain: string;
  bytes: number;
  files: number;
}

export interface EstimateSizeResponse {
  totalBytes: number;
  fileCount: number;
  tierQuotaBytes?: number;
  exceedsQuota?: boolean;
  byDomain?: SizeBucket[];
}

export interface RawConfigResponse {
  valid: boolean;
  configId?: string;
  issues?: unknown[];
  costEstimate?: unknown;
}

// ---------------------------------------------------------------------------
// NL config (Scale+)
// ---------------------------------------------------------------------------

export interface NlConfigResponse {
  config: Record<string, unknown>;
  yaml: string;
  confidence: number;
  notes: string;
}

export interface CompanyConfigResponse {
  company: Record<string, unknown>;
  config: Record<string, unknown>;
  yaml: string;
  notes: string;
}

// ---------------------------------------------------------------------------
// Credits
// ---------------------------------------------------------------------------

export interface PurchaseCreditsResponse {
  checkoutUrl: string;
}

export interface PrepaidBatch {
  id: string;
  amount: number;
  remaining: number;
  expiresAt?: string;
}

export interface PrepaidBalanceResponse {
  balance: number;
  batches: PrepaidBatch[];
}

export interface PrepaidHistoryResponse {
  batches: PrepaidBatch[];
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export interface GenerationSession {
  id: string;
  name: string;
  status: string;
  fiscalYearStart?: string;
  periodLengthMonths?: number;
  periods: number;
  periodsGenerated: number;
  generationConfig?: Record<string, unknown>;
}

export interface GenerateSessionResponse {
  sessionId: string;
  period: number;
  jobId: string;
}

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

export interface ScenarioTemplateNode {
  id: string;
  name: string;
  [k: string]: unknown;
}

export interface ScenarioTemplateEdge {
  from: string;
  to: string;
  [k: string]: unknown;
}

export interface ScenarioTemplate {
  id: string;
  name: string;
  description?: string;
  nodes?: ScenarioTemplateNode[];
  edges?: ScenarioTemplateEdge[];
}

export interface Scenario {
  id: string;
  name: string;
  status: string;
  templateId?: string;
  generationConfig?: Record<string, unknown>;
  baselineJobId?: string;
  counterfactualJobId?: string;
  diff?: unknown;
}

export interface ScenarioPack {
  name: string;
  description?: string;
  category?: string;
}

export interface ScenarioPackList {
  packs: ScenarioPack[];
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export interface Notification {
  id: string;
  userId?: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt?: string;
}

// ---------------------------------------------------------------------------
// Analytics (DS 2.3+)
// ---------------------------------------------------------------------------

export interface BenfordAnalysis {
  sampleSize: number;
  observedFrequencies?: number[];
  observedCounts?: number[];
  expectedFrequencies?: number[];
  chiSquared?: number;
  degreesOfFreedom?: number;
  pValue?: number;
  mad: number;
  conformity: string;
  passes: boolean;
  antiBenfordScore?: number;
}

export interface AmountDistributionAnalysis {
  sampleSize: number;
  mean: string;
  median: string;
  stdDev: string;
  min: string;
  max: string;
  percentile1?: string;
  percentile99?: string;
  skewness: number;
  kurtosis: number;
  roundNumberRatio?: number;
  niceNumberRatio?: number;
  passes: boolean;
}

export interface VariantAnalysis {
  variantCount: number;
  totalCases: number;
  variantEntropy: number;
  happyPathConcentration: number;
  passes: boolean;
  issues?: string[];
  reworkRate?: number;
  skippedStepRate?: number;
  outOfOrderRate?: number;
}

export interface TypologyDetection {
  name: string;
  transactionCount: number;
  caseCount: number;
  flagRate: number;
  patternDetected: boolean;
}

export interface KycCompletenessAnalysis {
  coreFieldRate: number;
  nameRate: number;
  dobRate: number;
  addressRate: number;
  idDocumentRate: number;
  riskRatingRate: number;
  totalProfiles: number;
  passes: boolean;
  issues?: string[];
}

export interface AmlDetectabilityAnalysis {
  typologyCoverage: number;
  scenarioCoherence: number;
  perTypology: TypologyDetection[];
  totalTransactions: number;
  passes: boolean;
  issues?: string[];
}

export interface BankingEvaluation {
  kyc?: KycCompletenessAnalysis;
  aml?: AmlDetectabilityAnalysis;
  passes: boolean;
  issues?: string[];
}

export interface JobAnalytics {
  benfordAnalysis?: BenfordAnalysis;
  amountDistribution?: AmountDistributionAnalysis;
  processVariantSummary?: VariantAnalysis;
  bankingEvaluation?: BankingEvaluation;
}

// ---------------------------------------------------------------------------
// Audit (DS 3.1+)
// ---------------------------------------------------------------------------

export interface AuditOpinion {
  opinionId?: string;
  companyCode?: string;
  fiscalYear?: number;
  opinionType?: string;
  goingConcern?: string;
  basisForOpinion?: string;
  signedBy?: string;
  signedDate?: string;
  matters?: unknown[];
}

export interface KeyAuditMatter {
  matterId?: string;
  companyCode?: string;
  fiscalYear?: number;
  title: string;
  description?: string;
  auditResponse?: string;
  relatedAccounts?: string[];
  riskLevel?: string;
}

export interface AuditArtifacts {
  auditOpinions?: unknown;
  keyAuditMatters?: unknown;
  anomalyLabels?: unknown;
}

// ---------------------------------------------------------------------------
// Fraud split (DS 3.1.1+)
// ---------------------------------------------------------------------------

export interface FraudTypeSplit {
  total: number;
  schemePropagated: number;
  directInjection: number;
}

export interface FraudSplit {
  totalEntries: number;
  fraudEntries: number;
  schemePropagated: number;
  directInjection: number;
  propagationRate: number;
  byFraudType: Record<string, FraudTypeSplit>;
}

// ---------------------------------------------------------------------------
// File listing
// ---------------------------------------------------------------------------

export interface FileSchema {
  name: string;
  type: string;
}

export interface JobFile {
  path: string;
  sizeBytes: number;
  contentType?: string;
  schema?: FileSchema[];
}

export interface JobFileList {
  jobId?: string;
  totalFiles: number;
  totalSizeBytes: number;
  files: JobFile[];
}

// ---------------------------------------------------------------------------
// AI + adversarial + fingerprint (DS 3.0+)
// ---------------------------------------------------------------------------

export interface AiChatResponse {
  reply: string;
}

export interface AiTuneResponse {
  originalConfig: Record<string, unknown>;
  suggestedConfig: Record<string, unknown>;
  explanation: string;
  qualitySummary?: unknown;
}

export interface AdversarialProbeResponse {
  id: string;
  status: string;
}

export interface ProbeSample {
  id: string;
  prediction?: unknown;
  groundTruth?: unknown;
}

export interface AdversarialProbeResults {
  id: string;
  samples?: ProbeSample[];
  metrics?: unknown;
}

export interface FingerprintSynthesisResponse {
  id: string;
  status: string;
}

// ---------------------------------------------------------------------------
// Optimizer (API 4.1+)
// ---------------------------------------------------------------------------

export interface OptimizerResponse {
  report: unknown;
}

// ---------------------------------------------------------------------------
// Template packs (API 4.1+)
// ---------------------------------------------------------------------------

export interface TemplatePackCategorySummary {
  category: string;
  sizeBytes: number;
  updatedAt?: string;
}

export interface TemplatePack {
  id: string;
  name: string;
  description?: string | null;
  mergeStrategy: string;
  createdAt?: string;
  updatedAt?: string;
  categories: TemplatePackCategorySummary[];
}

export interface TemplatePackList {
  packs: TemplatePack[];
  limit: number;
}

export interface TemplatePackValidationIssue {
  category: string;
  message: string;
}

export interface TemplatePackValidation {
  valid: boolean;
  categoriesChecked: string[];
  issues: TemplatePackValidationIssue[];
}

export interface TemplatePackCategoryContent {
  category: string;
  contentYaml: string;
  sizeBytes: number;
  updatedAt?: string;
}

export interface TemplatePackEnrichResponse {
  category: string;
  targetPackCategory: string;
  countRequested: number;
  sizeBytesAfter: number;
  model: string;
  seed: number;
}

export interface DeletedResponse {
  deleted: boolean;
}

// ---------------------------------------------------------------------------
// SAP / SAF-T export (API 4.4+, DS 4.3+)
// ---------------------------------------------------------------------------

export const SAP_DEFAULT_TABLES = [
  "bkpf", "bseg", "acdoca", "lfa1", "kna1", "mara", "csks", "cepc",
] as const;

export const SAP_ALL_TABLES = [
  "bkpf", "bseg", "acdoca",
  "lfa1", "lfb1", "kna1", "knb1", "mara", "mard", "anla", "csks", "cepc",
  "ska1", "skb1",
  "ekko", "ekpo", "vbak", "vbap", "likp", "lips", "mkpf", "mseg",
  "bsis", "bsas", "bsid", "bsad", "bsik", "bsak",
] as const;

export type SapDialect = "classic" | "hana";

export interface SapExportConfig {
  dialect?: SapDialect;
  tables?: string[];
  client?: string;
  ledger?: string;
  sourceSystem?: string;
  localCurrency?: string;
  includeExtensionFields?: boolean;
}

export type SaftJurisdiction = "pt" | "pl" | "ro" | "no" | "lu";

export interface SaftExportConfig {
  jurisdiction: SaftJurisdiction | string;
  companyTaxId?: string;
  companyName?: string;
}

export interface ChartOfAccountsMeta {
  coaId?: string;
  accountingFramework?: string | null;
  country?: string;
  industry?: string;
  complexity?: string;
  accountCount?: number;
  [k: string]: unknown;
}

// ---------------------------------------------------------------------------
// Stream + NDJSON + archive support
// ---------------------------------------------------------------------------

export interface NdjsonStreamParams {
  rate?: number;
  burst?: number;
  progressInterval?: number;
  file?: string;
}

// ---------------------------------------------------------------------------
// Jobs extensions
// ---------------------------------------------------------------------------

export interface CancelJobResponse {
  id: string;
  status: string;
  creditsReserved?: number;
  creditsUsed?: number;
  creditsRefunded?: number;
  rowsGenerated?: number;
  rowsTotal?: number;
}
