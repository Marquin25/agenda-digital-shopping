import { z } from "zod";
import { localDateTimeToUtc } from "@/domain/time/time-zone";

const LOCAL_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const optionalUuid = z
  .union([z.literal(""), z.null(), z.uuid()])
  .optional()
  .transform((v) => v || null);

/** Admin form input; dates are `datetime-local` values in mall time. */
export const eventInputSchema = z
  .object({
    title: z.string().trim().min(3, "Informe um título com pelo menos 3 caracteres.").max(120),
    description: z.string().trim().min(10, "Descreva o evento (mínimo de 10 caracteres).").max(5000),
    startsAt: z.string().regex(LOCAL_DATE_TIME, "Informe a data e a hora de início."),
    endsAt: z.string().regex(LOCAL_DATE_TIME, "Informe a data e a hora de término."),
    venueId: z.uuid("Escolha o espaço."),
    locationDetail: z.string().trim().max(200).default(""),
    categoryId: z.coerce.number().int().positive("Escolha a categoria."),
    featureIds: z.array(z.coerce.number().int().positive()).max(20).default([]),
    storeIds: z.array(z.uuid()).max(50).default([]),
    admissionInfo: z.string().trim().max(300).default(""),
    capacityMode: z.enum(["unlimited", "first_come"], "Escolha como funcionam as vagas."),
    displayedCapacity: z
      .union([z.literal(""), z.coerce.number().int().min(1).max(100_000)])
      .transform((v) => (v === "" ? null : v))
      .default(null),
    bannerAlt: z.string().trim().max(250).default(""),
    /** Days the post-event rating stays open (docs/spec/03 §8). */
    ratingPeriodDays: z
      .union([
        z.literal(""),
        z.coerce
          .number()
          .int("Informe um número inteiro de dias.")
          .min(1, "Use de 1 a 30 dias.")
          .max(30, "Use de 1 a 30 dias."),
      ])
      .transform((v) => (v === "" ? 7 : v))
      .default(7),
    /** Brief and catalog idea the event comes from; only stored when the event is created. */
    planId: optionalUuid,
    experienceTemplateId: optionalUuid,
  })
  .transform((v, ctx) => {
    const startsAt = localDateTimeToUtc(v.startsAt);
    const endsAt = localDateTimeToUtc(v.endsAt);
    if (endsAt <= startsAt) {
      ctx.addIssue({ code: "custom", path: ["endsAt"], message: "O término precisa ser depois do início." });
    }
    return {
      ...v,
      startsAt,
      endsAt,
      displayedCapacity: v.capacityMode === "unlimited" ? null : v.displayedCapacity,
    };
  });

export type EventInput = z.input<typeof eventInputSchema>;
export type ValidEventInput = z.output<typeof eventInputSchema>;
