import type { FileStorage, StoredFile } from "@/infrastructure/storage/file-storage";

/** In-memory `FileStorage` for tests; names in `failSave`/`failDelete` fail on demand. */
export class MemoryFileStorage implements FileStorage {
  readonly files = new Map<string, { content: Buffer; modifiedAt: Date }>();
  readonly failSave = new Set<string>();
  readonly failDelete = new Set<string>();

  constructor(private readonly clock: () => Date = () => new Date()) {}

  async save(name: string, content: Buffer): Promise<void> {
    if (this.failSave.has(name)) throw new Error(`Simulated save failure: ${name}`);
    this.files.set(name, { content, modifiedAt: this.clock() });
  }

  async read(name: string): Promise<Buffer | null> {
    return this.files.get(name)?.content ?? null;
  }

  async delete(name: string): Promise<void> {
    if (this.failDelete.has(name)) throw new Error(`Simulated delete failure: ${name}`);
    this.files.delete(name);
  }

  async list(): Promise<StoredFile[]> {
    return [...this.files].map(([name, { modifiedAt }]) => ({ name, modifiedAt }));
  }

  names(): string[] {
    return [...this.files.keys()].sort();
  }
}
