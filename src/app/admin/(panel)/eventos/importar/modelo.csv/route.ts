import { can } from "@/domain/auth/permissions";
import { IMPORT_COLUMNS } from "@/domain/events/event-import";
import { toCsv } from "@/domain/text/csv";
import { getCurrentAdmin } from "@/infrastructure/web/admin-session";

/** Empty template with one example row, built from the same column list the importer reads. */
export async function GET() {
  const admin = await getCurrentAdmin();
  if (!admin || admin.mustChangePassword || !can(admin.role, "events:manage"))
    return new Response("Unauthorized", { status: 401 });
  const csv = toCsv([IMPORT_COLUMNS.map((c) => c.header), IMPORT_COLUMNS.map((c) => c.example)]);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="modelo-importacao-eventos.csv"',
      "cache-control": "no-store",
    },
  });
}
