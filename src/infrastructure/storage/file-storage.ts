import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

/** Port for uploaded files; a local directory now, S3-compatible later (docs/spec/04 §3). */
export interface FileStorage {
  save(name: string, content: Buffer): Promise<void>;
  read(name: string): Promise<Buffer | null>;
  /** Removes the file; missing files are ignored. */
  delete(name: string): Promise<void>;
}

const SAFE_NAME = /^[a-z0-9-]+\.(webp)$/;

export class LocalFileStorage implements FileStorage {
  constructor(private readonly directory: string) {}

  private resolve(name: string): string {
    if (!SAFE_NAME.test(name)) throw new Error("Invalid file name");
    return path.join(this.directory, name);
  }

  async save(name: string, content: Buffer): Promise<void> {
    await mkdir(this.directory, { recursive: true });
    await writeFile(this.resolve(name), content);
  }

  async read(name: string): Promise<Buffer | null> {
    try {
      return await readFile(this.resolve(name));
    } catch {
      return null;
    }
  }

  async delete(name: string): Promise<void> {
    await rm(this.resolve(name), { force: true });
  }
}
