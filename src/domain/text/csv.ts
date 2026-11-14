/**
 * Minimal RFC 4180 CSV reader and writer for spreadsheets exchanged with Excel (B-94).
 * Reading accepts ";" (Excel in pt-BR) or "," (detected from the first line); writing always uses ";"
 * with a UTF-8 BOM so Excel opens accents correctly.
 */

export class CsvError extends Error {}

function detectDelimiter(text: string): ";" | "," {
  const firstLine = text.slice(0, text.search(/\r?\n|$/));
  const count = (char: string) => firstLine.split(char).length - 1;
  return count(",") > count(";") ? "," : ";";
}

export function parseCsv(input: string): string[][] {
  const text = input.startsWith("﻿") ? input.slice(1) : input;
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i]!;
    if (quoted) {
      if (char !== '"') cell += char;
      else if (text[i + 1] === '"') {
        cell += '"';
        i++;
      } else quoted = false;
    } else if (char === '"' && cell === "") quoted = true;
    else if (char === delimiter) {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else cell += char;
  }
  if (quoted) throw new CsvError("O arquivo CSV tem aspas sem fechamento.");
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/** Cells starting with these characters would run as formulas in a spreadsheet (CSV injection). */
const FORMULA_START = /^[=+\-@\t\r]/;

function csvCell(value: string | number | null | undefined): string {
  let text = value == null ? "" : String(value);
  if (typeof value === "string" && FORMULA_START.test(text)) text = `'${text}`;
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: (string | number | null | undefined)[][]): string {
  return `﻿${rows.map((r) => r.map(csvCell).join(";")).join("\r\n")}\r\n`;
}
