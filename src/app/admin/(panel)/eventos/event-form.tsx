"use client";

import { useActionState } from "react";
import { FieldError, FormMessage, invalidProps, SubmitButton } from "@/ui/admin/form-controls";
import type { FormState } from "@/ui/admin/form-state";
import { saveEventAction } from "./actions";

export interface EventFormValues {
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  venueId: string;
  locationDetail: string;
  categoryId: string;
  featureIds: number[];
  storeIds: string[];
  admissionInfo: string;
  capacityMode: "unlimited" | "first_come";
  displayedCapacity: string;
  bannerAlt: string;
  bannerUrl: string | null;
}

const LABELS: Record<string, string> = {
  title: "Título",
  description: "Descrição",
  startsAt: "Início",
  endsAt: "Término",
  venueId: "Espaço",
  categoryId: "Categoria",
  capacityMode: "Vagas",
  displayedCapacity: "Capacidade",
  banner: "Banner",
  bannerAlt: "Texto alternativo",
};

function groupBySegment<T extends { segmentName: string }>(items: T[]): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const item of items) groups.set(item.segmentName, [...(groups.get(item.segmentName) ?? []), item]);
  return [...groups];
}

export function EventForm({
  eventId,
  values,
  venues,
  categories,
  features,
  stores,
}: {
  eventId: string | null;
  values: EventFormValues;
  venues: { id: string; name: string; floor: string }[];
  categories: { id: number; name: string }[];
  features: { id: number; name: string }[];
  stores: { id: string; name: string; floor: string; segmentName: string }[];
}) {
  const [state, action] = useActionState<FormState, FormData>(saveEventAction.bind(null, eventId), {});
  const e = state.fieldErrors ?? {};
  return (
    <form action={action} className="panel" noValidate>
      <FormMessage state={state} labels={LABELS} />
      <div className="form-grid">
        <div className="field full">
          <label htmlFor="title">Título *</label>
          <input
            id="title"
            name="title"
            type="text"
            defaultValue={values.title}
            maxLength={120}
            required
            {...invalidProps("title", e.title)}
          />
          <FieldError id="title" message={e.title} />
        </div>
        <div className="field full">
          <label htmlFor="description">Descrição *</label>
          <span id="description-dica" className="hint">
            Texto simples; quebras de linha são mantidas.
          </span>
          <textarea
            id="description"
            name="description"
            defaultValue={values.description}
            maxLength={5000}
            required
            aria-describedby={e.description ? "description-erro description-dica" : "description-dica"}
            aria-invalid={e.description ? true : undefined}
          />
          <FieldError id="description" message={e.description} />
        </div>
        <div className="field">
          <label htmlFor="startsAt">Início * (horário de Brasília)</label>
          <input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            defaultValue={values.startsAt}
            required
            {...invalidProps("startsAt", e.startsAt)}
          />
          <FieldError id="startsAt" message={e.startsAt} />
        </div>
        <div className="field">
          <label htmlFor="endsAt">Término *</label>
          <input
            id="endsAt"
            name="endsAt"
            type="datetime-local"
            defaultValue={values.endsAt}
            required
            {...invalidProps("endsAt", e.endsAt)}
          />
          <FieldError id="endsAt" message={e.endsAt} />
        </div>
        <div className="field">
          <label htmlFor="venueId">Espaço *</label>
          <select
            id="venueId"
            name="venueId"
            defaultValue={values.venueId}
            required
            {...invalidProps("venueId", e.venueId)}
          >
            <option value="">Escolha…</option>
            {venues.map((v) => (
              <option key={v.id} value={v.id}>
                {[v.floor, v.name].filter(Boolean).join(" · ")}
              </option>
            ))}
          </select>
          <FieldError id="venueId" message={e.venueId} />
        </div>
        <div className="field">
          <label htmlFor="locationDetail">Complemento do local</label>
          <input
            id="locationDetail"
            name="locationDetail"
            type="text"
            defaultValue={values.locationDetail}
            maxLength={200}
          />
        </div>
        <div className="field">
          <label htmlFor="categoryId">Categoria *</label>
          <select
            id="categoryId"
            name="categoryId"
            defaultValue={values.categoryId}
            required
            {...invalidProps("categoryId", e.categoryId)}
          >
            <option value="">Escolha…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <FieldError id="categoryId" message={e.categoryId} />
        </div>
        <div className="field">
          <label htmlFor="admissionInfo">Informações de entrada</label>
          <input
            id="admissionInfo"
            name="admissionInfo"
            type="text"
            defaultValue={values.admissionInfo}
            maxLength={300}
            placeholder="Ex.: Gratuito"
          />
        </div>
        <fieldset className="full">
          <legend>Recursos de acessibilidade</legend>
          <ul className="choice-list">
            {features.map((f) => (
              <li className="choice" key={f.id}>
                <input
                  type="checkbox"
                  id={`feature-${f.id}`}
                  name="featureIds"
                  value={f.id}
                  defaultChecked={values.featureIds.includes(f.id)}
                />
                <span>
                  <label htmlFor={`feature-${f.id}`}>{f.name}</label>
                </span>
              </li>
            ))}
          </ul>
        </fieldset>
        {stores.length > 0 && (
          <fieldset className="full">
            <legend>Lojas participantes</legend>
            {groupBySegment(stores).map(([segment, list]) => (
              <div key={segment}>
                <p className="store-segment">{segment}</p>
                <ul className="choice-list">
                  {list.map((s) => (
                    <li className="choice" key={s.id}>
                      <input
                        type="checkbox"
                        id={`store-${s.id}`}
                        name="storeIds"
                        value={s.id}
                        defaultChecked={values.storeIds.includes(s.id)}
                      />
                      <span>
                        <label htmlFor={`store-${s.id}`}>
                          {s.name}
                          {s.floor && ` · ${s.floor}`}
                        </label>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </fieldset>
        )}
        <fieldset className="full" aria-describedby="vagas-dica">
          <legend>Vagas *</legend>
          <div className="checkbox-row">
            <input
              type="radio"
              id="cap-unlimited"
              name="capacityMode"
              value="unlimited"
              defaultChecked={values.capacityMode === "unlimited"}
            />
            <label htmlFor="cap-unlimited">Sem limite</label>
          </div>
          <div className="checkbox-row">
            <input
              type="radio"
              id="cap-first-come"
              name="capacityMode"
              value="first_come"
              defaultChecked={values.capacityMode === "first_come"}
            />
            <label htmlFor="cap-first-come">Limitadas, por ordem de chegada</label>
          </div>
          <div className="checkbox-row">
            <input type="radio" id="cap-reservation" name="capacityMode" value="reservation" disabled />
            <label htmlFor="cap-reservation">Com reserva — pendente de aprovação</label>
          </div>
          <p id="vagas-dica" className="hint">
            O sistema não reserva nem garante vagas. Reservas aguardam decisão (docs/spec/03 §6).
          </p>
        </fieldset>
        <div className="field">
          <label htmlFor="displayedCapacity">Capacidade informada (opcional)</label>
          <input
            id="displayedCapacity"
            name="displayedCapacity"
            type="number"
            min={1}
            inputMode="numeric"
            defaultValue={values.displayedCapacity}
            {...invalidProps("displayedCapacity", e.displayedCapacity)}
          />
          <FieldError id="displayedCapacity" message={e.displayedCapacity} />
        </div>
        <div className="field full">
          <label htmlFor="banner">Banner (JPEG, PNG ou WebP, até 5 MB)</label>
          {values.bannerUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- preview of the stored WebP
            <img src={values.bannerUrl} alt="" width={320} height={180} style={{ borderRadius: 8 }} />
          )}
          <input
            id="banner"
            name="banner"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            {...invalidProps("banner", e.banner)}
          />
          <FieldError id="banner" message={e.banner} />
        </div>
        <div className="field full">
          <label htmlFor="bannerAlt">Texto alternativo do banner (obrigatório se houver imagem)</label>
          <span id="bannerAlt-dica" className="hint">
            Descreva o que a imagem mostra para quem usa leitor de tela.
          </span>
          <input
            id="bannerAlt"
            name="bannerAlt"
            type="text"
            defaultValue={values.bannerAlt}
            maxLength={250}
            aria-describedby={e.bannerAlt ? "bannerAlt-erro bannerAlt-dica" : "bannerAlt-dica"}
            aria-invalid={e.bannerAlt ? true : undefined}
          />
          <FieldError id="bannerAlt" message={e.bannerAlt} />
        </div>
      </div>
      <SubmitButton>{eventId ? "Salvar alterações" : "Salvar rascunho"}</SubmitButton>
    </form>
  );
}
