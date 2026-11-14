"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  cancelEvent,
  deleteDraftEvent,
  endEventNow,
  EventRuleError,
  publishEvent,
} from "@/application/events/event-commands";
import { BannerStorageError, type NewBanner, saveEventWithBanner } from "@/application/events/event-banner";
import { eventInputSchema } from "@/application/events/event-input";
import { getConfig } from "@/infrastructure/config";
import { getDb } from "@/infrastructure/db";
import { BannerError, processBanner } from "@/infrastructure/storage/banner-image";
import { LocalFileStorage } from "@/infrastructure/storage/file-storage";
import { requireAdmin } from "@/infrastructure/web/admin-session";
import { fieldErrorsFrom, INVALID_FORM_MESSAGE, type FormState } from "@/ui/admin/form-state";

function readEventForm(formData: FormData) {
  const text = (name: string) => String(formData.get(name) ?? "");
  return {
    title: text("title"),
    description: text("description"),
    startsAt: text("startsAt"),
    endsAt: text("endsAt"),
    venueId: text("venueId"),
    locationDetail: text("locationDetail"),
    categoryId: text("categoryId"),
    featureIds: formData.getAll("featureIds").map(String),
    storeIds: formData.getAll("storeIds").map(String),
    admissionInfo: text("admissionInfo"),
    capacityMode: text("capacityMode"),
    displayedCapacity: text("displayedCapacity"),
    bannerAlt: text("bannerAlt"),
  };
}

async function readBanner(formData: FormData): Promise<NewBanner | null> {
  const file = formData.get("banner");
  if (!(file instanceof File) || file.size === 0) return null;
  return processBanner(Buffer.from(await file.arrayBuffer()));
}

export async function saveEventAction(
  eventId: string | null,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin("events:manage");
  const parsed = eventInputSchema.safeParse(readEventForm(formData));
  if (!parsed.success) return { message: INVALID_FORM_MESSAGE, fieldErrors: fieldErrorsFrom(parsed.error) };
  const db = await getDb();
  const storage = new LocalFileStorage(getConfig().uploadDir);
  let id: string;
  try {
    const banner = await readBanner(formData);
    id = await saveEventWithBanner(db, storage, { userId: admin.id, eventId, input: parsed.data, banner });
  } catch (error) {
    if (error instanceof BannerError || error instanceof BannerStorageError)
      return { fieldErrors: { banner: error.message }, message: INVALID_FORM_MESSAGE };
    if (error instanceof EventRuleError) return { message: error.message };
    throw error;
  }
  revalidatePath("/");
  redirect(`/admin/eventos/${id}?salvo=1`);
}

type Transition = "publish" | "cancel" | "end" | "delete";

export async function transitionEventAction(
  eventId: string,
  transition: Transition,
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const admin = await requireAdmin("events:manage");
  if ((transition === "cancel" || transition === "delete") && formData.get("confirm") !== "yes") {
    return { message: "Marque a confirmação para continuar." };
  }
  const db = await getDb();
  try {
    if (transition === "publish") await publishEvent(db, admin.id, eventId);
    if (transition === "cancel") await cancelEvent(db, admin.id, eventId);
    if (transition === "end") await endEventNow(db, admin.id, eventId);
    if (transition === "delete") await deleteDraftEvent(db, admin.id, eventId);
  } catch (error) {
    if (error instanceof EventRuleError) return { message: error.message };
    throw error;
  }
  revalidatePath("/");
  if (transition === "delete") redirect("/admin/eventos?excluido=1");
  redirect(`/admin/eventos/${eventId}?acao=${transition}`);
}
