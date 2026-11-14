import { getEventImport, importErrorReport, previewEventImport } from "@/application/events/event-import";
import { can } from "@/domain/auth/permissions";
import { getDb } from "@/infrastructure/db";
import { getCurrentAdmin } from "@/infrastructure/web/admin-session";

/** Rows with errors or warnings of a staged import, to fix the spreadsheet in Excel. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin();
  if (!admin || admin.mustChangePassword || !can(admin.role, "events:manage"))
    return new Response("Unauthorized", { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response("Not found", { status: 404 });
  const db = await getDb();
  const staged = await getEventImport(db, id);
  if (!staged) return new Response("Not found", { status: 404 });
  const report = importErrorReport(await previewEventImport(db, staged.rows));
  return new Response(report, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="relatorio-importacao.csv"',
      "cache-control": "no-store",
    },
  });
}
