import { useState } from "react";
import { useAuth } from "@/lib/auth";
import api from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { user, changePassword } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name || "", username: user?.username || "", email: user?.email || "" });
  const [passwords, setPasswords] = useState({ current: "", next: "", confirm: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const saveProfile = async (event) => {
    event.preventDefault();
    setMessage(""); setError("");
    try {
      await api.put("/auth/profile", profile);
      window.location.reload();
    } catch (err) {
      setError(err.response?.data?.detail || "Profil gagal diperbarui");
    }
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setMessage(""); setError("");
    if (passwords.next !== passwords.confirm) return setError("Konfirmasi password tidak sama");
    try {
      await changePassword(passwords.current, passwords.next);
      setPasswords({ current: "", next: "", confirm: "" });
      setMessage("Password berhasil diperbarui");
    } catch (err) {
      setError(err.response?.data?.detail || "Password gagal diperbarui");
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Profil Saya</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola identitas akun dan password Anda sendiri.
        </p>
      </div>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Informasi Profil</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
            <Label className="label">Nama<Input className="mt-1" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required /></Label>
            <Label className="label">Username<Input className="mt-1" value={profile.username} onChange={(e) => setProfile({ ...profile, username: e.target.value })} required minLength={3} /></Label>
            <Label className="label sm:col-span-2">Email<Input className="mt-1" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} required /></Label>
            <div><Button type="submit">Simpan Profil</Button></div>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-lg">Ganti Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={savePassword} className="grid gap-4">
            <Label className="label">Password Saat Ini<Input className="mt-1" type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} required /></Label>
            <Label className="label">Password Baru<Input className="mt-1" type="password" minLength={8} value={passwords.next} onChange={(e) => setPasswords({ ...passwords, next: e.target.value })} required /></Label>
            <Label className="label">Konfirmasi Password Baru<Input className="mt-1" type="password" minLength={8} value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} required /></Label>
            <div><Button type="submit">Ganti Password</Button></div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
