export type StoredImage = {
  path: string;
  mimeType: "image/webp";
  width: number;
  height: number;
  sizeBytes: number;
};

export type StoredDocument = {
  path: string;
  mimeType: "application/pdf";
  originalName: string;
  sizeBytes: number;
};

export type StoredPaymentAttachment = {
  path: string;
  mimeType: "application/pdf" | "image/webp";
  originalName: string;
  sizeBytes: number;
};

export const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
export const MAX_IMAGES_PER_UPLOAD = 8;
export const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;
export type ImageStorageFolder = "products" | "categories";
export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export function validateImageFileMetadata({
  type,
  size,
}: {
  type: string;
  size: number;
}) {
  if (!(ACCEPTED_IMAGE_TYPES as readonly string[]).includes(type)) {
    return "الملف يجب أن يكون JPG أو PNG أو WebP.";
  }
  if (size <= 0 || size > MAX_IMAGE_SIZE_BYTES) {
    return "حجم كل صورة يجب ألا يتجاوز 8 MB.";
  }
  return null;
}

export function validatePdfFileMetadata({
  type,
  size,
  name,
}: {
  type: string;
  size: number;
  name: string;
}) {
  if (type !== "application/pdf" || !name.toLowerCase().endsWith(".pdf")) {
    return "الملف يجب أن يكون PDF فقط.";
  }
  if (size <= 0 || size > MAX_PDF_SIZE_BYTES) {
    return "حجم ملف PDF يجب ألا يتجاوز 10 MB.";
  }
  return null;
}

export function hasPdfSignature(bytes: Uint8Array) {
  return new TextDecoder().decode(bytes.slice(0, 5)) === "%PDF-";
}

export interface StorageAdapter {
  saveImage(file: File, folder?: ImageStorageFolder): Promise<StoredImage>;
  saveDocument(file: File): Promise<StoredDocument>;
  savePaymentAttachment(file: File): Promise<StoredPaymentAttachment>;
  readFile(filePath: string): Promise<Uint8Array>;
  deleteFile(filePath: string): Promise<void>;
}
