/**
 * VynFi SAP Integration Pack — end-to-end TypeScript example.
 *
 * Run with: `VYNFI_API_KEY=... npx tsx examples/sap_export.ts`
 */
import { VynFi, type SapExportConfig } from "../src/index.js";

async function main() {
  const apiKey = process.env.VYNFI_API_KEY;
  if (!apiKey) throw new Error("VYNFI_API_KEY not set");
  const client = new VynFi({ apiKey, timeout: 180_000 });

  const sap: SapExportConfig = {
    dialect: "hana",
    client: "200",
    ledger: "0L",
    sourceSystem: "DATASYNTH",
    localCurrency: "EUR",
    // tables omitted — portal's default 8-table set applies
  };

  console.log("Submitting SAP job …");
  const job = await client.jobs.generateConfig({
    config: {
      sector: "retail",
      country: "DE",
      accountingFramework: "ifrs",
      rows: 500,
      companies: 1,
      periods: 2,
      processModels: ["o2c", "p2p"],
      exportFormat: "sap",
      output: { sap },
    },
  });
  console.log(`  job ${job.id}`);

  const done = await client.jobs.wait(job.id, {
    pollIntervalMs: 4000,
    timeoutMs: 420_000,
  });
  console.log(`  status: ${done.status}`);
  if (done.status !== "completed") {
    console.error(`  error: ${done.errorDetail}`);
    return;
  }

  const archive = await client.jobs.downloadArchive(done.id);
  const tables = archive.sapTables();
  console.log(`  ${tables.length} SAP tables emitted:`, tables);

  // FK spot-check — parse BKPF + BSEG and make sure every BSEG.BELNR
  // resolves to a BKPF.BELNR. (Minimal CSV parsing; production code
  // should use a CSV library.)
  const bkpfText = new TextDecoder().decode(await archive.sapTable("bkpf"));
  const bsegText = new TextDecoder().decode(await archive.sapTable("bseg"));
  const strip = (t: string) =>
    t.charCodeAt(0) === 0xfeff ? t.slice(1) : t;
  const parseCol = (t: string, idx: number) =>
    strip(t)
      .split("\n")
      .slice(1)
      .map((l) => l.split(";")[idx])
      .filter(Boolean);
  const bkpfIds = new Set(parseCol(bkpfText, 2));
  const orphans = parseCol(bsegText, 2).filter((b) => !bkpfIds.has(b));
  if (orphans.length === 0) {
    console.log("  ✓ BSEG.BELNR ⊆ BKPF.BELNR (FK integrity holds)");
  } else {
    console.log(`  ✗ ${orphans.length} BSEG rows have orphan BELNR`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
