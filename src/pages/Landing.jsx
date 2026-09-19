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
    <div className="min-h-screen relative overflow-hidden" data-testid="landing-page">
      <BatikBackdrop />
      <header className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo-transparent.png" alt="Logo BUMDES" data-testid="landing-logo"
               className="w-10 h-10 sm:w-12 sm:h-12 object-contain opacity-90" />
          <div className="leading-tight">
            <div className="font-heading font-semibold text-sm sm:text-base" style={{ color: "var(--primary-dark)" }}>
              BUMDes Karya Raharja
            </div>
            <div className="text-[10px] sm:text-xs tracking-wide" style={{ color: "var(--text-muted)" }}>Desa Wonoharjo</div>
          </div>
        </div>
        <Link to="/login" data-testid="landing-login-top" className="btn btn-outline text-xs sm:text-sm">
          Masuk <ArrowRight size={14} />
        </Link>
      </header>

      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-24 pb-8 sm:pb-10 text-center">
        <div className="inline-block px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold tracking-[0.18em] mb-6 fade-slow"
             style={{ background: "var(--primary-light)", color: "var(--primary-dark)" }}>
          PAPAN KINERJA · BUMDes · TAHUN {data?.year || new Date().getFullYear()}
        </div>
        <h1 className="modern-brand-title text-3xl sm:text-5xl lg:text-6xl leading-[1.08] fade-slow"
            style={{ color: "var(--primary-dark)", animationDelay: "0.08s" }}>
          SIA BUMDes{" "}
          <span style={{ background: "linear-gradient(120deg, #1F4E3D 0%, #2F6A52 45%, #C4A35A 100%)",
                         WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Karya Raharja
          </span>
        </h1>
        <p className="mt-5 sm:mt-6 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto fade-slow"
           style={{ color: "var(--text-secondary)", animationDelay: "0.16s" }}>
          Sistem Informasi Akuntansi &amp; Transparansi Keuangan Terintegrasi.
          <br />
          Berdaya dari Desa, Berkontribusi untuk Wonoharjo.
        </p>
      </section>

      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-6" data-testid="landing-stats">
        {err && <p className="text-center text-sm" style={{ color: "var(--status-error)" }}>Gagal memuat data ringkasan.</p>}
        {!data && !err && <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>Memuat...</p>}
        {data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard icon={ChartLineUp} label="Total Pendapatan" value={fmtRp(data.total_pendapatan)} tint="#E7EFE8" iconColor="#1F4E3D" delay={0.24} testId="stat-pendapatan" />
            <StatCard icon={ChartLineUp} label="Total Beban" value={fmtRp(data.total_beban)} tint="#F3E9D4" iconColor="#8A6A2A" delay={0.32} testId="stat-beban" />
            <StatCard icon={Buildings} label="Laba Bersih" value={fmtRp(data.laba_bersih)} tint="#E7EFE8" iconColor="#2F6A52" big={true} delay={0.40} testId="stat-laba" />
            <StatCard icon={HandHeart} label="Kontribusi PADes (est.)" value={fmtRp(data.pades_estimasi)} tint="#F3E9D4" iconColor="#C4A35A" delay={0.48} testId="stat-pades" />
          </div>
        )}
      </section>

      {data && trend.length > 0 && (
        <section className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 pt-4 pb-10 sm:pb-14">
          <div className="card p-4 sm:p-5">
            <h3 className="font-heading text-base sm:text-lg mb-1">Tren Pendapatan &amp; Beban {data.year}</h3>
            <p className="text-[11px] sm:text-xs mb-3" style={{ color: "var(--text-muted)" }}>Diperbarui langsung dari transaksi resmi.</p>
            <ResponsiveContainer width="99%" height={220}>
              <LineChart data={trend} margin={{ top: 8, right: 12, left: -4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false}
                       tickFormatter={(v) => v >= 1000000 ? `${Math.round(v/1_000_000)}jt` : v >= 1000 ? `${Math.round(v/1000)}rb` : v} width={44} />
                <Tooltip formatter={(v) => fmtRp(v)} contentStyle={{ background: "#FFFcf7", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                <Line type="monotone" dataKey="pendapatan" name="Pendapatan" stroke="#2F6A52" strokeWidth={2.4} dot={{ r: 3, strokeWidth: 2, stroke: "#2F6A52", fill: "#fff" }} />
                <Line type="monotone" dataKey="beban" name="Beban" stroke="#C4A35A" strokeWidth={2.4} dot={{ r: 3, strokeWidth: 2, stroke: "#C4A35A", fill: "#fff" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
        <div className="card p-6 sm:p-10">
          <h3 className="font-heading text-xl sm:text-3xl mb-4">Akuntabilitas Real-Time Melalui Inovasi Digital</h3>
          <blockquote data-testid="narasi-komitmen" className="relative rounded-xl px-5 sm:px-8 py-6 sm:py-7 mb-6"
            style={{ background: "linear-gradient(135deg, #E7EFE8 0%, #F3E9D4 100%)", borderLeft: "4px solid var(--primary-dark)" }}>
            <div className="font-body text-sm sm:text-base leading-relaxed text-justify space-y-3.5" style={{ color: "var(--text-secondary)" }}>
              <p>SIA BUMDes Karya Raharja adalah wujud nyata komitmen BUMDes Karya Raharja Desa Wonoharjo dalam menerapkan tata kelola keuangan yang transparan, akuntable, dan profesional dengan berpedoman pada Kepmendesa PDTT No. 136 Tahun 2022.</p>
              <p>Data yang ditampilkan di atas adalah data yang diperoleh secara <strong className="italic" style={{ color: "var(--primary-dark)" }}>real-time</strong> dari hasil pencatatan transaksi aktivitas usaha BUMDes.</p>
              <p>Kehadiran platform ini memastikan setiap rupiah pendapatan dioptimalkan untuk meminimalkan beban, memaksimalkan laba bersih, dan memperbesar kontribusi PADes demi pembangunan desa yang berkelanjutan.</p>
            </div>
          </blockquote>
          <Link to="/login" data-testid="landing-login-bottom" className="btn btn-primary">Masuk ke Dasbor <ArrowRight size={16} /></Link>
        </div>
      </section>

      <footer className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 text-center">
        <p className="text-[11px] sm:text-xs" style={{ color: "var(--text-muted)" }}>
          © {new Date().getFullYear()} BUMDes Karya Raharja Wonoharjo. All Rights Reserved.
        </p>
      </footer>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, tint, iconColor, big, testId, delay = 0 }) {
  return (
    <div data-testid={testId} className="rounded-2xl p-4 sm:p-5 stat-card fade-slow"
         style={{ background: "var(--surface)", border: "1px solid var(--border)", animationDelay: `${delay}s` }}>
      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: tint }}>
        <Icon size={20} weight="duotone" color={iconColor} />
      </div>
      <div className="text-[10px] sm:text-[11px] tracking-[0.14em] font-semibold uppercase" style={{ color: "var(--text-muted)" }}>{label}</div>
      <div className={`font-heading tabular-nums mt-1 ${big ? "text-xl sm:text-3xl" : "text-lg sm:text-2xl"}`} style={{ color: "var(--primary-dark)" }}>{value}</div>
    </div>
  );
}

function BatikBackdrop() {
  return (
    <>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, #F4F1EA 0%, #E7EFE8 42%, #F3E9D4 100%)" }} />
      <div className="absolute pointer-events-none" style={{ top: 0, left: 0, width: "70%", height: "55%", background: "radial-gradient(ellipse at 12% 8%, rgba(47,106,82,0.12) 0%, rgba(244,241,234,0) 70%)" }} />
      <div className="absolute pointer-events-none" style={{ bottom: 0, right: 0, width: "55%", height: "50%", background: "radial-gradient(ellipse at 90% 90%, rgba(196,163,90,0.16) 0%, rgba(244,241,234,0) 70%)" }} />
    </>
  );
}
