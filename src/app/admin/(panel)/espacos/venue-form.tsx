"use client";

import { ActionForm } from "@/ui/admin/action-form";
import { useActionState } from "react";
import { FieldError, FormMessage, invalidProps, SubmitButton } from "@/ui/admin/form-controls";
import type { FormState } from "@/ui/admin/form-state";
import { saveVenueAction } from "./actions";

export interface VenueValues {
  name: string;
  floor: string;
  reference: string;
  areaSquareMeters: string;
  capacity: string;
  facilities: string;
}

export function VenueForm({
  venueId,
  values,
  idPrefix,
}: {
  venueId: string | null;
  values: VenueValues;
  idPrefix: string;
}) {
  const [state, action] = useActionState<FormState, FormData>(saveVenueAction.bind(null, venueId), {});
  const e = state.fieldErrors ?? {};
  const id = (name: string) => `${idPrefix}-${name}`;
  return (
    <ActionForm action={action} state={state} resetOnSuccess={venueId === null}>
      <FormMessage state={state} />
      <div className="form-grid">
        <div className="field">
          <label htmlFor={id("name")}>Nome *</label>
          <input
            id={id("name")}
            name="name"
            type="text"
            defaultValue={values.name}
            required
            {...invalidProps(id("name"), e.name)}
          />
          <FieldError id={id("name")} message={e.name} />
        </div>
        <div className="field">
          <label htmlFor={id("floor")}>Piso</label>
          <input
            id={id("floor")}
            name="floor"
            type="text"
            defaultValue={values.floor}
            placeholder="Ex.: L1"
          />
        </div>
        <div className="field">
          <label htmlFor={id("reference")}>Referência</label>
          <input
            id={id("reference")}
            name="reference"
            type="text"
            defaultValue={values.reference}
            placeholder="Ex.: próximo à fonte"
          />
        </div>
        <div className="field">
          <label htmlFor={id("facilities")}>Estrutura (separada por vírgulas)</label>
          <input
            id={id("facilities")}
            name="facilities"
            type="text"
            defaultValue={values.facilities}
            placeholder="energia, som, palco"
          />
        </div>
        <div className="field">
          <label htmlFor={id("areaSquareMeters")}>Área (m²)</label>
          <input
            id={id("areaSquareMeters")}
            name="areaSquareMeters"
            type="number"
            min={0}
            defaultValue={values.areaSquareMeters}
            {...invalidProps(id("areaSquareMeters"), e.areaSquareMeters)}
          />
          <FieldError id={id("areaSquareMeters")} message={e.areaSquareMeters} />
        </div>
        <div className="field">
          <label htmlFor={id("capacity")}>Capacidade (pessoas)</label>
          <input
            id={id("capacity")}
            name="capacity"
            type="number"
            min={0}
            defaultValue={values.capacity}
            {...invalidProps(id("capacity"), e.capacity)}
          />
          <FieldError id={id("capacity")} message={e.capacity} />
        </div>
      </div>
      <SubmitButton>{venueId ? "Salvar espaço" : "Cadastrar espaço"}</SubmitButton>
    </ActionForm>
  );
}
