import { useMemo, useState } from "react";
import { getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";

/**
 * Sortable table hook -- same public API as before (sorted, sortKey, sortDir,
 * toggleSort, headerProps, sortIndicator), now powered by
 * @tanstack/react-table's getSortedRowModel() instead of a hand-rolled
 * Array.sort(). No consumer (Transactions.jsx, COAPage.jsx) needs to change.
 *
 * Usage: const { sorted, sortKey, sortDir, toggleSort, headerProps } = useSort(rows, "date", "desc")
 * Then: <th {...headerProps("date")}>Tanggal</th>
 */

// Same comparator as the original hand-rolled version: numeric compare for
// numbers, locale "id" natural compare for everything else, nulls/undefined
// pushed to the end of ascending order (and therefore to the front once
// "desc" reverses the whole result below -- same as the original).
export function compareValues(av, bv) {
  if (av == null && bv == null) return 0;
  if (av == null) return 1;
  if (bv == null) return -1;
  if (typeof av === "number" && typeof bv === "number") return av - bv;
  return String(av).localeCompare(String(bv), "id", { numeric: true });
}

export function useSort(rows, defaultKey = null, defaultDir = "asc") {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [sortDir, setSortDir] = useState(defaultDir);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // Single-sort, same as before: only the currently active key needs a
  // column def, so no static column schema is required per page. TanStack
  // Table's own `desc` flag just flips the comparator's sign, which would
  // also flip our "nulls always last" rule for descending order -- so the
  // table is always asked to sort ascending, and "desc" is applied by
  // reversing the whole ascending result afterwards (same as the original
  // Array.sort() + .reverse() this hook replaces, ties included).
  const columns = useMemo(() => {
    if (!sortKey) return [];
    return [
      {
        id: sortKey,
        accessorKey: sortKey,
        sortingFn: (rowA, rowB) => compareValues(rowA.getValue(sortKey), rowB.getValue(sortKey)),
      },
    ];
  }, [sortKey]);

  const sorting = useMemo(() => (sortKey ? [{ id: sortKey, desc: false }] : []), [sortKey]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: () => {}, // sorting is driven by toggleSort()/sortDir below, not by the table itself
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const ascending = table.getSortedRowModel().rows.map((r) => r.original);
    return sortDir === "desc" ? ascending.reverse() : ascending;
  }, [table, sortKey, sortDir, rows]);

  const headerProps = (key) => ({
    onClick: () => toggleSort(key),
    className: "cursor-pointer select-none",
    "data-testid": `sort-${key}`,
    title: "Klik untuk mengurutkan",
  });

  const sortIndicator = (key) => {
    if (sortKey !== key) return " ⇅";
    return sortDir === "asc" ? " ↑" : " ↓";
  };

  return { sorted, sortKey, sortDir, toggleSort, headerProps, sortIndicator };
}
