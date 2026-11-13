import { describe, expect, it } from "vitest";
import { OBJECTIVE_LABELS, rankWeights } from "@/domain/intelligence/experience-catalog";

describe("rankWeights", () => {
  it("lists weighted objectives strongest first and drops zeros", () => {
    expect(
      rankWeights(
        { strengthen_experience: 2, increase_sales: 3, increase_traffic: 0, attract_new_audiences: 1 },
        OBJECTIVE_LABELS,
      ).map((w) => `${w.label} ${w.weight}`),
    ).toEqual(["Aumentar vendas 3", "Fortalecer a experiência 2", "Atrair novos públicos 1"]);
  });

  it("keeps the vocabulary order between equal weights", () => {
    expect(
      rankWeights({ strengthen_experience: 2, increase_sales: 2 }, OBJECTIVE_LABELS).map((w) => w.key),
    ).toEqual(["increase_sales", "strengthen_experience"]);
  });
});
