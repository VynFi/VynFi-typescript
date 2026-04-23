/**
 * Ergonomic reader for a downloaded job archive.
 *
 * Supports two backends:
 * - **zip** — legacy/local storage; ``ArrayBuffer`` that starts with `PK`.
 *   Uses a hand-rolled minimal central-directory parser (no deps).
 * - **managed_blob** — JSON manifest with presigned URLs per file. Files
 *   are fetched lazily via `fetch()`.
 */

import type { ChartOfAccountsMeta } from "./types.js";

interface ZipEntry {
  name: string;
  compressedSize: number;
  uncompressedSize: number;
  offset: number;
  method: number;
}

interface ManifestEntry {
  path: string;
  url: string;
  size: number;
}

type Backend =
  | { kind: "zip"; data: Uint8Array; entries: Map<string, ZipEntry> }
  | {
      kind: "managed_blob";
      index: Map<string, ManifestEntry>;
      ttlSeconds?: number;
    };

function readUint32LE(buf: Uint8Array, o: number): number {
  return (
    buf[o] |
    (buf[o + 1] << 8) |
    (buf[o + 2] << 16) |
    (buf[o + 3] << 24 >>> 0)
  ) >>> 0;
}

function readUint16LE(buf: Uint8Array, o: number): number {
  return buf[o] | (buf[o + 1] << 8);
}

function parseZipCentralDirectory(buf: Uint8Array): Map<string, ZipEntry> {
  const entries = new Map<string, ZipEntry>();
  // Find End of Central Directory (EOCD) by scanning backward.
  const EOCD_SIG = 0x06054b50;
  let eocdOff = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (readUint32LE(buf, i) === EOCD_SIG) {
      eocdOff = i;
      break;
    }
  }
  if (eocdOff < 0) {
    throw new Error("zip: EOCD not found");
  }
  const totalEntries = readUint16LE(buf, eocdOff + 10);
  const cdOffset = readUint32LE(buf, eocdOff + 16);

  let o = cdOffset;
  for (let i = 0; i < totalEntries; i++) {
    if (readUint32LE(buf, o) !== 0x02014b50) throw new Error("zip: bad CD entry");
    const method = readUint16LE(buf, o + 10);
    const compressedSize = readUint32LE(buf, o + 20);
    const uncompressedSize = readUint32LE(buf, o + 24);
    const nameLen = readUint16LE(buf, o + 28);
    const extraLen = readUint16LE(buf, o + 30);
    const commentLen = readUint16LE(buf, o + 32);
    const localOffset = readUint32LE(buf, o + 42);
    const name = new TextDecoder().decode(buf.subarray(o + 46, o + 46 + nameLen));
    entries.set(name, {
      name,
      compressedSize,
      uncompressedSize,
      offset: localOffset,
      method,
    });
    o += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

async function inflateRaw(data: Uint8Array): Promise<Uint8Array> {
  // Use browser/Node DecompressionStream for the `deflate-raw` format used
  // by zip method 8.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const DS: any = (globalThis as any).DecompressionStream;
  if (!DS) {
    throw new Error(
      "DecompressionStream not available — zip method 8 needs Node 18+ or a modern browser.",
    );
  }
  const stream = new Blob([data as unknown as BlobPart]).stream().pipeThrough(new DS("deflate-raw"));
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value as Uint8Array);
  }
  let total = 0;
  for (const c of chunks) total += c.length;
  const out = new Uint8Array(total);
  let p = 0;
  for (const c of chunks) {
    out.set(c, p);
    p += c.length;
  }
  return out;
}

async function readZipEntry(buf: Uint8Array, entry: ZipEntry): Promise<Uint8Array> {
  // Re-read local file header to skip its variable fields.
  const lo = entry.offset;
  if (readUint32LE(buf, lo) !== 0x04034b50) throw new Error("zip: bad local header");
  const nameLen = readUint16LE(buf, lo + 26);
  const extraLen = readUint16LE(buf, lo + 28);
  const dataStart = lo + 30 + nameLen + extraLen;
  const compressed = buf.subarray(dataStart, dataStart + entry.compressedSize);
  if (entry.method === 0) return compressed;
  if (entry.method === 8) return inflateRaw(compressed);
  throw new Error(`zip: unsupported compression method ${entry.method}`);
}

export class JobArchive {
  private readonly backend: Backend;

  private constructor(backend: Backend) {
    this.backend = backend;
  }

  /** Construct from raw bytes. Auto-detects zip vs JSON manifest. */
  static fromBytes(data: Uint8Array): JobArchive {
    if (data.length >= 2 && data[0] === 0x50 && data[1] === 0x4b) {
      const entries = parseZipCentralDirectory(data);
      return new JobArchive({ kind: "zip", data, entries });
    }
    if (data.length > 0 && data[0] === 0x7b /* '{' */) {
      const text = new TextDecoder().decode(data);
      const obj = JSON.parse(text) as {
        files?: ManifestEntry[];
        ttl_seconds?: number;
      };
      if (!Array.isArray(obj.files)) {
        throw new Error("manifest: missing 'files' key");
      }
      const index = new Map<string, ManifestEntry>();
      for (const e of obj.files) index.set(e.path, e);
      return new JobArchive({
        kind: "managed_blob",
        index,
        ttlSeconds: obj.ttl_seconds,
      });
    }
    throw new Error("archive: bytes are neither a zip nor a JSON manifest");
  }

  backend_kind(): "zip" | "managed_blob" {
    return this.backend.kind;
  }

  /** Every file path in the archive. */
  files(): string[] {
    return this.backend.kind === "zip"
      ? [...this.backend.entries.keys()]
      : [...this.backend.index.keys()];
  }

  /** Unique top-level directories. */
  categories(): string[] {
    const out = new Set<string>();
    for (const name of this.files()) {
      const slash = name.indexOf("/");
      if (slash > 0) out.add(name.slice(0, slash));
    }
    return [...out].sort();
  }

  /** Glob-style filter (supports only `*` and `?`). */
  find(pattern: string): string[] {
    const rx = new RegExp(
      "^" +
        pattern
          .split("")
          .map((c) => {
            if (c === "*") return ".*";
            if (c === "?") return ".";
            return c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
          })
          .join("") +
        "$",
    );
    return this.files().filter((p) => rx.test(p));
  }

  /** Raw bytes for one path. Lazy-fetch for managed_blob. */
  async read(path: string): Promise<Uint8Array> {
    if (this.backend.kind === "zip") {
      const entry =
        this.backend.entries.get(path) ??
        [...this.backend.entries.values()].find((e) => {
          const base = path.split("/").pop() ?? path;
          return e.name === base || e.name.endsWith(`/${base}`);
        });
      if (!entry) throw new Error(`file not found in zip: ${path}`);
      return readZipEntry(this.backend.data, entry);
    }
    // managed_blob
    const entry =
      this.backend.index.get(path) ??
      [...this.backend.index.values()].find((e) => {
        const base = path.split("/").pop() ?? path;
        return e.path === base || e.path.endsWith(`/${base}`);
      });
    if (!entry) throw new Error(`file not found in manifest: ${path}`);
    const resp = await fetch(entry.url);
    if (!resp.ok) {
      throw new Error(`failed to fetch ${path}: HTTP ${resp.status}`);
    }
    return new Uint8Array(await resp.arrayBuffer());
  }

  async text(path: string): Promise<string> {
    return new TextDecoder().decode(await this.read(path));
  }

  async json<T = unknown>(path: string): Promise<T> {
    return JSON.parse(await this.text(path)) as T;
  }

  size(path: string): number {
    if (this.backend.kind === "zip") {
      const e = this.backend.entries.get(path);
      if (!e) throw new Error(`not found: ${path}`);
      return e.uncompressedSize;
    }
    const e = this.backend.index.get(path);
    if (!e) throw new Error(`not found: ${path}`);
    return e.size;
  }

  url(path: string): string | null {
    if (this.backend.kind === "managed_blob") {
      return this.backend.index.get(path)?.url ?? null;
    }
    return null;
  }

  ttlSeconds(): number | undefined {
    return this.backend.kind === "managed_blob" ? this.backend.ttlSeconds : undefined;
  }

  // -- Convenience readers -----------------------------------------------

  async auditOpinions(): Promise<unknown[]> {
    try {
      const v = await this.json<unknown[]>("audit/audit_opinions.json");
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  }

  async keyAuditMatters(): Promise<unknown[]> {
    try {
      const v = await this.json<unknown[]>("audit/key_audit_matters.json");
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  }

  /** SAP table stems under `sap_export/` (DS 4.3+). */
  sapTables(): string[] {
    return this.files()
      .filter((p) => p.startsWith("sap_export/") && p.endsWith(".csv"))
      .map((p) => p.slice("sap_export/".length, -".csv".length))
      .sort();
  }

  /** Raw CSV bytes for one SAP table (UTF-8 BOM preserved on HANA dialect). */
  async sapTable(name: string): Promise<Uint8Array> {
    return this.read(`sap_export/${name.toLowerCase()}.csv`);
  }

  /** SAF-T XML bytes (DS 4.3.1+). Tries root first; falls back to legacy
   *  nested path for backward compat. */
  async saftFile(jurisdiction: string): Promise<Uint8Array> {
    const j = jurisdiction.toLowerCase();
    try {
      return await this.read(`saft_${j}.xml`);
    } catch {
      return this.read(`saft/saft_${j}.xml`);
    }
  }

  /** Parse `chart_of_accounts_meta.json` (DS 4.4.1+); null if absent. */
  async coaMeta(): Promise<ChartOfAccountsMeta | null> {
    try {
      return await this.json<ChartOfAccountsMeta>("chart_of_accounts_meta.json");
    } catch {
      return null;
    }
  }
}
