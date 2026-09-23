import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ChangePassword() {
  const { changePassword, logout } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("Password baru minimal 8 karakter.");
      return;
    }
    if (newPassword !== confirmation) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("Password baru harus berbeda dari password sementara.");
      return;
    }
    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.response?.data?.detail || "Gagal mengganti password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="auth-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-md fade-in">
        <CardContent className="pt-6">
        <p className="label mb-1">Keamanan Akun</p>
        <h1 className="font-heading text-2xl font-bold">Ganti Password</h1>
        <p className="text-sm mt-2 mb-6" style={{ color: "var(--text-secondary)" }}>
          Password sementara harus diganti sebelum Anda dapat melanjutkan.
        </p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label" htmlFor="current-password">Password sementara</label>
            <Input id="current-password" type="password" required
              value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="new-password">Password baru</label>
            <Input id="new-password" type="password" minLength={8} required
              value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="confirm-password">Konfirmasi password baru</label>
            <Input id="confirm-password" type="password" minLength={8} required
              value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
          </div>
          {error && <div className="text-sm p-3 rounded-lg" style={{ background: "var(--status-error-bg)", color: "var(--status-error)" }}>{error}</div>}
          <Button className="w-full" disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan Password Baru"}
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={logout}>Keluar</Button>
        </form>
        </CardContent>
      </Card>
    </div>
  );
}
