import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { listCategories } from "@/application/catalog/catalog";
import { getDb } from "@/infrastructure/db";
import { SuggestionForm } from "@/ui/public/suggestion-form";
import { submitSuggestionAction } from "./actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Sugerir um evento", robots: { index: false } };

/** Suggestions wall (B-29): visitors send ideas; only the mall's team reads them. */
export default async function SuggestPage() {
  const categories = await listCategories(await getDb());
  // Server component rendered per request: this instant is when the form was shown (minimum filling time).
  // eslint-disable-next-line react-hooks/purity
  const startedAt = Date.now();

  return (
    <div className="rating-page">
      <h1>Sugira um evento</h1>
      <p>
        Que evento você gostaria de ver no shopping? Sua ideia vai direto para a equipe que monta a agenda. As
        sugestões não são publicadas no site.
      </p>
      <SuggestionForm
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        startedAt={startedAt}
        action={submitSuggestionAction}
      />
      <p className="callout callout--quiet">
        <ShieldCheck size={20} aria-hidden="true" />
        <span>
          Sem cadastro. Para limitar a 3 sugestões por dia, guardamos por 30 dias um identificador aleatório
          deste aparelho, pseudonimizado. <Link href="/privacidade">Saiba mais</Link>.
        </span>
      </p>
    </div>
  );
}
