import { useMemo } from "react";

const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const pad = (n) => String(n).padStart(2, "0");

function parseVal(value) {
  const raw = (value || "").slice(0, 10);
  const p = raw.split("-").map(Number);
  const now = new Date();
  const y = p[0] || now.getFullYear();
  const m = p[1] || (now.getMonth() + 1);
  const d = p[2] || 1;
  return { y, m, d };
}

function emit(y, m, d, mode) {
  const last = new Date(y, m, 0).getDate();
  const day = Math.min(d, last);
  if (mode === "month") return `${y}-${pad(m)}`;
  return `${y}-${pad(m)}-${pad(day)}`;
}

export default function MonthScrollDate({ value, onChange, mode = "date", testId }) {
  const { y, m, d } = parseVal(value);
  const label = mode === "month" ? `${MONTHS[m - 1]} ${y}` : `${pad(d)} ${MONTHS[m - 1]} ${y}`;

  const shift = (deltaMonth) => {
    const dt = new Date(y, m - 1 + deltaMonth, 1);
    onChange?.(emit(dt.getFullYear(), dt.getMonth() + 1, d, mode));
  };

  const onWheel = (e) => {
    e.preventDefault();
    shift(e.deltaY > 0 ? 1 : -1);
  };

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 9 }, (_, i) => now - 4 + i);
  }, []);

  return (
    <div className="month-scroll" data-testid={testId} onWheel={onWheel}>
      <button type="button" className="month-scroll-btn" onClick={() => shift(-1)} aria-label="Bulan sebelumnya">‹</button>
      <div className="month-scroll-mid">
        <div className="month-scroll-label">{label}</div>
        <div className="month-scroll-hint">gulir untuk ganti bulan</div>
        {mode === "date" && (
          <select className="month-scroll-day" value={d} onChange={(e) => onChange?.(emit(y, m, Number(e.target.value), mode))}>
            {Array.from({ length: new Date(y, m, 0).getDate() }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        )}
        <select className="month-scroll-year" value={y} onChange={(e) => onChange?.(emit(Number(e.target.value), m, d, mode))}>
          {years.map((yr) => <option key={yr} value={yr}>{yr}</option>)}
        </select>
      </div>
      <button type="button" className="month-scroll-btn" onClick={() => shift(1)} aria-label="Bulan berikutnya">›</button>
    </div>
  );
}
