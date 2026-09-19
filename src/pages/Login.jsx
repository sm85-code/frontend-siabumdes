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
    <div className="auth-bg flex items-center justify-center p-4 relative min-h-screen">
      <Link to="/" data-testid="login-back" className="absolute top-4 left-4 sm:top-6 sm:left-6 btn btn-outline text-xs sm:text-sm">
        <ArrowLeft size={14} /> Kembali
      </Link>
      <div className="w-full max-w-sm fade-in">
        <div className="card text-center px-6 py-8">
          <img src="/logo-transparent.png" alt="Logo BUMDES Karya Raharja" data-testid="bumdes-logo"
               className="w-20 h-20 object-contain mx-auto mb-3 rounded-full" style={{ boxShadow: "var(--shadow-soft)" }} />
          <h1 className="font-heading text-2xl">SIA BUMDes</h1>
          <p className="text-xs tracking-[0.14em] uppercase mt-1" style={{ color: "var(--text-muted)" }}>Karya Raharja · Wonoharjo</p>
          <form onSubmit={submit} className="space-y-4 text-left mt-6">
            <div>
              <label className="label">Username</label>
              <input data-testid="login-username" className="input" value={username}
                onChange={(e) => setUsername(e.target.value)} placeholder="username" autoFocus required />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input data-testid="login-password" className="input pr-10" type={showPw ? "text" : "password"}
                  value={password} onChange={(e) => setPassword(e.target.value)} placeholder="password" required />
                <button type="button" data-testid="toggle-password" onClick={() => setShowPw(!showPw)}
                        className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }}>
                  {showPw ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            {err && (
              <div data-testid="login-error" className="text-sm p-3 rounded-xl"
                   style={{ color: "#C45C5C" }}>{err}</div>
            )}
            <button data-testid="login-submit" disabled={loading} className="btn btn-primary w-full">
              <SignIn size={18} />{loading ? "Memproses..." : "Login"}
            </button>
          </form>
        </div>
        <p className="text-center text-xs mt-5" style={{ color: "var(--text-muted)" }}>
          Berpedoman pada Kepmendesa PDTT No. 136 Tahun 2022.
        </p>
      </div>
    </div>
  );
}
