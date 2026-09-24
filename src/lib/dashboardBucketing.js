// Pure helpers for Dashboard's chart granularity/bucketing logic, kept in
// their own module (no React/API imports) so they can be unit tested in
// isolation and reused without pulling in Dashboard.jsx's side effects.

export const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

// Chart granularity/bucketing is driven by the selected PeriodFilter mode.
// "custom" is intentionally absent here: its granularity/bucket depend on
// the actual selected date range length, computed by chartConfigForPeriod().
export const MODE_CHART_CONFIG = {
  today: { granularity: "day", bucket: "day" },
  week: { granularity: "day", bucket: "day" },
  thisMonth: { granularity: "day", bucket: "week" },
  monthly: { granularity: "day", bucket: "week" },
  yearly: { granularity: "month", bucket: "month" },
};

// Parses a "YYYY-MM-DD" date string as LOCAL midnight (not UTC), since
// `new Date("YYYY-MM-DD")` is parsed as UTC by the spec while every other
// date operation in this file (getDay/getDate/getMonth/getFullYear) reads
// back in local time. On any timezone behind UTC this mismatch can shift
// the parsed date back by a day, corrupting week-bucket boundaries.
export function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

// Computes granularity/bucket for the "custom" mode from the actual
// selected range length, instead of a fixed mapping:
//  - up to 31 days: day buckets (fine enough detail, few enough points)
//  - up to ~120 days (~4 months): week buckets (keeps the chart legible,
//    a daily series over 4 months would be too dense)
//  - beyond that: month buckets (a long custom range behaves like "yearly")
export function chartConfigForPeriod(period) {
  if (period.mode !== "custom") {
    return MODE_CHART_CONFIG[period.mode] || MODE_CHART_CONFIG.yearly;
  }
  const start = parseLocalDate(period.startDate);
  const end = parseLocalDate(period.endDate);
  const days = Math.max(1, Math.round((end - start) / 86400000) + 1);
  if (days <= 31) return { granularity: "day", bucket: "day" };
  if (days <= 120) return { granularity: "day", bucket: "week" };
  return { granularity: "month", bucket: "month" };
}

function pad(n) { return String(n).padStart(2, "0"); }
function iso(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

export function labelize(key, bucket) {
  if (bucket === "day") {
    const parts = key.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
    return key;
  }
  if (bucket === "month") {
    const parts = key.split("-");
    if (parts.length >= 2) {
      const m = Number(parts[1]);
      return `${MONTHS[m - 1]?.slice(0, 3) || m} ${parts[0].slice(2)}`;
    }
    return key;
  }
  return key;
}

export function bucketize(list, targetBucket) {
  if (!list || list.length === 0) return [];
  if (targetBucket === "day" || targetBucket === "month") {
    return list.map((r) => ({ ...r, month: labelize(r.month, targetBucket) }));
  }
  const map = new Map();
  for (const r of list) {
    const d = parseLocalDate(r.month);
    if (isNaN(d.getTime())) continue;
    const day = d.getDay() || 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - (day - 1));
    const key = iso(monday);
    const prev = map.get(key) || { pendapatan: 0, beban: 0 };
    map.set(key, {
      pendapatan: prev.pendapatan + (r.pendapatan || 0),
      beban: prev.beban + (r.beban || 0),
    });
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([k, v]) => {
      const monday = parseLocalDate(k);
      return { month: `Minggu ${monday.getDate()}/${monday.getMonth() + 1}`, ...v };
    });
}
