import type { Metadata } from "next";
import { listSegments, listStores } from "@/application/catalog/stores";
import { getDb } from "@/infrastructure/db";
import { requireAdmin } from "@/infrastructure/web/admin-session";
import { toggleSegmentAction, toggleStoreAction } from "./actions";
import { SegmentForm, StoreForm } from "./store-forms";

export const metadata: Metadata = { title: "Lojas e segmentos" };
export const dynamic = "force-dynamic";

export default async function StoresPage() {
  await requireAdmin("stores:manage");
  const db = await getDb();
  const [allSegments, stores] = await Promise.all([
    listSegments(db, { includeInactive: true }),
    listStores(db, { includeInactive: true }),
  ]);
  const activeSegments = allSegments.filter((s) => s.active).map((s) => ({ id: s.id, name: s.name }));
  return (
    <>
      <h1>Lojas e segmentos</h1>
      <p>
        Cadastre apenas dados comerciais das lojas participantes. Não registre nomes, telefones ou e-mails de
        pessoas.
      </p>
      <section className="panel" aria-labelledby="nova-loja" style={{ marginBottom: "1.5rem" }}>
        <h2 id="nova-loja">Nova loja</h2>
        <StoreForm
          storeId={null}
          idPrefix="nova-loja"
          segments={activeSegments}
          values={{ name: "", segmentId: "", floor: "" }}
        />
      </section>
      <h2>Lojas cadastradas ({stores.length})</h2>
      {stores.length === 0 && <p>Nenhuma loja cadastrada.</p>}
      {stores.map((s) => {
        // A store may keep its current segment even after the segment is deactivated.
        const options = activeSegments.some((a) => a.id === s.segmentId)
          ? activeSegments
          : [...activeSegments, { id: s.segmentId, name: `${s.segmentName} (inativo)` }];
        return (
          <details key={s.id} className="panel" style={{ marginBottom: "0.75rem" }}>
            <summary>
              <strong>{s.name}</strong> · {s.segmentName}
              {s.floor && ` · ${s.floor}`}
              {!s.active && " (inativa)"}
            </summary>
            <StoreForm
              storeId={s.id}
              idPrefix={`l-${s.id.slice(0, 8)}`}
              segments={options}
              values={{ name: s.name, segmentId: String(s.segmentId), floor: s.floor }}
            />
            <form action={toggleStoreAction.bind(null, s.id, !s.active)} style={{ marginTop: "0.75rem" }}>
              <button type="submit" className="button button--secondary">
                {s.active ? "Desativar loja" : "Reativar loja"}
              </button>
            </form>
          </details>
        );
      })}
      <section className="panel" aria-labelledby="novo-segmento" style={{ margin: "1.5rem 0" }}>
        <h2 id="novo-segmento">Novo segmento</h2>
        <SegmentForm segmentId={null} name="" idPrefix="novo-segmento" />
      </section>
      <h2>Segmentos ({allSegments.length})</h2>
      {allSegments.map((s) => (
        <details key={s.id} className="panel" style={{ marginBottom: "0.75rem" }}>
          <summary>
            <strong>{s.name}</strong>
            {!s.active && " (inativo)"}
          </summary>
          <SegmentForm segmentId={s.id} name={s.name} idPrefix={`s-${s.id}`} />
          <form action={toggleSegmentAction.bind(null, s.id, !s.active)} style={{ marginTop: "0.75rem" }}>
            <button type="submit" className="button button--secondary">
              {s.active ? "Desativar segmento" : "Reativar segmento"}
            </button>
          </form>
        </details>
      ))}
    </>
  );
}
