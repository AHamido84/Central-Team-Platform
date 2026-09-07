import { describe, expect, it } from "vitest";
import {
  isInternalUser,
  isClientUser,
  assertClientScope,
  ForbiddenError,
  type AuthenticatedUser,
} from "./authorization-core";

function makeUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: "user-1",
    roleId: "role-1",
    roleName: "STAFF",
    clientId: null,
    ...overrides,
  };
}

describe("isInternalUser / isClientUser", () => {
  it("treats a null clientId as internal staff", () => {
    const user = makeUser({ clientId: null });
    expect(isInternalUser(user)).toBe(true);
    expect(isClientUser(user)).toBe(false);
  });

  it("treats a set clientId as a client-portal user", () => {
    const user = makeUser({ clientId: "client-a" });
    expect(isInternalUser(user)).toBe(false);
    expect(isClientUser(user)).toBe(true);
  });
});

describe("assertClientScope", () => {
  it("allows internal staff to access any client", () => {
    const user = makeUser({ clientId: null });
    expect(() => assertClientScope(user, "client-a")).not.toThrow();
    expect(() => assertClientScope(user, "client-b")).not.toThrow();
  });

  it("allows a client user to access their own client's data", () => {
    const user = makeUser({ clientId: "client-a" });
    expect(() => assertClientScope(user, "client-a")).not.toThrow();
  });

  it("blocks a client user from accessing a different client's data", () => {
    const user = makeUser({ clientId: "client-a" });
    expect(() => assertClientScope(user, "client-b")).toThrow(ForbiddenError);
  });
});
