import { describe, expect, it } from "vitest";
import { areaChart } from "@/ui/admin/area-chart-geometry";

const box = { width: 100, height: 50 };

describe("area chart geometry", () => {
  it("spreads the points across the width and scales the highest value to the top", () => {
    const chart = areaChart([0, 5, 10], box);
    expect(chart.points).toEqual([
      { x: 0, y: 50 },
      { x: 50, y: 25 },
      { x: 100, y: 0 },
    ]);
    expect(chart.line).toBe("M0 50 L50 25 L100 0");
    expect(chart.area).toBe("M0 50 L50 25 L100 0 L100 50 L0 50 Z");
  });

  it("can share the scale of another series so both lines are comparable", () => {
    expect(areaChart([0, 5], box, 20).points).toEqual([
      { x: 0, y: 50 },
      { x: 100, y: 37.5 },
    ]);
  });

  it("draws a flat line on the baseline when every value is zero", () => {
    expect(areaChart([0, 0], box).line).toBe("M0 50 L100 50");
  });

  it("centres a single point", () => {
    expect(areaChart([7], box).points).toEqual([{ x: 50, y: 0 }]);
  });

  it("draws nothing without data", () => {
    expect(areaChart([], box)).toEqual({ points: [], line: "", area: "", max: 0 });
  });
});
