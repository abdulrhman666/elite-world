import "server-only";
import { LocalStorageAdapter } from "@/lib/storage/local-storage-adapter";
import type { StorageAdapter } from "@/lib/storage/storage-adapter";

let storageAdapter: StorageAdapter | undefined;

export function getStorageAdapter() {
  storageAdapter ??= new LocalStorageAdapter();
  return storageAdapter;
}
