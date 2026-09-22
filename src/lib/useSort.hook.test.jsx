// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useSort } from "./useSort";

// Behavior-parity test for the TanStack Table migration: same rows in,
// same order out, same toggle semantics as the original hand-rolled
// Array.sort() implementation.
const rows = [
  { id: "a", name: "Charlie", amount: 300 },
  { id: "b", name: "alpha", amount: 100 },
  { id: "c", name: "Bravo", amount: 200 },
  { id: "d", name: "Delta", amount: null },
];

describe("useSort", () => {
  it("returns rows unsorted when there is no default/active sort key", () => {
    const { result } = renderHook(() => useSort(rows));
    expect(result.current.sorted.map((r) => r.id)).toEqual(["a", "b", "c", "d"]);
    expect(result.current.sortKey).toBeNull();
  });

  it("sorts by the default key/direction on first render", () => {
    const { result } = renderHook(() => useSort(rows, "amount", "asc"));
    expect(result.current.sorted.map((r) => r.id)).toEqual(["b", "c", "a", "d"]);
    expect(result.current.sortKey).toBe("amount");
    expect(result.current.sortDir).toBe("asc");
  });

  it("nulls sort last ascending, and since desc reverses that whole order they land first", () => {
    // Matches the original hand-rolled hook exactly: it did
    // `arr.sort(compare); if (desc) arr.reverse()` -- nulls are pushed last
    // by the comparator (regardless of direction), then the reverse for
    // "desc" flips the entire ascending result, nulls included.
    const { result } = renderHook(() => useSort(rows, "amount", "desc"));
    expect(result.current.sorted.map((r) => r.id)).toEqual(["d", "a", "c", "b"]);
  });

  it("toggleSort: same key flips direction, different key resets to asc", () => {
    const { result } = renderHook(() => useSort(rows, "amount", "asc"));

    act(() => result.current.toggleSort("amount"));
    expect(result.current.sortDir).toBe("desc");
    expect(result.current.sorted.map((r) => r.id)).toEqual(["d", "a", "c", "b"]);

    act(() => result.current.toggleSort("name"));
    expect(result.current.sortKey).toBe("name");
    expect(result.current.sortDir).toBe("asc");
    expect(result.current.sorted.map((r) => r.id)).toEqual(["b", "c", "a", "d"]);
  });

  it("sortIndicator reflects the active column and direction", () => {
    const { result } = renderHook(() => useSort(rows, "amount", "asc"));
    expect(result.current.sortIndicator("amount")).toContain("↑");
    expect(result.current.sortIndicator("name")).toContain("⇅");
  });
});
