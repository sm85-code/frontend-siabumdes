import { describe, it, expect } from "vitest";
import { chartConfigForPeriod, bucketize, parseLocalDate } from "./dashboardBucketing";

describe("chartConfigForPeriod", () => {
  it("keeps static mappings for non-custom modes", () => {
    expect(chartConfigForPeriod({ mode: "today" })).toEqual({ granularity: "day", bucket: "day" });
    expect(chartConfigForPeriod({ mode: "week" })).toEqual({ granularity: "day", bucket: "day" });
    expect(chartConfigForPeriod({ mode: "thisMonth" })).toEqual({ granularity: "day", bucket: "week" });
    expect(chartConfigForPeriod({ mode: "monthly" })).toEqual({ granularity: "day", bucket: "week" });
    expect(chartConfigForPeriod({ mode: "yearly" })).toEqual({ granularity: "month", bucket: "month" });
  });

  it("uses day bucketing for a short custom range (2026-09-01 to 2026-09-10)", () => {
    expect(chartConfigForPeriod({ mode: "custom", startDate: "2026-09-01", endDate: "2026-09-10" }))
      .toEqual({ granularity: "day", bucket: "day" });
  });

  it("uses week bucketing for a ~2 month custom range", () => {
    expect(chartConfigForPeriod({ mode: "custom", startDate: "2026-01-01", endDate: "2026-03-01" }))
      .toEqual({ granularity: "day", bucket: "week" });
  });

  it("uses month bucketing for a long custom range (> ~4 months)", () => {
    expect(chartConfigForPeriod({ mode: "custom", startDate: "2026-01-01", endDate: "2026-12-31" }))
      .toEqual({ granularity: "month", bucket: "month" });
  });
});

describe("parseLocalDate", () => {
  it("parses a YYYY-MM-DD string as local midnight, not UTC", () => {
    const d = parseLocalDate("2026-03-01");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2); // March, 0-indexed
    expect(d.getDate()).toBe(1);
    expect(d.getHours()).toBe(0);
  });
});

describe("bucketize week bucketing (timezone-safe, no day-shift across month boundary)", () => {
  it("groups a Feb/Mar boundary week correctly and labels it from the Monday key", () => {
    // 2026-03-01 is a Sunday; the week containing it starts Monday 2026-02-23.
    const list = [
      { month: "2026-02-28", pendapatan: 100, beban: 10 },
      { month: "2026-03-01", pendapatan: 200, beban: 20 },
    ];
    const result = bucketize(list, "week");
    expect(result).toHaveLength(1);
    // Monday of that week is Feb 23 -> label "Minggu 23/2"
    expect(result[0].month).toBe("Minggu 23/2");
    expect(result[0].pendapatan).toBe(300);
    expect(result[0].beban).toBe(30);
  });

  it("passes day/month bucket rows through labelize without shifting dates", () => {
    const list = [{ month: "2026-01-01", pendapatan: 5, beban: 1 }];
    const dayResult = bucketize(list, "day");
    expect(dayResult[0].month).toBe("01/01");
  });
});
