import * as XLSX from "xlsx";
import { ddmm } from "./format";

const byOrder = (a, b) => a.input_order - b.input_order;
const sum = (arr) => arr.reduce((a, b) => a + (Number(b) || 0), 0);

export function buildOmset(stands, docs, dates) {
  const map = Object.fromEntries(docs.map((d) => [d.date, d.entries || {}]));
  const sorted = [...stands].sort(byOrder);
  const header = ["Stand", ...dates.map(ddmm), "Total"];
  const rowOf = (label, list) => {
    const vals = dates.map((d) => sum(list.map((s) => map[d]?.[s.id]?.omset)));
    return [label, ...vals, sum(vals)];
  };
  const rows = sorted.map((s) => rowOf(s.omset_name || s.form_name, [s]));
  const totals = [
    rowOf("Total AMK", sorted.filter((s) => s.category === "AMK")),
    rowOf("Total AMKopi", sorted.filter((s) => s.category === "AMKOPI")),
    rowOf("Grand Total", sorted),
  ];
  return { header, rows, totals };
}

export function buildPercup(stands, items, docs, dates) {
  const map = Object.fromEntries(docs.map((d) => [d.date, d.entries || {}]));
  const sorted = [...stands].sort(byOrder);
  const header = ["Stand", "Item", ...dates.map(ddmm), "Total"];
  const rowOf = (label, item, list) => {
    const vals = dates.map((d) => sum(list.map((s) => map[d]?.[s.id]?.cups?.[item.id])));
    return [label, item.name, ...vals, sum(vals)];
  };
  const rows = [];
  sorted.forEach((s) => items.forEach((it) => rows.push(rowOf(s.percup_name || s.form_name, it, [s]))));
  const totals = [];
  [["Total AMK", "AMK"], ["Total AMKopi", "AMKOPI"]].forEach(([label, cat]) =>
    items.forEach((it) => totals.push(rowOf(label, it, sorted.filter((s) => s.category === cat))))
  );
  return { header, rows, totals };
}

export function buildSpg(stands, docs, dates) {
  const map = Object.fromEntries(docs.map((d) => [d.date, d.entries || {}]));
  const sorted = [...stands].filter((s) => s.is_active_input).sort(byOrder);
  const header = ["Stand", ...dates.map(ddmm)];
  const rows = sorted.map((s) => [
    s.form_name,
    ...dates.map((d) => (map[d]?.[s.id]?.spg || []).filter((x) => x && x.trim()).join(", ")),
  ]);
  return { header, rows, totals: [] };
}

export function exportXlsx(matrices, filename) {
  const wb = XLSX.utils.book_new();
  matrices.forEach(({ name, data }) => {
    const ws = XLSX.utils.aoa_to_sheet([data.header, ...data.rows, ...data.totals]);
    ws["!cols"] = data.header.map((_, i) => ({ wch: i === 0 ? 16 : 11 }));
    XLSX.utils.book_append_sheet(wb, ws, name);
  });
  XLSX.writeFile(wb, filename);
}
