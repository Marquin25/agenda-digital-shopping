import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  NoSuchKey,
  PutObjectCommand,
  S3ServiceException,
} from "@aws-sdk/client-s3";
import { describe, expect, it } from "vitest";
import { createFileStorage } from "@/infrastructure/storage";
import { LocalFileStorage } from "@/infrastructure/storage/file-storage";
import { createS3Client, S3FileStorage, type S3Sender } from "@/infrastructure/storage/s3-file-storage";
import { describeFileStorageContract } from "./file-storage-contract";

const BUCKET = "test-bucket";

/** In-memory stand-in for `S3Client.send`: no network. Lists in small pages to exercise pagination. */
class FakeS3 {
  readonly objects = new Map<string, { body: Buffer; lastModified: Date; contentType?: string }>();
  readonly commands: string[] = [];
  failWith: Error | null = null;

  constructor(private readonly pageSize = 2) {}

  readonly client = { send: (command: unknown) => this.handle(command) } as unknown as S3Sender;

  private async handle(command: unknown): Promise<unknown> {
    this.commands.push((command as object).constructor.name);
    if (this.failWith) throw this.failWith;
    if (command instanceof PutObjectCommand) {
      const { Bucket, Key, Body, ContentType } = command.input;
      expect(Bucket).toBe(BUCKET);
      this.objects.set(Key!, {
        body: Buffer.from(Body as Buffer),
        lastModified: new Date(),
        contentType: ContentType,
      });
      return {};
    }
    if (command instanceof GetObjectCommand) {
      const object = this.objects.get(command.input.Key!);
      if (!object) throw new NoSuchKey({ message: "The specified key does not exist.", $metadata: {} });
      return { Body: { transformToByteArray: async () => new Uint8Array(object.body) } };
    }
    if (command instanceof DeleteObjectCommand) {
      this.objects.delete(command.input.Key!);
      return {};
    }
    if (command instanceof ListObjectsV2Command) {
      const { Prefix = "", ContinuationToken } = command.input;
      const keys = [...this.objects.keys()].filter((key) => key.startsWith(Prefix)).sort();
      const start = ContinuationToken ? Number(ContinuationToken) : 0;
      const page = keys.slice(start, start + this.pageSize);
      const next = start + this.pageSize < keys.length ? String(start + this.pageSize) : undefined;
      return {
        Contents: page.map((Key) => ({ Key, LastModified: this.objects.get(Key)!.lastModified })),
        IsTruncated: next !== undefined,
        NextContinuationToken: next,
      };
    }
    throw new Error("Unexpected command");
  }
}

describeFileStorageContract("S3FileStorage", async () => new S3FileStorage(new FakeS3().client, BUCKET));

describe("S3FileStorage", () => {
  it("stores banners under the banners/ prefix as WebP", async () => {
    const s3 = new FakeS3();
    await new S3FileStorage(s3.client, BUCKET).save("banner-a.webp", Buffer.from("a"));
    expect([...s3.objects.keys()]).toEqual(["banners/banner-a.webp"]);
    expect(s3.objects.get("banners/banner-a.webp")!.contentType).toBe("image/webp");
  });

  it("lists every page and ignores objects outside the prefix or with unsafe names", async () => {
    const s3 = new FakeS3(2);
    const storage = new S3FileStorage(s3.client, BUCKET);
    for (const name of ["a.webp", "b.webp", "c.webp", "d-600.webp", "e.webp"]) {
      await storage.save(name, Buffer.from(name));
    }
    const now = new Date();
    s3.objects.set("other/f.webp", { body: Buffer.from("f"), lastModified: now });
    s3.objects.set("banners/notes.txt", { body: Buffer.from("x"), lastModified: now });
    s3.objects.set("banners/nested/g.webp", { body: Buffer.from("g"), lastModified: now });

    const names = (await storage.list()).map((file) => file.name).sort();

    expect(names).toEqual(["a.webp", "b.webp", "c.webp", "d-600.webp", "e.webp"]);
  });

  it("validates the file name before any call to the bucket", async () => {
    const s3 = new FakeS3();
    const storage = new S3FileStorage(s3.client, BUCKET);
    await expect(storage.save("../x.webp", Buffer.from("x"))).rejects.toThrow("Invalid file name");
    await expect(storage.read("../x.webp")).rejects.toThrow("Invalid file name");
    await expect(storage.delete("../x.webp")).rejects.toThrow("Invalid file name");
    expect(s3.commands).toEqual([]);
  });

  it("propagates failures other than a missing object", async () => {
    const s3 = new FakeS3();
    s3.failWith = new S3ServiceException({
      name: "AccessDenied",
      $fault: "client",
      $metadata: { httpStatusCode: 403 },
    });
    await expect(new S3FileStorage(s3.client, BUCKET).read("a.webp")).rejects.toThrow();
  });
});

describe("createFileStorage", () => {
  const S3_CONFIG = {
    driver: "s3",
    endpoint: "http://localhost:9000",
    region: "test-region",
    bucket: BUCKET,
    accessKeyId: "test-access-key-id",
    secretAccessKey: "test-secret-value",
    forcePathStyle: true,
  } as const;

  it("picks the adapter from the configured driver", () => {
    expect(createFileStorage({ driver: "local", uploadDir: "./storage/test" })).toBeInstanceOf(
      LocalFileStorage,
    );
    expect(createFileStorage(S3_CONFIG)).toBeInstanceOf(S3FileStorage);
  });

  it("configures the S3 client with the endpoint, region and path-style flag (no request is sent)", async () => {
    const client = createS3Client(S3_CONFIG);
    expect(await client.config.region()).toBe("test-region");
    expect(client.config.forcePathStyle).toBe(true);
    const endpoint = await client.config.endpoint!();
    expect(`${endpoint.protocol}//${endpoint.hostname}:${endpoint.port}`).toBe("http://localhost:9000");
    expect(await client.config.credentials()).toMatchObject({ accessKeyId: "test-access-key-id" });
  });
});
