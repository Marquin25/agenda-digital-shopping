import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll } from "vitest";
import { LocalFileStorage } from "@/infrastructure/storage/file-storage";
import { describeFileStorageContract } from "./file-storage-contract";

const root = await mkdtemp(path.join(tmpdir(), "conecta-storage-"));
afterAll(() => rm(root, { recursive: true, force: true }));

let counter = 0;
// A directory that does not exist yet: the adapter creates it on the first save.
describeFileStorageContract(
  "LocalFileStorage",
  async () => new LocalFileStorage(path.join(root, `${++counter}`)),
);
