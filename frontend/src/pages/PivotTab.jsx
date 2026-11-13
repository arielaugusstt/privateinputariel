import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Copy, Download, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api, errMsg } from "@/lib/api";
import { todayStr, dateRange, fmt } from "@/lib/format";
import { buildPercup, exportXlsx } from "@/lib/pivot";
import { buildFinance, buildSal, buildSpgDetail, toTsv } from "@/lib/finance";
import { copyText } from "@/pages/WaTab";

const MAX_DAYS = 366;

const MODES = [
  { id: "omset", label: "OMSET", sheet: "OMSET" },
  { id: "qris", label: "QRIS", sheet: "QRIS" },
  { id: "sisa", label: "SISA TUNAI", sheet: "SISA TUNAI" },
  { id: "percup", label: "PERCUP", sheet: "PERCUP" },
  { id: "sal", label: "SAL / GAJI", sheet: "SAL" },
];

const monthStart = () => `${todayStr().slice(0, 8)}01`;
const monthEnd = () => {
  const [y, m] = todayStr().split("-").map(Number);
  return `${todayStr().slice(0, 8)}${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`;
};

const Matrix = ({ data, textCells }) => (
  <div className="bg-white rounded-2xl border border-[#D2D2D7]/80 overflow-hidden">
    <div className="overflow-auto max-h-[60vh]">
      <table data-testid="pivot-table" className="w-full text-xs tnum border-collapse">
        <thead className="sticky top-0 bg-[#F5F5F7] z-10">
          <tr>
            {data.header.map((h, i) => (
              <th key={i} className={`px-3 py-2 font-semibold text-[#1D1D1F] border-b border-[#D2D2D7] whitespace-nowrap ${i === 0 ? "text-left sticky left-0 bg-[#F5F5F7]" : "text-right"}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...data.rows, ...data.totals].map((row, ri) => {
            const isTotal = ri >= data.rows.length;
            return (
              <tr key={ri} className={isTotal ? "bg-[#F5F5F7] font-bold" : "hover:bg-[#F5F5F7]/60"}>
                {row.map((c, ci) => (
                  <td key={ci} className={`px-3 py-1.5 border-b border-[#E5E5EA] whitespace-nowrap ${ci === 0 ? `text-left sticky left-0 font-medium ${isTotal ? "bg-[#F5F5F7]" : "bg-white"}` : textCells ? "text-left text-[#1D1D1F]" : "text-right"}`}>
                    {typeof c === "number" ? (c ? (c < 0 ? `-${fmt(-c)}` : fmt(c)) : <span className="text-[#C7C7CC]">0</span>) : c}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </div>
);

export default function PivotTab({ stands, items, spgMaster, pivotRows }) {
  const [start, setStart] = useState(monthStart());
  const [end, setEnd] = useState(monthEnd());
  const [docs, setDocs] = useState([]);
  const [mode, setMode] = useState("omset");
  const [salView, setSalView] = useState("gaji");
  const [loading, setLoading] = useState(false);
  const reqId = useRef(0);
  const valid = !!start && !!end && start <= end && dateRange(start, end).length <= MAX_DAYS;

  const load = useCallback(async () => {
    const id = ++reqId.current;
    setDocs([]);
    if (!valid) return;
    setLoading(true);
    try {
      const { data } = await api.get("/daily-inputs", { params: { start, end } });
      if (id === reqId.current) setDocs(data);
    } catch (e) {
      if (id === reqId.current) toast.error(errMsg(e));
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [start, end, valid]);

  useEffect(() => {
    load();
  }, [load]);

  const dates = useMemo(() => (valid ? dateRange(start, end) : []), [start, end, valid]);
  const m = useMemo(
    () => ({
      omset: buildFinance(pivotRows, docs, dates, "omset"),
      qris: buildFinance(pivotRows, docs, dates, "qris"),
      sisa: buildFinance(pivotRows, docs, dates, "sisa"),
      percup: buildPercup(stands, items, docs, dates),
      sal: buildSal(stands, spgMaster, docs, dates),
      spgDetail: buildSpgDetail(stands, docs, dates),
    }),
    [stands, items, docs, dates, spgMaster, pivotRows]
  );
  const current = mode === "sal" && salView === "stand" ? m.spgDetail : m[mode];

  const onExport = () => {
    exportXlsx(
      [...MODES.map((x) => ({ name: x.sheet, data: m[x.id] })), { name: "SPG PER STAND", data: m.spgDetail }],
      `AMK_Pivot_${start}_${end}.xlsx`
    );
    toast.success("File Excel diunduh");
  };

  const onCopyTsv = async () => {
    if (await copyText(toTsv(current))) toast.success("Tersalin. Tempel di Google Sheets.");
    else toast.error("Gagal menyalin");
  };

  return (
    <div className="space-y-3 fade-up">
      <section className="bg-white rounded-2xl border border-[#D2D2D7]/80 p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <label>
            <span className="label-text">Dari</span>
            <input data-testid="pivot-start-date" type="date" value={start} onChange={(e) => setStart(e.target.value)} className="field mt-1 tnum" />
          </label>
          <label>
            <span className="label-text">Sampai</span>
            <input data-testid="pivot-end-date" type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="field mt-1 tnum" />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button data-testid="pivot-refresh-button" onClick={load} className="btn-secondary">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Muat Ulang
          </button>
          <button data-testid="btn-export-excel" onClick={onExport} disabled={loading || !valid} className="btn-primary">
            <Download className="w-4 h-4" /> Excel (.xlsx)
          </button>
        </div>
        {!valid && <p data-testid="pivot-range-error" className="text-xs font-semibold text-[#1D1D1F]">Rentang tidak valid: isi kedua tanggal, awal ≤ akhir, maksimal {MAX_DAYS} hari.</p>}
        <p className="text-[11px] text-[#6E6E73]">{dates.length} hari · {docs.length} hari berisi data · sheet: OMSET, QRIS, SISA TUNAI, PERCUP, SAL, SPG PER STAND</p>
      </section>
      <div className="grid grid-cols-5 gap-1 p-1 bg-[#E8E8ED] rounded-xl">
        {MODES.map((x) => (
          <button key={x.id} data-testid={`pivot-mode-${x.id}`} onClick={() => setMode(x.id)} className={`py-1.5 rounded-lg text-[10.5px] font-semibold leading-tight transition-colors ${mode === x.id ? "bg-white text-black shadow-sm" : "text-[#6E6E73]"}`}>
            {x.label}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {mode === "sal" && (
          <div className="flex p-1 bg-[#E8E8ED] rounded-xl">
            {[["gaji", "Tabel Gaji SPG"], ["stand", "Tampilan Per Stand"]].map(([id, label]) => (
              <button key={id} data-testid={`sal-view-${id}`} onClick={() => setSalView(id)} className={`flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${salView === id ? "bg-white text-black shadow-sm" : "text-[#6E6E73]"}`}>
                {label}
              </button>
            ))}
          </div>
        )}
        <button data-testid="btn-copy-tsv" onClick={onCopyTsv} disabled={!valid} className="btn-secondary w-full">
          <Copy className="w-4 h-4" /> Copy untuk Google Sheets (TSV)
        </button>
      </div>
      <Matrix data={current} textCells={mode === "sal"} />
    </div>
  );
}
