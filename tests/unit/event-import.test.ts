import { describe, expect, it } from "vitest";
import {
  IMPORT_COLUMNS,
  parseImportRow,
  parseLocalDateTimeCell,
  readImportHeader,
} from "@/domain/events/event-import";

const HEADER = [
  "Código",
  "Título",
  "Descrição",
  "Início",
  "Término",
  "Espaço",
  "Detalhe do local",
  "Categoria",
  "Acessibilidade",
  "Lojas",
  "Entrada",
  "Vagas",
  "Vagas exibidas",
  "Dias para avaliar",
  "Publicar",
];

describe("spreadsheet header (B-94)", () => {
  it("recognises the template columns regardless of case, accents and extra spaces", () => {
    const header = readImportHeader(["  TITULO ", "descricao", "inicio", "termino", "espaco", "categoria"]);
    expect(header.errors).toEqual([]);
    expect(header.columns.get("title")).toBe(0);
    expect(header.columns.get("venue")).toBe(4);
    expect(header.complete).toBe(false);
    expect(readImportHeader(HEADER)).toMatchObject({ errors: [], warnings: [], complete: true });
    expect(IMPORT_COLUMNS.map((c) => c.header)).toEqual(HEADER);
  });

  it("reports missing required and repeated columns as file errors", () => {
    expect(readImportHeader(["Título", "Início"]).errors).toEqual([
      "Falta a coluna obrigatória “Descrição”.",
      "Falta a coluna obrigatória “Término”.",
      "Falta a coluna obrigatória “Espaço”.",
      "Falta a coluna obrigatória “Categoria”.",
    ]);
    expect(readImportHeader([...HEADER, "titulo"]).errors).toEqual([
      "A coluna “Título” aparece mais de uma vez.",
    ]);
  });

  it("ignores banner and unknown columns with a warning (banners are never downloaded)", () => {
    const header = readImportHeader([...HEADER, "Banner", "Observações internas", ""]);
    expect(header.errors).toEqual([]);
    expect(header.warnings).toEqual([
      "A coluna “Banner” foi ignorada: banners não são importados; envie a imagem na tela do evento.",
      "A coluna “Observações internas” foi ignorada: não faz parte do modelo.",
    ]);
  });
});

describe("dates in mall time", () => {
  it("accepts Brazilian and ISO text, keeping the wall-clock time", () => {
    expect(parseLocalDateTimeCell("20/12/2026 18:30")).toBe("2026-12-20T18:30");
    expect(parseLocalDateTimeCell("5/1/2027 9:05")).toBe("2027-01-05T09:05");
    expect(parseLocalDateTimeCell("2026-12-20 18:30")).toBe("2026-12-20T18:30");
    expect(parseLocalDateTimeCell("2026-12-20T18:30:00")).toBe("2026-12-20T18:30");
  });

  it("reads Excel date cells by their wall-clock (UTC) fields and Excel serial numbers", () => {
    expect(parseLocalDateTimeCell(new Date(Date.UTC(2026, 11, 20, 18, 30)))).toBe("2026-12-20T18:30");
    // 46376.5 = 2026-12-20 12:00 in Excel's 1900 date system.
    expect(parseLocalDateTimeCell(46376.5)).toBe("2026-12-20T12:00");
  });

  it("rejects impossible dates, missing times and free text", () => {
    for (const value of ["31/02/2026 10:00", "20/12/2026", "20/12/2026 25:00", "amanhã", "", null, true])
      expect(parseLocalDateTimeCell(value), String(value)).toBeNull();
  });
});

describe("rows", () => {
  const header = readImportHeader(HEADER);
  const row = (overrides: Partial<Record<string, unknown>> = {}) => {
    const values: Record<string, unknown> = {
      Código: "natal-2026-01",
      Título: "Oficina de Natal",
      Descrição: "Oficina de enfeites para crianças",
      Início: "20/12/2026 15:00",
      Término: "20/12/2026 17:00",
      Espaço: "Praça Central",
      "Detalhe do local": "Perto da fonte",
      Categoria: "Infantil",
      Acessibilidade: "Intérprete de Libras; Rampa de acesso",
      Lojas: "Livraria Leitura",
      Entrada: "Gratuita",
      Vagas: "Ordem de chegada",
      "Vagas exibidas": 30,
      "Dias para avaliar": "",
      Publicar: "Sim",
      ...overrides,
    };
    return HEADER.map((h) => values[h] as string | number | null);
  };

  it("turns a valid row into form values, names to resolve and a normalised code", () => {
    expect(parseImportRow(row(), header, 2)).toEqual({
      line: 2,
      code: "NATAL-2026-01",
      publish: true,
      values: {
        title: "Oficina de Natal",
        description: "Oficina de enfeites para crianças",
        startsAt: "2026-12-20T15:00",
        endsAt: "2026-12-20T17:00",
        locationDetail: "Perto da fonte",
        admissionInfo: "Gratuita",
        capacityMode: "first_come",
        displayedCapacity: "30",
        ratingPeriodDays: "",
      },
      names: {
        venue: "Praça Central",
        category: "Infantil",
        features: ["Intérprete de Libras", "Rampa de acesso"],
        stores: ["Livraria Leitura"],
      },
      errors: [],
      warnings: [],
    });
  });

  it("defaults to unlimited places and a draft when Vagas and Publicar are empty", () => {
    const parsed = parseImportRow(
      row({ Código: "", Vagas: "", "Vagas exibidas": "", Publicar: "" }),
      header,
      3,
    );
    expect(parsed).toMatchObject({ code: null, publish: false, values: { capacityMode: "unlimited" } });
    expect(parsed!.errors).toEqual([]);
  });

  it("flags each problem by column", () => {
    const parsed = parseImportRow(
      row({ Código: "tem espaço", Início: "31/02/2026 10:00", Vagas: "talvez", Publicar: "depois" }),
      header,
      4,
    );
    expect(parsed!.errors).toEqual([
      { column: "Código", message: "Use só letras, números, ponto, hífen ou sublinhado (até 64)." },
      { column: "Início", message: "Data e hora inválidas. Use dd/mm/aaaa hh:mm." },
      { column: "Vagas", message: "Use “Livre” ou “Ordem de chegada”." },
      { column: "Publicar", message: "Use “Sim” ou “Não”." },
    ]);
  });

  it("recognises a fully empty row so it can be skipped silently", () => {
    expect(
      parseImportRow(
        HEADER.map(() => null),
        header,
        9,
      ),
    ).toBeNull();
    expect(
      parseImportRow(
        HEADER.map(() => "  "),
        header,
        9,
      ),
    ).toBeNull();
  });
});
