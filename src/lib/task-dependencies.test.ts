import { describe, expect, it } from "vitest";
import { wouldCreateCycle, canTransitionStatus } from "./task-dependencies";

describe("wouldCreateCycle", () => {
  it("rejects a task depending on itself", () => {
    expect(wouldCreateCycle([], { taskId: "A", dependsOnTaskId: "A" })).toBe(true);
  });

  it("allows a simple chain", () => {
    const edges = [{ taskId: "B", dependsOnTaskId: "A" }];
    expect(wouldCreateCycle(edges, { taskId: "C", dependsOnTaskId: "B" })).toBe(false);
  });

  it("rejects a direct back-edge (A depends on B, B depends on A)", () => {
    const edges = [{ taskId: "B", dependsOnTaskId: "A" }];
    expect(wouldCreateCycle(edges, { taskId: "A", dependsOnTaskId: "B" })).toBe(true);
  });

  it("rejects a transitive cycle (A->B->C, then C->A)", () => {
    const edges = [
      { taskId: "B", dependsOnTaskId: "A" },
      { taskId: "C", dependsOnTaskId: "B" },
    ];
    expect(wouldCreateCycle(edges, { taskId: "A", dependsOnTaskId: "C" })).toBe(true);
  });
});

describe("canTransitionStatus", () => {
  it("always allows moving to a pre-start status", () => {
    expect(canTransitionStatus("TODO", [{ status: "TODO" }])).toBe(true);
    expect(canTransitionStatus("CANCELLED", [{ status: "TODO" }])).toBe(true);
    expect(canTransitionStatus("BLOCKED", [{ status: "TODO" }])).toBe(true);
  });

  it("blocks starting work while a dependency is incomplete", () => {
    expect(canTransitionStatus("IN_PROGRESS", [{ status: "TODO" }])).toBe(false);
  });

  it("allows starting work once every dependency is completed", () => {
    expect(canTransitionStatus("IN_PROGRESS", [{ status: "COMPLETED" }, { status: "COMPLETED" }])).toBe(
      true,
    );
  });

  it("allows any transition when there are no dependencies", () => {
    expect(canTransitionStatus("COMPLETED", [])).toBe(true);
  });
});
