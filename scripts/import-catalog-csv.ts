import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  DEFAULT_CATALOG_CSV_PATH,
  formatCatalogImportReport,
  importCatalogCsv,
} from "../lib/catalog/csv-import";

async function main() {
  const csvPath = process.argv[2]
    ? path.resolve(process.argv[2])
    : DEFAULT_CATALOG_CSV_PATH;
  const outputDirectory = path.join(process.cwd(), "reports");

  const { report } = await importCatalogCsv({ csvPath });
  await mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    writeFile(
      path.join(outputDirectory, "catalog-import-report.json"),
      `${JSON.stringify(report, null, 2)}\n`,
      "utf8",
    ),
    writeFile(
      path.join(outputDirectory, "catalog-import-report.md"),
      formatCatalogImportReport(report),
      "utf8",
    ),
  ]);

  process.stdout.write(
    `Catalog import: ${report.acceptedProducts} accepted, ${report.excludedRows.length} excluded, ${report.potentialDuplicates.length} potential duplicates.\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
