import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { fmtRp, API } from "@/lib/api";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";
import { ArrowRight, Buildings, HandHeart, ChartLineUp } from "@phosphor-icons/react";

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];

export default function Landing() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    axios.get(`${API}/public/summary`)
      .then(r => setData(r.data))
      .catch(e => setErr(e.message));
  }, []);

  const trend = (data?.trend || []).map(t => ({
    label: MONTH_LABELS[Number(t.month.slice(5,7)) - 1] || t.month,
    pendapatan: t.pendapatan, beban: t.beban,
  }));

  return (
    <div className="min-h-screen" data-testid="landing-page" style={{ background: "#EFEAE2" }}>
      <header className="max-w-5xl mx-auto px-5 pt-7 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo-transparent.png" alt="Logo BUMDES" data-testid="landing-logo" className="w-11 h-11 object-contain" />
          <div className="leading-tight">
            <div className="font-heading text-[1.05rem]">BUMDes Karya Raharja</div>
            <div className="text-[11px] tracking-[0.14em] uppercase" style={{ color: "var(--text-muted)" }}>Desa Wonoharjo</div>
          </div>
        </div>
        <Link to="/login" data-testid="landing-login-top" className="btn btn-outline text-sm">Masuk</Link>
      </header>

      <section className="max-w-5xl mx-auto px-5 pt-12 pb-6">
        <p className="text-[11px] tracking-[0.2em] uppercase" style={{ color: "var(--text-muted)" }}>Papan kinerja {data?.year || new Date().getFullYear()}</p>
        <h1 className="modern-brand-title text-4xl sm:text-6xl mt-3 max-w-3xl">Buku besar desa, terbuka untuk warga.</h1>
        <p className="mt-4 max-w-xl text-[1.02rem]" style={{ color: "var(--text-secondary)" }}>
          SIA BUMDes Karya Raharja — pencatatan resmi, angka real-time, tanpa hiasan yang mengganggu baca.
        </p>
        <Link to="/login" className="btn btn-primary mt-6">Masuk ke dasbor <ArrowRight size={16} /></Link>
      </section>

      <section className="max-w-5xl mx-auto px-5 pb-6" data-testid="landing-stats">
        {err && <p className="text-sm" style={{ color: "var(--status-error)" }}>Gagal memuat data ringkasan.</p>}
        {!data && !err && <p className="text-sm" style={{ color: "var(--text-muted)" }}>Memuat...</p>}
        {data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard icon={ChartLineUp} label="Total Pendapatan" value={fmtRp(data.total_pendapatan)} testId="stat-pendapatan" />
            <StatCard icon={ChartLineUp} label="Total Beban" value={fmtRp(data.total_beban)} testId="stat-beban" />
            <StatCard icon={Buildings} label="Laba Bersih" value={fmtRp(data.laba_bersih)} big testId="stat-laba" />
            <StatCard icon={HandHeart} label="Kontribusi PADes (est.)" value={fmtRp(data.pades_estimasi)} testId="stat-pades" />
          </div>
        )}
      </section>

      {data && trend.length > 0 && (
        <section className="max-w-5xl mx-auto px-5 pb-8">
          <div className="card">
            <h3 className="font-heading text-lg mb-1">Tren pendapatan &amp; beban {data.year}</h3>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>Dari transaksi yang sudah dicatat.</p>
            <ResponsiveContainer width="99%" height={220}>
              <LineChart data={trend} margin={{ top: 8, right: 12, left: -4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false}
                       tickFormatter={(v) => v >= 1000000 ? `${Math.round(v/1_000_000)}jt` : v >= 1000 ? `${Math.round(v/1000)}rb` : v} width={44} />
                <Tooltip formatter={(v) => fmtRp(v)} contentStyle={{ background: "#FBF8F3", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11, boxShadow: "none" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="plainline" iconSize={12} />
                <Line type="monotone" dataKey="pendapatan" name="Pendapatan" stroke="#1F2A24" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="beban" name="Beban" stroke="#8B6A3F" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section className="max-w-5xl mx-auto px-5 pb-12">
        <div className="card">
          <h3 className="font-heading text-2xl sm:text-3xl mb-4">Akuntabilitas melalui pencatatan resmi</h3>
          <blockquote data-testid="narasi-komitmen" className="mb-6">
            <div className="font-body text-sm sm:text-[0.98rem] leading-relaxed text-justify space-y-3" style={{ color: "var(--text-secondary)" }}>
              <p>SIA BUMDes Karya Raharja adalah wujud komitmen BUMDes Karya Raharja Desa Wonoharjo dalam tata kelola keuangan yang transparan dan profesional, berpedoman pada Kepmendesa PDTT No. 136 Tahun 2022.</p>
              <p>Data di halaman ini diambil secara <strong className="italic" style={{ color: "var(--primary-dark)" }}>real-time</strong> dari pencatatan transaksi usaha.</p>
              <p>Setiap rupiah diarahkan untuk menekan beban, menjaga laba, dan memperbesar kontribusi PADes.</p>
            </div>
          </blockquote>
          <Link to="/login" data-testid="landing-login-bottom" className="btn btn-primary">Masuk ke dasbor <ArrowRight size={16} /></Link>
        </div>
      </section>

      <footer className="max-w-5xl mx-auto px-5 pb-8 text-center text-xs" style={{ color: "var(--text-muted)" }}>
        © {new Date().getFullYear()} BUMDes Karya Raharja Wonoharjo
      </footer>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, big, testId }) {
  return (
    <div data-testid={testId} className="card">
      <div className="text-[10px] tracking-[0.16em] font-semibold uppercase" style={{ color: "var(--text-muted)" }}>{label}</div>
      <div className={`font-heading tabular-nums mt-2 ${big ? "text-xl sm:text-3xl" : "text-lg sm:text-2xl"}`}>{value}</div>
    </div>
  );
}
