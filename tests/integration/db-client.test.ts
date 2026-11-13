import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { count } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";
import { connect } from "@/infrastructure/db/client";
import { categories } from "@/infrastructure/db/schema";

describe("connect", () => {
  const roots: string[] = [];
  afterAll(() => Promise.all(roots.map((dir) => rm(dir, { recursive: true, force: true }))));

  it("creates missing parent folders for an on-disk PGlite database (fresh clone)", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "conecta-db-"));
    roots.push(root);
    const connection = await connect(`pglite:${path.join(root, "storage", "nested", "db")}`);
    await connection.migrate(path.join(process.cwd(), "drizzle"));
    expect(await connection.db.select({ n: count() }).from(categories)).toEqual([{ n: 0 }]);
    await connection.close();
  });
});
