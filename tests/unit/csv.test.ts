import { describe, expect, it } from "vitest";
import { parseCsv, toCsv } from "@/domain/text/csv";

describe("CSV reading (Excel “CSV UTF-8”)", () => {
  it("detects ; or , from the header, strips the BOM and handles quotes and line breaks", () => {
    expect(parseCsv('﻿Título;Descrição\r\n"Show; ao vivo";"Linha 1\nLinha 2"\r\n')).toEqual([
      ["Título", "Descrição"],
      ["Show; ao vivo", "Linha 1\nLinha 2"],
    ]);
    expect(parseCsv('a,b\n"x ""y""",z')).toEqual([
      ["a", "b"],
      ['x "y"', "z"],
    ]);
  });

  it("keeps empty cells and ignores a trailing newline", () => {
    expect(parseCsv("a;b;c\n1;;3\n")).toEqual([
      ["a", "b", "c"],
      ["1", "", "3"],
    ]);
  });

  it("rejects an unterminated quoted cell", () => {
    expect(() => parseCsv('a;b\n"aberto;2')).toThrow("aspas");
  });
});

describe("CSV writing", () => {
  it("uses ; with a BOM for Excel and neutralises formulas (CSV injection)", () => {
    expect(
      toCsv([
        ["Linha", "Mensagem"],
        [2, "=HYPERLINK(1)"],
        [3, 'diz "oi"; tchau'],
      ]),
    ).toBe('﻿Linha;Mensagem\r\n2;\'=HYPERLINK(1)\r\n3;"diz ""oi""; tchau"\r\n');
    expect(toCsv([["+1", "-2", "@x", "\tz"]])).toBe("﻿'+1;'-2;'@x;'\tz\r\n");
  });
});
