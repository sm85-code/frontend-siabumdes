import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useAuth, can } from "@/lib/auth";
import api, { ROLE_LABELS } from "@/lib/api";
import {
  House, Receipt, ChartLine, UsersThree,
  BookOpenText, SignOut, Books, UserCircle, Package, Buildings, ClipboardText,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import WallpaperLayer from "@/components/WallpaperLayer";
import AppearancePopover from "@/components/AppearancePopover";
import BottomNav from "@/components/BottomNav";

const READ_MOST = ["admin", "direktur", "bendahara", "pengelola", "pengawas", "penasihat"];
const INK = "var(--primary-dark)";

/** Fixed mobile bottom-nav slot order (left→right). Lainnya is appended in BottomNav. */
const BOTTOM_NAV_PATHS = ["/dashboard", "/ledger", "/reports", "/transactions"];

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: House, roles: READ_MOST },
  { to: "/accounts", label: "Kode Akun (COA)", icon: Books, roles: ["admin"] },
  { to: "/transactions", label: "Transaksi", icon: Receipt, roles: READ_MOST },
  { to: "/reports", label: "Laporan Keuangan", shortLabel: "Laporan", icon: ChartLine, roles: READ_MOST },
  { to: "/ledger", label: "Buku Besar", icon: BookOpenText, roles: READ_MOST },
  { to: "/inventory", label: "Inventory", icon: Package, roles: ["admin", "direktur", "bendahara", "pengelola"], inventoryUnitOnly: true },
  { to: "/unit-usaha", label: "Profil Unit Usaha", icon: Buildings, roles: ["admin"] },
  { to: "/profil-bumdes", label: "Profil BUMDES", icon: Buildings, roles: ["admin"] },
  { to: "/audit-log", label: "Audit Log", icon: ClipboardText, roles: ["admin"] },
  { to: "/users", label: "Kelola Pengguna", icon: UsersThree, roles: ["admin"] },
  { to: "/profile", label: "Profil Saya", icon: UserCircle, roles: READ_MOST },
];

/** Prefer longest matching nav path so `/reports/per-unit` activates Laporan. */
function isNavActive(pathname, to, allPaths) {
  const matches = allPaths.filter(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (matches.length === 0) return false;
  const best = matches.reduce((a, b) => (a.length >= b.length ? a : b));
  return best === to;
}

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [inventoryUnitIds, setInventoryUnitIds] = useState(null);

  useEffect(() => {
    let alive = true;
    api.get("/unit-usaha").then((r) => {
      if (!alive) return;
      const ids = (r.data || [])
        .filter((x) => ["perdagangan", "manufaktur"].includes(x.business_type))
        .map((x) => x.id);
      setInventoryUnitIds(ids);
    }).catch(() => {});
    return () => { alive = false; };
  }, []);

  // Close mobile sheet on route change (Lainnya → pick item).
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const visible = useMemo(() => {
    if (!user) return [];
    return NAV.filter((n) => {
      if (!can(user, ...n.roles)) return false;
      if (n.inventoryUnitOnly && user.role === "pengelola") {
        return Boolean(inventoryUnitIds) && inventoryUnitIds.includes(user.unit_usaha_id);
      }
      return true;
    });
  }, [user, inventoryUnitIds]);

  const allPaths = useMemo(() => visible.map((n) => n.to), [visible]);

  const bottomItems = useMemo(() => {
    const byPath = new Map(visible.map((n) => [n.to, n]));
    return BOTTOM_NAV_PATHS.map((p) => byPath.get(p)).filter(Boolean);
  }, [visible]);

  const moreActive = useMemo(() => {
    if (!visible.length) return false;
    const onPrimary = BOTTOM_NAV_PATHS.some((p) => isNavActive(location.pathname, p, BOTTOM_NAV_PATHS));
    if (onPrimary) return false;
    return visible.some(
      (n) => !BOTTOM_NAV_PATHS.includes(n.to) && isNavActive(location.pathname, n.to, allPaths),
    );
  }, [visible, location.pathname, allPaths]);

  if (!user) return null;

  return (
    <div className="app-shell min-h-screen flex">
      <WallpaperLayer />
      {/* Mobile top brand bar — hamburger removed; primary nav is bottom bar + Lainnya sheet */}
      <div className="lg:hidden fixed top-3 inset-x-3 z-40 flex items-center px-4 h-14 rounded-2xl"
           style={{ background: "var(--surface)", border: "1px solid var(--legacy-border)", boxShadow: "var(--shadow-soft)" }}>
        <div className="flex items-center gap-2 min-w-0">
          <img src="/logo-bumdes.webp" alt="Logo" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
          <span className="font-heading font-semibold text-sm truncate">BUMDES Karya Raharja</span>
        </div>
      </div>

      <aside data-testid="sidebar"
        className={`fixed lg:sticky top-0 left-0 h-[100dvh] w-72 z-50 flex flex-col overflow-hidden transform transition-transform lg:transform-none ${open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="m-0 lg:m-4 flex flex-col h-full lg:h-[calc(100dvh-2rem)] rounded-none lg:rounded-2xl overflow-hidden"
             style={{ background: "var(--surface)", border: "1px solid var(--legacy-border)", boxShadow: "var(--shadow-soft)" }}>
          <div className="p-6 flex items-center gap-3">
            <img src="/logo-bumdes.webp" alt="Logo BUMDES" data-testid="sidebar-logo" className="w-11 h-11 rounded-full object-cover" />
            <div>
              <div className="font-heading font-semibold text-base leading-tight">BUMDES</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>Karya Raharja</div>
            </div>
          </div>
          <nav className="flex-1 min-h-0 p-3 space-y-1 overflow-y-auto">
            {visible.map((n) => {
              const Icon = n.icon;
              const active = isNavActive(location.pathname, n.to, allPaths);
              return (
                <NavLink key={n.to} to={n.to} data-testid={`nav-${n.to.replace(/\//g, "-")}`}
                  onClick={() => setOpen(false)} className={`side-link ${active ? "active" : ""}`}>
                  <span className="nav-ico">
                    <Icon size={18} weight={active ? "fill" : "regular"} color={active ? "hsl(var(--primary-foreground))" : INK} />
                  </span>
                  <span>{n.label}</span>
                </NavLink>
              );
            })}
          </nav>
          <div className="shrink-0 p-4">
            <AppearancePopover triggerClassName="w-full mb-3 justify-start gap-2" align="start" />
            <div className="flex items-center gap-3 mb-3">
              {user.photo_url ? (
                <img src={user.photo_url} alt={user.name} className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-full flex items-center justify-center font-heading font-semibold text-sm flex-shrink-0"
                     style={{ background: "hsl(var(--primary))", color: "#fff" }}>
                  {user.name?.[0]?.toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate">{user.name}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>{ROLE_LABELS[user.role]}</div>
              </div>
            </div>
            <Button data-testid="logout-btn" onClick={logout} variant="outline" size="sm" className="w-full">
              <SignOut size={16} /> Keluar
            </Button>
          </div>
        </div>
      </aside>

      {open && <div className="lg:hidden fixed inset-0 z-40 bg-black/20" onClick={() => setOpen(false)} />}
      <main className="flex-1 min-w-0 pt-20 lg:pt-0 pb-24 lg:pb-0">
        <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto fade-in">{children}</div>
      </main>

      <BottomNav
        items={bottomItems}
        onOpenMore={() => setOpen(true)}
        moreActive={moreActive}
      />
    </div>
  );
}
