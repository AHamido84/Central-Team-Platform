import { describe, expect, it } from "vitest";
import { isOverloaded, WORKLOAD_WARNING_THRESHOLD } from "./task-capacity";

describe("isOverloaded", () => {
  it("is false below the threshold", () => {
    expect(isOverloaded(WORKLOAD_WARNING_THRESHOLD - 1)).toBe(false);
  });

  it("is true at or above the threshold", () => {
    expect(isOverloaded(WORKLOAD_WARNING_THRESHOLD)).toBe(true);
    expect(isOverloaded(WORKLOAD_WARNING_THRESHOLD + 5)).toBe(true);
  });
});
