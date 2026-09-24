import { useEffect, useMemo, useState } from "react";
import api, { fmtRp, ROLE_LABELS } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import Spinner from "@/components/Spinner";
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid,
} from "recharts";
import { TrendUp, TrendDown, Coin, Storefront, ReceiptX, CalendarBlank, Lock } from "@phosphor-icons/react";
import TableShell from "@/components/TableShell";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PeriodFilter from "@/components/PeriodFilter";

const INK = "#14353A"; // --primary-dark
const TEAL = "#1C8A8A"; // --primary
const GRID_STROKE = "#E3E8E6"; // --border
const COLORS = ["#1C8A8A", "#14353A", "#C9A227", "#C45C6A", "#5AA9A3", "#8A969A"];
const TOOLTIP_STYLE = { background: "#FFFFFF", border: "1px solid #E3E8E6", borderRadius: 12, boxShadow: "0 1px 2px rgba(20, 53, 58, 0.05), 0 8px 24px rgba(20, 53, 58, 0.04)" };
const PIE_LEGEND_STYLE = { fontSize: 11 };
const yTickFormatter = (v) => (v >= 1e6 ? `${(v/1e6).toFixed(1)}Jt` : v >= 1e3 ? `${(v/1e3).toFixed(0)}rb` : v);

const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];

// Chart granularity/bucketing is driven by the selected PeriodFilter mode.
const MODE_CHART_CONFIG = {
  today: { granularity: "day", bucket: "day" },
  week: { granularity: "day", bucket: "day" },
  thisMonth: { granularity: "day", bucket: "week" },
  monthly: { granularity: "day", bucket: "week" },
  yearly: { granularity: "month", bucket: "month" },
  custom: { granularity: "month", bucket: "month" },
};

function pad(n) { return String(n).padStart(2, "0"); }
function iso(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

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

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [period, setPeriod] = useState({
    mode: "yearly",
    startDate: `${now.getFullYear()}-01-01`,
    endDate: `${now.getFullYear()}-12-31`,
    label: `Tahun ${now.getFullYear()}`,
  });

  const chartConfig = MODE_CHART_CONFIG[period.mode] || MODE_CHART_CONFIG.yearly;

  useEffect(() => {
    setLoading(true);
    api.get("/reports/dashboard", {
      params: { start_date: period.startDate, end_date: period.endDate, granularity: chartConfig.granularity },
    }).then((r) => setData(r.data)).finally(() => setLoading(false));
  }, [period, chartConfig.granularity]);

  const kpis = useMemo(() => data ? [
    { key: "pendapatan", label: "Total Pendapatan", value: data.total_pendapatan, icon: TrendUp },
    { key: "beban", label: "Total Beban", value: data.total_beban, icon: TrendDown },
    { key: "laba", label: "Laba Bersih", value: data.laba_bersih, icon: Coin },
    { key: "tx", label: "Jumlah Transaksi", value: data.total_transactions, icon: ReceiptX, isCount: true },
  ] : [], [data]);

  const chartData = useMemo(() => {
    if (!data?.monthly) return [];
    return bucketize(data.monthly, chartConfig.bucket);
  }, [data, chartConfig.bucket]);
  const useBar = chartData.length <= 1;

  if (loading && !data) return <div className="flex items-center justify-center min-h-[60vh]"><Spinner column size={48} label="Memuat dashboard..." /></div>;
  if (!data) return <div className="text-sm" style={{ color: "var(--text-muted)" }}>Tidak ada data.</div>;

  const jabatan = ROLE_LABELS[user?.role] || "Pengguna";
  const pLabel = period.label;
  const icoBox = { background: "var(--bg)", boxShadow: "var(--shadow-inset)" };

  return (
    <div className="space-y-6" data-testid="dashboard-page">
      {user?.blocked_periods && user.blocked_periods.length > 0 && (
        <Card className="fade-in" data-testid="blocked-periods-banner">
          <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Lock size={22} color={INK} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p className="font-heading font-semibold">
                {user.blocked_periods.length} periode terkunci oleh Admin
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
                Anda tidak dapat menambah, mengubah, atau menghapus transaksi pada:{" "}
                <b>{
                  user.blocked_periods.slice().sort().map(p => {
                    const [y, m] = p.split("-");
                    return `${MONTHS[Number(m) - 1]} ${y}`;
                  }).join(" · ")
                }</b>
              </p>
            </div>
          </div>
          </CardContent>
        </Card>
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

      <Card data-testid="period-card">
        <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="label flex items-center gap-1 mb-0">
            <CalendarBlank size={14} color={INK} /> Periode
          </label>
          <PeriodFilter value={period} onChange={setPeriod} defaultMode="yearly" data-testid="dashboard-period-filter" />
        </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <Card key={k.key} data-testid={`kpi-${k.key}`}>
              <CardContent className="p-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={icoBox}>
                  <Icon size={18} color={INK} />
                </div>
                <p className="text-xs uppercase tracking-wider font-semibold" style={{ color: "var(--text-secondary)" }}>{k.label}</p>
                <p className="font-heading text-xl sm:text-2xl font-bold mt-1 tabular-nums">
                  {k.isCount ? k.value : fmtRp(k.value)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
        <CardContent className="pt-6">
          <h3 className="font-heading text-lg font-semibold mb-4" data-testid="trend-title">Pendapatan & Beban ({pLabel})</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="99%" height={280}>
              {useBar ? (
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={yTickFormatter} />
                  <Tooltip formatter={(v) => fmtRp(v)} contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                  <Bar dataKey="pendapatan" name="Pendapatan" fill={INK} radius={[3,3,0,0]} />
                  <Bar dataKey="beban" name="Beban" fill={TEAL} radius={[3,3,0,0]} />
                </BarChart>
              ) : (
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={yTickFormatter} />
                  <Tooltip formatter={(v) => fmtRp(v)} contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                  <Line type="monotone" dataKey="pendapatan" name="Pendapatan" stroke={INK} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="beban" name="Beban" stroke={TEAL} strokeWidth={2} dot={false} />
                </LineChart>
              )}
            </ResponsiveContainer>
          ) : (
            <p className="text-sm py-16 text-center" style={{ color: "var(--text-muted)" }}>Belum ada transaksi pada periode ini.</p>
          )}
        </CardContent>
        </Card>
        <Card>
        <CardContent className="pt-6">
          <h3 className="font-heading text-lg font-semibold mb-4">Kontribusi Per Unit</h3>
          <p className="text-[11px] -mt-3 mb-3" style={{ color: "var(--text-muted)" }}>Berdasarkan laba bersih per unit (unit dengan laba positif).</p>
          {data.unit_summaries?.some(u => (u.laba || 0) > 0) ? (
            <ResponsiveContainer width="99%" height={240}>
              <PieChart>
                <Pie data={data.unit_summaries.filter(u => (u.laba || 0) > 0)} dataKey="laba" nameKey="code" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
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
        </CardContent>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-5">
          <h3 className="font-heading text-lg font-semibold flex items-center gap-2" data-testid="unit-table-title">
            <Storefront size={20} color={INK} /> Data Unit Usaha
          </h3>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Periode: {pLabel}</p>
        </div>
        <TableShell minWidth={560}>
          <Table data-testid="unit-summary-table">
            <TableHeader>
              <TableRow>
                <TableHead>Kode</TableHead><TableHead>Unit Usaha</TableHead>
                <TableHead className="num">Pendapatan</TableHead>
                <TableHead className="num">Beban</TableHead>
                <TableHead className="num">Laba Bersih</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.unit_summaries.map((u) => (
                <TableRow key={u.id}>
                  <TableCell><Badge>{u.code}</Badge></TableCell>
                  <TableCell className="font-medium">{u.name}</TableCell>
                  <TableCell className="num">{fmtRp(u.pendapatan)}</TableCell>
                  <TableCell className="num">{fmtRp(u.beban)}</TableCell>
                  <TableCell className="num font-semibold">{fmtRp(u.laba)}</TableCell>
                </TableRow>
              ))}
              {data.unit_summaries.length > 0 && (() => {
                const totP = data.unit_summaries.reduce((s, u) => s + (u.pendapatan || 0), 0);
                const totB = data.unit_summaries.reduce((s, u) => s + (u.beban || 0), 0);
                const totL = data.unit_summaries.reduce((s, u) => s + (u.laba || 0), 0);
                return (
                  <TableRow data-testid="unit-total-row">
                    <TableCell></TableCell>
                    <TableCell className="font-bold">TOTAL 6 UNIT USAHA</TableCell>
                    <TableCell className="num font-bold tabular-nums">{fmtRp(totP)}</TableCell>
                    <TableCell className="num font-bold tabular-nums">{fmtRp(totB)}</TableCell>
                    <TableCell className="num font-bold tabular-nums">{fmtRp(totL)}</TableCell>
                  </TableRow>
                );
              })()}
            </TableBody>
          </Table>
        </TableShell>
      </Card>
    </div>
  );
}
