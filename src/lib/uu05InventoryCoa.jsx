/** COA UU05 untuk transaksi inventory (Kas, Persediaan, Utang, Piutang, HPP, Pendapatan). */
export const UU05_INVENTORY_COA = [
  { code: "1.1.01.15", name: "Kas/Bank - UU05" },
  { code: "1.1.05.15", name: "Persediaan Barang Dagangan" },
  { code: "1.1.03.15", name: "Piutang Usaha" },
  { code: "2.1.01.15", name: "Utang Usaha" },
  { code: "4.1.01.15", name: "Pendapatan Usaha" },
  { code: "5.1.01.15", name: "Harga Pokok Penjualan Barang Dagangan" },
];

export const KAS_ACCOUNT_CODE = "1.1.01.15";
export const PERSEDIAAN_ACCOUNT_CODE = "1.1.05.15";
export const PIUTANG_ACCOUNT_CODE = "1.1.03.15";
export const UTANG_ACCOUNT_CODE = "2.1.01.15";
export const PENDAPATAN_ACCOUNT_CODE = "4.1.01.15";
export const HPP_ACCOUNT_CODE = "5.1.01.15";

export function CoaSelect({ value, onChange, required = true, id, disabled = false }) {
  return (
    <select id={id} required={required} disabled={disabled} className="input" value={value} onChange={onChange}>
      <option value="">— pilih akun —</option>
      {UU05_INVENTORY_COA.map((a) => (
        <option key={a.code} value={a.code}>
          {a.code} — {a.name}
        </option>
      ))}
    </select>
  );
}
