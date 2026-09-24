import { useEffect, useState } from "react";
import { CalendarBlank, Check } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// ---- Date helpers -------------------------------------------------------

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const pad = (n) => String(n).padStart(2, "0");
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayDate = () => new Date();
const todayIso = () => iso(todayDate());

function lastDayOfMonth(year, month /* 1-12 */) {
  return new Date(year, month, 0).getDate();
}

function monthRange(year, month) {
  return {
    startDate: `${year}-${pad(month)}-01`,
    endDate: `${year}-${pad(month)}-${pad(lastDayOfMonth(year, month))}`,
  };
}

function thisWeekRange() {
  const now = todayDate();
  const dow = now.getDay() || 7; // 1 (Mon) .. 7 (Sun)
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { startDate: iso(monday), endDate: iso(sunday) };
}

function parseYmd(s) {
  const [y, m, d] = String(s || "").split("-").map(Number);
  return { y, m, d };
}

// Resolve a mode + its draft params into a concrete {startDate, endDate}.
function resolveRange(mode, params) {
  switch (mode) {
    case "today": {
      const t = todayIso();
      return { startDate: t, endDate: t };
    }
    case "week":
      return thisWeekRange();
    case "thisMonth": {
      const now = todayDate();
      return monthRange(now.getFullYear(), now.getMonth() + 1);
    }
    case "monthly": {
      const { monthValue } = params;
      const { y, m } = parseYmd(`${monthValue}-01`);
      return monthRange(y, m);
    }
    case "yearly": {
      const y = params.yearValue;
      return { startDate: `${y}-01-01`, endDate: `${y}-12-31` };
    }
    case "custom":
      return { startDate: params.customStart, endDate: params.customEnd };
    default: {
      const t = todayIso();
      return { startDate: t, endDate: t };
    }
  }
}

function fmtID(dateStr) {
  const { y, m, d } = parseYmd(dateStr);
  if (!y || !m || !d) return dateStr || "";
  return `${d} ${MONTHS_ID[m - 1]} ${y}`;
}

// Build a human label for a resolved range, collapsing full months/years.
function fmtRangeLabel(startDate, endDate) {
  if (!startDate || !endDate) return "";
  if (startDate === endDate) return fmtID(startDate);
  const a = parseYmd(startDate);
  const b = parseYmd(endDate);
  const isFullYear = a.m === 1 && a.d === 1 && b.m === 12 && b.d === 31 && a.y === b.y;
  if (isFullYear) return `Tahun ${a.y}`;
  const isFullMonth = a.d === 1 && b.d === lastDayOfMonth(b.y, b.m) && a.y === b.y && a.m === b.m;
  if (isFullMonth) return `${MONTHS_ID[a.m - 1]} ${a.y}`;
  if (a.y === b.y && a.m === b.m) return `${a.d}–${b.d} ${MONTHS_ID[a.m - 1]} ${a.y}`;
  return `${fmtID(startDate)} – ${fmtID(endDate)}`;
}

function monthValueFromDate(dateStr) {
  const { y, m } = parseYmd(dateStr);
  if (!y || !m) return `${todayDate().getFullYear()}-${pad(todayDate().getMonth() + 1)}`;
  return `${y}-${pad(m)}`;
}

function yearValueFromDate(dateStr) {
  const { y } = parseYmd(dateStr);
  return y || todayDate().getFullYear();
}

const DEFAULT_YEAR_RANGE = [2022, 2030];

const LEFT_OPTIONS = [
  { mode: "today", label: "Hari Ini" },
  { mode: "week", label: "Minggu Ini" },
  { mode: "thisMonth", label: "Bulan Ini" },
  { divider: true },
  { mode: "monthly", label: "Bulanan" },
  { mode: "yearly", label: "Tahunan" },
  { divider: true },
  { mode: "custom", label: "Custom" },
];

/**
 * PeriodFilter — a single reusable period/date-range picker.
 *
 * Renders a trigger button showing the active resolved range, which opens
 * a popover with a left-hand list of period types and a right-hand panel
 * that adapts to the selected type (pure presets, a month picker, a year
 * picker, or a custom start/end date range).
 *
 * value:    { startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD", mode? }
 * onChange: (next: { startDate, endDate, mode, label }) => void
 * defaultMode: "today" | "week" | "thisMonth" | "monthly" | "yearly" | "custom"
 *              used to seed the mode when `value.mode` is not provided.
 */
export default function PeriodFilter({
  value,
  onChange,
  defaultMode = "monthly",
  yearRange = DEFAULT_YEAR_RANGE,
  className,
  align = "start",
  "data-testid": testId = "period-filter",
}) {
  const [open, setOpen] = useState(false);

  const initialMode = value?.mode || defaultMode;
  const [draftMode, setDraftMode] = useState(initialMode);
  const [monthValue, setMonthValue] = useState(
    initialMode === "monthly" && value?.startDate ? monthValueFromDate(value.startDate) : monthValueFromDate()
  );
  const [yearValue, setYearValue] = useState(
    initialMode === "yearly" && value?.startDate ? yearValueFromDate(value.startDate) : todayDate().getFullYear()
  );
  const [customStart, setCustomStart] = useState(value?.startDate || todayIso());
  const [customEnd, setCustomEnd] = useState(value?.endDate || todayIso());

  // Reset the draft to the current committed value whenever the popover opens.
  useEffect(() => {
    if (!open) return;
    const mode = value?.mode || defaultMode;
    setDraftMode(mode);
    if (value?.startDate) {
      setMonthValue(monthValueFromDate(value.startDate));
      setYearValue(yearValueFromDate(value.startDate));
      setCustomStart(value.startDate);
    }
    if (value?.endDate) setCustomEnd(value.endDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const [minYear, maxYear] = yearRange;
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

  const draftRange = resolveRange(draftMode, { monthValue, yearValue, customStart, customEnd });
  const draftLabel = fmtRangeLabel(draftRange.startDate, draftRange.endDate);

  const triggerLabel = value?.startDate && value?.endDate
    ? fmtRangeLabel(value.startDate, value.endDate)
    : "Pilih periode";

  const apply = () => {
    onChange?.({ mode: draftMode, startDate: draftRange.startDate, endDate: draftRange.endDate, label: draftLabel });
    setOpen(false);
  };

  const cancel = () => setOpen(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          data-testid={testId}
          className={cn("justify-between font-normal gap-2 min-w-[200px]", className)}
        >
          <span className="flex items-center gap-2 truncate">
            <CalendarBlank size={16} className="shrink-0 text-primary" />
            <span className="truncate">{triggerLabel}</span>
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className="w-[min(92vw,34rem)] p-0 rounded-2xl overflow-hidden"
        data-testid={`${testId}-panel`}
      >
        <div className="flex flex-col sm:flex-row">
          {/* Left: option list */}
          <div className="sm:w-40 shrink-0 border-b sm:border-b-0 sm:border-r p-2 flex sm:flex-col gap-1 overflow-x-auto sm:overflow-visible" style={{ borderColor: "var(--legacy-border)" }}>
            {LEFT_OPTIONS.map((opt, i) =>
              opt.divider ? (
                <div key={`div-${i}`} className="hidden sm:block my-1 h-px shrink-0" style={{ background: "var(--legacy-border)" }} />
              ) : (
                <button
                  key={opt.mode}
                  type="button"
                  data-testid={`${testId}-option-${opt.mode}`}
                  onClick={() => setDraftMode(opt.mode)}
                  className={cn(
                    "text-left text-sm px-3 py-2 rounded-xl whitespace-nowrap sm:whitespace-normal transition-colors flex items-center justify-between gap-2",
                    draftMode === opt.mode
                      ? "bg-primary/10 text-primary font-semibold"
                      : "hover:bg-accent text-foreground"
                  )}
                >
                  {opt.label}
                  {draftMode === opt.mode && <Check size={14} className="shrink-0 text-primary" />}
                </button>
              )
            )}
          </div>

          {/* Right: dynamic content */}
          <div className="flex-1 p-4 flex flex-col gap-4 min-w-0">
            <div className="flex-1 min-h-[64px]">
              {(draftMode === "today" || draftMode === "week" || draftMode === "thisMonth") && (
                <div className="text-sm rounded-xl px-3 py-3" style={{ background: "var(--bg)", boxShadow: "var(--shadow-inset)" }} data-testid={`${testId}-preset-summary`}>
                  <p className="label mb-1">Rentang tanggal</p>
                  <p className="font-heading font-semibold">{fmtRangeLabel(draftRange.startDate, draftRange.endDate)}</p>
                </div>
              )}

              {draftMode === "monthly" && (
                <div>
                  <label className="label">Pilih Bulan</label>
                  <Input
                    type="month"
                    value={monthValue}
                    onChange={(e) => setMonthValue(e.target.value)}
                    data-testid={`${testId}-month-input`}
                  />
                </div>
              )}

              {draftMode === "yearly" && (
                <div>
                  <label className="label">Pilih Tahun</label>
                  <Select value={String(yearValue)} onValueChange={(v) => setYearValue(Number(v))}>
                    <SelectTrigger data-testid={`${testId}-year-select`}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {draftMode === "custom" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Dari</label>
                    <Input
                      type="date"
                      value={customStart}
                      max={customEnd || undefined}
                      onChange={(e) => setCustomStart(e.target.value)}
                      data-testid={`${testId}-custom-start`}
                    />
                  </div>
                  <div>
                    <label className="label">Sampai</label>
                    <Input
                      type="date"
                      value={customEnd}
                      min={customStart || undefined}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      data-testid={`${testId}-custom-end`}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="text-xs px-3 py-2 rounded-full inline-flex w-fit items-center gap-1.5" style={{ background: "var(--bg)", color: "var(--primary-dark)", fontWeight: 600, boxShadow: "var(--shadow-inset)" }} data-testid={`${testId}-summary`}>
              <CalendarBlank size={13} /> {draftLabel}
            </div>

            <div className="flex justify-end gap-2 pt-1 border-t" style={{ borderColor: "var(--legacy-border)" }}>
              <Button type="button" variant="outline" size="sm" onClick={cancel} data-testid={`${testId}-cancel`}>
                Batal
              </Button>
              <Button type="button" size="sm" onClick={apply} data-testid={`${testId}-apply`}>
                Terapkan
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { resolveRange, fmtRangeLabel };
