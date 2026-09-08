import { describe, expect, it } from "vitest";
import { requestProgressPercent, allTasksComplete } from "./request-progress";

describe("requestProgressPercent", () => {
  it("is 0 for a request with no tasks", () => {
    expect(requestProgressPercent([])).toBe(0);
  });

  it("computes completed / total, excluding cancelled tasks", () => {
    const tasks = [
      { status: "COMPLETED" as const },
      { status: "COMPLETED" as const },
      { status: "COMPLETED" as const },
      { status: "TODO" as const },
      { status: "IN_PROGRESS" as const },
      { status: "CANCELLED" as const },
    ];
    // 3 completed out of 5 counted (cancelled excluded) = 60%
    expect(requestProgressPercent(tasks)).toBe(60);
  });

  it("is 100 when every counted task is completed", () => {
    expect(requestProgressPercent([{ status: "COMPLETED" }, { status: "CANCELLED" }])).toBe(100);
  });
});

describe("allTasksComplete", () => {
  it("is true for zero tasks (nothing decomposed yet)", () => {
    expect(allTasksComplete([])).toBe(true);
  });

  it("ignores cancelled tasks", () => {
    expect(allTasksComplete([{ status: "COMPLETED" }, { status: "CANCELLED" }])).toBe(true);
  });

  it("is false while any counted task is incomplete", () => {
    expect(allTasksComplete([{ status: "COMPLETED" }, { status: "IN_PROGRESS" }])).toBe(false);
  });
});
