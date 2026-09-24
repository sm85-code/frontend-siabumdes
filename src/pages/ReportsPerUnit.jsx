import { useCallback, useEffect, useState } from "react";
import api, { fmtRp, API } from "@/lib/api";
import { FilePdf, FileXls } from "@phosphor-icons/react";
import TableShell from "@/components/TableShell";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import PeriodFilter from "@/components/PeriodFilter";

const today = new Date().toISOString().slice(0, 10);
const currentYear = today.slice(0, 4);
const currentMonth = today.slice(5, 7);
const lastDayOfCurrentMonth = String(new Date(Number(currentYear), Number(currentMonth), 0).getDate()).padStart(2, "0");

export default function ReportsPerUnit() {
  const [period, setPeriod] = useState({
    mode: "monthly",
    startDate: `${currentYear}-${currentMonth}-01`,
    endDate: `${currentYear}-${currentMonth}-${lastDayOfCurrentMonth}`,
  });
  const start = period.startDate;
  const end = period.endDate;
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
      <Card>
      <CardContent className="pt-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="label">Periode</label>
          <PeriodFilter value={period} onChange={setPeriod} defaultMode="monthly" data-testid="per-unit-period-filter" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="btn-per-unit-pdf" onClick={() => download("pdf")}><FilePdf size={16} color="var(--status-error)" /> PDF</Button>
          <Button variant="outline" data-testid="btn-per-unit-excel" onClick={() => download("excel")}><FileXls size={16} color="var(--primary-dark)" /> Excel</Button>
        </div>
      </CardContent>
      </Card>
      {data && (
        <Card className="p-0 overflow-hidden">
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
                    <TableCell><Badge>{u.code}</Badge></TableCell>
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
        </Card>
      )}
    </div>
  );
}
