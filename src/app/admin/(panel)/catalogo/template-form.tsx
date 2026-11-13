"use client";

import { ActionForm } from "@/ui/admin/action-form";
import { useActionState } from "react";
import {
  AUDIENCE_LABELS,
  AUDIENCES,
  INDICATORS,
  MAX_WEIGHT,
  OBJECTIVE_LABELS,
  OBJECTIVES,
} from "@/domain/intelligence/experience-catalog";
import { FieldError, FormMessage, invalidProps, SubmitButton } from "@/ui/admin/form-controls";
import type { FormState } from "@/ui/admin/form-state";
import { saveTemplateAction } from "./actions";

export interface TemplateFormValues {
  name: string;
  description: string;
  objectiveWeights: Partial<Record<string, number>>;
  audienceWeights: Partial<Record<string, number>>;
  segmentIds: number[];
  costMin: string;
  costMax: string;
  minAreaSquareMeters: string;
  minCapacity: string;
  facilities: string;
  durationMinutes: string;
  categoryId: string;
  indicators: string[];
  reviewStatus: "draft" | "reviewed";
}

const LABELS: Record<string, string> = {
  name: "Nome",
  objectiveWeights: "Objetivos",
  audienceWeights: "Públicos",
  costMin: "Custo mínimo",
  costMax: "Custo máximo",
  minAreaSquareMeters: "Área mínima",
  minCapacity: "Capacidade mínima",
  durationMinutes: "Duração típica",
  indicators: "Indicadores",
};

const WEIGHT_OPTIONS = Array.from({ length: MAX_WEIGHT + 1 }, (_, w) => w);
const WEIGHT_LABELS = ["0 · não atende", "1 · pouco", "2 · bem", "3 · muito"];

function WeightGrid({
  id,
  legend,
  hint,
  prefix,
  keys,
  labels,
  values,
  error,
}: {
  id: string;
  legend: string;
  hint: string;
  prefix: string;
  keys: readonly string[];
  labels: Record<string, string>;
  values: Partial<Record<string, number>>;
  error?: string;
}) {
  return (
    <fieldset
      className="full"
      id={id}
      tabIndex={-1}
      aria-describedby={`${id}-dica`}
      {...invalidProps(id, error)}
    >
      <legend>{legend}</legend>
      <p id={`${id}-dica`} className="hint">
        {hint}
      </p>
      <FieldError id={id} message={error} />
      <div className="weight-grid">
        {keys.map((key) => (
          <div className="field" key={key}>
            <label htmlFor={`${prefix}-${key}`}>{labels[key]}</label>
            <select id={`${prefix}-${key}`} name={`${prefix}.${key}`} defaultValue={values[key] ?? 0}>
              {WEIGHT_OPTIONS.map((w) => (
                <option key={w} value={w}>
                  {WEIGHT_LABELS[w]}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

export function TemplateForm({
  templateId,
  values,
  segments,
  categories,
}: {
  templateId: string | null;
  values: TemplateFormValues;
  segments: { id: number; name: string }[];
  categories: { id: number; name: string }[];
}) {
  const [state, action] = useActionState<FormState, FormData>(saveTemplateAction.bind(null, templateId), {});
  const e = state.fieldErrors ?? {};
  return (
    <ActionForm action={action} state={state} className="panel" noValidate>
      <FormMessage state={state} labels={LABELS} />
      <div className="form-grid">
        <div className="field full">
          <label htmlFor="name">Nome *</label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={values.name}
            required
            maxLength={120}
            {...invalidProps("name", e.name)}
          />
          <FieldError id="name" message={e.name} />
        </div>
        <div className="field full">
          <label htmlFor="description">Descrição</label>
          <textarea
            id="description"
            name="description"
            defaultValue={values.description}
            maxLength={2000}
            rows={3}
          />
        </div>

        <WeightGrid
          id="objectiveWeights"
          legend="Objetivos que atende *"
          hint="Peso de 0 a 3 para cada objetivo. Pelo menos um precisa ser maior que zero."
          prefix="objective"
          keys={OBJECTIVES}
          labels={OBJECTIVE_LABELS}
          values={values.objectiveWeights}
          error={e.objectiveWeights}
        />
        <WeightGrid
          id="audienceWeights"
          legend="Públicos atendidos"
          hint="Descrição do público-alvo da ideia, escrita pela equipe. Não é um perfil coletado de visitantes."
          prefix="audience"
          keys={AUDIENCES}
          labels={AUDIENCE_LABELS}
          values={values.audienceWeights}
          error={e.audienceWeights}
        />

        {segments.length > 0 && (
          <fieldset className="full">
            <legend>Segmentos relacionados</legend>
            <ul className="choice-list">
              {segments.map((s) => (
                <li className="choice" key={s.id}>
                  <input
                    type="checkbox"
                    id={`segment-${s.id}`}
                    name="segmentIds"
                    value={s.id}
                    defaultChecked={values.segmentIds.includes(s.id)}
                  />
                  <span>
                    <label htmlFor={`segment-${s.id}`}>{s.name}</label>
                  </span>
                </li>
              ))}
            </ul>
          </fieldset>
        )}

        <div className="field">
          <label htmlFor="costMin">Custo mínimo (R$) *</label>
          <input
            id="costMin"
            name="costMin"
            type="number"
            min={0}
            step={100}
            inputMode="numeric"
            defaultValue={values.costMin}
            {...invalidProps("costMin", e.costMin)}
          />
          <FieldError id="costMin" message={e.costMin} />
        </div>
        <div className="field">
          <label htmlFor="costMax">Custo máximo (R$) *</label>
          <input
            id="costMax"
            name="costMax"
            type="number"
            min={0}
            step={100}
            inputMode="numeric"
            defaultValue={values.costMax}
            {...invalidProps("costMax", e.costMax)}
          />
          <FieldError id="costMax" message={e.costMax} />
        </div>
        <p className="hint full">Faixa informada pela administração, não é previsão de gasto.</p>

        <div className="field">
          <label htmlFor="minAreaSquareMeters">Área mínima (m²)</label>
          <input
            id="minAreaSquareMeters"
            name="minAreaSquareMeters"
            type="number"
            min={0}
            defaultValue={values.minAreaSquareMeters}
            {...invalidProps("minAreaSquareMeters", e.minAreaSquareMeters)}
          />
          <FieldError id="minAreaSquareMeters" message={e.minAreaSquareMeters} />
        </div>
        <div className="field">
          <label htmlFor="minCapacity">Capacidade mínima (pessoas)</label>
          <input
            id="minCapacity"
            name="minCapacity"
            type="number"
            min={0}
            defaultValue={values.minCapacity}
            {...invalidProps("minCapacity", e.minCapacity)}
          />
          <FieldError id="minCapacity" message={e.minCapacity} />
        </div>
        <div className="field">
          <label htmlFor="facilities">Estrutura necessária (separada por vírgulas)</label>
          <input
            id="facilities"
            name="facilities"
            type="text"
            defaultValue={values.facilities}
            placeholder="energia, som, palco"
          />
        </div>
        <div className="field">
          <label htmlFor="durationMinutes">Duração típica (minutos) *</label>
          <input
            id="durationMinutes"
            name="durationMinutes"
            type="number"
            min={15}
            max={1440}
            step={15}
            defaultValue={values.durationMinutes}
            {...invalidProps("durationMinutes", e.durationMinutes)}
          />
          <FieldError id="durationMinutes" message={e.durationMinutes} />
        </div>
        <div className="field">
          <label htmlFor="categoryId">Categoria da agenda</label>
          <select id="categoryId" name="categoryId" defaultValue={values.categoryId}>
            <option value="">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="full" id="indicators" tabIndex={-1}>
          <legend>Indicadores sugeridos</legend>
          <ul className="choice-list">
            {INDICATORS.map((i) => (
              <li className="choice" key={i.key}>
                <input
                  type="checkbox"
                  id={`indicator-${i.key}`}
                  name="indicators"
                  value={i.key}
                  defaultChecked={values.indicators.includes(i.key)}
                />
                <span>
                  <label htmlFor={`indicator-${i.key}`}>
                    {i.label}
                    {!i.measured && " (ainda não medido)"}
                  </label>
                </span>
              </li>
            ))}
          </ul>
        </fieldset>

        <fieldset className="full">
          <legend>Situação do conteúdo</legend>
          <div className="checkbox-row">
            <input
              type="radio"
              id="review-draft"
              name="reviewStatus"
              value="draft"
              defaultChecked={values.reviewStatus === "draft"}
            />
            <label htmlFor="review-draft">Rascunho para revisão</label>
          </div>
          <div className="checkbox-row">
            <input
              type="radio"
              id="review-reviewed"
              name="reviewStatus"
              value="reviewed"
              defaultChecked={values.reviewStatus === "reviewed"}
            />
            <label htmlFor="review-reviewed">Revisado pelo shopping</label>
          </div>
        </fieldset>
      </div>
      <SubmitButton>{templateId ? "Salvar modelo" : "Cadastrar modelo"}</SubmitButton>
    </ActionForm>
  );
}
