"use client";

import { useActionState } from "react";
import { FieldError, FormMessage, invalidProps, SubmitButton } from "@/ui/admin/form-controls";
import type { FormState } from "@/ui/admin/form-state";
import { saveSegmentAction, saveStoreAction } from "./actions";

export function SegmentForm({
  segmentId,
  name,
  idPrefix,
}: {
  segmentId: number | null;
  name: string;
  idPrefix: string;
}) {
  const [state, action] = useActionState<FormState, FormData>(saveSegmentAction.bind(null, segmentId), {});
  const id = `${idPrefix}-name`;
  return (
    <form action={action}>
      <FormMessage state={state} />
      <div className="field">
        <label htmlFor={id}>Nome do segmento *</label>
        <input
          id={id}
          name="name"
          type="text"
          defaultValue={name}
          required
          maxLength={60}
          {...invalidProps(id, state.fieldErrors?.name)}
        />
        <FieldError id={id} message={state.fieldErrors?.name} />
      </div>
      <SubmitButton>{segmentId ? "Salvar segmento" : "Cadastrar segmento"}</SubmitButton>
    </form>
  );
}

export interface StoreValues {
  name: string;
  segmentId: string;
  floor: string;
}

export function StoreForm({
  storeId,
  values,
  segments,
  idPrefix,
}: {
  storeId: string | null;
  values: StoreValues;
  segments: { id: number; name: string }[];
  idPrefix: string;
}) {
  const [state, action] = useActionState<FormState, FormData>(saveStoreAction.bind(null, storeId), {});
  const e = state.fieldErrors ?? {};
  const id = (name: string) => `${idPrefix}-${name}`;
  return (
    <form action={action}>
      <FormMessage state={state} labels={{ name: "Nome", segmentId: "Segmento" }} />
      <div className="form-grid">
        <div className="field">
          <label htmlFor={id("name")}>Nome da loja *</label>
          <input
            id={id("name")}
            name="name"
            type="text"
            defaultValue={values.name}
            required
            maxLength={120}
            {...invalidProps(id("name"), e.name)}
          />
          <FieldError id={id("name")} message={e.name} />
        </div>
        <div className="field">
          <label htmlFor={id("segmentId")}>Segmento *</label>
          <select
            id={id("segmentId")}
            name="segmentId"
            defaultValue={values.segmentId}
            required
            {...invalidProps(id("segmentId"), e.segmentId)}
          >
            <option value="">Escolha…</option>
            {segments.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <FieldError id={id("segmentId")} message={e.segmentId} />
        </div>
        <div className="field">
          <label htmlFor={id("floor")}>Piso</label>
          <input
            id={id("floor")}
            name="floor"
            type="text"
            defaultValue={values.floor}
            maxLength={40}
            placeholder="Ex.: L2"
          />
        </div>
      </div>
      <SubmitButton>{storeId ? "Salvar loja" : "Cadastrar loja"}</SubmitButton>
    </form>
  );
}
