import "server-only";
import { LocalStorageAdapter } from "@/lib/storage/local-storage-adapter";
import type { StorageAdapter } from "@/lib/storage/storage-adapter";
import { VercelBlobStorageAdapter } from "@/lib/storage/vercel-blob-storage-adapter";

let storageAdapter: StorageAdapter | undefined;

export function getStorageAdapter() {
  storageAdapter ??=
    process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN
      ? new VercelBlobStorageAdapter()
      : new LocalStorageAdapter();
  return storageAdapter;
}
