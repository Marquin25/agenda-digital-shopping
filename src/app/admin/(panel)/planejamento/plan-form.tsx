"use client";

import { useActionState } from "react";
import {
  AUDIENCE_LABELS,
  AUDIENCES,
  OBJECTIVE_LABELS,
  OBJECTIVES,
} from "@/domain/intelligence/experience-catalog";
import { ActionForm } from "@/ui/admin/action-form";
import { FieldError, FormMessage, invalidProps, SubmitButton } from "@/ui/admin/form-controls";
import type { FormState } from "@/ui/admin/form-state";
import { savePlanAction } from "./actions";

export interface PlanFormValues {
  title: string;
  primaryObjective: string;
  secondaryObjectives: string[];
  audiences: string[];
  interests: string;
  segmentIds: string[];
  storeIds: string[];
  venueIds: string[];
  budgetMin: string;
  budgetMax: string;
  periodStart: string;
  periodEnd: string;
  preferredWeekdays: string[];
  timeFrom: string;
  timeTo: string;
}

const LABELS: Record<string, string> = {
  title: "Nome",
  primaryObjective: "Objetivo principal",
  audiences: "Público desejado",
  venueIds: "Espaços",
  budgetMin: "Orçamento mínimo",
  budgetMax: "Orçamento máximo",
  periodStart: "Início do período",
  periodEnd: "Fim do período",
  timeFrom: "Horário inicial",
  timeTo: "Horário final",
};

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

function CheckboxGroup({
  id,
  legend,
  name,
  options,
  checked,
  hint,
  error,
}: {
  id: string;
  legend: string;
  name: string;
  options: { value: string; label: string }[];
  checked: string[];
  hint?: string;
  error?: string;
}) {
  const describedBy = [hint && `${id}-dica`, error && `${id}-erro`].filter(Boolean).join(" ") || undefined;
  return (
    <fieldset className="full" id={id} tabIndex={-1} aria-describedby={describedBy}>
      <legend>{legend}</legend>
      {hint && (
        <p id={`${id}-dica`} className="hint">
          {hint}
        </p>
      )}
      <FieldError id={id} message={error} />
      {options.length === 0 ? (
        <p className="hint">Nenhuma opção cadastrada.</p>
      ) : (
        <ul className="choice-list">
          {options.map((o) => (
            <li className="choice" key={o.value}>
              <input
                type="checkbox"
                id={`${id}-${o.value}`}
                name={name}
                value={o.value}
                defaultChecked={checked.includes(o.value)}
              />
              <span>
                <label htmlFor={`${id}-${o.value}`}>{o.label}</label>
              </span>
            </li>
          ))}
        </ul>
      )}
    </fieldset>
  );
}

export function PlanForm({
  planId,
  values,
  segments,
  stores,
  venues,
}: {
  planId: string | null;
  values: PlanFormValues;
  segments: { id: number; name: string }[];
  stores: { id: string; name: string; segmentName: string }[];
  venues: { id: string; name: string }[];
}) {
  const [state, action] = useActionState<FormState, FormData>(savePlanAction.bind(null, planId), {});
  const e = state.fieldErrors ?? {};
  const textField = (
    name: keyof PlanFormValues,
    label: string,
    props: React.ComponentProps<"input"> = {},
  ) => (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        defaultValue={values[name] as string}
        {...props}
        {...invalidProps(name, e[name])}
      />
      <FieldError id={name} message={e[name]} />
    </div>
  );
  return (
    <ActionForm action={action} state={state} className="panel" noValidate>
      <FormMessage state={state} labels={LABELS} />
      <div className="form-grid">
        <div className="field full">
          <label htmlFor="title">Nome do planejamento *</label>
          <input
            id="title"
            name="title"
            type="text"
            defaultValue={values.title}
            maxLength={120}
            placeholder="Ex.: Março da moda masculina"
            {...invalidProps("title", e.title)}
          />
          <FieldError id="title" message={e.title} />
        </div>

        <div className="field">
          <label htmlFor="primaryObjective">Objetivo principal *</label>
          <select
            id="primaryObjective"
            name="primaryObjective"
            defaultValue={values.primaryObjective}
            {...invalidProps("primaryObjective", e.primaryObjective)}
          >
            <option value="">Escolha…</option>
            {OBJECTIVES.map((o) => (
              <option key={o} value={o}>
                {OBJECTIVE_LABELS[o]}
              </option>
            ))}
          </select>
          <FieldError id="primaryObjective" message={e.primaryObjective} />
        </div>
        <CheckboxGroup
          id="secondaryObjectives"
          legend="Objetivos secundários"
          name="secondaryObjectives"
          options={OBJECTIVES.map((o) => ({ value: o, label: OBJECTIVE_LABELS[o] }))}
          checked={values.secondaryObjectives}
        />

        <CheckboxGroup
          id="audiences"
          legend="Público desejado *"
          name="audiences"
          options={AUDIENCES.map((a) => ({ value: a, label: AUDIENCE_LABELS[a] }))}
          checked={values.audiences}
          hint="Descreva o público que o shopping quer atingir. É uma descrição do alvo escrita pela equipe, não um perfil coletado de visitantes."
          error={e.audiences}
        />
        <div className="field full">
          <label htmlFor="interests">Interesses do público (separados por vírgulas)</label>
          <input
            id="interests"
            name="interests"
            type="text"
            defaultValue={values.interests}
            placeholder="Ex.: moda, gastronomia, games"
          />
        </div>

        <CheckboxGroup
          id="segmentIds"
          legend="Segmentos comerciais"
          name="segmentIds"
          options={segments.map((s) => ({ value: String(s.id), label: s.name }))}
          checked={values.segmentIds}
        />
        <CheckboxGroup
          id="storeIds"
          legend="Lojas interessadas"
          name="storeIds"
          options={stores.map((s) => ({ value: s.id, label: `${s.name} · ${s.segmentName}` }))}
          checked={values.storeIds}
        />
        <CheckboxGroup
          id="venueIds"
          legend="Espaços disponíveis *"
          name="venueIds"
          options={venues.map((v) => ({ value: v.id, label: v.name }))}
          checked={values.venueIds}
          error={e.venueIds}
        />

        {textField("budgetMin", "Orçamento mínimo (R$) *", {
          type: "number",
          min: 0,
          step: 100,
          inputMode: "numeric",
        })}
        {textField("budgetMax", "Orçamento máximo (R$) *", {
          type: "number",
          min: 0,
          step: 100,
          inputMode: "numeric",
        })}
        {textField("periodStart", "Início do período *", { type: "date" })}
        {textField("periodEnd", "Fim do período *", { type: "date" })}

        <CheckboxGroup
          id="preferredWeekdays"
          legend="Dias preferidos"
          name="preferredWeekdays"
          options={WEEKDAYS.map((label, day) => ({ value: String(day), label }))}
          checked={values.preferredWeekdays}
          hint="Deixe em branco se qualquer dia servir."
        />
        {textField("timeFrom", "Horário disponível: início", { type: "time" })}
        {textField("timeTo", "Horário disponível: fim", { type: "time" })}
        <p className="hint full">
          Deixe os horários vazios se não houver limite. Modelos com duração maior que essa janela não serão
          sugeridos.
        </p>
      </div>
      <SubmitButton>{planId ? "Salvar planejamento" : "Cadastrar planejamento"}</SubmitButton>
    </ActionForm>
  );
}
