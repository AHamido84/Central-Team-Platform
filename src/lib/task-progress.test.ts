import { describe, expect, it } from "vitest";
import { taskProgressPercent } from "./task-progress";

describe("taskProgressPercent", () => {
  it("maps every status to a fixed percent", () => {
    expect(taskProgressPercent("TODO")).toBe(0);
    expect(taskProgressPercent("IN_PROGRESS")).toBe(50);
    expect(taskProgressPercent("BLOCKED")).toBe(25);
    expect(taskProgressPercent("INTERNAL_REVIEW")).toBe(75);
    expect(taskProgressPercent("CLIENT_REVIEW")).toBe(85);
    expect(taskProgressPercent("CHANGES_REQUIRED")).toBe(60);
    expect(taskProgressPercent("COMPLETED")).toBe(100);
    expect(taskProgressPercent("CANCELLED")).toBe(0);
    expect(taskProgressPercent("ARCHIVED")).toBe(0);
  });
});
