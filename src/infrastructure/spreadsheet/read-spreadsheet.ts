import { unzipSync } from "fflate";
import { InvalidInputError, readSheet } from "read-excel-file/node";
import { cellText, IMPORT_LIMITS } from "@/domain/events/event-import";
import { CsvError, parseCsv } from "@/domain/text/csv";

/** A file that cannot be read as an event spreadsheet; the message is shown to the administrator. */
export class SpreadsheetError extends Error {}

/** Uncompressed size allowed inside an .xlsx (guards against zip bombs). */
const MAX_UNCOMPRESSED_BYTES = 20_000_000;
const MAX_ZIP_ENTRIES = 200;
/** VBA projects (macros) and ActiveX controls. */
const ACTIVE_CONTENT = /(^|\/)(vbaProject\.bin|vbaData\.xml)$|(^|\/)activeX\//i;
const ZIP_SIGNATURE = [0x50, 0x4b, 0x03, 0x04];

const READ_ERRORS: Record<string, string> = {
  XLS_FILE_NOT_SUPPORTED: "Arquivos .xls antigos não são aceitos. Salve como .xlsx ou .csv.",
  NO_DATA: "A planilha não tem dados.",
};

function extensionOf(fileName: string): "xlsx" | "csv" | null {
  const match = /\.([a-z0-9]+)$/i.exec(fileName.trim());
  const extension = match?.[1]?.toLowerCase();
  return extension === "xlsx" || extension === "csv" ? extension : null;
}

function isZip(bytes: Uint8Array): boolean {
  return ZIP_SIGNATURE.every((byte, i) => bytes[i] === byte);
}

/** Inspects the ZIP directory without inflating anything: no macros, no oversized content. */
function inspectXlsx(bytes: Uint8Array): void {
  let entries = 0;
  let uncompressed = 0;
  let macros = false;
  try {
    unzipSync(bytes, {
      filter: (file) => {
        entries++;
        uncompressed += file.originalSize;
        if (ACTIVE_CONTENT.test(file.name)) macros = true;
        return false;
      },
    });
  } catch {
    throw new SpreadsheetError("O arquivo não é uma planilha .xlsx válida.");
  }
  if (macros)
    throw new SpreadsheetError("A planilha contém macros e não foi aceita. Salve como .xlsx sem macros.");
  if (entries > MAX_ZIP_ENTRIES || uncompressed > MAX_UNCOMPRESSED_BYTES)
    throw new SpreadsheetError("A planilha tem conteúdo grande demais para importar.");
}

async function readXlsx(bytes: Buffer): Promise<string[][]> {
  if (!isZip(bytes)) throw new SpreadsheetError("O arquivo não é uma planilha .xlsx válida.");
  inspectXlsx(bytes);
  try {
    const rows = await readSheet(bytes, 1);
    return rows.map((row) =>
      row.map((value) => {
        // Dates come back with the wall-clock time in UTC fields; keep them as "YYYY-MM-DD HH:mm".
        if (value instanceof Date) return cellText(value).replace("T", " ");
        return cellText(value as string | number | boolean | null);
      }),
    );
  } catch (error) {
    if (error instanceof InvalidInputError)
      throw new SpreadsheetError(READ_ERRORS[error.code] ?? "O arquivo não é uma planilha .xlsx válida.");
    throw new SpreadsheetError("Não foi possível ler a planilha. Confira se o arquivo abre no Excel.");
  }
}

function readCsv(bytes: Buffer): string[][] {
  if (isZip(bytes) || bytes.includes(0)) throw new SpreadsheetError("O arquivo não é um CSV de texto.");
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new SpreadsheetError(
      "O CSV precisa estar em UTF-8. No Excel, use “CSV UTF-8 (delimitado por vírgulas)”.",
    );
  }
  try {
    return parseCsv(text);
  } catch (error) {
    if (error instanceof CsvError) throw new SpreadsheetError(error.message);
    throw error;
  }
}

/**
 * Reads the first sheet of an uploaded .xlsx or .csv as text cells (B-94).
 * Checks extension, size and content signature on the server; never runs formulas or macros
 * (formulas yield their saved values) and never fetches anything the cells point to.
 */
export async function readSpreadsheet(bytes: Buffer, fileName: string): Promise<string[][]> {
  const extension = extensionOf(fileName);
  if (!extension) throw new SpreadsheetError("Envie um arquivo .xlsx ou .csv.");
  if (bytes.length === 0) throw new SpreadsheetError("O arquivo está vazio.");
  if (bytes.length > IMPORT_LIMITS.maxBytes) throw new SpreadsheetError("Envie um arquivo de até 1 MB.");
  return extension === "xlsx" ? readXlsx(bytes) : readCsv(bytes);
}
