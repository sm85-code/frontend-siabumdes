import { useCallback, useEffect, useState } from "react";
import api, { fmtRp } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useConfirm } from "@/components/ConfirmProvider";
import { Plus, Trash } from "@phosphor-icons/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import TableShell from "@/components/TableShell";

export default function MitraPage() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const [list, setList] = useState([]);
  const [units, setUnits] = useState([]);
  const [filter, setFilter] = useState("");
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ unit_usaha_id: "", name: "", mitra_type: "", phone: "", address: "", modal: 0 });

  const load = useCallback(async () => {
    const [m, u] = await Promise.all([api.get("/mitra", { params: filter ? { unit_usaha_id: filter } : {} }), api.get("/unit-usaha")]);
    setList(m.data); setUnits(u.data);
  }, [filter]);
  useEffect(() => { load(); }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    await api.post("/mitra", { ...form, modal: parseFloat(form.modal || 0) });
    setShow(false); setForm({ unit_usaha_id: "", name: "", mitra_type: "", phone: "", address: "", modal: 0 });
    load();
  };

  const del = async (id) => {
    if (!(await confirm({ title: "Hapus mitra", description: "Data mitra akan dihapus dan tidak dapat dipulihkan.", confirmLabel: "Hapus", destructive: true }))) return;
    await api.delete(`/mitra/${id}`);
    load();
  };

  const canDel = ["admin", "direktur", "bendahara"].includes(user.role);
  const canAdd = ["admin", "direktur", "bendahara", "pengelola"].includes(user.role);

  return (
    <div className="space-y-6" data-testid="mitra-page">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div><p className="label mb-1">Kemitraan</p><h1 className="font-heading text-3xl font-bold">Data Mitra Usaha</h1></div>
        <Button data-testid="btn-new-mitra" onClick={() => setShow(true)}
                disabled={!canAdd}
                title={canAdd ? "" : "Read-only role"}>
          <Plus size={16} /> Tambah Mitra
        </Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <Label className="label">Filter Unit</Label>
          <Select value={filter} onValueChange={(v) => setFilter(v === "__all__" ? "" : v)}>
            <SelectTrigger className="max-w-md mt-1">
              <SelectValue placeholder="Semua unit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Semua unit</SelectItem>
              {units.map(u => <SelectItem key={u.id} value={u.id}>{u.code} - {u.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {show && canAdd && (
        <Card className="fade-in">
          <CardContent className="pt-6">
            <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label className="label">Unit Usaha</Label>
                <Select required value={form.unit_usaha_id} onValueChange={(v) => setForm({ ...form, unit_usaha_id: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="— pilih —" /></SelectTrigger>
                  <SelectContent>
                    {units.map(u => <SelectItem key={u.id} value={u.id}>{u.code} - {u.name}</SelectItem>)}
                  </SelectContent>
                </Select></div>
              <div><Label className="label">Nama Mitra</Label><Input required className="mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label className="label">Jenis</Label><Input className="mt-1" placeholder="peternak_domba / tukang_kayu / dll" value={form.mitra_type} onChange={(e) => setForm({ ...form, mitra_type: e.target.value })} /></div>
              <div><Label className="label">HP</Label><Input className="mt-1" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label className="label">Alamat</Label><Input className="mt-1" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
              <div><Label className="label">Modal Dititipkan (Rp)</Label><Input type="number" className="mt-1" value={form.modal} onChange={(e) => setForm({ ...form, modal: e.target.value })} /></div>
              <div className="sm:col-span-2 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setShow(false)}>Batal</Button><Button type="submit">Simpan</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="p-0">
        <TableShell minWidth={720}>
          <Table>
            <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead>Unit</TableHead><TableHead>Jenis</TableHead><TableHead>HP</TableHead><TableHead className="num text-right">Modal</TableHead>{canDel && <TableHead></TableHead>}</TableRow></TableHeader>
            <TableBody>
              {list.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Belum ada mitra.</TableCell></TableRow>
                : list.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="font-medium">{m.name}</TableCell>
                    <TableCell><Badge variant="secondary">{units.find(u => u.id === m.unit_usaha_id)?.code || "-"}</Badge></TableCell>
                    <TableCell>{m.mitra_type || "-"}</TableCell>
                    <TableCell>{m.phone || "-"}</TableCell>
                    <TableCell className="num text-right">{fmtRp(m.modal)}</TableCell>
                    {canDel && <TableCell><Button variant="ghost" size="icon" onClick={() => del(m.id)} className="h-8 w-8"><Trash size={16} color="var(--status-error)" /></Button></TableCell>}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableShell>
      </Card>
    </div>
  );
}
