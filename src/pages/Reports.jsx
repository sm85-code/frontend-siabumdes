import { useEffect, useMemo, useState } from "react";
import api, { fmtRp, fmtDate, API } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { notify } from "@/lib/feedback";
import { useConfirm } from "@/components/ConfirmProvider";
import Spinner from "@/components/Spinner";
import { FilePdf, FileXls, FileDoc, ChartLine, Scales, Coins, TrendUp, BookOpen, Lock } from "@phosphor-icons/react";
import TableShell from "@/components/TableShell";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const YEAR_MIN = 2022, YEAR_MAX = 2030;
const YEARS = Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, i) => YEAR_MIN + i);
const pad = (n) => String(n).padStart(2, "0");
const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth() + 1;
const monthRange = (year, month) => {
  const lastDay = new Date(year, month, 0).getDate();
  return { start: `${year}-${pad(month)}-01`, end: `${year}-${pad(month)}-${pad(lastDay)}` };
};

// Sub-tabs report: keys sama untuk BUMDES dan Unit — backend pakai unit_usaha_id untuk scoping.
const REPORTS = [
  { key: "laba-rugi", label: "Laporan Laba Rugi", icon: ChartLine, needsRange: true },
  { key: "perubahan-ekuitas", label: "Laporan Perubahan Ekuitas", icon: TrendUp, needsRange: true },
  { key: "neraca", label: "Laporan Posisi Keuangan (Neraca)", icon: Scales, needsRange: false },
  { key: "arus-kas", label: "Laporan Arus Kas", icon: Coins, needsRange: true },
  { key: "calk", label: "Catatan atas Laporan Keuangan (CaLK)", icon: BookOpen, needsRange: true },
];

export default function Reports() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const isPengelola = user?.role === "pengelola";
  const isAdmin = user?.role === "admin";

  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);
  const [periodMode, setPeriodMode] = useState("monthly");
  const [customPreset, setCustomPreset] = useState("ytd");
  const [customStart, setCustomStart] = useState(`${currentYear}-01-01`);
  const [customEnd, setCustomEnd] = useState(new Date().toISOString().slice(0, 10));
  const { start: monthlyStart, end: monthlyEnd } = monthRange(year, month);
  const customRange = customPreset === "ytd" ? [`${year}-01-01`, new Date().toISOString().slice(0, 10)] : customPreset === "qtd" ? [`${year}-${String(Math.floor((month - 1) / 3) * 3 + 1).padStart(2, "0")}-01`, new Date().toISOString().slice(0, 10)] : customPreset === "mtd" ? [`${year}-${String(month).padStart(2, "0")}-01`, new Date().toISOString().slice(0, 10)] : [customStart, customEnd];
  const start = periodMode === "yearly" ? `${year}-01-01` : periodMode === "custom" ? customRange[0] : monthlyStart;
  const end = periodMode === "yearly" ? `${year}-12-31` : periodMode === "custom" ? customRange[1] : monthlyEnd;
  // tab: laporan | tutup-buku
  const [tab, setTab] = useState("laporan");
  const [active, setActive] = useState("laba-rugi");
  // Dropdown 7 kelompok
  const [groupKey, setGroupKey] = useState("BUMDES");  // BUMDES | UU01..UU06
  const [units, setUnits] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Tutup Buku (admin only)
  // BUMDES (Pusat) tutup buku per triwulan/tahun; unit usaha (UU01..UU06) tetap bulanan.
  const [closeGroup, setCloseGroup] = useState("BUMDES");
  const [closeKind, setCloseKind] = useState("quarter"); // quarter | year -- BUMDES only
  const [closeYear, setCloseYear] = useState(currentYear);
  const [closeQuarter, setCloseQuarter] = useState(Math.floor((currentMonth - 1) / 3) + 1);
  const [closeMonth, setCloseMonth] = useState(currentMonth); // unit usaha only
  const closePeriod = closeGroup === "BUMDES"
    ? (closeKind === "year" ? `${closeYear}` : `${closeYear}-Q${closeQuarter}`)
    : `${closeYear}-${pad(closeMonth)}`;
  const [closedList, setClosedList] = useState([]);
  const loadClosed = () => api.get("/reports/closed-periods").then(r => setClosedList(r.data));
  useEffect(() => { if (isAdmin) loadClosed(); }, [isAdmin]);
  const doClose = async () => {
    if (!(await confirm({ title: "Tutup buku", description: `Tutup buku periode ${closePeriod} untuk ${closeGroup}?`, confirmLabel: "Tutup buku", destructive: true }))) return;
    try {
      const r = await api.post("/reports/close-period", { period: closePeriod, group: closeGroup });
      notify(`Berhasil ditutup. Jurnal dibuat: ${r.data.entries}. Laba bersih: Rp ${r.data.laba_bersih.toLocaleString("id-ID")}`);
      loadClosed();
    } catch (er) { notify(er.response?.data?.detail || "Gagal tutup buku"); }
  };
  const doReopen = async (period, grp) => {
    if (!(await confirm({ title: "Batalkan tutup buku", description: `Batalkan tutup buku ${period} (${grp})?`, confirmLabel: "Batalkan", destructive: true }))) return;
    try { await api.delete("/reports/close-period", { params: { period, group: grp } }); loadClosed(); }
    catch (er) { notify(er.response?.data?.detail || "Gagal batalkan"); }
  };

  useEffect(() => {
    api.get("/unit-usaha").then(r => {
      setUnits(r.data);
      if (isPengelola && user?.unit_usaha_id) {
        const own = r.data.find(u => u.id === user.unit_usaha_id);
        if (own) setGroupKey(own.code);
      }
    });
  }, [isPengelola, user]);

  const visibleReports = groupKey === "BUMDES" ? REPORTS : REPORTS.filter(r => !["perubahan-ekuitas", "calk"].includes(r.key));
  const cfg = visibleReports.find(r => r.key === active) || visibleReports[0];
  useEffect(() => {
    if (groupKey !== "BUMDES" && ["perubahan-ekuitas", "calk"].includes(active)) {
      setActive("neraca");
      setData(null);
    }
  }, [groupKey, active]);
  const groupOptions = useMemo(() => {
    const list = [{ code: "BUMDES", name: "Pusat", id: null }];
    ["UU01", "UU02", "UU03", "UU04", "UU05", "UU06"].forEach(code => {
      const u = units.find(unit => unit.code === code);
      if (u) list.push({ code: u.code, name: u.name, id: u.id });
    });
    return isPengelola
      ? list.filter(o => o.code === units.find(u => u.id === user?.unit_usaha_id)?.code)
      : list;
  }, [units, isPengelola, user]);

  const activeUnitId = useMemo(() => {
    if (groupKey === "BUMDES") return null;
    return units.find(u => u.code === groupKey)?.id || null;
  }, [groupKey, units]);

  const load = async () => {
    setLoading(true); setData(null);
    try {
      if (cfg) {
        const params = cfg.needsRange
          ? { start_date: start, end_date: end }
          : { as_of_date: end };
        if (activeUnitId) params.unit_usaha_id = activeUnitId;
        const r = await api.get(`/reports/${cfg.key}`, { params });
        setData(r.data);
      }
    } catch (er) { notify(er.response?.data?.detail || "Gagal memuat laporan"); }
    finally { setLoading(false); }
  };

  const download = async (kind) => {
    if (!cfg) return;
    const params = new URLSearchParams(cfg.needsRange
      ? { start_date: start, end_date: end }
      : { as_of_date: end });
    if (activeUnitId) params.set("unit_usaha_id", activeUnitId);
    const urlPath = `${API}/reports/${cfg.key}/${kind}?${params}`;
    const ext = kind === "pdf" ? "pdf" : kind === "word" ? "docx" : "xlsx";
    const filename = `${cfg.key}_${groupKey}.${ext}`;
    const res = await fetch(urlPath, { credentials: "include" });
    if (!res.ok) { notify(`Gagal export ${kind.toUpperCase()}`); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" data-testid="reports-page">
      <div>
        <p className="label mb-1">FINANCIAL STATEMENTS</p>
        <h1 className="font-heading text-3xl font-bold page-h1">Laporan Keuangan</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          {isPengelola
            ? "Anda hanya dapat mengakses laporan unit usaha yang Anda kelola."
            : isAdmin
              ? "Dua tab: Laporan Keuangan (pilih kelompok BUMDES atau salah satu unit usaha) dan Tutup Buku."
              : "Laporan Keuangan — pilih kelompok BUMDES atau salah satu unit usaha."}
        </p>
      </div>

      {isAdmin && (
        <div className="tab-strip" data-testid="reports-toplevel-tabs">
          <button data-testid="tab-laporan" onClick={() => { setTab("laporan"); setData(null); }}
                  className={`btn ${tab === "laporan" ? "btn-primary" : "btn-outline"}`}>
            <Scales size={16} weight={tab === "laporan" ? "fill" : "regular"} /> Laporan Keuangan
          </button>
          <button data-testid="tab-tutup-buku" onClick={() => setTab("tutup-buku")}
                  className={`btn ${tab === "tutup-buku" ? "btn-primary" : "btn-outline"}`}>
            <Lock size={16} weight={tab === "tutup-buku" ? "fill" : "regular"} /> Tutup Buku
          </button>
        </div>
      )}

      {tab === "laporan" && (
        <>
          <div className="card">
            <label className="label" htmlFor="report-group-select">Kelompok</label>
            <select id="report-group-select" data-testid="report-group-select" className="select" value={groupKey}
                    disabled={isPengelola}
                    onChange={(e) => { setGroupKey(e.target.value); setData(null); }}>
              {groupOptions.map(o => <option key={o.code} value={o.code}>{o.code === "BUMDES" ? "BUMDES - Pusat" : `${o.code} - ${o.name}`}</option>)}
            </select>
          </div>

          <div className="card">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
              <div>
                <label className="label" htmlFor="report-type-select">Jenis Laporan Keuangan</label>
                <select id="report-type-select" data-testid="report-type-select" className="select" value={active}
                        onChange={(e) => { setActive(e.target.value); setData(null); }}>
                  {visibleReports.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="report-period-mode">Periode</label>
                <select id="report-period-mode" data-testid="report-period-mode" className="select" value={periodMode} onChange={(e) => { setPeriodMode(e.target.value); setData(null); }}>
                  <option value="monthly">Bulanan</option>
                  <option value="yearly">Tahunan</option>
                  <option value="custom">Custom</option>
                </select>
                {periodMode === "custom" && <>
                  <select className="select mt-2" value={customPreset} onChange={(e) => setCustomPreset(e.target.value)}><option value="ytd">Year to Date</option><option value="qtd">Quarter to Date</option><option value="mtd">Month to Date</option><option value="dates">Pilih tanggal</option></select>
                  {customPreset === "dates" && <div className="grid grid-cols-2 gap-2 mt-2"><input className="input" type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} /><input className="input" type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} /></div>}
                </>}
              </div>
              {periodMode === "monthly" && <div>
                <label className="label" htmlFor="report-month">Bulan</label>
                <select id="report-month" data-testid="report-month" className="select" value={month} onChange={(e) => { setMonth(Number(e.target.value)); setData(null); }}>
                  {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              </div>}
              <div>
                <label className="label" htmlFor="report-year">Tahun</label>
                <select id="report-year" data-testid="report-year" className="select" value={year} onChange={(e) => { setYear(Number(e.target.value)); setData(null); }}>
                  {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <button data-testid="btn-load-report" onClick={load} className="btn btn-primary">
                {loading ? <Spinner size={18} label="Memuat..." /> : "Tampilkan Laporan"}
              </button>
            </div>
          </div>
        </>
      )}

      {tab === "laporan" && data && cfg && (
        <div className="card fade-in">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h3 className="font-heading text-xl font-semibold">{cfg.label}
              <span className="ml-2 badge">{groupKey}</span>
            </h3>
            <div className="flex gap-2">
              <button data-testid="btn-export-pdf" onClick={() => download("pdf")} className="btn btn-outline">
                <FilePdf size={16} weight="duotone" color="var(--status-error)" /> Export PDF
              </button>
              <button data-testid="btn-export-excel" onClick={() => download("excel")} className="btn btn-outline">
                <FileXls size={16} weight="duotone" color="var(--primary-dark)" /> Export Excel
              </button>
              <button data-testid="btn-export-word" onClick={() => download("word")} className="btn btn-outline">
                <FileDoc size={16} weight="duotone" color="#2b579a" /> Export Word
              </button>
            </div>
          </div>
          <ReportBody active={active} data={data} />
          {/* Alokasi Bagi Hasil Unit (30/70) */}
          {active === "laba-rugi" && activeUnitId && (
            <div className="mt-6 p-4 rounded-lg" data-testid="bagi-hasil-info"
                 style={{ background: "var(--primary-light)", border: "1px solid var(--legacy-border)" }}>
              <h4 className="font-heading font-semibold mb-2" style={{ color: "var(--primary-dark)" }}>
                Alokasi Bagi Hasil Unit Usaha {groupKey}:
              </h4>
              <ol className="text-sm space-y-1 ml-5" style={{ listStyleType: "decimal" }}>
                <li>Pengelola Unit (30%) = <b style={{ color: "hsl(var(--primary))" }} data-testid="share-pengelola">{fmtRp(Math.round((data.laba_bersih || 0) * 0.30))}</b></li>
                <li>BUMDES (70%) = <b style={{ color: "var(--primary-dark)" }} data-testid="share-bumdes">{fmtRp(Math.round((data.laba_bersih || 0) * 0.70))}</b></li>
              </ol>
            </div>
          )}
          {/* Alokasi Bagi Hasil BUMDES 6-way (untuk Laba Rugi BUMDES) */}
          {active === "laba-rugi" && !activeUnitId && !isPengelola && (
            <div className="mt-6 p-4 rounded-lg" data-testid="alokasi-bumdes-info"
                 style={{ background: "var(--primary-light)", border: "1px solid var(--legacy-border)" }}>
              <h4 className="font-heading font-semibold mb-2" style={{ color: "var(--primary-dark)" }}>
                Alokasi Bagi Hasil Usaha BUMDES:
              </h4>
              <ol className="text-sm space-y-1 ml-5" style={{ listStyleType: "decimal" }}>
                {[
                  ["PADes", 30, "var(--chart-1)"],
                  ["Modal BUMDES", 18, "var(--chart-2)"],
                  ["Penasihat", 7, "var(--chart-3)"],
                  ["Pengawas", 5, "var(--chart-4)"],
                  ["Pengurus", 35, "var(--text-primary)"],
                  ["Dana Sosial", 5, "var(--text-muted)"],
                ].map(([label, pct, color]) => (
                  <li key={label}>{label} ({pct}%) = <b style={{ color }} data-testid={`share-${label.toLowerCase().replace(/ /g, "-")}`}>{fmtRp(Math.round((data.laba_bersih || 0) * pct / 100))}</b></li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}

      {tab === "tutup-buku" && isAdmin && (
        <div className="card" data-testid="close-period-card">
          <div className="flex items-center gap-2 mb-3">
            <Lock size={20} weight="duotone" color="var(--status-warning)" />
            <h3 className="font-heading font-semibold">Tutup Buku</h3>
          </div>
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
            Generate jurnal penutup fisik (tutup pendapatan/beban ke Ikhtisar L/R, transfer ke Saldo Laba) untuk 1 grup 1 periode.
            Grup harus punya akun ber-subcategory <b>ikhtisar_laba_rugi</b> dan <b>saldo_laba</b>.
            BUMDES (Pusat) tutup buku per <b>triwulan/tahun</b>; unit usaha tutup buku <b>bulanan</b>.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
            <div>
              <label className="label">Kelompok</label>
              <select className="select" data-testid="close-group-select"
                      value={closeGroup} onChange={(e) => setCloseGroup(e.target.value)}>
                <option value="BUMDES">BUMDES</option>
                {units.map(u => <option key={u.code} value={u.code}>{u.code} - {u.name}</option>)}
              </select>
            </div>
            {closeGroup === "BUMDES" ? (
              <>
                <div>
                  <label className="label">Jenis Periode</label>
                  <select className="select" data-testid="close-kind-select"
                          value={closeKind} onChange={(e) => setCloseKind(e.target.value)}>
                    <option value="quarter">Triwulan</option>
                    <option value="year">Tahunan</option>
                  </select>
                </div>
                {closeKind === "quarter" && (
                  <div>
                    <label className="label">Triwulan</label>
                    <select className="select" data-testid="close-quarter-select"
                            value={closeQuarter} onChange={(e) => setCloseQuarter(Number(e.target.value))}>
                      <option value={1}>Q1 (Jan–Mar)</option>
                      <option value={2}>Q2 (Apr–Jun)</option>
                      <option value={3}>Q3 (Jul–Sep)</option>
                      <option value={4}>Q4 (Okt–Des)</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="label">Tahun</label>
                  <select className="select" data-testid="close-year-select"
                          value={closeYear} onChange={(e) => setCloseYear(Number(e.target.value))}>
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </>
            ) : (
              <div>
                <label className="label">Periode</label>
                <input type="month" className="input" data-testid="close-period-input"
                       value={`${closeYear}-${pad(closeMonth)}`}
                       onChange={(e) => {
                         const [y, m] = e.target.value.split("-");
                         setCloseYear(Number(y)); setCloseMonth(Number(m));
                       }} />
              </div>
            )}
            <button data-testid="btn-close-period" onClick={doClose} className="btn btn-primary">
              <Lock size={16} /> Tutup Buku
            </button>
          </div>

          <div className="mt-6">
            <p className="label mb-2">Periode Sudah Ditutup ({closedList.length})</p>
            <TableShell minWidth={520}>
              <Table data-testid="closed-periods-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Periode</TableHead><TableHead>Kelompok</TableHead><TableHead className="num">Laba Bersih</TableHead><TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {closedList.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8" style={{ color: "var(--text-muted)" }}>Belum ada periode yang ditutup.</TableCell></TableRow>
                  ) : closedList.map(c => (
                    <TableRow key={c.period + c.group}>
                      <TableCell className="font-medium">{c.period}</TableCell>
                      <TableCell><span className="badge">{c.group}</span></TableCell>
                      <TableCell className="num">{fmtRp(c.laba_bersih || 0)}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        <button data-testid={`reopen-${c.period}-${c.group}`}
                                onClick={() => doReopen(c.period, c.group)}
                                className="btn btn-outline text-xs">
                          Batalkan
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableShell>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportBody({ active, data }) {
  if (active === "laba-rugi") {
    return (
      <TableShell minWidth={480}>
        <Table>
          <TableHeader><TableRow><TableHead>Kode</TableHead><TableHead>Nama Akun</TableHead><TableHead className="num">Jumlah</TableHead></TableRow></TableHeader>
          <TableBody>
            <TableRow><TableCell colSpan={3} className="font-semibold" style={{ background: "var(--primary-light)" }}>PENDAPATAN</TableCell></TableRow>
            {data.pendapatan.map((it) => (<TableRow key={it.code}><TableCell>{it.code}</TableCell><TableCell>{it.name}</TableCell><TableCell className="num">{fmtRp(it.amount)}</TableCell></TableRow>))}
            <TableRow><TableCell></TableCell><TableCell className="font-semibold">Total Pendapatan</TableCell><TableCell className="num font-semibold">{fmtRp(data.total_pendapatan)}</TableCell></TableRow>
            <TableRow><TableCell colSpan={3} className="font-semibold" style={{ background: "var(--primary-light)" }}>BEBAN</TableCell></TableRow>
            {data.beban.map((it) => (<TableRow key={it.code}><TableCell>{it.code}</TableCell><TableCell>{it.name}</TableCell><TableCell className="num">{fmtRp(it.amount)}</TableCell></TableRow>))}
            <TableRow><TableCell></TableCell><TableCell className="font-semibold">Total Beban</TableCell><TableCell className="num font-semibold">{fmtRp(data.total_beban)}</TableCell></TableRow>
            <TableRow style={{ background: "var(--total-row-bg)" }}><TableCell></TableCell><TableCell className="font-bold" style={{ color: "var(--primary-dark)" }}>LABA / (RUGI) BERSIH</TableCell><TableCell className="num font-bold" style={{ color: "var(--primary-dark)" }}>{fmtRp(data.laba_bersih)}</TableCell></TableRow>
          </TableBody>
        </Table>
      </TableShell>
    );
  }
  if (active === "neraca") {
    return (
      <>
        <p className="text-sm mb-3" style={{ color: "var(--text-secondary)" }}>Per: {data.as_of}</p>
        <TableShell minWidth={480}>
          <Table>
            <TableHeader><TableRow><TableHead>Kode</TableHead><TableHead>Akun</TableHead><TableHead className="num">Jumlah</TableHead></TableRow></TableHeader>
            <TableBody>
              <TableRow><TableCell colSpan={3} className="font-semibold" style={{ background: "var(--primary-light)" }}>ASET</TableCell></TableRow>
              {data.aset.map((it) => (<TableRow key={`a-${it.code}`}><TableCell>{it.code}</TableCell><TableCell>{it.name}</TableCell><TableCell className="num">{fmtRp(it.amount)}</TableCell></TableRow>))}
              <TableRow><TableCell></TableCell><TableCell className="font-semibold">Total Aset</TableCell><TableCell className="num font-semibold">{fmtRp(data.total_aset)}</TableCell></TableRow>
              <TableRow><TableCell colSpan={3} className="font-semibold" style={{ background: "var(--primary-light)" }}>KEWAJIBAN</TableCell></TableRow>
              {data.kewajiban.map((it) => (<TableRow key={`k-${it.code}`}><TableCell>{it.code}</TableCell><TableCell>{it.name}</TableCell><TableCell className="num">{fmtRp(it.amount)}</TableCell></TableRow>))}
              <TableRow><TableCell></TableCell><TableCell className="font-semibold">Total Kewajiban</TableCell><TableCell className="num font-semibold">{fmtRp(data.total_kewajiban)}</TableCell></TableRow>
              <TableRow><TableCell colSpan={3} className="font-semibold" style={{ background: "var(--primary-light)" }}>EKUITAS</TableCell></TableRow>
              {data.ekuitas.map((it, i) => (<TableRow key={`e-${it.code}-${i}`}><TableCell>{it.code}</TableCell><TableCell>{it.name}</TableCell><TableCell className="num">{fmtRp(it.amount)}</TableCell></TableRow>))}
              <TableRow><TableCell></TableCell><TableCell className="font-semibold">Total Ekuitas</TableCell><TableCell className="num font-semibold">{fmtRp(data.total_ekuitas)}</TableCell></TableRow>
              <TableRow style={{ background: "var(--total-row-bg)" }}><TableCell></TableCell><TableCell className="font-bold">TOTAL PASIVA</TableCell><TableCell className="num font-bold">{fmtRp(data.total_pasiva)}</TableCell></TableRow>
            </TableBody>
          </Table>
        </TableShell>
        <p className="text-xs mt-3" style={{ color: data.balanced ? "var(--status-success)" : "var(--status-error)" }}>
          {data.balanced ? "✓ Neraca seimbang" : "⚠ Neraca belum seimbang — periksa transaksi."}
        </p>
      </>
    );
  }
  if (active === "arus-kas") {
    return (
      <TableShell minWidth={480}>
        <Table>
          <TableHeader><TableRow><TableHead>Tanggal</TableHead><TableHead>Keterangan</TableHead><TableHead className="num">Jumlah</TableHead></TableRow></TableHeader>
          <TableBody>
            <TableRow><TableCell colSpan={3} className="font-semibold" style={{ background: "var(--primary-light)" }}>KAS MASUK</TableCell></TableRow>
            {data.kas_masuk.map((it, i) => (<TableRow key={`m-${it.date}-${i}`}><TableCell>{it.date}</TableCell><TableCell>{it.description}</TableCell><TableCell className="num">{fmtRp(it.amount)}</TableCell></TableRow>))}
            <TableRow><TableCell></TableCell><TableCell className="font-semibold">Total Kas Masuk</TableCell><TableCell className="num font-semibold">{fmtRp(data.total_masuk)}</TableCell></TableRow>
            <TableRow><TableCell colSpan={3} className="font-semibold" style={{ background: "var(--primary-light)" }}>KAS KELUAR</TableCell></TableRow>
            {data.kas_keluar.map((it, i) => (<TableRow key={`k-${it.date}-${i}`}><TableCell>{it.date}</TableCell><TableCell>{it.description}</TableCell><TableCell className="num">{fmtRp(it.amount)}</TableCell></TableRow>))}
            <TableRow><TableCell></TableCell><TableCell className="font-semibold">Total Kas Keluar</TableCell><TableCell className="num font-semibold">{fmtRp(data.total_keluar)}</TableCell></TableRow>
            <TableRow style={{ background: "var(--total-row-bg)" }}><TableCell></TableCell><TableCell className="font-bold">ARUS KAS BERSIH</TableCell><TableCell className="num font-bold">{fmtRp(data.arus_kas_bersih)}</TableCell></TableRow>
          </TableBody>
        </Table>
      </TableShell>
    );
  }
  if (active === "perubahan-ekuitas") {
    const row = (item) => item.kind === "section" ? (
      <TableRow key={item.no} style={{ background: "var(--total-row-bg)", fontWeight: 700 }}>
        <TableCell>{item.no}</TableCell><TableCell colSpan={2} className="uppercase tracking-wide" style={{ paddingLeft: 12 + (item.indent || 0) * 20 }}>{item.label}</TableCell>
      </TableRow>
    ) : (
      <TableRow key={item.no} style={item.bold ? { background: "var(--primary-light)", fontWeight: 700 } : undefined}>
        <TableCell>{item.no}</TableCell>
        <TableCell className="max-w-xs" style={{ paddingLeft: 12 + (item.indent || 0) * 20 }}>{item.label}</TableCell>
        <TableCell className="num">{fmtRp(item.amount)}</TableCell>
      </TableRow>
    );
    return (
      <TableShell minWidth={620}>
        <Table className="tbl-compact-mobile">
          <TableHeader><TableRow><TableHead>No.</TableHead><TableHead>Uraian</TableHead><TableHead className="num">Jumlah (Rp)</TableHead></TableRow></TableHeader>
          <TableBody>{data.rows.map(row)}</TableBody>
        </Table>
      </TableShell>
    );
  }
  if (active === "calk") {
    const INFO_LABELS = { nama: "Nama Entitas", periode_awal: "Periode Awal", periode_akhir: "Periode Akhir" };
    const RINGKASAN_LABELS = {
      total_pendapatan: "Total Pendapatan", total_beban: "Total Beban", laba_bersih: "Laba Bersih",
      total_aset: "Total Aset", total_kewajiban: "Total Kewajiban", total_ekuitas: "Total Ekuitas",
      arus_kas_bersih: "Arus Kas Bersih",
    };
    const titleCase = (s) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const fmtInfoValue = (k, v) => (k === "periode_awal" || k === "periode_akhir") ? fmtDate(v) : v;
    return (
      <div className="space-y-6 text-sm leading-relaxed">
        <section>
          <h4 className="font-heading font-semibold mb-2">1. Informasi Umum</h4>
          <TableShell minWidth={320}>
            <Table>
              <TableBody>
                {Object.entries(data.informasi_umum).map(([k, v]) => (
                  <TableRow key={k}><TableCell style={{ width: "45%" }}>{INFO_LABELS[k] || titleCase(k)}</TableCell><TableCell>{fmtInfoValue(k, v)}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </TableShell>
        </section>
        <section>
          <h4 className="font-heading font-semibold mb-2">2. Ringkasan Kinerja</h4>
          <TableShell minWidth={320}>
            <Table>
              <TableBody>
                {Object.entries(data.ringkasan_kinerja).map(([k, v]) => (
                  <TableRow key={k}><TableCell>{RINGKASAN_LABELS[k] || titleCase(k)}</TableCell><TableCell className="num">{fmtRp(v)}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </TableShell>
        </section>
        <section>
          <h4 className="font-heading font-semibold mb-2">3. Kebijakan Akuntansi</h4>
          <div className="space-y-3">
            {data.kebijakan_akuntansi.map((k, i) => (
              <p key={i} className="text-justify" style={{ color: "var(--text-primary)" }}>{k}</p>
            ))}
          </div>
        </section>
      </div>
    );
  }
  return null;
}
