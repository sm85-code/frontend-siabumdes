import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api, { fmtRp, fmtDate, API } from "@/lib/api";
import { useAuth, can } from "@/lib/auth";
import { notify, notifySuccess, notifyError } from "@/lib/feedback";
import { useConfirm } from "@/components/ConfirmProvider";
import { useSort } from "@/lib/useSort";
import { Plus, Trash, Pencil, Receipt, FileArrowUp, DownloadSimple, FileXls, Paperclip, LinkSimple, GoogleDriveLogo, X } from "@phosphor-icons/react";
import TableShell from "@/components/TableShell";
import Spinner from "@/components/Spinner";
import PeriodFilter, { resolveRange, fmtRangeLabel } from "@/components/PeriodFilter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table";

const pad = (n) => String(n).padStart(2, "0");

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  unit_usaha_id: "",
  transaction_type: "",
  description: "",
  amount: "",
  debit_account_code: "",
  credit_account_code: "",
  reference: "",
};

export default function Transactions() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const canWrite = can(user, "admin", "direktur", "bendahara", "pengelola");
  const canImport = can(user, "admin", "direktur", "bendahara");
  const canBulkDelete = can(user, "admin", "direktur", "bendahara");
  const isPengelola = user?.role === "pengelola";

  const [searchParams, setSearchParams] = useSearchParams();
  const refFilter = searchParams.get("reference") || "";
  const clearRefFilter = () => setSearchParams((prev) => { const p = new URLSearchParams(prev); p.delete("reference"); return p; });

  const [txs, setTxs] = useState([]);
  const [units, setUnits] = useState([]);
  const [types, setTypes] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);
  const proofInputRef = useRef(null);
  const [driveStatus, setDriveStatus] = useState(null);

  // Load Drive status for admin
  useEffect(() => {
    if (user?.role === "admin") {
      api.get("/admin/gdrive/status").then(r => setDriveStatus(r.data)).catch(() => {});
    }
  }, [user]);

  const connectDrive = async () => {
    try {
      const r = await api.get("/admin/gdrive/connect");
      window.open(r.data.auth_url, "_blank", "width=560,height=720");
      // Poll status setiap 3 detik untuk update state setelah user selesai OAuth
      const iv = setInterval(async () => {
        try {
          const s = await api.get("/admin/gdrive/status");
          if (s.data?.connected) {
            setDriveStatus(s.data);
            clearInterval(iv);
            notify("Google Drive terhubung");
          }
        } catch {}
      }, 3000);
      setTimeout(() => clearInterval(iv), 180000);
    } catch (er) { notify("Gagal memulai koneksi Drive"); }
  };

  const uploadProof = async (tx) => {
    if (driveStatus && !driveStatus.connected && user?.role === "admin") {
      notify("Google Drive belum terhubung. Klik 'Hubungkan Drive' dulu.");
      return;
    }
    const current = (tx.proofs || (tx.proof ? [tx.proof] : []));
    if (current.length >= 3) {
      notify("Maksimal 3 file bukti per transaksi.");
      return;
    }
    const inp = document.createElement("input");
    inp.type = "file";
    inp.accept = ".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png";
    inp.onchange = async (e) => {
      const f = e.target.files?.[0];
      if (!f) return;
      if (f.size > 1024 * 1024) { notify("Ukuran file maksimal 1 MB"); return; }
      const fd = new FormData();
      fd.append("file", f);
      try {
        const res = await fetch(`${API}/transactions/${tx.id}/proof`, {
          method: "POST", credentials: "include", body: fd,
        });
        const data = await res.json();
        if (!res.ok) { notify(data.detail || "Gagal upload bukti"); return; }
        const last = (data.proofs || []).slice(-1)[0];
        notify(`Bukti terupload: ${last?.file_name || "OK"}`);
        load();
      } catch (er) { notify("Gagal upload: " + er.message); }
    };
    inp.click();
  };

  const deleteProof = async (tx, fileId, fileName) => {
    if (!(await confirm({ title: "Hapus bukti transaksi", description: `Hapus file bukti "${fileName}"? File juga akan dihapus dari Google Drive.`, confirmLabel: "Hapus", destructive: true }))) return;
    try {
      const res = await fetch(`${API}/transactions/${tx.id}/proofs/${fileId}`, {
        method: "DELETE", credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) { notify(data.detail || "Gagal hapus bukti"); return; }
      load();
    } catch (er) { notify("Gagal hapus: " + er.message); }
  };

  // Unified tab + period filter
  const [activeGroup, setActiveGroup] = useState("BUMDES"); // BUMDES | UU01..UU06
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    const range = resolveRange("monthly", { monthValue: `${now.getFullYear()}-${pad(now.getMonth() + 1)}` });
    return { mode: "monthly", startDate: range.startDate, endDate: range.endDate };
  });
  const periodLabel = fmtRangeLabel(period.startDate, period.endDate);
  const [selected, setSelected] = useState(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    const [t, u, tt, a] = await Promise.all([
      api.get("/transactions", refFilter ? { params: { reference: refFilter, limit: 2000 } } : undefined),
      api.get("/unit-usaha"),
      api.get("/transaction-types"),
      api.get("/accounts"),
    ]);
    setTxs(t.data); setUnits(u.data); setTypes(tt.data); setAccounts(a.data);
    setLoading(false);
  }, [refFilter]);

  useEffect(() => { load(); }, [load]);

  // Sinkronisasi bukti dengan Google Drive di background:
  // jika pemilik akun Drive menghapus file di Drive, entri di aplikasi ikut hilang.
  useEffect(() => {
    if (!can(user, "admin", "direktur", "bendahara", "pengelola")) return;
    let ignore = false;
    (async () => {
      try {
        const r = await api.post("/transactions/verify-proofs");
        if (!ignore && r.data?.removed > 0) load();
      } catch {}
    })();
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Pengelola pinned to own unit tab
  useEffect(() => {
    if (isPengelola && units.length && user?.unit_usaha_id) {
      const own = units.find(x => x.id === user.unit_usaha_id);
      if (own && activeGroup !== own.code) setActiveGroup(own.code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPengelola, units, user]);

  // Pre-select pengelola's own unit as default for new form
  useEffect(() => {
    if (isPengelola && user?.unit_usaha_id && !editingId && !form.unit_usaha_id) {
      setForm(f => ({ ...f, unit_usaha_id: user.unit_usaha_id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, editingId]);

  const filteredTypes = useMemo(() => {
    let list;
    if (!form.unit_usaha_id) {
      list = types.filter(t => (t.group || "BUMDES") === "BUMDES");
    } else {
      const unitCode = units.find(u => u.id === form.unit_usaha_id)?.code;
      list = unitCode ? types.filter(t => (t.group || "BUMDES") === unitCode) : [];
    }
    return [...list].sort((a, b) => (a.name || "").localeCompare(b.name || "", "id", { sensitivity: "base" }));
  }, [types, form.unit_usaha_id, units]);

  const filteredAccounts = useMemo(() => {
    const grp = form.unit_usaha_id
      ? (units.find(u => u.id === form.unit_usaha_id)?.code || "BUMDES")
      : "BUMDES";
    return accounts.filter(a => (a.group || "BUMDES") === grp);
  }, [accounts, form.unit_usaha_id, units]);

  const onTypeChange = (code) => {
    const t = types.find(x => x.code === code);
    setForm(f => ({
      ...f, transaction_type: code,
      debit_account_code: t?.debit || f.debit_account_code,
      credit_account_code: t?.credit || f.credit_account_code,
      description: (editingId ? f.description : t?.name) || f.description,
    }));
  };

  const onUnitChange = (unitId) => {
    setForm(f => ({ ...f, unit_usaha_id: unitId, transaction_type: "" }));
  };

  const openCreate = () => {
    setEditingId(null);
    // Default unit: sesuai tab aktif
    let initialUnit = "";
    if (activeGroup !== "BUMDES") {
      initialUnit = units.find(u => u.code === activeGroup)?.id || "";
    }
    if (isPengelola) initialUnit = user.unit_usaha_id || "";
    setForm({ ...emptyForm, date: new Date().toISOString().slice(0, 10), unit_usaha_id: initialUnit });
    setShowForm(true);
  };

  const openEdit = (tx) => {
    setEditingId(tx.id);
    setForm({
      date: tx.date, unit_usaha_id: tx.unit_usaha_id || "",
      transaction_type: tx.transaction_type || "",
      description: tx.description || "", amount: String(tx.amount || 0),
      debit_account_code: tx.debit_account_code || "",
      credit_account_code: tx.credit_account_code || "",
      reference: tx.reference || "",
    });
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      const body = { ...form, amount: parseFloat(form.amount) };
      if (editingId) await api.put(`/transactions/${editingId}`, body);
      else await api.post("/transactions", body);
      setShowForm(false); setEditingId(null);
      load();
      notifySuccess(editingId ? "Transaksi berhasil diperbarui." : "Transaksi berhasil disimpan.");
    } catch (er) { notifyError(er.response?.data?.detail || "Gagal menyimpan"); }
  };

  const del = async (id) => {
    if (!(await confirm({ title: "Hapus transaksi", description: "Transaksi akan dihapus dan tidak dapat dipulihkan.", confirmLabel: "Hapus", destructive: true }))) return;
    try {
      await api.delete(`/transactions/${id}`);
      load();
      notifySuccess("Transaksi berhasil dihapus.");
    } catch (er) { notifyError(er.response?.data?.detail || "Gagal menghapus transaksi"); }
  };

  const bulkDelete = async () => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!(await confirm({ title: "Hapus transaksi terpilih", description: `Hapus ${ids.length} transaksi terpilih? Aksi ini tidak dapat dibatalkan.`, confirmLabel: "Hapus semua", destructive: true }))) return;
    try {
      await Promise.all(ids.map(id => api.delete(`/transactions/${id}`)));
      notifySuccess(`${ids.length} transaksi berhasil dihapus.`);
    } catch (er) {
      notifyError("Sebagian gagal dihapus: " + (er.response?.data?.detail || er.message));
    }
    setSelected(new Set());
    load();
  };

  const downloadTemplate = async () => {
    const res = await fetch(`${API}/transactions/template`, { credentials: "include" });
    if (!res.ok) { notify("Gagal download template"); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "Template-Transaksi-BUMDES.xlsx"; a.click();
    URL.revokeObjectURL(url);
  };

  const onImportClick = () => fileInputRef.current?.click();

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch(`${API}/transactions/import`, {
        method: "POST", credentials: "include", body: fd,
      });
      const data = await res.json();
      if (!res.ok) { notify(data.detail || "Gagal impor"); return; }
      setImportResult(data);
      load();
    } catch (er) { notify("Gagal impor: " + er.message); }
    finally { e.target.value = ""; }
  };

  const unitOf = (id) => units.find(u => u.id === id);
  const accName = (c) => accounts.find(a => a.code === c)?.name || c;
  const canEditRow = (tx) => {
    if (!canWrite) return false;
    if (isPengelola) return tx.unit_usaha_id === user.unit_usaha_id;
    return true;
  };

  // Fixed group order keeps the selector consistent with the UU01–UU06 business units.
  const groupTabs = useMemo(() => {
    const tabs = [
      { key: "BUMDES", label: "BUMDES - Pusat" },
      ...["UU01", "UU02", "UU03", "UU04", "UU05", "UU06"]
        .map(code => {
          const unit = units.find(u => u.code === code);
          return unit ? { key: code, label: `${code} - ${unit.name}` } : null;
        })
        .filter(Boolean),
    ];
    return isPengelola
      ? tabs.filter(t => t.key === units.find(u => u.id === user?.unit_usaha_id)?.code)
      : tabs;
  }, [units, isPengelola, user]);

  // Filter tx by activeGroup + period
  const activeUnitId = useMemo(() => {
    if (activeGroup === "BUMDES") return null;
    return units.find(u => u.code === activeGroup)?.id || null;
  }, [activeGroup, units]);

  const filteredTxs = useMemo(() => {
  // Deep-link dari Inventory (?reference=...): backend sudah filter persis
  // yang diminta, jangan disaring lagi oleh periode/unit yang sedang aktif
  // di halaman ini -- transaksinya bisa saja di bulan/unit yang beda dari
  // yang sedang ditampilkan.
  if (refFilter) return txs;
  return txs.filter(t => {
  const inGroup = activeGroup === "BUMDES" ? !t.unit_usaha_id : t.unit_usaha_id === activeUnitId;
  const inPeriod = (t.date || "") >= period.startDate && (t.date || "") <= period.endDate;
  return inGroup && inPeriod;
  });
  }, [txs, activeGroup, activeUnitId, period.startDate, period.endDate, refFilter]);

  const sortState = useSort(filteredTxs, "date", "desc");

  // Reset selection when tab/period changes
  useEffect(() => { setSelected(new Set()); }, [activeGroup, period.startDate, period.endDate]);

  const toggleSel = (id) => setSelected(prev => {
    const n = new Set(prev);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  });

  const exportExcel = async () => {
    if (sortState.sorted.length === 0) {
const proceed = await confirm({
  title: "Export tanpa transaksi",
  description: `Tidak ada transaksi ${activeGroup} pada ${periodLabel}. Tetap unduh file kosong?`,
  confirmLabel: "Unduh file",
  });
  if (!proceed) return;
    }
    const params = new URLSearchParams({ start_date: period.startDate, end_date: period.endDate });
    if (activeGroup === "BUMDES") params.set("unit_usaha_id", "");
    else if (activeUnitId) params.set("unit_usaha_id", activeUnitId);
    const res = await fetch(`${API}/transactions/export?${params}`, { credentials: "include" });
    if (!res.ok) { notify("Gagal export Excel"); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Transaksi_${activeGroup}_${period.startDate}_sd_${period.endDate}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAll = async () => {
    if (txs.length === 0) {
      notify("Belum ada transaksi di sistem.");
      return;
    }
if (!(await confirm({
  title: "Export semua transaksi",
  description: `Export SEMUA ${txs.length} transaksi dari seluruh unit dan periode ke satu file Excel multi-sheet?`,
  confirmLabel: "Export semua",
  }))) return;
    const res = await fetch(`${API}/transactions/export?all_data=true`, { credentials: "include" });
    if (!res.ok) { notify("Gagal export semua data"); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const today = new Date().toISOString().slice(0, 10);
    a.href = url; a.download = `Transaksi_Semua_Data_${today}.xlsx`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" data-testid="transactions-page">
      {user?.blocked_periods && user.blocked_periods.length > 0 && (
        <Card className="fade-in border-destructive/30 bg-destructive/5" data-testid="tx-blocked-banner">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">
              <b>Periode terkunci:</b>{" "}
              {user.blocked_periods.slice().sort().join(", ")}. Anda tidak dapat menambah/mengubah/menghapus transaksi pada periode tersebut.
            </p>
          </CardContent>
        </Card>
      )}

      {refFilter && (
        <Card className="flex items-center justify-between gap-3 flex-wrap p-4 border-primary/40">
          <p className="text-sm">
            Menampilkan {filteredTxs.length === 0 ? "0 transaksi" : `${filteredTxs.length} transaksi`} terkait mutasi/penyesuaian stok dari Inventory.
            {filteredTxs.length === 0 && " Kemungkinan mutasi ini tidak berdampak nilai (tidak ada jurnal yang diposting)."}
          </p>
          <Button type="button" variant="outline" size="sm" onClick={clearRefFilter}>
            Tampilkan semua transaksi
          </Button>
        </Card>
      )}

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="label mb-1">JOURNAL ENTRY</p>
          <h1 className="font-heading text-3xl font-bold page-h1">Transaksi Keuangan</h1>
          <p className="text-sm mt-1 text-muted-foreground">
            Input transaksi cepat — laporan terbentuk otomatis.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap w-full sm:w-auto">
          {user?.role === "admin" && (
            <Button data-testid="btn-connect-drive" onClick={connectDrive}
                    variant="outline" className="flex-1 sm:flex-none"
                    title={driveStatus?.email ? `Terhubung: ${driveStatus.email}` : "Belum terhubung"}>
              <GoogleDriveLogo size={16} weight="duotone"
                               className={driveStatus?.connected ? "text-green-600" : "text-amber-500"} />
              {driveStatus?.connected ? "Drive Terhubung" : "Hubungkan Drive"}
            </Button>
          )}
          {canImport && (
            <>
              <Button data-testid="btn-download-template" onClick={downloadTemplate} variant="outline" className="flex-1 sm:flex-none">
                <DownloadSimple size={16} weight="duotone" /> Download Template
              </Button>
              <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden"
                     data-testid="import-file-input" onChange={onFileChange} />
              <Button data-testid="btn-import-excel" onClick={onImportClick} variant="outline" className="flex-1 sm:flex-none">
                <FileArrowUp size={16} weight="duotone" /> Impor Excel
              </Button>
            </>
          )}
          <Button data-testid="btn-export-tx-excel" onClick={exportExcel} variant="outline" className="flex-1 sm:flex-none">
            <FileXls size={16} weight="duotone" /> Export Excel
          </Button>
          <Button data-testid="btn-export-tx-all" onClick={exportAll} variant="outline" className="flex-1 sm:flex-none">
            <FileXls size={16} weight="duotone" /> Export Semua Data
          </Button>
          <Button data-testid="btn-new-tx" onClick={openCreate}
                  disabled={!canWrite}
                  className="flex-1 sm:flex-none">
            <Plus size={18} weight="bold" /> Tambah Transaksi
          </Button>
        </div>
      </div>

      {importResult && (
        <Card className="fade-in bg-primary/5" data-testid="import-result">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-heading font-semibold mb-1">Hasil Impor</h4>
                <p className="text-sm">Berhasil: <b>{importResult.inserted}</b> dari <b>{importResult.total_rows}</b> baris.</p>
                {importResult.errors?.length > 0 && (
                  <ul className="text-xs mt-2 space-y-0.5 text-destructive">
                    {importResult.errors.slice(0, 10).map((e, i) => (<li key={i}>Baris {e.row}: {e.error}</li>))}
                    {importResult.errors.length > 10 && <li>+ {importResult.errors.length - 10} error lainnya</li>}
                  </ul>
                )}
              </div>
              <Button onClick={() => setImportResult(null)} variant="outline" size="sm">Tutup</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showForm && canWrite && (
        <Card className="fade-in">
          <CardHeader>
            <CardTitle className="font-heading text-lg">
              {editingId ? "Edit Transaksi" : "Transaksi Baru"}
            </CardTitle>
          </CardHeader>
          <form onSubmit={submit}>
            <CardContent className="pt-0 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Tanggal</Label>
                <Input data-testid="tx-date" type="date" required
                       value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Unit Usaha (opsional)</Label>
                <Select data-testid="tx-unit" value={form.unit_usaha_id || "__bumdes__"}
                        onValueChange={(v) => onUnitChange(v === "__bumdes__" ? "" : v)}
                        disabled={isPengelola}>
                  <SelectTrigger data-testid="tx-unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {!isPengelola && <SelectItem value="__bumdes__">BUMDES - Pusat</SelectItem>}
                    {units
                      .filter(u => !isPengelola || u.id === user?.unit_usaha_id)
                      .map(u => <SelectItem key={u.id} value={u.id}>{u.code} - {u.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Jenis Transaksi
                  {form.unit_usaha_id && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      (difilter berdasarkan unit terpilih)
                    </span>
                  )}
                </Label>
                <Select data-testid="tx-type" required value={form.transaction_type}
                        onValueChange={onTypeChange}>
                  <SelectTrigger data-testid="tx-type">
                    <SelectValue placeholder="— pilih jenis —" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTypes.map(t => <SelectItem key={t.code} value={t.code}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Nominal (Rp)</Label>
                <Input data-testid="tx-amount" type="number" min="0" step="1" required
                       value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                       placeholder="100000" />
              </div>
              <div className="space-y-1.5">
                <Label>Nomor Referensi (opsional)</Label>
                <Input data-testid="tx-ref"
                       value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })}
                       placeholder="mis. nota-001" />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Keterangan</Label>
                <Input data-testid="tx-desc" required
                       value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                       placeholder="Keterangan detail transaksi" />
              </div>
              <div className="space-y-1.5">
                <Label>Debit</Label>
                <Select data-testid="tx-debit" required value={form.debit_account_code}
                        onValueChange={(v) => setForm({ ...form, debit_account_code: v })}>
                  <SelectTrigger data-testid="tx-debit">
                    <SelectValue placeholder="— pilih akun —" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredAccounts.map(a => <SelectItem key={a.code} value={a.code}>{a.code} - {a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Kredit</Label>
                <Select data-testid="tx-credit" required value={form.credit_account_code}
                        onValueChange={(v) => setForm({ ...form, credit_account_code: v })}>
                  <SelectTrigger data-testid="tx-credit">
                    <SelectValue placeholder="— pilih akun —" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredAccounts.map(a => <SelectItem key={a.code} value={a.code}>{a.code} - {a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter className="sm:col-span-2 justify-end gap-2">
              <Button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} variant="outline">Batal</Button>
              <Button data-testid="tx-save" type="submit">
                {editingId ? "Simpan Perubahan" : "Simpan Transaksi"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Unified group and period filters */}
      <Card data-testid="tx-filters">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="tx-group-select">Kelompok</Label>
              <Select value={activeGroup} onValueChange={setActiveGroup} disabled={isPengelola}>
                <SelectTrigger id="tx-group-select" data-testid="tx-group-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {groupTabs.map(g => <SelectItem key={g.key} value={g.key}>{g.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Periode</Label>
              <PeriodFilter value={period} onChange={setPeriod} defaultMode="monthly" data-testid="tx-period-filter" />
            </div>
            <div className="text-xs px-3 py-2 rounded-lg bg-primary/10 text-primary font-semibold">
              Tampilkan: {periodLabel} · {activeGroup}
            </div>
            {canBulkDelete && selected.size > 0 && (
              <Button data-testid="btn-bulk-delete" onClick={bulkDelete}
                      variant="destructive" size="sm" className="sm:col-span-4 justify-self-start">
                <Trash size={14} /> Hapus {selected.size} Terpilih
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Unified Table */}
      <Card className="p-0 overflow-hidden">
        <CardHeader className="p-4 border-b bg-primary/10 space-y-0.5">
          <CardTitle className="font-heading font-semibold text-base" data-testid="tx-table-title">
            Transaksi {activeGroup} — {periodLabel}
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {sortState.sorted.length} transaksi ditemukan.
          </p>
        </CardHeader>
        <TableShell
          minWidth={720}
          data-testid="tx-table"
        >
          <Table data-testid="tx-table">
            <TableHeader>
              <TableRow>
                {canBulkDelete && (
                  <TableHead style={{ width: 32 }}>
                    <Checkbox data-testid="tx-select-all"
                           checked={sortState.sorted.length > 0 && sortState.sorted.every(r => selected.has(r.id))}
                           onCheckedChange={(checked) => {
                             if (checked) setSelected(new Set(sortState.sorted.map(r => r.id)));
                             else setSelected(new Set());
                           }} />
                  </TableHead>
                )}
                <TableHead {...sortState.headerProps("date")}>Tanggal{sortState.sortIndicator("date")}</TableHead>
                {activeGroup !== "BUMDES" && <TableHead>Unit</TableHead>}
                <TableHead {...sortState.headerProps("description")}>Keterangan{sortState.sortIndicator("description")}</TableHead>
                <TableHead {...sortState.headerProps("debit_account_code")}>Debit{sortState.sortIndicator("debit_account_code")}</TableHead>
                <TableHead {...sortState.headerProps("credit_account_code")}>Kredit{sortState.sortIndicator("credit_account_code")}</TableHead>
                <TableHead className="text-right" {...sortState.headerProps("amount")}>Jumlah{sortState.sortIndicator("amount")}</TableHead>
                <TableHead>Bukti</TableHead>
                {canWrite && <TableHead></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={99} className="text-center py-6"><Spinner className="justify-center" /></TableCell></TableRow>
              ) : sortState.sorted.length === 0 ? (
                <TableRow><TableCell colSpan={99} className="text-center py-10">
                  <Receipt size={32} weight="duotone" className="text-muted-foreground mx-auto mb-2" />
                  <div className="text-muted-foreground">
                    Belum ada transaksi <b>{activeGroup}</b> pada <b>{periodLabel}</b>.
                  </div>
                </TableCell></TableRow>
              ) : sortState.sorted.map((t) => (
                <TableRow key={t.id}>
                  {canBulkDelete && (
                    <TableCell>
                      <Checkbox data-testid={`sel-tx-${t.id}`}
                             checked={selected.has(t.id)}
                             onCheckedChange={() => toggleSel(t.id)} />
                    </TableCell>
                  )}
                  <TableCell>{fmtDate(t.date)}</TableCell>
                  {activeGroup !== "BUMDES" && (
                    <TableCell><Badge variant="secondary">{unitOf(t.unit_usaha_id)?.code}</Badge></TableCell>
                  )}
                  <TableCell className="max-w-xs truncate">{t.description}</TableCell>
                  <TableCell className="text-xs">{accName(t.debit_account_code)}</TableCell>
                  <TableCell className="text-xs">{accName(t.credit_account_code)}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">{fmtRp(t.amount)}</TableCell>
                  <TableCell>
                    {(() => {
                      const proofs = t.proofs || (t.proof ? [t.proof] : []);
                      const editable = canEditRow(t);
                      if (proofs.length === 0) {
                        return editable ? (
                          <button data-testid={`upload-proof-${t.id}`} onClick={() => uploadProof(t)}
                                  className="text-xs flex items-center gap-1 text-muted-foreground">
                            <Paperclip size={13} /> Upload
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        );
                      }
                      return (
                        <div className="flex flex-col gap-1">
                          {proofs.map((p) => (
                            <div key={p.file_id} className="flex items-center gap-1.5">
                              <a href={p.url} target="_blank" rel="noreferrer"
                                 data-testid={`view-proof-${t.id}-${p.file_id}`}
                                 className="text-xs flex items-center gap-1 underline truncate max-w-[180px] text-primary"
                                 title={p.file_name}>
                                <LinkSimple size={13} /> {p.file_name}
                              </a>
                              {editable && (
                                <button data-testid={`del-proof-${t.id}-${p.file_id}`}
                                        onClick={() => deleteProof(t, p.file_id, p.file_name)}
                                        title="Hapus bukti"
                                        className="p-1 rounded hover:bg-red-50">
                                  <X size={12} className="text-destructive" />
                                </button>
                              )}
                            </div>
                          ))}
                          {editable && proofs.length < 3 && (
                            <button data-testid={`add-proof-${t.id}`} onClick={() => uploadProof(t)}
                                    className="text-[11px] flex items-center gap-1 mt-0.5 text-muted-foreground">
                              <Paperclip size={11} /> Tambah ({proofs.length}/3)
                            </button>
                          )}
                        </div>
                      );
                    })()}
                  </TableCell>
                  {canWrite && (
                    <TableCell><div className="flex gap-1">
                      {canEditRow(t) && (
                        <Button data-testid={`edit-tx-${t.id}`} onClick={() => openEdit(t)}
                                variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10 hover:text-primary">
                          <Pencil size={16} />
                        </Button>
                      )}
                      {can(user, "admin", "direktur", "bendahara") && (
                        <Button data-testid={`del-tx-${t.id}`} onClick={() => del(t.id)}
                                variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive">
                          <Trash size={16} />
                        </Button>
                      )}
                    </div></TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableShell>
      </Card>
    </div>
  );
}
