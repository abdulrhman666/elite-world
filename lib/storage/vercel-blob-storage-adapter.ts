import "server-only";
import { randomUUID } from "node:crypto";
import { del, put } from "@vercel/blob";
import {
  convertToWebp,
  DocumentStorageError,
  ImageStorageError,
  LocalStorageAdapter,
} from "@/lib/storage/local-storage-adapter";
import type {
  StorageAdapter,
  StoredImage,
} from "@/lib/storage/storage-adapter";
import { validateImageFileMetadata } from "@/lib/storage/storage-adapter";

function isVercelBlobUrl(filePath: string) {
  try {
    return new URL(filePath).hostname.endsWith(".blob.vercel-storage.com");
  } catch {
    return false;
  }
}

export class VercelBlobStorageAdapter implements StorageAdapter {
  private readonly localStorage = new LocalStorageAdapter();

  async saveImage(file: File): Promise<StoredImage> {
    const validationError = validateImageFileMetadata(file);
    if (validationError) throw new ImageStorageError(validationError);

    let output: Awaited<ReturnType<typeof convertToWebp>>;
    try {
      output = await convertToWebp(Buffer.from(await file.arrayBuffer()));
    } catch (error) {
      if (error instanceof ImageStorageError) throw error;
      throw new ImageStorageError("تعذر قراءة الصورة أو أنها تالفة.");
    }

    try {
      const filename = `${Date.now()}-${randomUUID()}.webp`;
      const blob = await put(`products/${filename}`, output.data, {
        access: "public",
        addRandomSuffix: false,
        contentType: "image/webp",
      });
      return {
        path: blob.url,
        mimeType: "image/webp",
        width: output.info.width,
        height: output.info.height,
        sizeBytes: output.info.size,
      };
    } catch {
      throw new ImageStorageError(
        "تعذر حفظ الصورة في Vercel Blob. تأكد من ربط التخزين بالمشروع.",
      );
    }
  }

  saveDocument: StorageAdapter["saveDocument"] = (file) =>
    this.localStorage.saveDocument(file);

  savePaymentAttachment: StorageAdapter["savePaymentAttachment"] = (file) =>
    this.localStorage.savePaymentAttachment(file);

  async readFile(filePath: string) {
    if (!isVercelBlobUrl(filePath)) {
      return this.localStorage.readFile(filePath);
    }
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new DocumentStorageError("تعذر قراءة الملف من التخزين.");
    }
    return new Uint8Array(await response.arrayBuffer());
  }

  async deleteFile(filePath: string) {
    if (!isVercelBlobUrl(filePath)) {
      return this.localStorage.deleteFile(filePath);
    }
    await del(filePath);
  }
}
