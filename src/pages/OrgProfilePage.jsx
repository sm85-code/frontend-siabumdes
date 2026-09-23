import { useEffect, useState } from "react";
import api from "@/lib/api";
import { notify } from "@/lib/feedback";
import Spinner from "@/components/Spinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const EMPTY = {
  org_name: "", org_legal_name: "", address: "", village: "", district: "",
  regency: "", province: "", phone: "", email: "", tagline: "", logo_url: "",
  signatory_left_title: "", signatory_left_name: "",
  signatory_mid_title: "", signatory_mid_name: "",
  signatory_right_title: "", signatory_right_name: "",
  primary_color: "1F4E79",
};

export default function OrgProfilePage() {
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get("/org-profile");
      setForm({ ...EMPTY, ...r.data });
    } catch (er) {
      notify(er.response?.data?.detail || "Gagal memuat profil BUMDES");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { logo_url: _logoUrl, updated_at: _updatedAt, ...payload } = form;
      const r = await api.put("/org-profile", payload);
      setForm({ ...EMPTY, ...r.data });
      notify("Profil BUMDES tersimpan. Kop surat export PDF/Excel/Word akan langsung memakai data ini.");
    } catch (er) {
      notify(er.response?.data?.detail || "Gagal menyimpan profil BUMDES");
    } finally {
      setSaving(false);
    }
  };

  const uploadLogo = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { notify("Ukuran logo maksimal 2 MB"); return; }
    const fd = new FormData();
    fd.append("file", file);
    setUploading(true);
    api.post("/org-profile/logo", fd)
      .then((r) => { setForm({ ...EMPTY, ...r.data }); notify("Logo BUMDES berhasil diupload"); })
      .catch((er) => notify(er.response?.data?.detail || "Gagal upload logo"))
      .finally(() => setUploading(false));
  };

  if (loading) return <Spinner />;

  return (
    <div className="max-w-3xl space-y-6" data-testid="org-profile-page">
      <div>
        <p className="label mb-1">PENGATURAN</p>
        <h1 className="font-heading text-2xl font-bold page-h1">Profil BUMDES</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Teks dan logo di sini dipakai sebagai kop surat pada semua export PDF, Excel, dan Word
          (Laporan Keuangan, Buku Besar). Perubahan langsung berlaku tanpa perlu deploy ulang.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Logo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-20 h-20 rounded-lg flex items-center justify-center overflow-hidden shrink-0 bg-muted border border-border">
              {form.logo_url ? (
                <img src={form.logo_url} alt="Logo BUMDES" className="w-full h-full object-contain" />
              ) : (
                <span className="text-xs text-center px-1 text-muted-foreground">Belum ada logo</span>
              )}
            </div>
            <div>
              <Label className="inline-flex">
                <Button asChild variant="outline" size="sm" className="cursor-pointer">
                  <span>{uploading ? "Mengupload..." : "Upload Logo"}</span>
                </Button>
                <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden
                       onChange={uploadLogo} disabled={uploading} data-testid="org-logo-input" />
              </Label>
              <p className="text-xs mt-1 text-muted-foreground">PNG/JPG/WebP/SVG, maksimal 2 MB. Tampil di tengah kop surat.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={save} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Identitas Organisasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <Label className="label">Nama BUMDES<Input className="mt-1" value={form.org_name} onChange={set("org_name")} required /></Label>
              <Label className="label">Nama Badan Hukum<Input className="mt-1" value={form.org_legal_name} onChange={set("org_legal_name")} /></Label>
              <Label className="label sm:col-span-2">Tagline (di bawah nama, opsional)<Input className="mt-1" value={form.tagline} onChange={set("tagline")} /></Label>
              <Label className="label sm:col-span-2">Alamat<Input className="mt-1" value={form.address} onChange={set("address")} placeholder="Jl. Contoh No. 1" /></Label>
              <Label className="label">Desa/Kelurahan<Input className="mt-1" value={form.village} onChange={set("village")} /></Label>
              <Label className="label">Kecamatan<Input className="mt-1" value={form.district} onChange={set("district")} /></Label>
              <Label className="label">Kabupaten/Kota<Input className="mt-1" value={form.regency} onChange={set("regency")} /></Label>
              <Label className="label">Provinsi<Input className="mt-1" value={form.province} onChange={set("province")} /></Label>
              <Label className="label">Telepon<Input className="mt-1" value={form.phone} onChange={set("phone")} /></Label>
              <Label className="label">Email<Input className="mt-1" type="email" value={form.email} onChange={set("email")} /></Label>
              <Label className="label">Warna Kop Surat<div className="flex items-center gap-2 mt-1">
                <input type="color" className="h-11 w-14 rounded-md border border-border"
                       value={`#${(form.primary_color || "1F4E79").replace("#", "")}`}
                       onChange={(e) => setForm((f) => ({ ...f, primary_color: e.target.value.replace("#", "") }))} />
                <span className="text-sm font-mono">#{(form.primary_color || "1F4E79").replace("#", "").toUpperCase()}</span>
              </div></Label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-lg">Kolom Tanda Tangan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs mb-3 text-muted-foreground">
              Nama dikosongkan akan tampil sebagai titik-titik (belum diisi manual) di dokumen.
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              <Label className="label">Jabatan Kiri<Input className="mt-1" value={form.signatory_left_title} onChange={set("signatory_left_title")} /></Label>
              <Label className="label">Jabatan Tengah<Input className="mt-1" value={form.signatory_mid_title} onChange={set("signatory_mid_title")} /></Label>
              <Label className="label">Jabatan Kanan<Input className="mt-1" value={form.signatory_right_title} onChange={set("signatory_right_title")} /></Label>
              <Label className="label">Nama Kiri<Input className="mt-1" value={form.signatory_left_name} onChange={set("signatory_left_name")} /></Label>
              <Label className="label">Nama Tengah<Input className="mt-1" value={form.signatory_mid_name} onChange={set("signatory_mid_name")} /></Label>
              <Label className="label">Nama Kanan<Input className="mt-1" value={form.signatory_right_name} onChange={set("signatory_right_name")} /></Label>
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={saving} data-testid="save-org-profile">
          {saving ? "Menyimpan..." : "Simpan Profil BUMDES"}
        </Button>
      </form>
    </div>
  );
}
