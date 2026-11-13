import Link from "next/link";
import { AGENDA_PARAMS, countActiveFilters, type AgendaFilters } from "@/domain/agenda/agenda-filters";

interface Option {
  slug: string;
  name: string;
}

/** Plain GET form: works without JavaScript and keeps the filters in the URL (shareable). */
export function AgendaFiltersForm({
  filters,
  categories,
  features,
}: {
  filters: AgendaFilters;
  categories: Option[];
  features: Option[];
}) {
  const active = countActiveFilters(filters);
  const dateKind = filters.date.kind;
  return (
    <form className="filters" method="get" action="/" role="search" aria-label="Buscar e filtrar eventos">
      <div className="field">
        <label htmlFor="q">Buscar eventos</label>
        <input id="q" name={AGENDA_PARAMS.query} type="search" defaultValue={filters.query} maxLength={100} />
      </div>

      <fieldset>
        <legend>Quando</legend>
        <ul className="choice-list">
          {[
            ["", "Todas as datas"],
            ["hoje", "Hoje"],
            ["fim-de-semana", "Fim de semana"],
            ["intervalo", "Escolher datas"],
          ].map(([value, label]) => (
            <li className="choice" key={value}>
              <input
                type="radio"
                id={`data-${value || "todas"}`}
                name={AGENDA_PARAMS.date}
                value={value}
                defaultChecked={
                  (value === "" && dateKind === "all") ||
                  (value === "hoje" && dateKind === "today") ||
                  (value === "fim-de-semana" && dateKind === "weekend") ||
                  (value === "intervalo" && dateKind === "range")
                }
              />
              <span>
                <label htmlFor={`data-${value || "todas"}`}>{label}</label>
              </span>
            </li>
          ))}
        </ul>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="de">De</label>
            <input
              id="de"
              name={AGENDA_PARAMS.from}
              type="date"
              defaultValue={filters.date.kind === "range" ? filters.date.from : ""}
              aria-describedby="datas-dica"
            />
          </div>
          <div className="field">
            <label htmlFor="ate">Até</label>
            <input
              id="ate"
              name={AGENDA_PARAMS.to}
              type="date"
              defaultValue={filters.date.kind === "range" ? filters.date.to : ""}
              aria-describedby="datas-dica"
            />
          </div>
        </div>
        <p id="datas-dica" className="hint">
          As datas só valem com a opção “Escolher datas”.
        </p>
      </fieldset>

      <details open={filters.categories.length > 0}>
        <summary>Categorias{filters.categories.length > 0 ? ` (${filters.categories.length})` : ""}</summary>
        <fieldset>
          <legend className="visually-hidden">Categorias</legend>
          <ul className="choice-list">
            {categories.map((c) => (
              <li className="choice" key={c.slug}>
                <input
                  type="checkbox"
                  id={`cat-${c.slug}`}
                  name={AGENDA_PARAMS.category}
                  value={c.slug}
                  defaultChecked={filters.categories.includes(c.slug)}
                />
                <span>
                  <label htmlFor={`cat-${c.slug}`}>{c.name}</label>
                </span>
              </li>
            ))}
          </ul>
        </fieldset>
      </details>

      <details open={filters.features.length > 0}>
        <summary>Acessibilidade{filters.features.length > 0 ? ` (${filters.features.length})` : ""}</summary>
        <fieldset>
          <legend className="visually-hidden">Recursos de acessibilidade</legend>
          <p className="hint">Mostra eventos que oferecem todos os recursos marcados.</p>
          <ul className="choice-list">
            {features.map((f) => (
              <li className="choice" key={f.slug}>
                <input
                  type="checkbox"
                  id={`ac-${f.slug}`}
                  name={AGENDA_PARAMS.feature}
                  value={f.slug}
                  defaultChecked={filters.features.includes(f.slug)}
                />
                <span>
                  <label htmlFor={`ac-${f.slug}`}>{f.name}</label>
                </span>
              </li>
            ))}
          </ul>
        </fieldset>
      </details>

      <div className="filters__actions">
        <button type="submit" className="button">
          Aplicar filtros
        </button>
        {active > 0 && (
          <Link href="/" className="button button--link">
            Limpar filtros ({active} {active === 1 ? "ativo" : "ativos"})
          </Link>
        )}
      </div>
    </form>
  );
}
