import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api, { fmtRp, fmtDate, API } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { notify } from "@/lib/feedback";
import { Books, MagnifyingGlass, FilePdf, FileXls, FileDoc, CaretUpDown, Check } from "@phosphor-icons/react";
import TableShell from "@/components/TableShell";
import Spinner from "@/components/Spinner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import PeriodFilter from "@/components/PeriodFilter";

const pad = (n) => String(n).padStart(2, "0");

export default function BukuBesar() {
  const { user } = useAuth();
  const isPengelola = user?.role === "pengelola";

  const [accounts, setAccounts] = useState([]);
  const [units, setUnits] = useState([]);
  const [group, setGroup] = useState("BUMDES"); // active tab
  const [selected, setSelected] = useState("");
  const [search, setSearch] = useState("");
  const now = new Date();
  const [period, setPeriod] = useState({
    mode: "monthly",
    startDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`,
    endDate: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate())}`,
  });
  const startDate = period.startDate;
  const endDate = period.endDate;
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/accounts"), api.get("/unit-usaha")]).then(([a, u]) => {
      setAccounts(a.data); setUnits(u.data);
      // pengelola: pin ke unit sendiri
      if (isPengelola && user?.unit_usaha_id) {
        const own = u.data.find(x => x.id === user.unit_usaha_id);
        if (own) setGroup(own.code);
      }
    });
  }, [isPengelola, user]);

  // unit_usaha_id derived from active tab
  const activeUnitId = useMemo(() => {
    if (group === "BUMDES") return null;
    return units.find(u => u.code === group)?.id || null;
  }, [group, units]);

  const loadLedger = useCallback(async (code) => {
    if (!code) { setLedger(null); return; }
    setLoading(true);
    try {
      const params = { account_code: code, start_date: startDate, end_date: endDate };
      if (activeUnitId) params.unit_usaha_id = activeUnitId;
      const r = await api.get("/reports/ledger", { params });
      setLedger(r.data);
    } catch (er) { notify(er.response?.data?.detail || "Gagal memuat buku besar"); }
    finally { setLoading(false); }
  }, [startDate, endDate, activeUnitId]);

  useEffect(() => { if (selected) loadLedger(selected); }, [selected, loadLedger]);

  // When switching group tab, reset selection
  useEffect(() => { setSelected(""); setLedger(null); }, [group]);

  const downloadPdf = async () => download("pdf");
  const downloadExcel = async () => download("excel");
  const downloadWord = async () => download("word");
  const download = async (kind) => {
    if (!selected) return;
    const p = new URLSearchParams({ account_code: selected, start_date: startDate, end_date: endDate });
    if (activeUnitId) p.set("unit_usaha_id", activeUnitId);
    const res = await fetch(`${API}/reports/ledger/${kind}?${p}`, {
      credentials: "include",
    });
    if (!res.ok) { notify(`Gagal mengunduh ${kind}`); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const ext = kind === "pdf" ? "pdf" : kind === "word" ? "docx" : "xlsx";
    a.href = url; a.download = `Buku-Besar_${group}_${selected}_${startDate}_sd_${endDate}.${ext}`; a.click();
    URL.revokeObjectURL(url);
  };

  // Filter accounts by active group
  const groupAccounts = useMemo(
    () => accounts.filter(a => (a.group || "BUMDES") === group),
    [accounts, group]
  );
  const filteredAccounts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groupAccounts;
    return groupAccounts.filter(a => a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q));
  }, [groupAccounts, search]);

  const groupTabs = useMemo(() => {
    const tabs = [{ key: "BUMDES", label: "BUMDES - Pusat" }];
    ["UU01", "UU02", "UU03", "UU04", "UU05", "UU06"].forEach(code => {
      const u = units.find(unit => unit.code === code);
      if (u) tabs.push({ key: u.code, label: `${u.code} - ${u.name}` });
    });
    return isPengelola
      ? tabs.filter(t => t.key !== "BUMDES" && t.key === units.find(u => u.id === user?.unit_usaha_id)?.code)
      : tabs;
  }, [units, isPengelola, user]);

  return (
    <div className="space-y-6" data-testid="ledger-page">
      <div>
        <p className="label mb-1">GENERAL LEDGER</p>
        <h1 className="font-heading text-3xl font-bold flex items-center gap-2 page-h1">
          <Books size={26} weight="duotone" color="var(--primary-dark)" /> Buku Besar per Akun
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
          Tiap kelompok punya buku besar sendiri. Pilih kelompok terlebih dahulu, lalu pilih akun dari dropdown untuk melihat riwayat transaksinya.
        </p>
      </div>

      <Card className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-start" data-testid="ledger-filters">
        <div>
          <label className="label" htmlFor="ledger-group-select">Kelompok</label>
          <Select value={group} disabled={isPengelola} onValueChange={(v) => setGroup(v)}>
            <SelectTrigger id="ledger-group-select" data-testid="ledger-group-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {groupTabs.map(g => <SelectItem key={g.key} value={g.key}>{g.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="label" htmlFor="ledger-period-filter">Periode</label>
          <PeriodFilter
            value={period}
            onChange={(next) => { setPeriod(next); setSelected(""); setLedger(null); }}
            defaultMode="monthly"
            data-testid="ledger-period-filter"
            className="w-full"
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <label className="label" htmlFor="ledger-account-select">Akun</label>
          <AccountCombobox
            accounts={filteredAccounts}
            group={group}
            selected={selected}
            onSelect={setSelected}
            search={search}
            onSearchChange={setSearch}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6">
        <div>
          {!selected ? (
            <Card className="text-center py-16">
              <Books size={40} weight="duotone" color="var(--text-muted)" style={{ margin: "0 auto 12px" }} />
              <p style={{ color: "var(--text-muted)" }}>Pilih akun dari dropdown di atas untuk melihat buku besar <b>{group}</b>.</p>
            </Card>
          ) : loading ? (
            <Card className="text-center py-10"><Spinner column size={40} className="justify-center" /></Card>
          ) : ledger ? (
            <Card className="p-0 overflow-hidden">
              <div className="p-5" style={{ borderBottom: "1px solid var(--legacy-border)" }}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="label mb-0">Buku Besar · {group}</p>
                    <h3 className="font-heading text-xl font-bold" data-testid="ledger-title">
                      {ledger.account.code} — {ledger.account.name}
                    </h3>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      Kategori: {ledger.account.category} • Saldo normal: {ledger.account.normal_balance}
                    </p>
                  </div>
                  <div className="flex items-start gap-3 flex-wrap">
                    <div className="text-right">
                      <div className="label">Saldo Akhir</div>
                      <div className="font-heading text-xl font-bold" style={{ color: "var(--primary-dark)" }} data-testid="ledger-final-balance">
                        {fmtRp(ledger.saldo_akhir)}
                      </div>
                    </div>
                    <Button variant="outline" data-testid="btn-ledger-pdf" onClick={downloadPdf}>
                      <FilePdf size={16} weight="duotone" color="var(--status-error)" /> Export PDF
                    </Button>
                    <Button variant="outline" data-testid="btn-ledger-excel" onClick={downloadExcel}>
                      <FileXls size={16} weight="duotone" color="var(--primary-dark)" /> Export Excel
                    </Button>
                    <Button variant="outline" data-testid="btn-ledger-word" onClick={downloadWord}>
                      <FileDoc size={16} weight="duotone" color="#2b579a" /> Export Word
                    </Button>
                  </div>
                </div>
              </div>
              <TableShell
                minWidth={760}
                data-testid="ledger-table"
              >
                <Table className="tbl-compact-mobile" data-testid="ledger-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Keterangan</TableHead>
                      <TableHead>Akun Lawan</TableHead>
                      <TableHead>Ref.</TableHead>
                      <TableHead className="num">Debit</TableHead>
                      <TableHead className="num">Kredit</TableHead>
                      <TableHead className="num">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow style={{ background: "var(--primary-light)" }}>
                      <TableCell colSpan={6} className="font-semibold">Saldo Awal</TableCell>
                      <TableCell className="num font-semibold">{fmtRp(ledger.saldo_awal)}</TableCell>
                    </TableRow>
                    {ledger.entries.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8" style={{ color: "var(--text-muted)" }}>
                        Tidak ada transaksi pada periode ini.
                      </TableCell></TableRow>
                    ) : ledger.entries.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>{fmtDate(e.date)}</TableCell>
                        <TableCell className="max-w-xs">{e.description}</TableCell>
                        <TableCell className="text-xs">
                          <div className="font-mono">{e.other_account_code}</div>
                          <div style={{ color: "var(--text-muted)" }}>{e.other_account_name}</div>
                        </TableCell>
                        <TableCell className="text-xs">{e.reference || "-"}</TableCell>
                        <TableCell className="num">{e.debit ? fmtRp(e.debit) : "-"}</TableCell>
                        <TableCell className="num">{e.credit ? fmtRp(e.credit) : "-"}</TableCell>
                        <TableCell className="num font-semibold tabular-nums">{fmtRp(e.balance)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow style={{ background: "var(--total-row-bg)" }}>
                      <TableCell colSpan={4} className="font-bold" style={{ color: "var(--primary-dark)" }}>TOTAL PERIODE</TableCell>
                      <TableCell className="num font-bold">{fmtRp(ledger.total_debit)}</TableCell>
                      <TableCell className="num font-bold">{fmtRp(ledger.total_credit)}</TableCell>
                      <TableCell className="num font-bold">{fmtRp(ledger.saldo_akhir)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableShell>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AccountCombobox({ accounts, group, selected, onSelect, search, onSearchChange }) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);
  const selectedAccount = accounts.find(a => a.code === selected)
    || (selected ? { code: selected, name: "" } : null);

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (o) setTimeout(() => inputRef.current?.focus(), 0); }}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          id="ledger-account-select"
          data-testid="ledger-account-select"
          className="w-full justify-between font-normal"
        >
          {selectedAccount ? (
            <span className="truncate text-left">
              <span className="font-mono text-xs font-semibold mr-2">{selectedAccount.code}</span>
              <span>{selectedAccount.name}</span>
            </span>
          ) : (
            <span style={{ color: "var(--text-muted)" }}>Pilih akun {group}...</span>
          )}
          <CaretUpDown size={16} className="ml-2 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <div className="p-2" style={{ borderBottom: "1px solid var(--legacy-border)" }}>
          <div className="relative">
            <MagnifyingGlass size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" color="var(--text-muted)" />
            <Input
              ref={inputRef}
              id="ledger-search"
              data-testid="ledger-search"
              className="pl-10"
              placeholder="Cari berdasarkan kode atau nama akun"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
        <ul data-testid="ledger-account-list" className="max-h-72 overflow-y-auto">
          {accounts.length === 0 ? (
            <li className="p-4 text-sm text-center" style={{ color: "var(--text-muted)" }}>
              Belum ada akun pada kelompok <b>{group}</b>.
            </li>
          ) : accounts.map(a => {
            const active = a.code === selected;
            return (
              <li key={a.code}>
                <button
                  type="button"
                  data-testid={`ledger-acc-${a.code}`}
                  onClick={() => { onSelect(a.code); setOpen(false); }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 border-b transition-colors flex items-center justify-between gap-2",
                    active ? "bg-primary/10" : "bg-transparent hover:bg-muted/50",
                  )}
                  style={{ borderColor: "var(--legacy-border)" }}
                >
                  <span>
                    <span className={cn("block font-mono text-xs font-semibold", active ? "text-primary" : "text-muted-foreground")}>{a.code}</span>
                    <span className={cn("block text-sm", active ? "text-primary" : "text-foreground")}>{a.name}</span>
                  </span>
                  {active && <Check size={16} className="text-primary shrink-0" />}
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
