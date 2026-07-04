import "server-only";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import type {
  StorageAdapter,
  ImageStorageFolder,
  StoredDocument,
  StoredImage,
  StoredPaymentAttachment,
} from "@/lib/storage/storage-adapter";
import {
  hasPdfSignature,
  validateImageFileMetadata,
  validatePdfFileMetadata,
} from "@/lib/storage/storage-adapter";

const uploadRoots: Record<
  ImageStorageFolder,
  { publicPath: string; directory: string }
> = {
  products: {
    publicPath: "/images/products/uploads",
    directory: path.join(process.cwd(), "public/images/products/uploads"),
  },
  categories: {
    publicPath: "/images/categories/uploads",
    directory: path.join(process.cwd(), "public/images/categories/uploads"),
  },
};
const invoiceStoragePrefix = "invoices";
const invoiceDirectory = path.join(process.cwd(), ".storage/invoices");
const paymentStoragePrefix = "payments";
const paymentDirectory = path.join(process.cwd(), ".storage/payments");

export class ImageStorageError extends Error {}
export class DocumentStorageError extends Error {}

export async function convertToWebp(input: Buffer) {
  const processor = sharp(input, {
    failOn: "error",
    limitInputPixels: 40_000_000,
  });
  const metadata = await processor.metadata();
  if (!metadata.format || !["jpeg", "png", "webp"].includes(metadata.format)) {
    throw new ImageStorageError("محتوى الملف ليس صورة مدعومة.");
  }
  return processor
    .rotate()
    .resize({
      width: 2400,
      height: 2400,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 86, effort: 4, smartSubsample: true })
    .toBuffer({ resolveWithObject: true });
}

export class LocalStorageAdapter implements StorageAdapter {
  async saveImage(
    file: File,
    folder: ImageStorageFolder = "products",
  ): Promise<StoredImage> {
    const validationError = validateImageFileMetadata(file);
    if (validationError) throw new ImageStorageError(validationError);

    const input = Buffer.from(await file.arrayBuffer());
    let output: Awaited<ReturnType<typeof convertToWebp>>;
    try {
      output = await convertToWebp(input);
    } catch (error) {
      if (error instanceof ImageStorageError) throw error;
      throw new ImageStorageError("تعذر قراءة الصورة أو أنها تالفة.");
    }

    const uploadRoot = uploadRoots[folder];
    await mkdir(uploadRoot.directory, { recursive: true });
    const filename = `${Date.now()}-${randomUUID()}.webp`;
    await writeFile(path.join(uploadRoot.directory, filename), output.data);
    return {
      path: `${uploadRoot.publicPath}/${filename}`,
      mimeType: "image/webp",
      width: output.info.width,
      height: output.info.height,
      sizeBytes: output.info.size,
    };
  }

  async saveDocument(file: File): Promise<StoredDocument> {
    const validationError = validatePdfFileMetadata(file);
    if (validationError) throw new DocumentStorageError(validationError);
    const data = new Uint8Array(await file.arrayBuffer());
    if (!hasPdfSignature(data)) {
      throw new DocumentStorageError("محتوى الملف ليس PDF صالحاً.");
    }
    await mkdir(invoiceDirectory, { recursive: true });
    const filename = `${Date.now()}-${randomUUID()}.pdf`;
    await writeFile(path.join(invoiceDirectory, filename), data);
    return {
      path: `${invoiceStoragePrefix}/${filename}`,
      mimeType: "application/pdf",
      originalName: path.basename(file.name).slice(0, 180),
      sizeBytes: data.byteLength,
    };
  }

  async savePaymentAttachment(file: File): Promise<StoredPaymentAttachment> {
    const originalName = path.basename(file.name).slice(0, 180);
    if (
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf")
    ) {
      const validationError = validatePdfFileMetadata(file);
      if (validationError) throw new DocumentStorageError(validationError);
      const data = new Uint8Array(await file.arrayBuffer());
      if (!hasPdfSignature(data)) {
        throw new DocumentStorageError("محتوى الملف ليس PDF صالحاً.");
      }
      await mkdir(paymentDirectory, { recursive: true });
      const filename = `${Date.now()}-${randomUUID()}.pdf`;
      await writeFile(path.join(paymentDirectory, filename), data);
      return {
        path: `${paymentStoragePrefix}/${filename}`,
        mimeType: "application/pdf",
        originalName,
        sizeBytes: data.byteLength,
      };
    }

    const validationError = validateImageFileMetadata(file);
    if (validationError) throw new DocumentStorageError(validationError);
    const input = Buffer.from(await file.arrayBuffer());
    let output: Awaited<ReturnType<typeof convertToWebp>>;
    try {
      output = await convertToWebp(input);
    } catch {
      throw new DocumentStorageError("تعذر قراءة الصورة أو أنها تالفة.");
    }

    await mkdir(paymentDirectory, { recursive: true });
    const filename = `${Date.now()}-${randomUUID()}.webp`;
    await writeFile(path.join(paymentDirectory, filename), output.data);
    return {
      path: `${paymentStoragePrefix}/${filename}`,
      mimeType: "image/webp",
      originalName,
      sizeBytes: output.info.size,
    };
  }

  async readFile(filePath: string) {
    if (filePath.startsWith(`${invoiceStoragePrefix}/`)) {
      return readFile(path.join(invoiceDirectory, path.basename(filePath)));
    }
    if (filePath.startsWith(`${paymentStoragePrefix}/`)) {
      return readFile(path.join(paymentDirectory, path.basename(filePath)));
    }
    throw new DocumentStorageError("مسار المستند غير صالح.");
  }

  async deleteFile(filePath: string) {
    if (filePath.startsWith(`${invoiceStoragePrefix}/`)) {
      try {
        await unlink(path.join(invoiceDirectory, path.basename(filePath)));
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "ENOENT"
        ) {
          return;
        }
        throw error;
      }
      return;
    }
    if (filePath.startsWith(`${paymentStoragePrefix}/`)) {
      try {
        await unlink(path.join(paymentDirectory, path.basename(filePath)));
      } catch (error) {
        if (
          typeof error === "object" &&
          error !== null &&
          "code" in error &&
          error.code === "ENOENT"
        ) {
          return;
        }
        throw error;
      }
      return;
    }
    // الملفات الحالية خارج uploads محفوظة دائماً؛ الحذف يزيل ارتباطها فقط.
    const uploadRoot = Object.values(uploadRoots).find(({ publicPath }) =>
      filePath.startsWith(`${publicPath}/`),
    );
    if (!uploadRoot) return;
    const filename = path.basename(filePath);
    const absolutePath = path.join(uploadRoot.directory, filename);
    try {
      await unlink(absolutePath);
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return;
      }
      throw error;
    }
  }
}
