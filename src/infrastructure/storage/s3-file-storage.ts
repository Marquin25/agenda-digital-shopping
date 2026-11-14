import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  NoSuchKey,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import type { StorageConfig } from "@/infrastructure/config";
import { assertSafeFileName, type FileStorage, isSafeFileName, type StoredFile } from "./file-storage";

/** The only part of `S3Client` the adapter uses; tests inject an in-memory fake. */
export type S3Sender = Pick<S3Client, "send">;

/** Banners live under this prefix, so the retention job never touches other objects in the bucket. */
const KEY_PREFIX = "banners/";

export function createS3Client(config: Extract<StorageConfig, { driver: "s3" }>): S3Client {
  return new S3Client({
    region: config.region,
    endpoint: config.endpoint ?? undefined,
    forcePathStyle: config.forcePathStyle,
    credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey },
  });
}

const isMissing = (error: unknown) =>
  error instanceof NoSuchKey ||
  (error instanceof S3ServiceException && error.$metadata.httpStatusCode === 404);

/** `FileStorage` on an S3-compatible bucket (AWS S3, Cloudflare R2, MinIO). */
export class S3FileStorage implements FileStorage {
  constructor(
    private readonly client: S3Sender,
    private readonly bucket: string,
  ) {}

  private key(name: string): string {
    return KEY_PREFIX + assertSafeFileName(name);
  }

  async save(name: string, content: Buffer): Promise<void> {
    const Key = this.key(name);
    await this.client.send(
      new PutObjectCommand({ Bucket: this.bucket, Key, Body: content, ContentType: "image/webp" }),
    );
  }

  async read(name: string): Promise<Buffer | null> {
    const Key = this.key(name);
    try {
      const { Body } = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key }));
      return Body ? Buffer.from(await Body.transformToByteArray()) : null;
    } catch (error) {
      if (isMissing(error)) return null;
      throw error;
    }
  }

  async delete(name: string): Promise<void> {
    const Key = this.key(name);
    // Deleting a missing object succeeds on S3, matching the port.
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key }));
  }

  async list(): Promise<StoredFile[]> {
    const files: StoredFile[] = [];
    let ContinuationToken: string | undefined;
    do {
      const page = await this.client.send(
        new ListObjectsV2Command({ Bucket: this.bucket, Prefix: KEY_PREFIX, ContinuationToken }),
      );
      for (const object of page.Contents ?? []) {
        const name = object.Key?.slice(KEY_PREFIX.length) ?? "";
        if (isSafeFileName(name) && object.LastModified) {
          files.push({ name, modifiedAt: object.LastModified });
        }
      }
      ContinuationToken = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (ContinuationToken);
    return files;
  }
}
