import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import api, { fmtRp, fmtDate } from "@/lib/api";
import { useAuth, can } from "@/lib/auth";
import {
  Package, Plus, ArrowDown, ArrowUp, SlidersHorizontal, ChartBar, ChartPie, Trash, PencilSimple,
  Truck, Users, Wallet, HandCoins,
} from "@phosphor-icons/react";
import {
  CoaSelect, KAS_ACCOUNT_CODE, PERSEDIAAN_ACCOUNT_CODE, PIUTANG_ACCOUNT_CODE,
  UTANG_ACCOUNT_CODE, PENDAPATAN_ACCOUNT_CODE, HPP_ACCOUNT_CODE,
  PENYESUAIAN_NILAI_PERSEDIAAN_ACCOUNT_CODE, BEBAN_KERUGIAN_BARANG_ACCOUNT_CODE,
} from "@/lib/uu05InventoryCoa";
import InventorySummary from "@/pages/InventorySummary";
import TableShell from "@/components/TableShell";
import Spinner from "@/components/Spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";

function formatApiError(err, fallback = "Terjadi kesalahan") {
  const detail = err?.response?.data?.detail;
  if (detail == null) return err?.message || fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail.map((item) => {
      if (typeof item === "string") return item;
      const loc = Array.isArray(item?.loc) ? item.loc.filter((x) => x !== "body").join(".") : "";
      const msg = item?.msg || item?.message || JSON.stringify(item);
      return loc ? `${loc}: ${msg}` : msg;
    }).join("; ");
  }
  if (typeof detail === "object") return detail.message || JSON.stringify(detail);
  return String(detail);
}

const BASE = "/v1/uu05_inventory";
const today = () => new Date().toISOString().slice(0, 10);

const TABS = [
  { id: "summary", label: "Summary", icon: ChartPie },
  { id: "katalog", label: "Katalog Produk", icon: Package },
  { id: "stock-in", label: "Stock In", icon: ArrowDown },
  { id: "stock-out", label: "Stock Out", icon: ArrowUp },
  { id: "kelola", label: "Penyesuaian Stok", icon: SlidersHorizontal },
  { id: "vendor", label: "Mitra Pemasok", icon: Truck },
  { id: "customer", label: "Customer", icon: Users },
  { id: "utang", label: "Utang", icon: Wallet },
  { id: "piutang", label: "Piutang", icon: HandCoins },
  { id: "laporan", label: "Laporan", icon: ChartBar },
];

const emptyStockIn = () => ({
  product_id: "", quantity: 1, unit_cost: 0, movement_date: today(),
  debit_account_code: PERSEDIAAN_ACCOUNT_CODE, credit_account_code: KAS_ACCOUNT_CODE,
  vendor_id: "", invoice_number: "", payment_method: "cash", due_date: "",
});

const emptyStockOut = () => ({
  product_id: "", quantity: 1, movement_date: today(),
  debit_account_code: HPP_ACCOUNT_CODE, credit_account_code: PERSEDIAAN_ACCOUNT_CODE,
  customer_id: "", sell_price: 0, invoice_number: "", payment_method: "cash", due_date: "",
  revenue_debit_account_code: KAS_ACCOUNT_CODE, revenue_credit_account_code: PENDAPATAN_ACCOUNT_CODE,
});

const emptyPartnerForm = () => ({ id: null, name: "", contact: "", address: "" });

const emptyAdjustForm = () => ({
  product_id: "", quantity_delta: -1, reason: "rusak",
  adjustment_date: today(), notes: "",
  debit_account_code: PERSEDIAAN_ACCOUNT_CODE, credit_account_code: PENDAPATAN_ACCOUNT_CODE,
});

export default function Inventory() {
  const { user } = useAuth();
  const [tab, setTab] = useState("summary");
  const [meta, setMeta] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [movements, setMovements] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [valuation, setValuation] = useState(null);
  const [movementReport, setMovementReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [productForm, setProductForm] = useState({
    sku: "", name: "", category_id: "", unit_of_measure: "pcs",
    cost_price: 0, sell_price: 0, opening_qty: 0,
  });
  const [stockIn, setStockIn] = useState(emptyStockIn());
  const [stockOut, setStockOut] = useState(emptyStockOut());
  const [adjust, setAdjust] = useState(emptyAdjustForm());
  const [vendorForm, setVendorForm] = useState(emptyPartnerForm());
  const [customerForm, setCustomerForm] = useState(emptyPartnerForm());
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
      setError(formatApiError(e, "Gagal memuat inventory"));
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
      setError(formatApiError(e, "Gagal memuat mutasi"));
    }
  }, []);

  const loadTrade = useCallback(async () => {
    try {
      const [v, c, pu, sa] = await Promise.all([
        api.get(`${BASE}/vendors`),
        api.get(`${BASE}/customers`),
        api.get(`${BASE}/purchases`, { params: { limit: 100 } }),
        api.get(`${BASE}/sales`, { params: { limit: 100 } }),
      ]);
      setVendors(Array.isArray(v.data) ? v.data : []);
      setCustomers(Array.isArray(c.data) ? c.data : []);
      setPurchases(Array.isArray(pu.data) ? pu.data : []);
      setSales(Array.isArray(sa.data) ? sa.data : []);
    } catch (e) {
      setError(formatApiError(e, "Gagal memuat mitra pemasok/customer"));
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
      setError(formatApiError(e, "Gagal memuat laporan"));
    }
  }, [reportRange]);

  useEffect(() => { loadCore(); }, [loadCore]);
  useEffect(() => {
    if (tab === "kelola" || tab === "stock-in" || tab === "stock-out" || tab === "summary") loadOps();
    if (tab === "laporan" || tab === "summary") loadReports();
    if (["stock-in", "stock-out", "vendor", "customer", "utang", "piutang"].includes(tab)) loadTrade();
  }, [tab, loadOps, loadReports, loadTrade]);

  const productOptions = useMemo(
    () => products.map((p) => ({
      id: p.id,
      label: `${p.sku} — ${p.name} (stok ${p.qty_on_hand})`,
    })),
    [products],
  );

  const activeVendors = useMemo(() => vendors.filter((v) => v.is_active), [vendors]);
  const activeCustomers = useMemo(() => customers.filter((c) => c.is_active), [customers]);

  if (!canAccessRole) return <Navigate to="/dashboard" replace />;
  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Spinner label="Memuat inventory…" /></div>;
  }
  if (meta && user?.role === "pengelola" && user.unit_usaha_id !== meta.unit_usaha_id) {
    return <Navigate to="/dashboard" replace />;
  }

  const emptyProductForm = () => ({
    sku: "", name: "", category_id: "", unit_of_measure: "pcs",
    cost_price: 0, sell_price: 0, opening_qty: 0,
  });

  const openCreateProduct = () => {
    setEditingId(null);
    setProductForm(emptyProductForm());
    setShowForm(true);
  };

  const openEditProduct = (p) => {
    setEditingId(p.id);
    setProductForm({
      sku: p.sku,
      name: p.name,
      category_id: p.category_id || "",
      unit_of_measure: p.unit_of_measure || "pcs",
      cost_price: Number(p.cost_price || 0),
      sell_price: Number(p.sell_price || 0),
      opening_qty: 0,
    });
    setShowForm(true);
  };

  const closeProductForm = () => {
    setShowForm(false);
    setEditingId(null);
    setProductForm(emptyProductForm());
  };

  const submitProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`${BASE}/products/${editingId}`, {
          name: productForm.name,
          category_id: productForm.category_id,
          unit_of_measure: productForm.unit_of_measure,
          cost_price: Number(productForm.cost_price || 0),
          sell_price: Number(productForm.sell_price || 0),
        });
      } else {
        await api.post(`${BASE}/products`, {
          ...productForm,
          cost_price: Number(productForm.cost_price || 0),
          sell_price: Number(productForm.sell_price || 0),
          opening_qty: Number(productForm.opening_qty || 0),
          unit_usaha_id: meta?.unit_usaha_id,
        });
      }
      closeProductForm();
      loadCore();
    } catch (err) {
      setError(formatApiError(err, "Gagal menyimpan produk"));
    }
  };

  const removeProduct = async (id) => {
    if (!window.confirm("Hapus produk ini? Stok harus 0. Riwayat mutasi/penyesuaian & jurnal terkait ikut dihapus.")) return;
    try {
      await api.delete(`${BASE}/products/${id}`);
      loadCore();
    } catch (err) {
      setError(formatApiError(err, "Gagal menghapus produk"));
    }
  };

  const submitStockIn = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.post(`${BASE}/stock-in`, {
        ...stockIn,
        quantity: Number(stockIn.quantity),
        unit_cost: Number(stockIn.unit_cost),
        due_date: stockIn.payment_method === "credit" ? stockIn.due_date : null,
        unit_usaha_id: meta?.unit_usaha_id,
      });
      setStockIn(emptyStockIn());
      await Promise.all([loadCore(), loadOps(), loadTrade()]);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const submitStockOut = async (e) => {
    e.preventDefault();
    if (submitting) return;
    const product = products.find((p) => p.id === stockOut.product_id);
    if (product && Number(stockOut.quantity) > Number(product.qty_on_hand)) {
      setError(`Qty keluar (${stockOut.quantity}) melebihi stok tersedia (${product.qty_on_hand}).`);
      return;
    }
    setSubmitting(true);
    try {
      await api.post(`${BASE}/stock-out`, {
        ...stockOut,
        quantity: Number(stockOut.quantity),
        sell_price: Number(stockOut.sell_price),
        due_date: stockOut.payment_method === "piutang" ? stockOut.due_date : null,
        unit_usaha_id: meta?.unit_usaha_id,
      });
      setStockOut(emptyStockOut());
      await Promise.all([loadCore(), loadOps(), loadTrade()]);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const submitAdjust = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      await api.post(`${BASE}/adjustments`, {
        ...adjust,
        quantity_delta: Number(adjust.quantity_delta),
        unit_usaha_id: meta?.unit_usaha_id,
      });
      setAdjust(emptyAdjustForm());
      await Promise.all([loadCore(), loadOps()]);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const cancelMovement = async (id) => {
    if (!window.confirm("Batalkan mutasi ini? Mutasi, transaksi pembelian/penjualan & jurnal terkait akan dihapus permanen.")) return;
    try {
      await api.post(`${BASE}/cancel-movement`, { stock_card_id: id });
      await Promise.all([loadCore(), loadOps(), loadTrade()]);
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  const cancelAdjustment = async (id) => {
    if (!window.confirm("Batalkan penyesuaian ini? Qty dikembalikan dan jurnal terkait dihapus.")) return;
    try {
      await api.post(`${BASE}/cancel-adjustment`, { adjustment_id: id });
      await Promise.all([loadCore(), loadOps()]);
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  const submitVendor = async (e) => {
    e.preventDefault();
    try {
      if (vendorForm.id) {
        await api.put(`${BASE}/vendors/${vendorForm.id}`, {
          name: vendorForm.name, contact: vendorForm.contact, address: vendorForm.address,
        });
      } else {
        await api.post(`${BASE}/vendors`, {
          name: vendorForm.name, contact: vendorForm.contact, address: vendorForm.address,
          unit_usaha_id: meta?.unit_usaha_id,
        });
      }
      setVendorForm(emptyPartnerForm());
      await loadTrade();
    } catch (err) {
      setError(formatApiError(err, "Gagal menyimpan mitra pemasok"));
    }
  };

  const toggleVendorActive = async (v) => {
    try {
      await api.put(`${BASE}/vendors/${v.id}`, { is_active: !v.is_active });
      await loadTrade();
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  const submitCustomer = async (e) => {
    e.preventDefault();
    try {
      if (customerForm.id) {
        await api.put(`${BASE}/customers/${customerForm.id}`, {
          name: customerForm.name, contact: customerForm.contact, address: customerForm.address,
        });
      } else {
        await api.post(`${BASE}/customers`, {
          name: customerForm.name, contact: customerForm.contact, address: customerForm.address,
          unit_usaha_id: meta?.unit_usaha_id,
        });
      }
      setCustomerForm(emptyPartnerForm());
      await loadTrade();
    } catch (err) {
      setError(formatApiError(err, "Gagal menyimpan customer"));
    }
  };

  const toggleCustomerActive = async (c) => {
    try {
      await api.put(`${BASE}/customers/${c.id}`, { is_active: !c.is_active });
      await loadTrade();
    } catch (err) {
      setError(formatApiError(err));
    }
  };

  const payPurchase = async (purchase) => {
    const amountStr = window.prompt(
      `Jumlah pelunasan utang (sisa ${fmtRp(Number(purchase.outstanding))}):`,
      purchase.outstanding,
    );
    if (!amountStr) return;
    try {
      await api.post(`${BASE}/purchases/pay`, {
        purchase_id: purchase.id,
        amount: Number(amountStr),
        paid_date: today(),
        debit_account_code: UTANG_ACCOUNT_CODE,
        credit_account_code: KAS_ACCOUNT_CODE,
        unit_usaha_id: meta?.unit_usaha_id,
      });
      await loadTrade();
    } catch (err) {
      setError(formatApiError(err, "Gagal mencatat pelunasan"));
    }
  };

  const paySale = async (sale) => {
    const amountStr = window.prompt(
      `Jumlah pelunasan piutang (sisa ${fmtRp(Number(sale.outstanding))}):`,
      sale.outstanding,
    );
    if (!amountStr) return;
    try {
      await api.post(`${BASE}/sales/pay`, {
        sale_id: sale.id,
        amount: Number(amountStr),
        paid_date: today(),
        debit_account_code: KAS_ACCOUNT_CODE,
        credit_account_code: PIUTANG_ACCOUNT_CODE,
        unit_usaha_id: meta?.unit_usaha_id,
      });
      await loadTrade();
    } catch (err) {
      setError(formatApiError(err, "Gagal mencatat pelunasan"));
    }
  };

  return (
    <div className="space-y-6 fade-in" data-testid="inventory-page">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <p className="label mb-1">Unit Usaha UU05</p>
          <h1 className="font-heading text-3xl font-bold">Inventory</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            {meta?.unit_name || "Persediaan barang dagang"} · katalog, mutasi, pembelian, penjualan & valuasi
          </p>
        </div>
        {tab === "katalog" && canWrite && (
          <Button type="button" onClick={openCreateProduct} data-testid="btn-new-product">
            <Plus size={16} /> Tambah Produk
          </Button>
        )}
      </div>

      {error && (
        <div className="card p-3 text-sm" style={{ borderColor: "var(--status-error)", color: "var(--status-error-strong)", background: "var(--status-error-bg)" }} role="alert" data-testid="inventory-error">
          <strong className="block mb-1">Validasi / API</strong>
          <span>{typeof error === "string" ? error : JSON.stringify(error)}</span>
          <button type="button" className="ml-3 underline" onClick={() => setError("")}>tutup</button>
        </div>
      )}

      <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Tab inventory">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <Button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              variant={active ? "default" : "outline"}
              size="sm"
              onClick={() => setTab(t.id)}
              data-testid={`tab-${t.id}`}
            >
              <Icon size={16} /> {t.label}
            </Button>
          );
        })}
      </div>

      {tab === "summary" && (
        <InventorySummary
          products={products}
          movements={movements}
          valuation={valuation}
          movementReport={movementReport}
        />
      )}

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
              <p className="label mb-3">{editingId ? "Edit produk" : "Tambah produk"}</p>
              <form onSubmit={submitProduct} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">SKU</label>
                  <input required className="input" value={productForm.sku} disabled={!!editingId} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} />
                </div>
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
                {!editingId && (
                  <div><label className="label">Qty awal</label><input type="number" min="0" className="input" value={productForm.opening_qty} onChange={(e) => setProductForm({ ...productForm, opening_qty: e.target.value })} /></div>
                )}
                <div className="sm:col-span-2 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={closeProductForm}>Batal</Button>
                  <Button type="submit">{editingId ? "Simpan perubahan" : "Simpan produk"}</Button>
                </div>
              </form>
            </div>
          )}

          <div className="card p-0 overflow-hidden">
            <TableShell minWidth={720}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead><TableHead>Nama</TableHead><TableHead>Kategori</TableHead><TableHead>Satuan</TableHead>
                  <TableHead className="num">HPP</TableHead><TableHead className="num">Harga jual</TableHead>
                  <TableHead className="num">Stok</TableHead><TableHead className="num">Nilai</TableHead>
                  {canWrite && <TableHead />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8" style={{ color: "var(--text-muted)" }}>Belum ada produk di katalog.</TableCell></TableRow>
                ) : products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.sku}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell><Badge variant="secondary">{p.category_name || "-"}</Badge></TableCell>
                    <TableCell>{p.unit_of_measure}</TableCell>
                    <TableCell className="num">{fmtRp(Number(p.cost_price))}</TableCell>
                    <TableCell className="num">{fmtRp(Number(p.sell_price))}</TableCell>
                    <TableCell className="num">{p.qty_on_hand}</TableCell>
                    <TableCell className="num">{fmtRp(Number(p.stock_value))}</TableCell>
                    {canWrite && (
                      <TableCell className="whitespace-nowrap">
                        <button type="button" className="p-1.5" title="Edit" onClick={() => openEditProduct(p)} data-testid={`btn-edit-product-${p.id}`}>
                          <PencilSimple size={16} />
                        </button>
                        <button type="button" className="p-1.5" title="Hapus" onClick={() => removeProduct(p.id)}>
                          <Trash size={16} color="var(--status-error)" />
                        </button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </TableShell>
          </div>
        </div>
      )}

      {tab === "stock-in" && (
        <div className="space-y-4">
          <div className="card">
            <p className="label mb-2">Penerimaan barang (Stock In / Pembelian)</p>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>Stock in menghasilkan transaksi stok masuk sekaligus transaksi Pembelian (tunai atau kredit/utang).</p>
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
                <div>
                  <label className="label">Mitra Pemasok</label>
                  <select required className="select" value={stockIn.vendor_id} onChange={(e) => setStockIn({ ...stockIn, vendor_id: e.target.value })}>
                    <option value="">— pilih mitra pemasok —</option>
                    {activeVendors.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                  </select>
                  {activeVendors.length === 0 && (
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Belum ada mitra pemasok — tambahkan di tab Mitra Pemasok.</p>
                  )}
                </div>
                <div><label className="label">Tanggal</label><input type="date" required className="input" value={stockIn.movement_date} onChange={(e) => setStockIn({ ...stockIn, movement_date: e.target.value })} /></div>
                <div><label className="label">No. Invoice</label><input className="input" value={stockIn.invoice_number} onChange={(e) => setStockIn({ ...stockIn, invoice_number: e.target.value })} /></div>
                <div><label className="label">Qty masuk</label><input type="number" min="1" required className="input" value={stockIn.quantity} onChange={(e) => setStockIn({ ...stockIn, quantity: e.target.value })} /></div>
                <div><label className="label">HPP / unit (Rp)</label><input type="number" min="0" required className="input" value={stockIn.unit_cost} onChange={(e) => setStockIn({ ...stockIn, unit_cost: e.target.value })} /></div>
                <div>
                  <label className="label">Metode bayar</label>
                  <select className="select" value={stockIn.payment_method} onChange={(e) => {
                    const method = e.target.value;
                    setStockIn({
                      ...stockIn, payment_method: method,
                      credit_account_code: method === "credit" ? UTANG_ACCOUNT_CODE : KAS_ACCOUNT_CODE,
                    });
                  }}>
                    <option value="cash">Tunai</option>
                    <option value="credit">Kredit (Utang Usaha)</option>
                  </select>
                </div>
                {stockIn.payment_method === "credit" && (
                  <div><label className="label">Jatuh tempo</label><input type="date" required className="input" value={stockIn.due_date} onChange={(e) => setStockIn({ ...stockIn, due_date: e.target.value })} /></div>
                )}
                <div>
                  <label className="label">Akun debit (Persediaan)</label>
                  <CoaSelect value={stockIn.debit_account_code} onChange={(e) => setStockIn({ ...stockIn, debit_account_code: e.target.value })} />
                </div>
                <div>
                  <label className="label">Akun kredit ({stockIn.payment_method === "credit" ? "Utang Usaha" : "Kas/Bank"})</label>
                  <CoaSelect value={stockIn.credit_account_code} onChange={(e) => setStockIn({ ...stockIn, credit_account_code: e.target.value })} />
                </div>
                <div className="sm:col-span-2 flex justify-end"><Button type="submit" disabled={submitting}>{submitting ? "Menyimpan…" : "Catat stock in"}</Button></div>
              </form>
            ) : <p className="text-sm">Role Anda read-only.</p>}
          </div>
          <MovementTable rows={movements.filter((m) => m.direction === "in" && m.finance_status !== "cancelled")} onCancel={canWrite ? cancelMovement : null} />
        </div>
      )}

      {tab === "stock-out" && (
        <div className="space-y-4">
          <div className="card">
            <p className="label mb-2">Pengeluaran barang (Stock Out / Penjualan)</p>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>Stock out menghasilkan transaksi stok keluar + jurnal HPP, sekaligus transaksi Penjualan (jurnal pendapatan) tunai atau piutang.</p>
            {canWrite ? (
              <form onSubmit={submitStockOut} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Produk</label>
                  <select required className="select" value={stockOut.product_id} onChange={(e) => {
                    const p = products.find((x) => x.id === e.target.value);
                    setStockOut({ ...stockOut, product_id: e.target.value, sell_price: p ? Number(p.sell_price) : 0 });
                  }}>
                    <option value="">— pilih —</option>
                    {productOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Customer</label>
                  <select required className="select" value={stockOut.customer_id} onChange={(e) => setStockOut({ ...stockOut, customer_id: e.target.value })}>
                    <option value="">— pilih customer —</option>
                    {activeCustomers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {activeCustomers.length === 0 && (
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Belum ada customer — tambahkan di tab Customer.</p>
                  )}
                </div>
                <div><label className="label">Tanggal</label><input type="date" required className="input" value={stockOut.movement_date} onChange={(e) => setStockOut({ ...stockOut, movement_date: e.target.value })} /></div>
                <div><label className="label">No. Invoice</label><input className="input" value={stockOut.invoice_number} onChange={(e) => setStockOut({ ...stockOut, invoice_number: e.target.value })} /></div>
                <div><label className="label">Qty keluar</label><input type="number" min="1" required className="input" value={stockOut.quantity} onChange={(e) => setStockOut({ ...stockOut, quantity: e.target.value })} /></div>
                <div><label className="label">Harga jual / unit (Rp)</label><input type="number" min="0" required className="input" value={stockOut.sell_price} onChange={(e) => setStockOut({ ...stockOut, sell_price: e.target.value })} /></div>
                <div>
                  <label className="label">Metode bayar</label>
                  <select className="select" value={stockOut.payment_method} onChange={(e) => {
                    const method = e.target.value;
                    setStockOut({
                      ...stockOut, payment_method: method,
                      revenue_debit_account_code: method === "piutang" ? PIUTANG_ACCOUNT_CODE : KAS_ACCOUNT_CODE,
                    });
                  }}>
                    <option value="cash">Tunai</option>
                    <option value="piutang">Piutang</option>
                  </select>
                </div>
                {stockOut.payment_method === "piutang" && (
                  <div><label className="label">Jatuh tempo</label><input type="date" required className="input" value={stockOut.due_date} onChange={(e) => setStockOut({ ...stockOut, due_date: e.target.value })} /></div>
                )}
                <div>
                  <label className="label">Akun debit (HPP)</label>
                  <CoaSelect value={stockOut.debit_account_code} onChange={(e) => setStockOut({ ...stockOut, debit_account_code: e.target.value })} />
                </div>
                <div>
                  <label className="label">Akun kredit (Persediaan)</label>
                  <CoaSelect value={stockOut.credit_account_code} onChange={(e) => setStockOut({ ...stockOut, credit_account_code: e.target.value })} />
                </div>
                <div>
                  <label className="label">Akun debit penjualan ({stockOut.payment_method === "piutang" ? "Piutang" : "Kas/Bank"})</label>
                  <CoaSelect value={stockOut.revenue_debit_account_code} onChange={(e) => setStockOut({ ...stockOut, revenue_debit_account_code: e.target.value })} />
                </div>
                <div>
                  <label className="label">Akun kredit (Pendapatan)</label>
                  <CoaSelect value={stockOut.revenue_credit_account_code} onChange={(e) => setStockOut({ ...stockOut, revenue_credit_account_code: e.target.value })} />
                </div>
                <div className="sm:col-span-2 card p-3 text-sm" style={{ background: "var(--surface-alt)" }}>
                  <p>Preview jurnal HPP: <strong>{fmtRp(Number(stockOut.quantity || 0) * Number(products.find((p) => p.id === stockOut.product_id)?.cost_price || 0))}</strong></p>
                  <p>Preview jurnal Penjualan: <strong>{fmtRp(Number(stockOut.quantity || 0) * Number(stockOut.sell_price || 0))}</strong></p>
                </div>
                <div className="sm:col-span-2 flex justify-end"><Button type="submit" disabled={submitting}>{submitting ? "Menyimpan…" : "Catat stock out"}</Button></div>
              </form>
            ) : <p className="text-sm">Role Anda read-only.</p>}
          </div>
          <MovementTable rows={movements.filter((m) => m.direction === "out" && m.finance_status !== "cancelled")} onCancel={canWrite ? cancelMovement : null} />
        </div>
      )}

      {tab === "kelola" && (
        <div className="space-y-4">
          <div className="card">
            <p className="label mb-2">Penyesuaian Stok</p>
            <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
              Pengurangan stok (delta negatif) menghasilkan 2 transaksi: pengurangan fisik nilai persediaan, lalu pengakuan beban kerugian.
              Penambahan stok (delta positif) tetap 1 jurnal dengan akun kredit/offset pilihan Anda.
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

                {Number(adjust.quantity_delta) < 0 ? (
                  <div className="sm:col-span-2 card p-3 text-sm space-y-3" style={{ background: "var(--surface-alt)" }}>
                    <div>
                      <p className="font-medium mb-1">Jurnal 1 — Pengurangan fisik nilai persediaan</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <CoaSelect value={PENYESUAIAN_NILAI_PERSEDIAAN_ACCOUNT_CODE} onChange={() => {}} disabled id="adj-loss-debit-1" />
                        <CoaSelect value={PERSEDIAAN_ACCOUNT_CODE} onChange={() => {}} disabled id="adj-loss-credit-1" />
                      </div>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Jurnal 2 — Pengakuan beban kerugian</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <CoaSelect value={BEBAN_KERUGIAN_BARANG_ACCOUNT_CODE} onChange={() => {}} disabled id="adj-loss-debit-2" />
                        <CoaSelect value={PENYESUAIAN_NILAI_PERSEDIAAN_ACCOUNT_CODE} onChange={() => {}} disabled id="adj-loss-credit-2" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="label">Akun debit (Persediaan)</label>
                      <CoaSelect value={adjust.debit_account_code} onChange={(e) => setAdjust({ ...adjust, debit_account_code: e.target.value })} />
                    </div>
                    <div>
                      <label className="label">Akun kredit (Pendapatan/Offset)</label>
                      <CoaSelect value={adjust.credit_account_code} onChange={(e) => setAdjust({ ...adjust, credit_account_code: e.target.value })} />
                    </div>
                  </>
                )}

                <div className="sm:col-span-2"><label className="label">Catatan</label><input className="input" value={adjust.notes} onChange={(e) => setAdjust({ ...adjust, notes: e.target.value })} /></div>
                <div className="sm:col-span-2 flex justify-end"><Button type="submit" disabled={submitting}>{submitting ? "Menyimpan…" : "Simpan penyesuaian"}</Button></div>
              </form>
            ) : <p className="text-sm">Role Anda read-only.</p>}
          </div>

          <div className="card p-0 overflow-hidden">
            <TableShell minWidth={720}>
            <Table>
              <TableHeader><TableRow><TableHead>Tanggal</TableHead><TableHead>SKU</TableHead><TableHead>Produk</TableHead><TableHead className="num">Delta</TableHead><TableHead>Alasan</TableHead><TableHead>Catatan</TableHead><TableHead>Ref</TableHead>{canWrite && <TableHead />}</TableRow></TableHeader>
              <TableBody>
                {adjustments.length === 0 ? (
                  <TableRow><TableCell colSpan={canWrite ? 8 : 7} className="text-center py-8" style={{ color: "var(--text-muted)" }}>Belum ada penyesuaian.</TableCell></TableRow>
                ) : adjustments.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{fmtDate(a.adjustment_date)}</TableCell>
                    <TableCell>{a.sku}</TableCell>
                    <TableCell>{a.product_name}</TableCell>
                    <TableCell className="num">{a.quantity_delta > 0 ? `+${a.quantity_delta}` : a.quantity_delta}</TableCell>
                    <TableCell><Badge variant="secondary">{a.reason}</Badge></TableCell>
                    <TableCell>{a.notes || "-"}</TableCell>
                    <TableCell className="text-xs">
                      <Link
                        to={`/transactions?reference=${encodeURIComponent(a.id)}`}
                        className="underline"
                        style={{ color: "var(--primary-dark)" }}
                      >
                        Lihat transaksi
                      </Link>
                    </TableCell>
                    {canWrite && (
                      <TableCell>
                        <Button type="button" variant="outline" size="sm" onClick={() => cancelAdjustment(a.id)}>
                          Batalkan
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </TableShell>
          </div>
        </div>
      )}

      {tab === "vendor" && (
        <div className="space-y-4">
          {canWrite && (
            <div className="card">
              <p className="label mb-3">{vendorForm.id ? "Edit mitra pemasok" : "Tambah mitra pemasok"}</p>
              <form onSubmit={submitVendor} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><label className="label">Nama</label><input required className="input" value={vendorForm.name} onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })} /></div>
                <div><label className="label">Kontak</label><input className="input" value={vendorForm.contact} onChange={(e) => setVendorForm({ ...vendorForm, contact: e.target.value })} /></div>
                <div><label className="label">Alamat</label><input className="input" value={vendorForm.address} onChange={(e) => setVendorForm({ ...vendorForm, address: e.target.value })} /></div>
                <div className="sm:col-span-3 flex justify-end gap-2">
                  {vendorForm.id && <Button type="button" variant="outline" onClick={() => setVendorForm(emptyPartnerForm())}>Batal</Button>}
                  <Button type="submit">{vendorForm.id ? "Simpan perubahan" : "Simpan mitra pemasok"}</Button>
                </div>
              </form>
            </div>
          )}
          <div className="card p-0 overflow-hidden">
            <TableShell minWidth={640}>
              <Table>
                <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead>Kontak</TableHead><TableHead>Alamat</TableHead><TableHead>Status</TableHead>{canWrite && <TableHead />}</TableRow></TableHeader>
                <TableBody>
                  {vendors.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8" style={{ color: "var(--text-muted)" }}>Belum ada mitra pemasok.</TableCell></TableRow>
                  ) : vendors.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.name}</TableCell>
                      <TableCell>{v.contact || "-"}</TableCell>
                      <TableCell>{v.address || "-"}</TableCell>
                      <TableCell><Badge variant={v.is_active ? "default" : "outline"}>{v.is_active ? "aktif" : "nonaktif"}</Badge></TableCell>
                      {canWrite && (
                        <TableCell className="whitespace-nowrap">
                          <button type="button" className="p-1.5" title="Edit" onClick={() => setVendorForm({ id: v.id, name: v.name, contact: v.contact || "", address: v.address || "" })}><PencilSimple size={16} /></button>
                          <Button type="button" variant="outline" size="sm" className="ml-2" onClick={() => toggleVendorActive(v)}>{v.is_active ? "Nonaktifkan" : "Aktifkan"}</Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableShell>
          </div>
        </div>
      )}

      {tab === "customer" && (
        <div className="space-y-4">
          {canWrite && (
            <div className="card">
              <p className="label mb-3">{customerForm.id ? "Edit customer" : "Tambah customer"}</p>
              <form onSubmit={submitCustomer} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><label className="label">Nama</label><input required className="input" value={customerForm.name} onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })} /></div>
                <div><label className="label">Kontak</label><input className="input" value={customerForm.contact} onChange={(e) => setCustomerForm({ ...customerForm, contact: e.target.value })} /></div>
                <div><label className="label">Alamat</label><input className="input" value={customerForm.address} onChange={(e) => setCustomerForm({ ...customerForm, address: e.target.value })} /></div>
                <div className="sm:col-span-3 flex justify-end gap-2">
                  {customerForm.id && <Button type="button" variant="outline" onClick={() => setCustomerForm(emptyPartnerForm())}>Batal</Button>}
                  <Button type="submit">{customerForm.id ? "Simpan perubahan" : "Simpan customer"}</Button>
                </div>
              </form>
            </div>
          )}
          <div className="card p-0 overflow-hidden">
            <TableShell minWidth={640}>
              <Table>
                <TableHeader><TableRow><TableHead>Nama</TableHead><TableHead>Kontak</TableHead><TableHead>Alamat</TableHead><TableHead>Status</TableHead>{canWrite && <TableHead />}</TableRow></TableHeader>
                <TableBody>
                  {customers.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center py-8" style={{ color: "var(--text-muted)" }}>Belum ada customer.</TableCell></TableRow>
                  ) : customers.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.contact || "-"}</TableCell>
                      <TableCell>{c.address || "-"}</TableCell>
                      <TableCell><Badge variant={c.is_active ? "default" : "outline"}>{c.is_active ? "aktif" : "nonaktif"}</Badge></TableCell>
                      {canWrite && (
                        <TableCell className="whitespace-nowrap">
                          <button type="button" className="p-1.5" title="Edit" onClick={() => setCustomerForm({ id: c.id, name: c.name, contact: c.contact || "", address: c.address || "" })}><PencilSimple size={16} /></button>
                          <Button type="button" variant="outline" size="sm" className="ml-2" onClick={() => toggleCustomerActive(c)}>{c.is_active ? "Nonaktifkan" : "Aktifkan"}</Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableShell>
          </div>
        </div>
      )}

      {tab === "utang" && (
        <div className="card p-0 overflow-hidden">
          <TableShell minWidth={800}>
            <Table>
              <TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Mitra Pemasok</TableHead><TableHead>Metode</TableHead><TableHead className="num">Total</TableHead><TableHead className="num">Terbayar</TableHead><TableHead className="num">Sisa</TableHead><TableHead>Jatuh tempo</TableHead><TableHead>Status</TableHead>{canWrite && <TableHead />}</TableRow></TableHeader>
              <TableBody>
                {purchases.filter((p) => p.payment_method === "credit").length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8" style={{ color: "var(--text-muted)" }}>Belum ada utang usaha.</TableCell></TableRow>
                ) : purchases.filter((p) => p.payment_method === "credit").map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.invoice_number || "-"}</TableCell>
                    <TableCell>{p.vendor_name}</TableCell>
                    <TableCell><Badge variant="secondary">{p.payment_method}</Badge></TableCell>
                    <TableCell className="num">{fmtRp(Number(p.total_amount))}</TableCell>
                    <TableCell className="num">{fmtRp(Number(p.paid_amount))}</TableCell>
                    <TableCell className="num">{fmtRp(Number(p.outstanding))}</TableCell>
                    <TableCell>{p.due_date ? fmtDate(p.due_date) : "-"}</TableCell>
                    <TableCell><Badge variant={p.status === "paid" ? "default" : "outline"}>{p.status}</Badge></TableCell>
                    {canWrite && (
                      <TableCell>
                        {p.status !== "paid" && (
                          <Button type="button" variant="outline" size="sm" onClick={() => payPurchase(p)}>Catat pelunasan</Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableShell>
        </div>
      )}

      {tab === "piutang" && (
        <div className="card p-0 overflow-hidden">
          <TableShell minWidth={800}>
            <Table>
              <TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Customer</TableHead><TableHead>Metode</TableHead><TableHead className="num">Total</TableHead><TableHead className="num">Terbayar</TableHead><TableHead className="num">Sisa</TableHead><TableHead>Jatuh tempo</TableHead><TableHead>Status</TableHead>{canWrite && <TableHead />}</TableRow></TableHeader>
              <TableBody>
                {sales.filter((s) => s.payment_method === "piutang").length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8" style={{ color: "var(--text-muted)" }}>Belum ada piutang usaha.</TableCell></TableRow>
                ) : sales.filter((s) => s.payment_method === "piutang").map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.invoice_number || "-"}</TableCell>
                    <TableCell>{s.customer_name}</TableCell>
                    <TableCell><Badge variant="secondary">{s.payment_method}</Badge></TableCell>
                    <TableCell className="num">{fmtRp(Number(s.total_amount))}</TableCell>
                    <TableCell className="num">{fmtRp(Number(s.paid_amount))}</TableCell>
                    <TableCell className="num">{fmtRp(Number(s.outstanding))}</TableCell>
                    <TableCell>{s.due_date ? fmtDate(s.due_date) : "-"}</TableCell>
                    <TableCell><Badge variant={s.status === "paid" ? "default" : "outline"}>{s.status}</Badge></TableCell>
                    {canWrite && (
                      <TableCell>
                        {s.status !== "paid" && (
                          <Button type="button" variant="outline" size="sm" onClick={() => paySale(s)}>Catat pelunasan</Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableShell>
        </div>
      )}

      {tab === "laporan" && (
        <div className="space-y-4">
          <div className="card p-4 flex flex-wrap gap-4 items-end">
            <div><label className="label">Dari</label><input type="date" className="input" value={reportRange.date_from} onChange={(e) => setReportRange({ ...reportRange, date_from: e.target.value })} /></div>
            <div><label className="label">Sampai</label><input type="date" className="input" value={reportRange.date_to} onChange={(e) => setReportRange({ ...reportRange, date_to: e.target.value })} /></div>
            <Button type="button" variant="outline" onClick={loadReports}>Muat ulang</Button>
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
            <div className="card p-0 overflow-hidden">
              <TableShell minWidth={720}>
              <Table>
                <TableHeader><TableRow><TableHead>Kategori</TableHead><TableHead className="num">SKU</TableHead><TableHead className="num">Qty</TableHead><TableHead className="num">Nilai</TableHead></TableRow></TableHeader>
                <TableBody>
                  {valuation.by_category.map((c) => (
                    <TableRow key={c.category}>
                      <TableCell>{c.category}</TableCell>
                      <TableCell className="num">{c.sku_count}</TableCell>
                      <TableCell className="num">{c.qty}</TableCell>
                      <TableCell className="num">{fmtRp(Number(c.value))}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </TableShell>
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
    <div className="card p-0 overflow-hidden">
      <TableShell minWidth={720}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal</TableHead><TableHead>SKU</TableHead><TableHead>Produk</TableHead><TableHead className="num">Qty</TableHead>
            <TableHead className="num">Nilai</TableHead><TableHead>Status</TableHead><TableHead>Ref</TableHead>{onCancel && <TableHead />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow><TableCell colSpan={8} className="text-center py-8" style={{ color: "var(--text-muted)" }}>Belum ada mutasi.</TableCell></TableRow>
          ) : rows.map((m) => (
            <TableRow key={m.id}>
              <TableCell>{fmtDate(m.movement_date)}</TableCell>
              <TableCell>{m.sku}</TableCell>
              <TableCell>{m.product_name}</TableCell>
              <TableCell className="num">{m.quantity}</TableCell>
              <TableCell className="num">{fmtRp(Number(m.total_value))}</TableCell>
              <TableCell><Badge variant="secondary">{m.finance_status}</Badge></TableCell>
              <TableCell className="text-xs">
                {m.reference ? (
                  <Link
                    to={`/transactions?reference=${encodeURIComponent(m.id)}`}
                    className="underline"
                    style={{ color: "var(--primary-dark)" }}
                  >
                    Lihat transaksi
                  </Link>
                ) : (
                  "-"
                )}
              </TableCell>
              {onCancel && (
                <TableCell>
                  {m.finance_status !== "cancelled" && (
                    <Button type="button" variant="outline" size="sm" onClick={() => onCancel(m.id)}>Batalkan</Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </TableShell>
    </div>
  );
}
