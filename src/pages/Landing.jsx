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
    <div className="min-h-screen relative overflow-hidden" data-testid="landing-page">
      <PangandaranBackdrop />
      <header className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo-transparent.png" alt="Logo BUMDES" data-testid="landing-logo"
               className="w-12 h-12 sm:w-14 sm:h-14 object-contain" />
          <div className="leading-tight">
            <div className="font-heading font-semibold text-sm sm:text-base" style={{ color: "var(--primary-dark)" }}>
              BUMDes Karya Raharja
            </div>
            <div className="text-[10px] sm:text-xs tracking-wide" style={{ color: "var(--text-muted)" }}>Desa Wonoharjo · Pangandaran</div>
          </div>
        </div>
        <Link to="/login" data-testid="landing-login-top" className="btn btn-outline text-xs sm:text-sm">
          Masuk <ArrowRight size={14} />
        </Link>
      </header>

      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-8 text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10px] sm:text-xs font-semibold tracking-[0.16em] mb-6 fade-slow"
             style={{ background: "var(--primary-light)", color: "var(--primary-dark)" }}>
          <Sun size={14} weight="fill" color="#E8A07A" />
          PAPAN KINERJA · BUMDes · {data?.year || new Date().getFullYear()}
        </div>
        <h1 className="modern-brand-title text-3xl sm:text-5xl lg:text-6xl leading-[1.08] fade-slow"
            style={{ color: "var(--primary-dark)", animationDelay: "0.08s" }}>
          SIA BUMDes{" "}
          <span style={{ background: "linear-gradient(120deg, #2C6B73 0%, #5BA8A0 50%, #E8A07A 100%)",
                         WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Karya Raharja
          </span>
        </h1>
        <p className="mt-5 sm:mt-6 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto fade-slow"
           style={{ color: "var(--text-secondary)", animationDelay: "0.16s" }}>
          Sistem Informasi Akuntansi & Transparansi Keuangan Terintegrasi.
          <br />
          Dari pesisir Wonoharjo, untuk kemajuan desa.
        </p>
        <div className="mt-6 flex justify-center gap-5 fade-slow" style={{ animationDelay: "0.2s" }}>
          <span className="w-11 h-11 rounded-2xl bg-white/80 border border-[#D7E6E2] flex items-center justify-center"><Boat size={22} weight="duotone" color="#3D4F9A" /></span>
          <span className="w-11 h-11 rounded-2xl bg-white/80 border border-[#D7E6E2] flex items-center justify-center"><Tree size={22} weight="duotone" color="#3E8B86" /></span>
          <span className="w-11 h-11 rounded-2xl bg-white/80 border border-[#D7E6E2] flex items-center justify-center"><Fish size={22} weight="duotone" color="#5BA8A0" /></span>
          <span className="w-11 h-11 rounded-2xl bg-white/80 border border-[#D7E6E2] flex items-center justify-center"><Sun size={22} weight="duotone" color="#E8A07A" /></span>
        </div>
      </section>

      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-6" data-testid="landing-stats">
        {err && <p className="text-center text-sm" style={{ color: "var(--status-error)" }}>Gagal memuat data ringkasan.</p>}
        {!data && !err && <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>Memuat...</p>}
        {data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard icon={ChartLineUp} label="Total Pendapatan" value={fmtRp(data.total_pendapatan)} tint="#E4F3F0" iconColor="#3E8B86" delay={0.24} testId="stat-pendapatan" />
            <StatCard icon={ChartLineUp} label="Total Beban" value={fmtRp(data.total_beban)} tint="#F8E8D4" iconColor="#E8A07A" delay={0.32} testId="stat-beban" />
            <StatCard icon={Buildings} label="Laba Bersih" value={fmtRp(data.laba_bersih)} tint="#D7EAF4" iconColor="#3D4F9A" big={true} delay={0.40} testId="stat-laba" />
            <StatCard icon={HandHeart} label="Kontribusi PADes (est.)" value={fmtRp(data.pades_estimasi)} tint="#F8DCE3" iconColor="#E07A8A" delay={0.48} testId="stat-pades" />
          </div>
        )}
      </section>

      {data && trend.length > 0 && (
        <section className="relative z-10 max-w-4xl mx-auto px-5 sm:px-8 pt-4 pb-10 sm:pb-14">
          <div className="card p-4 sm:p-5">
            <h3 className="font-heading text-base sm:text-lg mb-1">Tren Pendapatan & Beban {data.year}</h3>
            <p className="text-[11px] sm:text-xs mb-3" style={{ color: "var(--text-muted)" }}>Diperbarui langsung dari transaksi resmi.</p>
            <ResponsiveContainer width="99%" height={220}>
              <LineChart data={trend} margin={{ top: 8, right: 12, left: -4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={{ stroke: "var(--border)" }} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false}
                       tickFormatter={(v) => v >= 1000000 ? `${Math.round(v/1_000_000)}jt` : v >= 1000 ? `${Math.round(v/1000)}rb` : v} width={44} />
                <Tooltip formatter={(v) => fmtRp(v)} contentStyle={{ background: "#FFFFFF", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                <Line type="monotone" dataKey="pendapatan" name="Pendapatan" stroke="#3E8B86" strokeWidth={2.4} dot={{ r: 3, strokeWidth: 2, stroke: "#3E8B86", fill: "#fff" }} />
                <Line type="monotone" dataKey="beban" name="Beban" stroke="#E8A07A" strokeWidth={2.4} dot={{ r: 3, strokeWidth: 2, stroke: "#E8A07A", fill: "#fff" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      <section className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
        <div className="card p-6 sm:p-10">
          <h3 className="font-heading text-xl sm:text-3xl mb-4">Akuntabilitas Real-Time Melalui Inovasi Digital</h3>
          <blockquote data-testid="narasi-komitmen" className="relative rounded-xl px-5 sm:px-8 py-6 sm:py-7 mb-6"
            style={{ background: "linear-gradient(135deg, #E4F3F0 0%, #F8EFE3 100%)", borderLeft: "4px solid var(--primary-dark)" }}>
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

function PangandaranBackdrop() {
  return (
    <>
      <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, #F4FBFA 0%, #E8F4F2 48%, #F8EFE3 100%)" }} />
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <circle cx="1080" cy="90" r="70" fill="#F3C98B" opacity="0.35" />
        <path d="M40 620c80-30 140 10 220-8 90-20 150 16 240 4 80-10 140-36 230-18 70 14 150 8 230-10 70-16 140 8 210 2v210H40z" fill="#5BA8A0" opacity="0.08" />
        <path d="M0 680c90-18 170 12 260-6 100-20 170 10 270 0 90-8 160-28 250-10 80 16 170 4 250-12 70-14 120 6 170 2v146H0z" fill="#2C6B73" opacity="0.06" />
        <g opacity="0.18" transform="translate(70 430)">
          <path d="M40 90 L55 40 L70 90 Z" fill="#3D4F9A" />
          <rect x="52" y="88" width="6" height="36" fill="#3D4F9A" />
          <path d="M20 124 C40 112 80 112 100 124 L90 132 C70 122 40 122 28 132 Z" fill="#E8A07A" />
        </g>
        <g opacity="0.16" transform="translate(980 460)">
          <circle cx="36" cy="18" r="16" fill="#3E8B86" />
          <path d="M36 34 C20 70 16 110 36 130 C56 110 52 70 36 34 Z" fill="#3E8B86" />
          <rect x="33" y="128" width="6" height="28" fill="#C4A06A" />
        </g>
        <g opacity="0.16" transform="translate(860 140)">
          <path d="M8 28 C28 8 58 8 78 24 C62 18 48 22 40 36 C34 22 20 16 8 28 Z" fill="#5BA8A0" />
        </g>
      </svg>
    </>
  );
}
