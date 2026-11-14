import { strToU8, zipSync, type Zippable } from "fflate";
import { describe, expect, it } from "vitest";
import { readSpreadsheet, SpreadsheetError } from "@/infrastructure/spreadsheet/read-spreadsheet";

/** Minimal .xlsx: one sheet with inline strings and a date-formatted number (numFmt 22 = m/d/yy h:mm). */
function xlsx(
  extra: Zippable = {},
  cells = [
    '<c r="A1" t="inlineStr"><is><t>Título</t></is></c><c r="B1" t="inlineStr"><is><t>Início</t></is></c>',
    '<c r="A2" t="inlineStr"><is><t>Show</t></is></c><c r="B2" s="1"><v>46376.625</v></c>',
  ],
) {
  const rows = cells.map((c, i) => `<row r="${i + 1}">${c}</row>`).join("");
  return Buffer.from(
    zipSync({
      "[Content_Types].xml": strToU8(
        '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
      ),
      "_rels/.rels": strToU8(
        '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
      ),
      "xl/workbook.xml": strToU8(
        '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Eventos" sheetId="1" r:id="rId1"/></sheets></workbook>',
      ),
      "xl/_rels/workbook.xml.rels": strToU8(
        '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
      ),
      "xl/styles.xml": strToU8(
        '<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cellXfs count="2"><xf numFmtId="0"/><xf numFmtId="22" applyNumberFormat="1"/></cellXfs></styleSheet>',
      ),
      "xl/worksheets/sheet1.xml": strToU8(
        `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows}</sheetData></worksheet>`,
      ),
      ...extra,
    }),
  );
}

const reject = (promise: Promise<unknown>) => expect(promise).rejects.toBeInstanceOf(SpreadsheetError);

describe("reading uploaded spreadsheets on the server (B-94)", () => {
  it("reads the first sheet of an .xlsx, with date cells as mall wall-clock text", async () => {
    expect(await readSpreadsheet(xlsx(), "eventos.XLSX")).toEqual([
      ["Título", "Início"],
      ["Show", "2026-12-20 15:00"],
    ]);
  });

  it("reads a UTF-8 CSV separated by ; (as Excel saves it)", async () => {
    const csv = Buffer.from("﻿Título;Início\r\nShow;20/12/2026 15:00\r\n", "utf8");
    expect(await readSpreadsheet(csv, "eventos.csv")).toEqual([
      ["Título", "Início"],
      ["Show", "20/12/2026 15:00"],
    ]);
  });

  it("trusts the content, not the name: a renamed text file or other extensions are refused", async () => {
    await expect(readSpreadsheet(Buffer.from("Título;Início\n"), "eventos.xlsx")).rejects.toThrow(
      "não é uma planilha .xlsx válida",
    );
    await expect(readSpreadsheet(xlsx(), "eventos.csv")).rejects.toThrow("não é um CSV de texto");
    await expect(readSpreadsheet(xlsx(), "eventos.xlsm")).rejects.toThrow("Envie um arquivo .xlsx ou .csv");
    await reject(readSpreadsheet(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0, 0, 0, 0]), "antigo.xls"));
  });

  it("refuses files with macros, oversized content or too large uploads, without reading them", async () => {
    await expect(
      readSpreadsheet(xlsx({ "xl/vbaProject.bin": new Uint8Array(10) }), "e.xlsx"),
    ).rejects.toThrow("macros");
    const bomb = xlsx({ "xl/media/big.bin": [new Uint8Array(30_000_000), { level: 9 }] });
    expect(bomb.length).toBeLessThan(1_000_000);
    await expect(readSpreadsheet(bomb, "e.xlsx")).rejects.toThrow("conteúdo grande demais");
    await expect(readSpreadsheet(Buffer.alloc(1_000_001, 65), "e.csv")).rejects.toThrow("até 1 MB");
    await expect(readSpreadsheet(Buffer.alloc(0), "e.csv")).rejects.toThrow("vazio");
  });

  it("refuses CSV that is not valid UTF-8 text", async () => {
    await expect(readSpreadsheet(Buffer.from([0x54, 0xed, 0x74, 0x75, 0x6c, 0x6f]), "e.csv")).rejects.toThrow(
      "UTF-8",
    );
    await expect(readSpreadsheet(Buffer.from("a;b\n\u0000;c"), "e.csv")).rejects.toThrow(
      "não é um CSV de texto",
    );
  });
});
