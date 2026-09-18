import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import api, { fmtRp, fmtDate } from "@/lib/api";
import { useAuth, can } from "@/lib/auth";
import {
  Package, Plus, ArrowDown, ArrowUp, SlidersHorizontal, ChartBar, Trash,
} from "@phosphor-icons/react";

const BASE = "/v1/uu05_inventory";
const today = () => new Date().toISOString().slice(0, 10);

const TABS = [
  { id: "katalog", label: "Katalog Produk", icon: Package },
  { id: "stock-in", label: "Stock In", icon: ArrowDown },
  { id: "stock-out", label: "Stock Out", icon: ArrowUp },
  { id: "kelola", label: "Kelola Stok", icon: SlidersHorizontal },
  { id: "laporan", label: "Laporan", icon: ChartBar },
];

export default function Inventory() {
  const { user } = useAuth();
  const [tab, setTab] = useState("katalog");
  const [meta, setMeta] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [movements, setMovements] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [valuation, setValuation] = useState(null);
  const [movementReport, setMovementReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [productForm, setProductForm] = useState({
    sku: "", name: "", category_id: "", unit_of_measure: "pcs",
    cost_price: 0, sell_price: 0, opening_qty: 0,
  });
  const [stockIn, setStockIn] = useState({
    product_id: "", quantity: 1, unit_cost: 0, movement_date: today(),
    debit_account_code: "", credit_account_code: "",
  });
  const [stockOut, setStockOut] = useState({
    product_id: "", quantity: 1, movement_date: today(),
    debit_account_code: "", credit_account_code: "",
  });
  const [adjust, setAdjust] = useState({
    product_id: "", quantity_delta: -1, reason: "rusak",
    adjustment_date: today(), notes: "",
  });
  const [reportRange, setReportRange] = useState({ date_from: "", date_to: "" });

  const canAccessRole = can(user, "admin", "direktur", "bendahara", "pengelola");
  const canWrite = can(user, "admin", "direktur", "bendahara", "pengelola");

  const loadCore = useCallback(async () => {
    setError("");
    try {
      const [m, p, c] = await Promise.all([
        api.get(`${BASE}/meta`),
        api.get(`${BASE}/products`, { params: { q: q || undefined, category_id: catFilter || undefined } }),
        api.get(`${BASE}/categories`),
      ]);
      setMeta(m.data);
      setProducts(Array.isArray(p.data) ? p.data : []);
      setCategories(Array.isArray(c.data) ? c.data : []);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || "Gagal memuat inventory");
    } finally {
      setLoading(false);
    }
  }, [q, catFilter]);

  const loadOps = useCallback(async () => {
    try {
      const [mov, adj] = await Promise.all([
        api.get(`${BASE}/movements`, { params: { limit: 50 } }),
        api.get(`${BASE}/adjustments`, { params: { limit: 50 } }),
      ]);
      setMovements(Array.isArray(mov.data) ? mov.data : []);
      setAdjustments(Array.isArray(adj.data) ? adj.data : []);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || "Gagal memuat mutasi");
    }
  }, []);

  const loadReports = useCallback(async () => {
    try {
      const [val, mov] = await Promise.all([
        api.get(`${BASE}/reports/valuation`),
        api.get(`${BASE}/reports/movements`, {
          params: {
            date_from: reportRange.date_from || undefined,
            date_to: reportRange.date_to || undefined,
          },
        }),
      ]);
      setValuation(val.data);
      setMovementReport(mov.data);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || "Gagal memuat laporan");
    }
  }, [reportRange]);

  useEffect(() => { loadCore(); }, [loadCore]);
  useEffect(() => {
    if (tab === "kelola" || tab === "stock-in" || tab === "stock-out") loadOps();
    if (tab === "laporan") loadReports();
  }, [tab, loadOps, loadReports]);

  const productOptions = useMemo(
    () => products.map((p) => ({
      id: p.id,
      label: `${p.sku} — ${p.name} (stok ${p.qty_on_hand})`,
    })),
    [products],
  );

  if (!canAccessRole) return <Navigate to="/dashboard" replace />;
  if (loading) {
    return <div className="text-sm" style={{ color: "var(--text-muted)" }}>Memuat inventory…</div>;
  }
  if (meta && user?.role === "pengelola" && user.unit_usaha_id !== meta.unit_usaha_id) {
    return <Navigate to="/dashboard" replace />;
  }

  const submitProduct = async (e) => {
    e.preventDefault();
    try {
      await api.post(`${BASE}/products`, {
        ...productForm,
        cost_price: Number(productForm.cost_price || 0),
        sell_price: Number(productForm.sell_price || 0),
        opening_qty: Number(productForm.opening_qty || 0),
        unit_usaha_id: meta?.unit_usaha_id,
      });
      setShowForm(false);
      setProductForm({ sku: "", name: "", category_id: "", unit_of_measure: "pcs", cost_price: 0, sell_price: 0, opening_qty: 0 });
      loadCore();
    } catch (err) {
      setError(err?.response?.data?.detail || err.message);
    }
  };

  const removeProduct = async (id) => {
    if (!window.confirm("Hapus produk ini? Stok harus 0.")) return;
    try {
      await api.delete(`${BASE}/products/${id}`);
      loadCore();
    } catch (err) {
      setError(err?.response?.data?.detail || err.message);
    }
  };

  const submitStockIn = async (e) => {
    e.preventDefault();
    try {
      await api.post(`${BASE}/stock-in`, {
        ...stockIn,
        quantity: Number(stockIn.quantity),
        unit_cost: Number(stockIn.unit_cost),
        unit_usaha_id: meta?.unit_usaha_id,
      });
      setStockIn({ product_id: "", quantity: 1, unit_cost: 0, movement_date: today(), debit_account_code: "", credit_account_code: "" });
      await Promise.all([loadCore(), loadOps()]);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message);
    }
  };

  const submitStockOut = async (e) => {
    e.preventDefault();
    try {
      await api.post(`${BASE}/stock-out`, {
        ...stockOut,
        quantity: Number(stockOut.quantity),
        unit_usaha_id: meta?.unit_usaha_id,
      });
      setStockOut({ product_id: "", quantity: 1, movement_date: today(), debit_account_code: "", credit_account_code: "" });
      await Promise.all([loadCore(), loadOps()]);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message);
    }
  };

  const submitAdjust = async (e) => {
    e.preventDefault();
    try {
      await api.post(`${BASE}/adjustments`, {
        ...adjust,
        quantity_delta: Number(adjust.quantity_delta),
      });
      setAdjust({ product_id: "", quantity_delta: -1, reason: "rusak", adjustment_date: today(), notes: "" });
      await Promise.all([loadCore(), loadOps()]);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message);
    }
  };

  const cancelMovement = async (id) => {
    if (!window.confirm("Batalkan mutasi ini? Jurnal terkait akan dibatalkan.")) return;
    try {
      await api.post(`${BASE}/cancel-movement`, { stock_card_id: id });
      await Promise.all([loadCore(), loadOps()]);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message);
    }
  };

  return (
    <div className="space-y-6 fade-in" data-testid="inventory-page">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <p className="label mb-1">Unit Usaha UU05</p>
          <h1 className="font-heading text-3xl font-bold">Inventory</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {meta?.unit_name || "Persediaan barang dagang"} · katalog, mutasi, penyesuaian & valuasi
          </p>
        </div>
        {tab === "katalog" && canWrite && (
          <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)} data-testid="btn-new-product">
            <Plus size={16} /> Tambah Produk
          </button>
        )}
      </div>

      {error && (
        <div className="card p-3 text-sm" style={{ borderColor: "#D97878", color: "#9B3B3B" }} role="alert">
          {typeof error === "string" ? error : JSON.stringify(error)}
          <button type="button" className="ml-3 underline" onClick={() => setError("")}>tutup</button>
        </div>
      )}

      <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Tab inventory">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              className={`btn ${active ? "btn-primary" : "btn-outline"} text-sm`}
              onClick={() => setTab(t.id)}
              data-testid={`tab-${t.id}`}
            >
              <Icon size={16} /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "katalog" && (
        <div className="space-y-4">
          <div className="card p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Cari SKU / nama</label>
              <input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="contoh: KIPAS" />
            </div>
            <div>
              <label className="label">Kategori</label>
              <select className="select" value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
                <option value="">Semua kategori</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          {showForm && canWrite && (
            <div className="card fade-in">
              <form onSubmit={submitProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="label">SKU</label><input required className="input" value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} /></div>
                <div><label className="label">Nama produk</label><input required className="input" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} /></div>
                <div>
                  <label className="label">Kategori</label>
                  <select required className="select" value={productForm.category_id} onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}>
                    <option value="">— pilih —</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div><label className="label">Satuan</label><input className="input" value={productForm.unit_of_measure} onChange={(e) => setProductForm({ ...productForm, unit_of_measure: e.target.value })} /></div>
                <div><label className="label">Harga pokok (Rp)</label><input type="number" min="0" className="input" value={productForm.cost_price} onChange={(e) => setProductForm({ ...productForm, cost_price: e.target.value })} /></div>
                <div><label className="label">Harga jual (Rp)</label><input type="number" min="0" className="input" value={productForm.sell_price} onChange={(e) => setProductForm({ ...productForm, sell_price: e.target.value })} /></div>
                <div><label className="label">Qty awal</label><input type="number" min="0" className="input" value={productForm.opening_qty} onChange={(e) => setProductForm({ ...productForm, opening_qty: e.target.value })} /></div>
                <div className="sm:col-span-2 flex justify-end gap-2">
                  <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Batal</button>
                  <button type="submit" className="btn btn-primary">Simpan produk</button>
                </div>
              </form>
            </div>
          )}

          <div className="card p-0 overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>SKU</th><th>Nama</th><th>Kategori</th><th>Satuan</th>
                  <th className="num">HPP</th><th className="num">Harga jual</th>
                  <th className="num">Stok</th><th className="num">Nilai</th>
                  {canWrite && <th />}
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-8" style={{ color: "var(--text-muted)" }}>Belum ada produk di katalog.</td></tr>
                ) : products.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium">{p.sku}</td>
                    <td>{p.name}</td>
                    <td><span className="badge">{p.category_name || "-"}</span></td>
                    <td>{p.unit_of_measure}</td>
                    <td className="num">{fmtRp(Number(p.cost_price))}</td>
                    <td className="num">{fmtRp(Number(p.sell_price))}</td>
                    <td className="num">{p.qty_on_hand}</td>
                    <td className="num">{fmtRp(Number(p.stock_value))}</td>
                    {canWrite && (
                      <td>
                        <button type="button" className="p-1.5" title="Hapus" onClick={() => removeProduct(p.id)}>
                          <Trash size={16} color="#D97878" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "stock-in" && (
        <div className="space-y-4">
          <div className="card">
            <p className="label mb-2">Penerimaan barang (Stock In)</p>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              Menambah qty, memperbarui HPP, dan memposting jurnal pembelian persediaan.
            </p>
            {canWrite ? (
              <form onSubmit={submitStockIn} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Produk</label>
                  <select required className="select" value={stockIn.product_id} onChange={(e) => {
                    const p = products.find((x) => x.id === e.target.value);
                    setStockIn({ ...stockIn, product_id: e.target.value, unit_cost: p ? Number(p.cost_price) : 0 });
                  }}>
                    <option value="">— pilih —</option>
                    {productOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                </div>
                <div><label className="label">Tanggal</label><input type="date" required className="input" value={stockIn.movement_date} onChange={(e) => setStockIn({ ...stockIn, movement_date: e.target.value })} /></div>
                <div><label className="label">Qty masuk</label><input type="number" min="1" required className="input" value={stockIn.quantity} onChange={(e) => setStockIn({ ...stockIn, quantity: e.target.value })} /></div>
                <div><label className="label">HPP / unit (Rp)</label><input type="number" min="0" required className="input" value={stockIn.unit_cost} onChange={(e) => setStockIn({ ...stockIn, unit_cost: e.target.value })} /></div>
                <div><label className="label">Akun debit (Persediaan)</label><input required className="input" placeholder="mis. 1.1.03" value={stockIn.debit_account_code} onChange={(e) => setStockIn({ ...stockIn, debit_account_code: e.target.value })} /></div>
                <div><label className="label">Akun kredit (Kas/Utang)</label><input required className="input" placeholder="mis. 1.1.01 / 2.1.01" value={stockIn.credit_account_code} onChange={(e) => setStockIn({ ...stockIn, credit_account_code: e.target.value })} /></div>
                <div className="sm:col-span-2 flex justify-end"><button type="submit" className="btn btn-primary">Catat stock in</button></div>
              </form>
            ) : <p className="text-sm">Role Anda read-only.</p>}
          </div>
          <MovementTable rows={movements.filter((m) => m.direction === "in")} onCancel={canWrite ? cancelMovement : null} />
        </div>
      )}

      {tab === "stock-out" && (
        <div className="space-y-4">
          <div className="card">
            <p className="label mb-2">Pengeluaran barang (Stock Out / COGS)</p>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              Mengurangi stok memakai HPP berjalan dan memposting jurnal HPP ↔ Persediaan.
            </p>
            {canWrite ? (
              <form onSubmit={submitStockOut} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Produk</label>
                  <select required className="select" value={stockOut.product_id} onChange={(e) => setStockOut({ ...stockOut, product_id: e.target.value })}>
                    <option value="">— pilih —</option>
                    {productOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                </div>
                <div><label className="label">Tanggal</label><input type="date" required className="input" value={stockOut.movement_date} onChange={(e) => setStockOut({ ...stockOut, movement_date: e.target.value })} /></div>
                <div><label className="label">Qty keluar</label><input type="number" min="1" required className="input" value={stockOut.quantity} onChange={(e) => setStockOut({ ...stockOut, quantity: e.target.value })} /></div>
                <div><label className="label">Akun debit (HPP)</label><input required className="input" placeholder="mis. 5.1.01" value={stockOut.debit_account_code} onChange={(e) => setStockOut({ ...stockOut, debit_account_code: e.target.value })} /></div>
                <div><label className="label">Akun kredit (Persediaan)</label><input required className="input" placeholder="mis. 1.1.03" value={stockOut.credit_account_code} onChange={(e) => setStockOut({ ...stockOut, credit_account_code: e.target.value })} /></div>
                <div className="sm:col-span-2 flex justify-end"><button type="submit" className="btn btn-primary">Catat stock out</button></div>
              </form>
            ) : <p className="text-sm">Role Anda read-only.</p>}
          </div>
          <MovementTable rows={movements.filter((m) => m.direction === "out")} onCancel={canWrite ? cancelMovement : null} />
        </div>
      )}

      {tab === "kelola" && (
        <div className="space-y-4">
          <div className="card">
            <p className="label mb-2">Penyesuaian stok</p>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              Untuk rusak, kadaluarsa, atau koreksi opname. Jurnal otomatis belum diposting pada penyesuaian ini.
            </p>
            {canWrite ? (
              <form onSubmit={submitAdjust} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Produk</label>
                  <select required className="select" value={adjust.product_id} onChange={(e) => setAdjust({ ...adjust, product_id: e.target.value })}>
                    <option value="">— pilih —</option>
                    {productOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                </div>
                <div><label className="label">Tanggal</label><input type="date" required className="input" value={adjust.adjustment_date} onChange={(e) => setAdjust({ ...adjust, adjustment_date: e.target.value })} /></div>
                <div><label className="label">Delta qty (+/-)</label><input type="number" required className="input" value={adjust.quantity_delta} onChange={(e) => setAdjust({ ...adjust, quantity_delta: e.target.value })} /></div>
                <div>
                  <label className="label">Alasan</label>
                  <select className="select" value={adjust.reason} onChange={(e) => setAdjust({ ...adjust, reason: e.target.value })}>
                    <option value="rusak">Rusak</option>
                    <option value="kadaluarsa">Kadaluarsa</option>
                    <option value="koreksi">Koreksi</option>
                  </select>
                </div>
                <div className="sm:col-span-2"><label className="label">Catatan</label><input className="input" value={adjust.notes} onChange={(e) => setAdjust({ ...adjust, notes: e.target.value })} /></div>
                <div className="sm:col-span-2 flex justify-end"><button type="submit" className="btn btn-primary">Simpan penyesuaian</button></div>
              </form>
            ) : <p className="text-sm">Role Anda read-only.</p>}
          </div>

          <div className="card p-0 overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Tanggal</th><th>SKU</th><th>Produk</th><th className="num">Delta</th><th>Alasan</th><th>Catatan</th></tr></thead>
              <tbody>
                {adjustments.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-8" style={{ color: "var(--text-muted)" }}>Belum ada penyesuaian.</td></tr>
                ) : adjustments.map((a) => (
                  <tr key={a.id}>
                    <td>{fmtDate(a.adjustment_date)}</td>
                    <td>{a.sku}</td>
                    <td>{a.product_name}</td>
                    <td className="num">{a.quantity_delta > 0 ? `+${a.quantity_delta}` : a.quantity_delta}</td>
                    <td><span className="badge">{a.reason}</span></td>
                    <td>{a.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "laporan" && (
        <div className="space-y-4">
          <div className="card p-4 flex flex-wrap gap-4 items-end">
            <div><label className="label">Dari</label><input type="date" className="input" value={reportRange.date_from} onChange={(e) => setReportRange({ ...reportRange, date_from: e.target.value })} /></div>
            <div><label className="label">Sampai</label><input type="date" className="input" value={reportRange.date_to} onChange={(e) => setReportRange({ ...reportRange, date_to: e.target.value })} /></div>
            <button type="button" className="btn btn-outline" onClick={loadReports}>Muat ulang</button>
          </div>

          {valuation && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Stat label="SKU aktif" value={valuation.summary?.sku_count ?? 0} />
              <Stat label="Total qty" value={valuation.summary?.total_qty ?? 0} />
              <Stat label="Nilai persediaan" value={fmtRp(Number(valuation.summary?.total_value || 0))} />
            </div>
          )}

          {movementReport && (
            <div className="card p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="label mb-1">Stock in</p>
                <p className="font-heading text-xl font-bold">{movementReport.stock_in?.qty ?? 0} unit</p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>{fmtRp(Number(movementReport.stock_in?.value || 0))} · {movementReport.stock_in?.count ?? 0} transaksi</p>
              </div>
              <div>
                <p className="label mb-1">Stock out</p>
                <p className="font-heading text-xl font-bold">{movementReport.stock_out?.qty ?? 0} unit</p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>{fmtRp(Number(movementReport.stock_out?.value || 0))} · {movementReport.stock_out?.count ?? 0} transaksi</p>
              </div>
            </div>
          )}

          {valuation?.by_category?.length > 0 && (
            <div className="card p-0 overflow-x-auto">
              <table className="tbl">
                <thead><tr><th>Kategori</th><th className="num">SKU</th><th className="num">Qty</th><th className="num">Nilai</th></tr></thead>
                <tbody>
                  {valuation.by_category.map((c) => (
                    <tr key={c.category}>
                      <td>{c.category}</td>
                      <td className="num">{c.sku_count}</td>
                      <td className="num">{c.qty}</td>
                      <td className="num">{fmtRp(Number(c.value))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="card p-4">
      <p className="label mb-1">{label}</p>
      <p className="font-heading text-2xl font-bold">{value}</p>
    </div>
  );
}

function MovementTable({ rows, onCancel }) {
  return (
    <div className="card p-0 overflow-x-auto">
      <table className="tbl">
        <thead>
          <tr>
            <th>Tanggal</th><th>SKU</th><th>Produk</th><th className="num">Qty</th>
            <th className="num">Nilai</th><th>Status</th><th>Ref</th>{onCancel && <th />}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={8} className="text-center py-8" style={{ color: "var(--text-muted)" }}>Belum ada mutasi.</td></tr>
          ) : rows.map((m) => (
            <tr key={m.id}>
              <td>{fmtDate(m.movement_date)}</td>
              <td>{m.sku}</td>
              <td>{m.product_name}</td>
              <td className="num">{m.quantity}</td>
              <td className="num">{fmtRp(Number(m.total_value))}</td>
              <td><span className="badge">{m.finance_status}</span></td>
              <td className="text-xs">{m.reference}</td>
              {onCancel && (
                <td>
                  {m.finance_status !== "cancelled" && (
                    <button type="button" className="btn btn-outline text-xs" onClick={() => onCancel(m.id)}>Batalkan</button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
