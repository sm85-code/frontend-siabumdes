import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { fmtRp, API } from "@/lib/api";
import Spinner from "@/components/Spinner";
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid,
} from "recharts";
import { ArrowRight, Buildings, HandHeart, ChartLineUp } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartContainer, ChartTooltip, ChartTooltipContent,
  ChartLegend, ChartLegendContent,
} from "@/components/ui/chart";
import WallpaperLayer from "@/components/WallpaperLayer";
import AppearancePopover from "@/components/AppearancePopover";
import { TypographyH3, TypographyP } from "@/components/ui/typography";

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Ags","Sep","Okt","Nov","Des"];
const TREND_CHART_CONFIG = {
  pendapatan: { label: "Pendapatan", color: "var(--chart-2)" },
  beban: { label: "Beban", color: "var(--chart-1)" },
};

export default function Landing() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    axios.get(`${API}/public/summary`)
      .then(r => setData(r.data))
      .catch(e => setErr(e.message));
  }, []);

  const year = data?.year || new Date().getFullYear();
  const trend = (data?.trend || []).map(t => ({
    label: MONTH_LABELS[Number(t.month.slice(5,7)) - 1] || t.month,
    pendapatan: t.pendapatan, beban: t.beban,
  }));

  return (
    <div className="min-h-screen auth-bg" data-testid="landing-page">
      <WallpaperLayer />
      <header className="max-w-5xl mx-auto px-5 pt-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo-transparent.png" alt="Logo BUMDES" data-testid="landing-logo" className="w-11 h-11 object-contain" />
          <div className="leading-tight">
            <div className="font-heading text-[1.05rem]">BUMDes Karya Raharja</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>Desa Wonoharjo</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AppearancePopover triggerClassName="text-sm gap-2" align="end" />
          <Button asChild variant="outline" className="text-sm">
            <Link to="/login" data-testid="landing-login-top">Masuk <ArrowRight size={14} /></Link>
          </Button>
        </div>
      </header>

      <section className="max-w-3xl mx-auto px-5 pt-10 pb-6 text-center">
        <p className="inline-block text-xs tracking-[0.14em] uppercase px-4 py-1.5 rounded-full mb-5"
           style={{ background: "var(--primary-light)", color: "var(--text-secondary)" }}>
          Papan Kinerja · BUMDes · Tahun {year}
        </p>
        <h1 className="modern-brand-title text-3xl sm:text-5xl">
          SIA BUMDes <span style={{ color: "var(--chart-3)" }}>Karya Raharja</span>
        </h1>
        <p className="mt-4 text-sm sm:text-base" style={{ color: "var(--text-secondary)" }}>
          Sistem Informasi Akuntansi & Transparansi Keuangan Terintegrasi.<br />
          Berdaya dari Desa, Berkontribusi untuk Wonoharjo.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-5 pb-6" data-testid="landing-stats">
        {err && <p className="text-center text-sm" style={{ color: "var(--status-error)" }}>Gagal memuat data ringkasan.</p>}
        {!data && !err && <div className="flex justify-center"><Spinner /></div>}
        {data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={ChartLineUp} label="Total Pendapatan" value={fmtRp(data.total_pendapatan)} testId="stat-pendapatan" />
            <StatCard icon={ChartLineUp} label="Total Beban" value={fmtRp(data.total_beban)} testId="stat-beban" />
            <StatCard icon={Buildings} label="Laba Bersih" value={fmtRp(data.laba_bersih)} testId="stat-laba" />
            <StatCard icon={HandHeart} label="Kontribusi PADes (est.)" value={fmtRp(data.pades_estimasi)} testId="stat-pades" />
          </div>
        )}
      </section>

      {data && trend.length > 0 && (
        <section className="max-w-5xl mx-auto px-5 pb-8">
          <Card>
          <CardContent className="pt-6">
            <h3 className="font-heading text-lg mb-1">Tren Pendapatan & Beban {year}</h3>
            <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>Diperbarui langsung dari transaksi resmi.</p>
            <ChartContainer config={TREND_CHART_CONFIG} className="w-full aspect-auto" style={{ height: 220 }}>
              <LineChart data={trend} margin={{ top: 8, right: 12, left: -4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--legacy-border, #E3E8E6)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "var(--text-muted)" }} tickLine={false} axisLine={false}
                       tickFormatter={(v) => v >= 1000000 ? `${Math.round(v/1_000_000)}jt` : v >= 1000 ? `${Math.round(v/1000)}rb` : v} width={44} />
                <ChartTooltip content={<ChartTooltipContent formatter={(v) => fmtRp(v)} />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line type="monotone" dataKey="pendapatan" name="Pendapatan" stroke="var(--color-pendapatan)" strokeWidth={2} dot={{ r: 3, fill: "var(--color-pendapatan)" }} />
                <Line type="monotone" dataKey="beban" name="Beban" stroke="var(--color-beban)" strokeWidth={2} dot={{ r: 3, fill: "var(--color-beban)" }} />
              </LineChart>
            </ChartContainer>
          </CardContent>
          </Card>
        </section>
      )}

      <section className="max-w-5xl mx-auto px-5 pb-12">
        <Card>
        <CardContent className="pt-6">
          <TypographyH3 className="mb-4 text-2xl">Akuntabilitas Real-Time Melalui Inovasi Digital</TypographyH3>
          <blockquote data-testid="narasi-komitmen" className="mb-6 max-w-3xl text-justify" style={{ color: "var(--text-secondary)" }}>
            <TypographyP className="mt-0">SIA BUMDes Karya Raharja adalah wujud nyata komitmen BUMDes Karya Raharja Desa Wonoharjo dalam menerapkan tata kelola keuangan yang transparan, akuntable, dan profesional dengan berpedoman pada Kepmendesa PDTT No. 136 Tahun 2022.</TypographyP>
            <TypographyP>Data yang ditampilkan di atas adalah data yang diperoleh secara <em>real-time</em> dari hasil pencatatan transaksi aktivitas usaha BUMDes.</TypographyP>
            <TypographyP>Kehadiran platform ini memastikan setiap rupiah pendapatan dioptimalkan untuk meminimalkan beban, memaksimalkan laba bersih, dan memperbesar kontribusi PADes demi pembangunan desa yang berkelanjutan.</TypographyP>
          </blockquote>
          <Button asChild>
            <Link to="/login" data-testid="landing-login-bottom">Masuk ke Dasbor <ArrowRight size={16} /></Link>
          </Button>
        </CardContent>
        </Card>
      </section>

      <footer className="max-w-5xl mx-auto px-5 pb-8 text-center text-xs" style={{ color: "var(--text-muted)" }}>
        © {new Date().getFullYear()} BUMDes Karya Raharja Wonoharjo. All Rights Reserved.
      </footer>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, testId }) {
  return (
    <Card data-testid={testId}>
      <CardContent className="pt-6">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: "var(--primary-light)" }}>
          <Icon size={18} color="var(--primary-dark)" />
        </div>
        <div className="text-xs tracking-[0.1em] font-semibold uppercase" style={{ color: "var(--text-muted)" }}>{label}</div>
        <div className="font-heading tabular-nums text-xl sm:text-2xl mt-1">{value}</div>
      </CardContent>
    </Card>
  );
}
