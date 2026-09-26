import { useEffect, useState } from "react";
import api from "@/lib/api";
import { notify } from "@/lib/feedback";
import Spinner from "@/components/Spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, PencilSimple } from "@phosphor-icons/react";

const BUSINESS_TYPES = [
  { value: "jasa", label: "Jasa" },
  { value: "perdagangan", label: "Perdagangan" },
  { value: "manufaktur", label: "Manufaktur" },
];
const BUSINESS_TYPE_LABEL = Object.fromEntries(BUSINESS_TYPES.map((t) => [t.value, t.label]));

const EMPTY_NEW = { code: "", name: "", business_type: "jasa" };

export default function UnitUsahaPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newUnit, setNewUnit] = useState(EMPTY_NEW);
  const [editing, setEditing] = useState(null); // unit object being edited, or null

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/unit-usaha");
      setList(r.data || []);
    } catch (er) {
      notify(er.response?.data?.detail || "Gagal memuat daftar unit usaha");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const submitNew = async (e) => {
    e.preventDefault();
    if (!newUnit.code.trim() || !newUnit.name.trim()) {
      notify("Kode dan nama unit wajib diisi");
      return;
    }
    setSaving(true);
    try {
      await api.post("/unit-usaha", newUnit);
      notify("Unit usaha baru ditambahkan");
      setAddOpen(false);
      setNewUnit(EMPTY_NEW);
      await load();
    } catch (er) {
      notify(er.response?.data?.detail || "Gagal menambah unit usaha");
    } finally {
      setSaving(false);
    }
  };

  const submitEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch(`/unit-usaha/${editing.id}`, {
        name: editing.name,
        business_type: editing.business_type,
        active: editing.active,
      });
      notify("Perubahan unit usaha tersimpan");
      setEditing(null);
      await load();
    } catch (er) {
      notify(er.response?.data?.detail || "Gagal menyimpan perubahan unit usaha");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Spinner column size={48} label="Memuat unit usaha..." />;

  return (
    <div className="space-y-6" data-testid="unit-page">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="label mb-1">Struktur Usaha</p>
          <h1 className="font-heading text-3xl font-bold">
            {list.length} Unit Usaha BUMDES
          </h1>
        </div>
        <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) setNewUnit(EMPTY_NEW); }}>
          <DialogTrigger asChild>
            <Button data-testid="unit-add-btn"><Plus className="mr-1" size={16} /> Tambah Unit</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Tambah Unit Usaha</DialogTitle></DialogHeader>
            <form onSubmit={submitNew} className="space-y-3">
              <div>
                <Label htmlFor="new-code">Kode unit</Label>
                <Input id="new-code" data-testid="unit-new-code" value={newUnit.code}
                  onChange={(e) => setNewUnit((f) => ({ ...f, code: e.target.value }))}
                  placeholder="mis. UU07" />
                <p className="text-xs text-muted-foreground mt-1">
                  Kode tidak bisa diubah lagi setelah dibuat.
                </p>
              </div>
              <div>
                <Label htmlFor="new-name">Nama unit</Label>
                <Input id="new-name" data-testid="unit-new-name" value={newUnit.name}
                  onChange={(e) => setNewUnit((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>Jenis usaha</Label>
                <Select value={newUnit.business_type}
                  onValueChange={(v) => setNewUnit((f) => ({ ...f, business_type: v }))}>
                  <SelectTrigger data-testid="unit-new-business-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saving} data-testid="unit-new-save">
                  {saving ? "Menyimpan..." : "Simpan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {list.map((u) => (
          <Card key={u.id} data-testid={`unit-card-${u.code}`} className={u.active === false ? "opacity-60" : ""}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{u.code}</Badge>
                  <Badge variant="outline">{BUSINESS_TYPE_LABEL[u.business_type] || u.business_type}</Badge>
                  {u.active === false && <Badge variant="outline">Nonaktif</Badge>}
                </div>
                <Button variant="ghost" size="icon" data-testid={`unit-edit-${u.code}`}
                  onClick={() => setEditing({ ...u })}>
                  <PencilSimple size={16} />
                </Button>
              </div>
              <h3 className="font-heading text-lg font-bold mb-2">{u.name}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => { if (!o) setEditing(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Unit Usaha {editing?.code}</DialogTitle></DialogHeader>
          {editing && (
            <form onSubmit={submitEdit} className="space-y-3">
              <div>
                <Label>Kode unit</Label>
                <Input value={editing.code} disabled />
                <p className="text-xs text-muted-foreground mt-1">
                  Kode tidak bisa diubah karena sudah dipakai di akun/transaksi unit ini.
                </p>
              </div>
              <div>
                <Label htmlFor="edit-name">Nama unit</Label>
                <Input id="edit-name" data-testid="unit-edit-name" value={editing.name}
                  onChange={(e) => setEditing((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <Label>Jenis usaha</Label>
                <Select value={editing.business_type}
                  onValueChange={(v) => setEditing((f) => ({ ...f, business_type: v }))}>
                  <SelectTrigger data-testid="unit-edit-business-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="edit-active" data-testid="unit-edit-active" checked={editing.active !== false}
                  onCheckedChange={(v) => setEditing((f) => ({ ...f, active: v }))} />
                <Label htmlFor="edit-active">Unit aktif</Label>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saving} data-testid="unit-edit-save">
                  {saving ? "Menyimpan..." : "Simpan"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
