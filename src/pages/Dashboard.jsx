import { useEffect, useMemo, useState } from "react";
import api, { fmtRp, ROLE_LABELS } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid,
} from "recharts";
import { TrendUp, TrendDown, Coin, Storefront, ReceiptX, CalendarBlank, Lock } from "@phosphor-icons/react";

const COLORS = ["#1F2A24", "#3F5D4E", "#8B6A3F", "#5C534A", "#8B4034", "#A07A3A"];
const TOOLTIP_STYLE = { background: "#FBF8F3", border: "1px solid #DDD4C7", borderRadius: 8, boxShadow: "none" };
const PIE_LEGEND_STYLE = { fontSize: 11 };
const yTickFormatter = (v) => (v >= 1e6 ? `${(v/1e6).toFixed(1)}Jt` : v >= 1e3 ? `${(v/1e3).toFixed(0)}rb` : v);

const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
const YEAR_MIN = 2022, YEAR_MAX = 2030;
const YEARS = Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => YEAR_MIN + i);

const PERIOD_OPTIONS = [
  { key: "hari_ini", label: "Hari ini", granularity: "day", bucket: "day" },
  { key: "minggu_ini", label: "Minggu ini", granularity: "day", bucket: "day" },
  { key: "bulan_ini", label: "Bulan ini", granularity: "day", bucket: "week" },
  { key: "3bulan", label: "3 bulan terakhir", granularity: "month", bucket: "month" },
  { key: "6bulan", label: "6 bulan terakhir", granularity: "month", bucket: "month" },
  { key: "bulanan", label: "Bulanan (pilih bulan)", granularity: "day", bucket: "week" },
  { key: "tahunan", label: "Tahunan (pilih tahun)", granularity: "month", bucket: "month" },
  { key: "custom", label: "Custom (tanggal awal – akhir)", granularity: "month", bucket: "month" },
];

function pad(n) { return String(n).padStart(2, "0"); }
function iso(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

function computeRange({ period, month, year, customStart, customEnd }) {
  const now = new Date();
  const endToday = iso(now);
  switch (period) {
    case "hari_ini":
      return { start: endToday, end: endToday };
    case "minggu_ini": {
      const day = now.getDay() || 7;
      const start = new Date(now); start.setDate(now.getDate() - (day - 1));
      return { start: iso(start), end: endToday };
    }
    case "bulan_ini": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: iso(start), end: endToday };
    }
    case "3bulan": {
      const start = new Date(now); start.setMonth(now.getMonth() - 2); start.setDate(1);
      return { start: iso(start), end: endToday };
    }
    case "6bulan": {
      const start = new Date(now); start.setMonth(now.getMonth() - 5); start.setDate(1);
      return { start: iso(start), end: endToday };
    }
    case "bulanan": {
      const y = now.getFullYear();
      const start = new Date(y, month - 1, 1);
      const end = new Date(y, month, 0);
      return { start: iso(start), end: iso(end) };
    }
    case "tahunan": {
      return { start: `${year}-01-01`, end: `${year}-12-31` };
    }
    case "custom":
      return { start: customStart, end: customEnd };
    default:
      return { start: undefined, end: endToday };
  }
}

function bucketize(list, targetBucket) {
  if (!list || list.length === 0) return [];
  if (targetBucket === "day" || targetBucket === "month") {
    return list.map((r) => ({ ...r, month: labelize(r.month, targetBucket) }));
  }
  const map = new Map();
  for (const r of list) {
    const d = new Date(r.month);
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
    .map(([k, v]) => ({ month: `Minggu ${new Date(k).getDate()}/${new Date(k).getMonth() + 1}`, ...v }));
}

function labelize(key, bucket) {
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

function periodLabel(state) {
  const opt = PERIOD_OPTIONS.find(p => p.key === state.period);
  if (state.period === "bulanan") return `${MONTHS[state.month - 1]} ${new Date().getFullYear()}`;
  if (state.period === "tahunan") return `Tahun ${state.year}`;
  if (state.period === "custom") return `${state.customStart} s.d. ${state.customEnd}`;
  return opt?.label || "";
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [state, setState] = useState({
    period: "tahunan",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    customStart: `${YEAR_MIN}-01-01`,
    customEnd: iso(new Date()),
  });

  const currentOpt = PERIOD_OPTIONS.find(p => p.key === state.period) || PERIOD_OPTIONS[6];

  useEffect(() => {
    setLoading(true);
    const { start, end } = computeRange(state);
    api.get("/reports/dashboard", {
      params: { start_date: start, end_date: end, granularity: currentOpt.granularity },
    }).then((r) => setData(r.data)).finally(() => setLoading(false));
  }, [state, currentOpt.granularity]);

  const ink = "#1F2A24";
  const paper = "#EDE4D6";
  const kpis = useMemo(() => data ? [
    { key: "pendapatan", label: "Total Pendapatan", value: data.total_pendapatan, icon: TrendUp },
    { key: "beban", label: "Total Beban", value: data.total_beban, icon: TrendDown },
    { key: "laba", label: "Laba Bersih", value: data.laba_bersih, icon: Coin },
    { key: "tx", label: "Jumlah Transaksi", value: data.total_transactions, icon: ReceiptX, isCount: true },
  ] : [], [data]);

  const chartData = useMemo(() => {
    if (!data?.monthly) return [];
    return bucketize(data.monthly, currentOpt.bucket);
  }, [data, currentOpt.bucket]);
  const useBar = chartData.length <= 1;

  if (loading && !data) return <div className="text-sm">Memuat dashboard...</div>;
  if (!data) return <div className="text-sm">Tidak ada data.</div>;

  const jabatan = ROLE_LABELS[user?.role] || "Pengguna";
  const pLabel = periodLabel(state);

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      {user?.blocked_periods && user.blocked_periods.length > 0 && (
        <div className="card fade-in" data-testid="blocked-periods-banner"
             style={{ background: "#F3E6C8", border: "1px solid #DDD4C7" }}>
          <div className="flex items-start gap-3">
            <Lock size={22} weight="duotone" color={ink} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p className="font-heading font-semibold">
                {user.blocked_periods.length} periode terkunci oleh Admin
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                Anda tidak dapat menambah, mengubah, atau menghapus transaksi pada:{" "}
                <b>{
                  user.blocked_periods
                    .slice()
                    .sort()
                    .map(p => {
                      const [y, m] = p.split("-");
                      return `${MONTHS[Number(m) - 1]} ${y}`;
                    })
                    .join(" · ")
                }</b>
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <p className="label mb-1">SIA BUMDes Karya Raharja</p>
        <h1 className="font-heading text-3xl sm:text-4xl font-bold page-h1" data-testid="dashboard-greeting">
          Selamat datang, {jabatan}.
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Ringkasan data BUMDes Karya Raharja • {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="card card-sm" data-testid="period-card">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[220px]">
            <label className="label flex items-center gap-1">
              <CalendarBlank size={14} weight="duotone" color={ink} /> Periode
            </label>
            <select data-testid="period-select" className="select"
                    value={state.period}
                    onChange={(e) => setState(s => ({ ...s, period: e.target.value }))}>
              {PERIOD_OPTIONS.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
            </select>
          </div>

          {state.period === "bulanan" && (
            <div className="min-w-[160px]">
              <label className="label">Pilih Bulan</label>
              <select data-testid="period-month" className="select"
                      value={state.month}
                      onChange={(e) => setState(s => ({ ...s, month: Number(e.target.value) }))}>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
          )}

          {state.period === "tahunan" && (
            <div className="min-w-[140px]">
              <label className="label">Pilih Tahun</label>
              <select data-testid="period-year" className="select"
                      value={state.year}
                      onChange={(e) => setState(s => ({ ...s, year: Number(e.target.value) }))}>
                {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}

          {state.period === "custom" && (
            <>
              <div className="min-w-[160px]">
                <label className="label">Tanggal Awal</label>
                <input data-testid="period-custom-start" type="date" className="input"
                       min={`${YEAR_MIN}-01-01`} max={`${YEAR_MAX}-12-31`}
                       value={state.customStart}
                       onChange={(e) => setState(s => ({ ...s, customStart: e.target.value }))} />
              </div>
              <div className="min-w-[160px]">
                <label className="label">Tanggal Akhir</label>
                <input data-testid="period-custom-end" type="date" className="input"
                       min={`${YEAR_MIN}-01-01`} max={`${YEAR_MAX}-12-31`}
                       value={state.customEnd}
                       onChange={(e) => setState(s => ({ ...s, customEnd: e.target.value }))} />
              </div>
            </>
          )}

          <div className="text-xs px-3 py-2 rounded-lg" data-testid="period-label"
               style={{ background: paper, color: ink, fontWeight: 600 }}>
            {pLabel}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.key} className="card card-sm" data-testid={`kpi-${k.key}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: paper }}>
                  <Icon size={18} weight="duotone" color={ink} />
                </div>
              </div>
              <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--text-secondary)" }}>{k.label}</p>
              <p className="font-heading text-xl sm:text-2xl font-bold mt-1 tabular-nums">
                {k.isCount ? k.value : fmtRp(k.value)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h3 className="font-heading text-lg font-semibold mb-4" data-testid="trend-title">
            Pendapatan & Beban ({pLabel})
          </h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="99%" height={280}>
              {useBar ? (
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DDD4C7" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={yTickFormatter} />
                  <Tooltip formatter={(v) => fmtRp(v)} contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                  <Bar dataKey="pendapatan" name="Pendapatan" fill="#1F2A24" radius={[3,3,0,0]} />
                  <Bar dataKey="beban" name="Beban" fill="#8B6A3F" radius={[3,3,0,0]} />
                </BarChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#DDD4C7" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={yTickFormatter} />
                  <Tooltip formatter={(v) => fmtRp(v)} contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                  <Line type="monotone" dataKey="pendapatan" name="Pendapatan"
                        stroke="#1F2A24" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="beban" name="Beban"
                        stroke="#8B6A3F" strokeWidth={2} dot={false} />
                </LineChart>
              )}
            </ResponsiveContainer>
          ) : (
            <p className="text-sm py-16 text-center" style={{ color: "var(--text-muted)" }}>Belum ada transaksi pada periode ini.</p>
          )}
        </div>

        <div className="card">
          <h3 className="font-heading text-lg font-semibold mb-4">Kontribusi Per Unit</h3>
          <p className="text-[11px] -mt-3 mb-3" style={{ color: "var(--text-muted)" }}>
            Berdasarkan laba bersih per unit (unit dengan laba positif).
          </p>
          {data.unit_summaries?.some(u => (u.laba || 0) > 0) ? (
            <ResponsiveContainer width="99%" height={240}>
              <PieChart>
                <Pie data={data.unit_summaries.filter(u => (u.laba || 0) > 0)}
                     dataKey="laba" nameKey="code" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                  {data.unit_summaries.filter(u => (u.laba || 0) > 0).map((u, i) => (
                    <Cell key={u.id} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => fmtRp(v)} />
                <Legend wrapperStyle={PIE_LEGEND_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm py-16 text-center" style={{ color: "var(--text-muted)" }}>Belum ada unit dengan laba positif pada periode ini.</p>
          )}
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="p-5" style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 className="font-heading text-lg font-semibold flex items-center gap-2" data-testid="unit-table-title">
            <Storefront size={20} weight="duotone" color={ink} /> Data Unit Usaha
          </h3>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Periode: {pLabel}</p>
        </div>
        <div className="h-scroll">
          <table className="tbl" data-testid="unit-summary-table" style={{ minWidth: 560 }}>
            <thead>
              <tr>
                <th>Kode</th>
                <th>Unit Usaha</th>
                <th className="num">Pendapatan</th>
                <th className="num">Beban</th>
                <th className="num">Laba Bersih</th>
              </tr>
            </thead>
            <tbody>
              {data.unit_summaries.map((u) => (
                <tr key={u.id}>
                  <td><span className="badge">{u.code}</span></td>
                  <td className="font-medium">{u.name}</td>
                  <td className="num">{fmtRp(u.pendapatan)}</td>
                  <td className="num">{fmtRp(u.beban)}</td>
                  <td className="num font-semibold">{fmtRp(u.laba)}</td>
                </tr>
              ))}
              {data.unit_summaries.length > 0 && (() => {
                const totP = data.unit_summaries.reduce((s, u) => s + (u.pendapatan || 0), 0);
                const totB = data.unit_summaries.reduce((s, u) => s + (u.beban || 0), 0);
                const totL = data.unit_summaries.reduce((s, u) => s + (u.laba || 0), 0);
                return (
                  <tr data-testid="unit-total-row" style={{ background: paper }}>
                    <td></td>
                    <td className="font-bold">TOTAL 6 UNIT USAHA</td>
                    <td className="num font-bold tabular-nums">{fmtRp(totP)}</td>
                    <td className="num font-bold tabular-nums">{fmtRp(totB)}</td>
                    <td className="num font-bold tabular-nums">{fmtRp(totL)}</td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
