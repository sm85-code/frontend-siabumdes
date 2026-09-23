import { useCallback, useEffect, useState } from "react";
import api, { fmtRp, API } from "@/lib/api";
import { FilePdf, FileXls } from "@phosphor-icons/react";
import TableShell from "@/components/TableShell";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

const today = new Date().toISOString().slice(0, 10);
const startOfYear = today.slice(0, 4) + "-01-01";

export default function ReportsPerUnit() {
  const [start, setStart] = useState(startOfYear);
  const [end, setEnd] = useState(today);
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    const r = await api.get("/reports/per-unit", { params: { start_date: start, end_date: end } });
    setData(r.data);
  }, [start, end]);

  useEffect(() => { load(); }, [load]);

  const download = async (kind) => {
    const res = await fetch(`${API}/reports/per-unit/${kind}?start_date=${start}&end_date=${end}`, {
      credentials: "include",
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ext = kind === "pdf" ? "pdf" : "xlsx";
    a.href = url; a.download = `Laporan-Per-Unit_${start}_sd_${end}.${ext}`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" data-testid="per-unit-page">
      <div>
        <p className="label mb-1">Laporan</p>
        <h1 className="font-heading text-3xl font-bold">Kinerja Per Unit Usaha</h1>
      </div>
      <div className="card grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
        <div><label className="label">Dari</label><input type="date" className="input" value={start} onChange={(e) => setStart(e.target.value)} /></div>
        <div><label className="label">Sampai</label><input type="date" className="input" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
        <div className="flex gap-2">
          <button onClick={load} className="btn btn-primary flex-1">Terapkan</button>
          <button data-testid="btn-per-unit-pdf" onClick={() => download("pdf")} className="btn btn-outline"><FilePdf size={16} color="var(--status-error)" /> PDF</button>
          <button data-testid="btn-per-unit-excel" onClick={() => download("excel")} className="btn btn-outline"><FileXls size={16} color="var(--primary-dark)" /> Excel</button>
        </div>
      </div>
      {data && (
        <div className="card p-0 overflow-hidden">
          <TableShell minWidth={720}>
            <Table data-testid="per-unit-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead><TableHead>Unit Usaha</TableHead>
                  <TableHead className="num">Pendapatan</TableHead><TableHead className="num">Beban</TableHead>
                  <TableHead className="num">Laba Bersih</TableHead>
                  <TableHead className="num">30% Pengelola</TableHead><TableHead className="num">70% BUMDES</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.units.map(u => (
                  <TableRow key={u.id}>
                    <TableCell><span className="badge">{u.code}</span></TableCell>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="num">{fmtRp(u.pendapatan)}</TableCell>
                    <TableCell className="num">{fmtRp(u.beban)}</TableCell>
                    <TableCell className="num font-semibold" style={{ color: u.laba_bersih >= 0 ? "var(--primary-dark)" : "var(--status-error)" }}>{fmtRp(u.laba_bersih)}</TableCell>
                    <TableCell className="num" style={{ color: "var(--primary-dark)" }}>{fmtRp(u.share_pengelola_30)}</TableCell>
                    <TableCell className="num" style={{ color: "var(--primary-dark)" }}>{fmtRp(u.share_bumdes_70)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableShell>
        </div>
      )}
    </div>
  );
}
