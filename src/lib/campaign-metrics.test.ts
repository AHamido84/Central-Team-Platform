import { describe, expect, it } from "vitest";
import { computeCTR, computeCPC, computeCPL, computeROAS } from "./campaign-metrics";

describe("campaign metric derivations", () => {
  it("computes CTR as a percentage", () => {
    expect(computeCTR(50, 1000)).toBe(5);
  });

  it("computes CPC, CPL, ROAS from raw totals", () => {
    expect(computeCPC(100, 50)).toBe(2);
    expect(computeCPL(100, 10)).toBe(10);
    expect(computeROAS(500, 100)).toBe(5);
  });

  it("returns null instead of Infinity/NaN when the denominator is zero", () => {
    expect(computeCTR(0, 0)).toBeNull();
    expect(computeCPC(0, 0)).toBeNull();
    expect(computeCPL(0, 0)).toBeNull();
    expect(computeROAS(0, 0)).toBeNull();
  });
});
