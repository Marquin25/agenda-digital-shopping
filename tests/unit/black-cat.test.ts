import { describe, expect, it } from "vitest";
import { isLuckyActivation, LUCKY_NUMBER } from "@/ui/public/black-cat";

describe("black cat easter egg", () => {
  it("celebrates on the 13th activation and on every 13th after it", () => {
    expect(LUCKY_NUMBER).toBe(13);
    expect([1, 12, 14, 25].map(isLuckyActivation)).toEqual([false, false, false, false]);
    expect([13, 26, 39].map(isLuckyActivation)).toEqual([true, true, true]);
  });

  it("never celebrates before the first activation", () => {
    expect(isLuckyActivation(0)).toBe(false);
  });
});
