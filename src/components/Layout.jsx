import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth, can } from "@/lib/auth";
import api, { ROLE_LABELS } from "@/lib/api";
import {
  House, Receipt, ChartLine, ChartBar, Storefront, UsersThree,
  BookOpenText, SignOut, List, X, Books, Calculator, UserCircle, Package,
} from "@phosphor-icons/react";

const READ_ONLY = ["admin", "direktur", "bendahara", "pengawas", "penasihat"];
const READ_MOST = ["admin", "direktur", "bendahara", "pengelola", "pengawas", "penasihat"];

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: House, roles: READ_MOST },
  { to: "/transactions", label: "Transaksi", icon: Receipt, roles: READ_MOST },
  { to: "/reports", label: "Laporan Keuangan", icon: ChartLine, roles: READ_MOST },
  { to: "/ledger", label: "Buku Besar", icon: BookOpenText, roles: READ_MOST },
  { to: "/accounts", label: "Kode Akun (COA)", icon: Books, roles: READ_ONLY },
  { to: "/inventory", label: "Inventory", icon: Package, roles: ["admin", "direktur", "bendahara", "pengelola"], uu05Only: true },
  { to: "/users", label: "Kelola Pengguna", icon: UsersThree, roles: ["admin"] },
  { to: "/profile", label: "Profil Saya", icon: UserCircle, roles: READ_MOST },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [uu05Id, setUu05Id] = useState(null);

  useEffect(() => {
    let alive = true;
    api.get("/unit-usaha").then((r) => {
      if (!alive) return;
      const u = (r.data || []).find((x) => x.code === "UU05");
      setUu05Id(u?.id || null);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  if (!user) return null;
  const visible = NAV.filter((n) => {
    if (!can(user, ...n.roles)) return false;
    if (n.uu05Only && user.role === "pengelola") {
      return Boolean(uu05Id) && user.unit_usaha_id === uu05Id;
    }
    return true;
  });

  return (
    <div className="min-h-screen flex gap-0 lg:gap-0" style={{ background: "var(--bg)" }}>
      <div className="lg:hidden fixed top-3 inset-x-3 z-40 flex items-center justify-between px-4 h-14 rounded-2xl"
           style={{ background: "white", boxShadow: "var(--shadow-soft)" }}>
        <div className="flex items-center gap-2">
          <img src="/logo-bumdes.webp" alt="Logo" className="w-8 h-8 rounded-full object-cover" />
          <span className="font-heading font-bold text-sm">BUMDES Karya Raharja</span>
        </div>
        <button data-testid="mobile-menu-btn" onClick={() => setOpen(!open)} className="p-2 rounded-xl"
                style={{ background: "#F3F6FB", color: "var(--primary-dark)" }}>
          {open ? <X size={22} /> : <List size={22} />}
        </button>
      </div>

      <aside
        data-testid="sidebar"
        className={`fixed lg:sticky top-0 left-0 h-[100dvh] lg:h-[100dvh] w-72 z-50 flex flex-col overflow-hidden transform transition-transform lg:transform-none ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        style={{ background: "transparent" }}
      >
        <div className="m-0 lg:m-4 lg:mb-4 flex flex-col h-full lg:h-[calc(100dvh-2rem)] rounded-none lg:rounded-3xl overflow-hidden"
             style={{ background: "white", boxShadow: "var(--shadow-soft)" }}>
        <div className="p-6 flex items-center gap-3">
          <img src="/logo-bumdes.webp" alt="Logo BUMDES" data-testid="sidebar-logo"
               className="w-11 h-11 rounded-full object-cover"
               style={{ background: "white", boxShadow: "var(--shadow-soft)" }} />
          <div>
            <div className="font-heading font-bold text-base leading-tight">BUMDES</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>Karya Raharja</div>
          </div>
        </div>

        <nav className="flex-1 min-h-0 p-3 space-y-1 overflow-y-auto">
          {visible.map((n) => {
            const Icon = n.icon;
            const active = location.pathname === n.to;
            return (
              <NavLink
                key={n.to}
                to={n.to}
                data-testid={`nav-${n.to.replace(/\//g, "-")}`}
                onClick={() => setOpen(false)}
                className={`side-link ${active ? "active" : ""}`}
              >
                <span className="nav-ico">
                  <Icon size={18} weight={active ? "fill" : "duotone"} />
                </span>
                <span>{n.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="shrink-0 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center font-heading font-bold text-sm"
                 style={{ background: "var(--grad-primary)", color: "white" }}>
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate">{user.name}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>{ROLE_LABELS[user.role]}</div>
            </div>
          </div>
          <button data-testid="logout-btn" onClick={logout} className="btn btn-outline w-full text-sm">
            <SignOut size={16} /> Keluar
          </button>
        </div>
        </div>
      </aside>

      {open && <div className="lg:hidden fixed inset-0 z-40 bg-[#1E2A44]/25" onClick={() => setOpen(false)} />}

      <main className="flex-1 min-w-0 pt-20 lg:pt-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
