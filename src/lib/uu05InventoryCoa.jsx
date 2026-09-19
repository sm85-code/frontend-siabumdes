/** COA UU05 untuk transaksi inventory (Kas, Persediaan, Utang, HPP). */
export const UU05_INVENTORY_COA = [
  { code: "1.1.01.15", name: "Kas/Bank - UU05" },
  { code: "1.1.05.15", name: "Persediaan Barang Dagangan" },
  { code: "2.1.01.15", name: "Utang Usaha" },
  { code: "5.1.01.15", name: "Harga Pokok Penjualan Barang Dagangan" },
];

export function CoaSelect({ value, onChange, required = true, id }) {
  return (
    <select id={id} required={required} className="input" value={value} onChange={onChange}>
      <option value="">— pilih akun —</option>
      {UU05_INVENTORY_COA.map((a) => (
        <option key={a.code} value={a.code}>
          {a.code} — {a.name}
        </option>
      ))}
    </select>
  );
}
