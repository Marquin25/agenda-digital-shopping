import { describe, expect, it } from "vitest";
import { parseStorageConfig } from "@/infrastructure/config";

// Obviously fake values: none of them is a real credential.
const S3_ENV = {
  STORAGE_DRIVER: "s3",
  S3_REGION: "test-region",
  S3_BUCKET: "test-bucket",
  S3_ACCESS_KEY_ID: "test-access-key-id",
  S3_SECRET_ACCESS_KEY: "test-secret-value",
};

describe("storage configuration", () => {
  it("uses the local disk by default", () => {
    expect(parseStorageConfig({})).toEqual({ driver: "local", uploadDir: "./storage/uploads" });
    expect(parseStorageConfig({ STORAGE_DRIVER: "", UPLOAD_DIR: "/data/uploads" })).toEqual({
      driver: "local",
      uploadDir: "/data/uploads",
    });
  });

  it("reads the S3-compatible settings, with an optional endpoint and path-style addressing", () => {
    expect(parseStorageConfig(S3_ENV)).toEqual({
      driver: "s3",
      endpoint: null,
      region: "test-region",
      bucket: "test-bucket",
      accessKeyId: "test-access-key-id",
      secretAccessKey: "test-secret-value",
      forcePathStyle: false,
    });
    expect(
      parseStorageConfig({ ...S3_ENV, S3_ENDPOINT: "http://localhost:9000", S3_FORCE_PATH_STYLE: "true" }),
    ).toMatchObject({ endpoint: "http://localhost:9000", forcePathStyle: true });
  });

  it("names every missing S3 variable without printing any value", () => {
    const env = { ...S3_ENV, S3_BUCKET: "", S3_SECRET_ACCESS_KEY: undefined };
    let message = "";
    try {
      parseStorageConfig(env);
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain("STORAGE_DRIVER=s3");
    expect(message).toContain("S3_BUCKET");
    expect(message).toContain("S3_SECRET_ACCESS_KEY");
    expect(message).not.toContain("S3_REGION");
    for (const value of ["test-region", "test-access-key-id"]) expect(message).not.toContain(value);
  });

  it("rejects an unknown driver or an invalid flag without echoing the value", () => {
    expect(() => parseStorageConfig({ STORAGE_DRIVER: "ftp-secret" })).toThrow(/STORAGE_DRIVER/);
    expect(() => parseStorageConfig({ STORAGE_DRIVER: "ftp-secret" })).not.toThrow(/ftp-secret/);
    expect(() => parseStorageConfig({ ...S3_ENV, S3_FORCE_PATH_STYLE: "maybe" })).toThrow(
      /S3_FORCE_PATH_STYLE/,
    );
    expect(() => parseStorageConfig({ ...S3_ENV, S3_ENDPOINT: "not a url" })).toThrow(/S3_ENDPOINT/);
  });
});
