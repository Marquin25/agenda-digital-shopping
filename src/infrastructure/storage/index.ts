import { getConfig, type StorageConfig } from "@/infrastructure/config";
import { type FileStorage, LocalFileStorage } from "./file-storage";
import { createS3Client, S3FileStorage } from "./s3-file-storage";

/** Factory: the `FileStorage` adapter selected by `STORAGE_DRIVER`. */
export function createFileStorage(config: StorageConfig): FileStorage {
  if (config.driver === "s3") return new S3FileStorage(createS3Client(config), config.bucket);
  return new LocalFileStorage(config.uploadDir);
}

const globalForStorage = globalThis as unknown as { conectaFileStorage?: FileStorage };

/** Process-wide storage (one S3 client and its connection pool, reused across requests). */
export function getFileStorage(): FileStorage {
  globalForStorage.conectaFileStorage ??= createFileStorage(getConfig().storage);
  return globalForStorage.conectaFileStorage;
}

export type { FileStorage };
