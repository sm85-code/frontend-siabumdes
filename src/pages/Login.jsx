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
      <Link to="/" data-testid="login-back"
            className="absolute top-4 left-4 sm:top-6 sm:left-6 btn btn-outline text-xs sm:text-sm">
        <ArrowLeft size={14} /> Kembali
      </Link>
      <div className="w-full max-w-md fade-in">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-3">
            <img
              src="/logo-bumdes.webp"
              alt="Logo BUMDES Karya Raharja"
              data-testid="bumdes-logo"
              className="w-32 h-32 rounded-full object-cover"
              style={{
                background: "white",
                boxShadow: "8px 8px 20px rgba(164,186,214,0.35), -6px -6px 16px rgba(255,255,255,0.9)",
                border: "4px solid white",
              }}
            />
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold mt-1" style={{ color: "#1E2A44" }}>
            BUMDes Karya Raharja
          </h1>
          <p className="text-sm mt-1" style={{ color: "#2F5FD0" }}>
            Sistem Informasi Akuntansi
          </p>
        </div>

        <div className="card">
          <h2 className="font-heading text-xl font-semibold mb-1">Masuk ke Akun</h2>
          <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
            Silakan gunakan username & password Anda.
          </p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Username / Email</label>
              <input
                data-testid="login-username"
                className="input" value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="mis. admin"
                autoFocus required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  data-testid="login-password"
                  className="input pr-10" type={showPw ? "text" : "password"}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required
                />
                <button type="button" data-testid="toggle-password"
                        onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: "var(--text-muted)" }}>
                  {showPw ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {err && (
              <div data-testid="login-error" className="text-sm p-3 rounded-2xl"
                   style={{ background: "#FDECEA", color: "#8A4141" }}>
                {err}
              </div>
            )}
            <button data-testid="login-submit" disabled={loading} className="btn btn-primary w-full">
              <SignIn size={18} weight="bold" />
              {loading ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: "#2F5FD0" }}>
          Aplikasi SIA BUMDes ini dikembangkan dengan berpedoman pada Kepmendesa PDTT No. 136 Tahun 2022.
        </p>
        <p className="text-center text-xs mt-4" style={{ color: "var(--text-muted)" }}>
          © {new Date().getFullYear()} BUMDes Karya Raharja Wonoharjo. All Rights Reserved.
        </p>
      </div>
    </div>
  );
}
