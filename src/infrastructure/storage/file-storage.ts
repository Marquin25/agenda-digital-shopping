import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

/** Port for uploaded files; a local directory now, S3-compatible later (docs/spec/04 §3). */
export interface FileStorage {
  save(name: string, content: Buffer): Promise<void>;
  read(name: string): Promise<Buffer | null>;
  /** Removes the file; missing files are ignored. */
  delete(name: string): Promise<void>;
  /** Every stored file, in no particular order. */
  list(): Promise<StoredFile[]>;
}

export interface StoredFile {
  name: string;
  modifiedAt: Date;
}

const SAFE_NAME = /^[a-z0-9-]+\.(webp)$/;

export class LocalFileStorage implements FileStorage {
  constructor(private readonly directory: string) {}

  private resolve(name: string): string {
    if (!SAFE_NAME.test(name)) throw new Error("Invalid file name");
    return path.join(this.directory, name);
  }

  async save(name: string, content: Buffer): Promise<void> {
    const file = this.resolve(name);
    await mkdir(this.directory, { recursive: true });
    await writeFile(file, content);
  }

  async read(name: string): Promise<Buffer | null> {
    const file = this.resolve(name);
    try {
      return await readFile(file);
    } catch {
      return null;
    }
  }

  async delete(name: string): Promise<void> {
    await rm(this.resolve(name), { force: true });
  }

  async list(): Promise<StoredFile[]> {
    let names: string[];
    try {
      names = await readdir(this.directory);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
    const files = await Promise.all(
      names
        .filter((name) => SAFE_NAME.test(name))
        .map(async (name) => {
          // A file deleted between readdir and stat is simply not listed.
          const info = await stat(this.resolve(name)).catch(() => null);
          return info?.isFile() ? { name, modifiedAt: info.mtime } : null;
        }),
    );
    return files.filter((file): file is StoredFile => file !== null);
  }
}
