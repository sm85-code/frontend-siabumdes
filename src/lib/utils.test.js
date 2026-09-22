import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("merges class names and drops falsy values", () => {
    const skip = false;
    expect(cn("a", skip && "b", "c")).toBe("a c");
  });

  it("lets a later Tailwind class win over an earlier conflicting one", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
});
