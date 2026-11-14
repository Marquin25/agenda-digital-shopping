import { bannerFileNames } from "@/domain/media/banner-variants";
import type { Database } from "@/infrastructure/db/client";
import type { FileStorage } from "@/infrastructure/storage/file-storage";
import { createEvent, updateEvent } from "./event-commands";
import type { ValidEventInput } from "./event-input";

/** A processed banner upload: the name stored on the event and every responsive file to save. */
export interface NewBanner {
  fileName: string;
  files: { fileName: string; content: Buffer }[];
}

/** The new banner could not be stored; nothing was written and the event keeps its previous banner. */
export class BannerStorageError extends Error {
  constructor() {
    super("Não foi possível salvar a imagem. Tente novamente.");
  }
}

/** Deletes every name, never throwing; failures are logged with the file name only. */
async function deleteBestEffort(storage: FileStorage, names: string[]): Promise<void> {
  const results = await Promise.allSettled(names.map((name) => storage.delete(name)));
  results.forEach((result, index) => {
    if (result.status === "rejected") console.error(`[banner] Could not delete file ${names[index]}`);
  });
}

async function storeVariants(storage: FileStorage, banner: NewBanner): Promise<void> {
  const results = await Promise.allSettled(banner.files.map((f) => storage.save(f.fileName, f.content)));
  if (results.every((result) => result.status === "fulfilled")) return;
  // All writes have settled, so removing every variant of this attempt leaves nothing orphaned.
  await deleteBestEffort(
    storage,
    banner.files.map((f) => f.fileName),
  );
  throw new BannerStorageError();
}

/**
 * Creates (`eventId: null`) or updates an event, swapping its banner consistently (B-57):
 * variants are stored first, the event row is saved, and only then is the replaced banner removed,
 * best effort. A failure before the row is saved removes the new variants; a failure removing the
 * old banner never undoes the new one (the retention job collects what is left behind).
 */
export async function saveEventWithBanner(
  db: Database,
  storage: FileStorage,
  command: {
    userId: string | null;
    eventId: string | null;
    input: ValidEventInput;
    banner: NewBanner | null;
  },
): Promise<string> {
  const { userId, eventId, input, banner } = command;
  if (banner) await storeVariants(storage, banner);
  const stored = banner ? { path: banner.fileName } : null;
  let id: string;
  let replacedBannerPath: string | null = null;
  try {
    if (eventId) {
      ({ replacedBannerPath } = await updateEvent(db, userId, eventId, input, stored));
      id = eventId;
    } else {
      id = await createEvent(db, userId, input, stored);
    }
  } catch (error) {
    // The new files are only referenced once the event row is saved.
    if (banner) await deleteBestEffort(storage, bannerFileNames(banner.fileName));
    throw error;
  }
  if (replacedBannerPath) await deleteBestEffort(storage, bannerFileNames(replacedBannerPath));
  return id;
}
