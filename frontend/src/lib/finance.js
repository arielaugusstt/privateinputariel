import { ddmm } from "./format";

const entriesMap = (docs) => Object.fromEntries(docs.map((d) => [d.date, d.entries || {}]));

export const dayLabel = (dates) => {
  const oneMonth = dates.length > 0 && dates[0].slice(0, 7) === dates[dates.length - 1].slice(0, 7);
  return (d) => (oneMonth ? String(Number(d.slice(8))) : ddmm(d));
};

// one month -> fixed columns 1..31 like omset.pdf; otherwise the actual dates
const financeColumns = (dates) => {
  const oneMonth = dates.length > 0 && dates[0].slice(0, 7) === dates[dates.length - 1].slice(0, 7);
  if (!oneMonth) return dates.map((d) => ({ label: ddmm(d), date: d }));
  const ym = dates[0].slice(0, 7);
  const inRange = new Set(dates);
  return Array.from({ length: 31 }, (_, i) => {
    const d = `${ym}-${String(i + 1).padStart(2, "0")}`;
    return { label: String(i + 1), date: inRange.has(d) ? d : null };
  });
};

const FIELD = {
  omset: (e) => Number(e.omset) || 0,
  qris: (e) => Number(e.qris) || 0,
  sisa: (e) => (Number(e.omset) || 0) - (Number(e.qris) || 0),
};

export function buildFinance(pivotRows, docs, dates, field) {
  const map = entriesMap(docs);
  const get = FIELD[field];
  const cols = financeColumns(dates);
  const header = ["", ...cols.map((c) => c.label)];
  const rows = pivotRows.map((r) => [
    r.label,
    ...cols.map((c) => {
      const e = r.stand_id && c.date ? map[c.date]?.[r.stand_id] : null;
      return e ? get(e) : "";
    }),
  ]);
  return { header, rows, totals: [] };
}

const effectiveSpg = (stand, dayEntries) => {
  const src = stand.category === "AMKOPI" && stand.parent_stand_id ? stand.parent_stand_id : stand.id;
  return [0, 1, 2].map((i) => dayEntries?.[src]?.spg?.[i] || "");
};

export function buildSal(stands, spgMaster, docs, dates) {
  const map = entriesMap(docs);
  const lbl = dayLabel(dates);
  const mains = stands.filter((s) => s.category !== "AMKOPI");
  const cells = {};
  const found = new Set();
  dates.forEach((d) => {
    mains.forEach((s) => {
      (map[d]?.[s.id]?.spg || []).filter(Boolean).forEach((name) => {
        found.add(name);
        const k = `${d}|${name}`;
        cells[k] = cells[k] ? `${cells[k]}/${s.wa_name}` : s.wa_name;
      });
    });
  });
  const master = spgMaster.filter((m) => m.is_active).map((m) => m.name);
  const names = [...master, ...[...found].filter((n) => !master.includes(n)).sort()];
  const header = ["TGL", ...names];
  const rows = dates.map((d) => [lbl(d), ...names.map((n) => cells[`${d}|${n}`] || "-")]);
  const shifts = names.map((n) => dates.filter((d) => cells[`${d}|${n}`]).length);
  return { header, rows, totals: [["TOTAL HADIR (SHIFT)", ...shifts]] };
}

export function buildSpgDetail(stands, docs, dates) {
  const map = entriesMap(docs);
  const lbl = dayLabel(dates);
  const list = stands.filter((s) => s.is_active_input).sort((a, b) => a.input_order - b.input_order);
  const header = ["STAND", "POSISI", ...dates.map(lbl)];
  const rows = [];
  list.forEach((s) => [0, 1, 2].forEach((i) => rows.push([s.form_name, `SPG ${i + 1}`, ...dates.map((d) => effectiveSpg(s, map[d])[i])])));
  return { header, rows, totals: [] };
}

export const toTsv = (data) =>
  [data.header, ...data.rows, ...data.totals].map((r) => r.map((c) => String(c ?? "").replace(/[\t\n]/g, " ")).join("\t")).join("\n");
