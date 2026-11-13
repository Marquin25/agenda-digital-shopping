export function ReviewBadge({ status }: { status: "draft" | "reviewed" }) {
  return status === "draft" ? (
    <span className="status status--review-draft">Rascunho para revisão</span>
  ) : (
    <span className="status status--reviewed">Revisado</span>
  );
}
