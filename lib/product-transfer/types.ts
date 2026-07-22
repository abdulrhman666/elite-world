import type { ProductTransferKey } from "@/lib/product-transfer/columns";

export type TransferScalar = string | number | boolean | null;
export type TransferValues = Partial<
  Record<ProductTransferKey, TransferScalar>
>;

export type ProductChange = {
  field: ProductTransferKey;
  label: string;
  before: TransferScalar;
  after: TransferScalar;
};

export type ImportAnalysisRow = {
  rowNumber: number;
  status: "NEW" | "UPDATE" | "UNCHANGED" | "ERROR" | "DUPLICATE";
  productId: string | null;
  sku: string;
  nameAr: string;
  values: TransferValues;
  changes: ProductChange[];
  errors: string[];
  warnings: string[];
};

export type ImportAnalysis = {
  version: 1;
  rows: ImportAnalysisRow[];
  availableZipFilenames: string[];
};
