"use client";

import { useActionState, useState } from "react";
import { PROMO_CHANNELS, TRAFFIC_CHANNEL_LABELS } from "@/domain/metrics/traffic-source";
import { FieldError, FormMessage, invalidProps, SubmitButton } from "@/ui/admin/form-controls";
import type { FormState } from "@/ui/admin/form-state";
import { createPromoLinkAction } from "./actions";

export function PromoLinkForm({
  events,
  categories,
  defaultEventId,
}: {
  events: { id: string; title: string }[];
  categories: { slug: string; name: string }[];
  defaultEventId: string | null;
}) {
  const [state, action] = useActionState<FormState, FormData>(createPromoLinkAction, {});
  const [destination, setDestination] = useState(defaultEventId ? "event" : "agenda");
  const e = state.fieldErrors ?? {};
  return (
    <form action={action}>
      <FormMessage state={state} labels={{ channel: "Canal", description: "Descrição", eventId: "Evento" }} />
      <div className="form-grid">
        <div className="field">
          <label htmlFor="channel">Canal *</label>
          <select
            id="channel"
            name="channel"
            required
            defaultValue=""
            {...invalidProps("channel", e.channel)}
          >
            <option value="">Escolha…</option>
            {PROMO_CHANNELS.map((c) => (
              <option key={c} value={c}>
                {TRAFFIC_CHANNEL_LABELS[c]}
              </option>
            ))}
          </select>
          <FieldError id="channel" message={e.channel} />
        </div>
        <div className="field">
          <label htmlFor="description">Onde será usado *</label>
          <input
            id="description"
            name="description"
            type="text"
            maxLength={120}
            placeholder="Ex.: Cartaz da entrada A"
            required
            {...invalidProps("description", e.description)}
          />
          <FieldError id="description" message={e.description} />
        </div>
        <fieldset className="full">
          <legend>Destino</legend>
          <div className="checkbox-row">
            <input
              type="radio"
              id="dest-agenda"
              name="destination"
              value="agenda"
              checked={destination === "agenda"}
              onChange={() => setDestination("agenda")}
            />
            <label htmlFor="dest-agenda">Agenda</label>
          </div>
          <div className="checkbox-row">
            <input
              type="radio"
              id="dest-event"
              name="destination"
              value="event"
              checked={destination === "event"}
              onChange={() => setDestination("event")}
            />
            <label htmlFor="dest-event">Um evento</label>
          </div>
        </fieldset>
        {destination === "agenda" ? (
          <div className="field">
            <label htmlFor="category">Filtrar a agenda por categoria (opcional)</label>
            <select id="category" name="category" defaultValue="">
              <option value="">Agenda completa</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="field">
            <label htmlFor="eventId">Evento *</label>
            <select
              id="eventId"
              name="eventId"
              defaultValue={defaultEventId ?? ""}
              {...invalidProps("eventId", e.eventId)}
            >
              <option value="">Escolha…</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title}
                </option>
              ))}
            </select>
            <FieldError id="eventId" message={e.eventId} />
          </div>
        )}
      </div>
      <SubmitButton>Criar link de divulgação</SubmitButton>
    </form>
  );
}
