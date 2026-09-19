import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { fmtRp, API } from "@/lib/api";
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend,
} from "recharts";
import { ArrowRight, Buildings, HandHeart, ChartLineUp, Fish, Tree, Sun, Boat } from "@phosphor-icons/react";

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
    <div className="min-h-screen" data-testid="landing-page" style={{ background: "#F4E9DC" }}>
      <header className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo-transparent.png" alt="Logo BUMDES" data-testid="landing-logo" className="w-12 h-12 object-contain" />
          <div className="leading-tight">
            <div className="font-heading font-semibold">BUMDes Karya Raharja</div>
            <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>Desa Wonoharjo</div>
          </div>
        </div>
        <Link to="/login" data-testid="landing-login-top" className="btn btn-outline text-sm">Masuk</Link>
      </header>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-8">
        <div className="rounded-[1.6rem] px-6 py-8 sm:px-10 sm:py-10 flex flex-col sm:flex-row sm:items-center gap-6" style={{ background: "#C45C2A", color: "#FFF8F2" }}>
          <div className="flex-1">
            <p className="text-[11px] tracking-[0.16em] uppercase opacity-80">Papan Kinerja {data?.year || new Date().getFullYear()}</p>
            <h1 className="modern-brand-title text-3xl sm:text-5xl mt-2" style={{ color: "#FFF8F2" }}>
              Transparan. Akuntabel. Nyata.
            </h1>
            <p className="mt-3 text-sm sm:text-base opacity-90">SIA BUMDes Karya Raharja — dari pencatatan resmi, tampil real-time.</p>
            <Link to="/login" className="btn mt-5 inline-flex" style={{ background: "#FFF8F2", color: "#6B2E16" }}>
              Masuk ke Dasbor <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 shrink-0">
            {[{I: Boat, c: "#F3E0D2"}, {I: Tree, c: "#F6E4C8"}, {I: Fish, c: "#E8D7C6"}, {I: Sun, c: "#F8E8C8"}].map((x, i) => (
              <span key={i} className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: x.c }}>
                <x.I size={24} color="#6B2E16" />
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-6" data-testid="landing-stats">
        {err && <p className="text-center text-sm" style={{ color: "var(--status-error)" }}>Gagal memuat data ringkasan.</p>}
        {!data && !err && <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>Memuat...</p>}
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
        <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-8">
          <div className="card">
            <h3 className="font-heading text-lg mb-1">Tren Pendapatan &amp; Beban {data.year}</h3>
            <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>Diperbarui langsung dari transaksi resmi.</p>
            <ResponsiveContainer width="99%" height={220}>
              <LineChart data={trend} margin={{ top: 8, right: 12, left: -4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false}
                       tickFormatter={(v) => v >= 1000000 ? `${Math.round(v/1_000_000)}jt` : v >= 1000 ? `${Math.round(v/1000)}rb` : v} width={44} />
                <Tooltip formatter={(v) => fmtRp(v)} contentStyle={{ background: "#FFFBF6", border: "1px solid var(--border)", borderRadius: 16, fontSize: 11, boxShadow: "none" }} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                <Line type="monotone" dataKey="pendapatan" name="Pendapatan" stroke="#C45C2A" strokeWidth={2.4} dot={{ r: 3, fill: "#C45C2A" }} />
                <Line type="monotone" dataKey="beban" name="Beban" stroke="#D4A056" strokeWidth={2.4} dot={{ r: 3, fill: "#D4A056" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
        <div className="card">
          <h3 className="font-heading text-xl sm:text-3xl mb-4">Akuntabilitas Real-Time Melalui Inovasi Digital</h3>
          <blockquote data-testid="narasi-komitmen" className="rounded-2xl px-5 py-6 mb-6" style={{ background: "#F3E0D2" }}>
            <div className="font-body text-sm sm:text-base leading-relaxed text-justify space-y-3.5" style={{ color: "var(--text-secondary)" }}>
              <p>SIA BUMDes Karya Raharja adalah wujud nyata komitmen BUMDes Karya Raharja Desa Wonoharjo dalam menerapkan tata kelola keuangan yang transparan, akuntable, dan profesional dengan berpedoman pada Kepmendesa PDTT No. 136 Tahun 2022.</p>
              <p>Data yang ditampilkan di atas adalah data yang diperoleh secara <strong className="italic" style={{ color: "var(--primary-dark)" }}>real-time</strong> dari hasil pencatatan transaksi aktivitas usaha BUMDes.</p>
              <p>Kehadiran platform ini memastikan setiap rupiah pendapatan dioptimalkan untuk meminimalkan beban, memaksimalkan laba bersih, dan memperbesar kontribusi PADes demi pembangunan desa yang berkelanjutan.</p>
            </div>
          </blockquote>
          <Link to="/login" data-testid="landing-login-bottom" className="btn btn-primary">Masuk ke Dasbor <ArrowRight size={16} /></Link>
        </div>
      </section>

      <footer className="max-w-5xl mx-auto px-4 pb-8 text-center text-xs" style={{ color: "var(--text-muted)" }}>
        © {new Date().getFullYear()} BUMDes Karya Raharja Wonoharjo. All Rights Reserved.
      </footer>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, big, testId }) {
  return (
    <div data-testid={testId} className="card p-4">
      <div className="w-9 h-9 rounded-full flex items-center justify-center mb-3" style={{ background: "#F3E0D2" }}>
        <Icon size={18} color="#C45C2A" />
      </div>
      <div className="text-[10px] tracking-[0.14em] font-semibold uppercase" style={{ color: "var(--text-muted)" }}>{label}</div>
      <div className={`font-heading tabular-nums mt-1 ${big ? "text-xl sm:text-3xl" : "text-lg sm:text-2xl"}`}>{value}</div>
    </div>
  );
}
