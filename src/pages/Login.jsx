import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Eye, EyeSlash, SignIn, ArrowLeft } from "@phosphor-icons/react";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      await login(username.trim(), password);
      nav("/dashboard");
    } catch (er) {
      setErr(er.response?.data?.detail || "Login gagal");
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-bg flex items-center justify-center p-4 relative">
      <Link to="/" data-testid="login-back" className="absolute top-4 left-4 sm:top-6 sm:left-6 btn btn-outline text-xs sm:text-sm">
        <ArrowLeft size={14} /> Kembali
      </Link>
      <div className="w-full max-w-md fade-in">
        <div className="text-center mb-6">
          <img src="/logo-bumdes.webp" alt="Logo BUMDES Karya Raharja" data-testid="bumdes-logo"
               className="w-28 h-28 rounded-full object-cover mx-auto mb-3" style={{ border: "1px solid var(--border)" }} />
          <h1 className="font-heading text-2xl sm:text-3xl mt-1">BUMDes Karya Raharja</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Sistem Informasi Akuntansi</p>
        </div>
        <div className="card">
          <h2 className="font-heading text-xl mb-1">Masuk ke Akun</h2>
          <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>Silakan gunakan username & password Anda.</p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Username / Email</label>
              <input data-testid="login-username" className="input" value={username}
                onChange={(e) => setUsername(e.target.value)} placeholder="mis. admin" autoFocus required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input data-testid="login-password" className="input pr-10" type={showPw ? "text" : "password"}
                  value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                <button type="button" data-testid="toggle-password" onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                  {showPw ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {err && (
              <div data-testid="login-error" className="text-sm p-3 rounded-xl"
                   style={{ background: "#F8E8E6", color: "#B4544A" }}>{err}</div>
            )}
            <button data-testid="login-submit" disabled={loading} className="btn btn-primary w-full">
              <SignIn size={18} weight="bold" />{loading ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>
        <p className="text-center text-xs mt-5" style={{ color: "var(--text-muted)" }}>
          Aplikasi SIA BUMDes ini dikembangkan dengan berpedoman pada Kepmendesa PDTT No. 136 Tahun 2022.
        </p>
        <p className="text-center text-xs mt-4" style={{ color: "var(--text-muted)" }}>
          © {new Date().getFullYear()} BUMDes Karya Raharja Wonoharjo. All Rights Reserved.
        </p>
      </div>
    </div>
  );
}
