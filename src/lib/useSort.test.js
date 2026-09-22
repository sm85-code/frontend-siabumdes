import { describe, expect, it } from "vitest";
import { compareValues } from "./useSort";

// Unit test for the pure comparator in the default (node) test environment.
// See useSort.hook.test.jsx for the full hook behavior (rendered with
// jsdom), including how "desc" interacts with these null semantics.
describe("compareValues", () => {
  it("compares numbers numerically, not as strings", () => {
    expect(compareValues(2, 10)).toBeLessThan(0);
    expect(compareValues(10, 2)).toBeGreaterThan(0);
    expect(compareValues(5, 5)).toBe(0);
  });

  it("compares strings with Indonesian locale + natural numeric ordering", () => {
    expect(compareValues("item2", "item10")).toBeLessThan(0);
    expect(compareValues("Anggaran", "Belanja")).toBeLessThan(0);
  });

  it("always sorts null/undefined to the end regardless of the other value", () => {
    expect(compareValues(null, 5)).toBeGreaterThan(0);
    expect(compareValues(5, null)).toBeLessThan(0);
    expect(compareValues(undefined, "x")).toBeGreaterThan(0);
    expect(compareValues(null, null)).toBe(0);
    expect(compareValues(null, undefined)).toBe(0);
  });
});
