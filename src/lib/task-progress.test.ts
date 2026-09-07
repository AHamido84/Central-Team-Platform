import { describe, expect, it } from "vitest";
import { taskProgressPercent } from "./task-progress";

describe("taskProgressPercent", () => {
  it("maps every status to a fixed percent", () => {
    expect(taskProgressPercent("TODO")).toBe(0);
    expect(taskProgressPercent("IN_PROGRESS")).toBe(50);
    expect(taskProgressPercent("IN_REVIEW")).toBe(80);
    expect(taskProgressPercent("DONE")).toBe(100);
    expect(taskProgressPercent("CANCELLED")).toBe(0);
  });
});
