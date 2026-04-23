/**
 * VynFi SAF-T export (PT).
 *
 * Run with: `VYNFI_API_KEY=... npx tsx examples/saft_export.ts`
 */
import { writeFileSync } from "node:fs";
import { VynFi, type SaftExportConfig } from "../src/index.js";

async function main() {
  const apiKey = process.env.VYNFI_API_KEY;
  if (!apiKey) throw new Error("VYNFI_API_KEY not set");
  const client = new VynFi({ apiKey, timeout: 180_000 });

  const saft: SaftExportConfig = {
    jurisdiction: "pt",
    companyTaxId: "500000000",
    companyName: "ACME Retail SA",
  };

  console.log("Submitting SAF-T job …");
  const job = await client.jobs.generateConfig({
    config: {
      sector: "retail",
      country: "PT",
      accountingFramework: "ifrs",
      rows: 300,
      companies: 1,
      periods: 1,
      processModels: ["o2c", "p2p"],
      exportFormat: "saft",
      output: { saft },
    },
  });
  const done = await client.jobs.wait(job.id, {
    pollIntervalMs: 4000,
    timeoutMs: 420_000,
  });
  console.log(`  ${job.id}: ${done.status}`);
  if (done.status !== "completed") return;

  const archive = await client.jobs.downloadArchive(done.id);
  const xml = await archive.saftFile("pt");
  console.log(`  saft_pt.xml: ${xml.length} bytes`);
  const head = new TextDecoder().decode(xml.slice(0, 180));
  console.log(`  head: ${head}`);
  writeFileSync("/tmp/saft_pt.xml", xml);
  console.log("  saved to /tmp/saft_pt.xml");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
