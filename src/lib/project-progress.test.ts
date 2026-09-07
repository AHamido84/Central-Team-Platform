import { describe, expect, it } from "vitest";
import { computeProjectProgress } from "./project-progress";

describe("computeProjectProgress", () => {
  it("returns 0% for an empty scope", () => {
    expect(computeProjectProgress([])).toEqual({
      percent: 0,
      totalQty: 0,
      plannedQty: 0,
      inProgressQty: 0,
      completedQty: 0,
    });
  });

  it("weights progress by quantity, matching the spec's 78% example shape", () => {
    const result = computeProjectProgress([
      { quantity: 20, status: "COMPLETED" },
      { quantity: 5, status: "IN_PROGRESS" },
      { quantity: 3, status: "PLANNED" },
    ]);
    expect(result.totalQty).toBe(28);
    expect(result.completedQty).toBe(20);
    expect(result.percent).toBe(Math.round((20 / 28) * 100));
  });

  it("excludes cancelled items from the total", () => {
    const result = computeProjectProgress([
      { quantity: 10, status: "COMPLETED" },
      { quantity: 10, status: "CANCELLED" },
    ]);
    expect(result.totalQty).toBe(10);
    expect(result.percent).toBe(100);
  });

  it("defaults a null quantity to 1", () => {
    const result = computeProjectProgress([
      { quantity: null, status: "COMPLETED" },
      { quantity: null, status: "PLANNED" },
    ]);
    expect(result.totalQty).toBe(2);
    expect(result.percent).toBe(50);
  });
});
