import { useEffect, useMemo, useState, useCallback } from "react";
import { Download, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api, errMsg } from "@/lib/api";
import { addDays, todayStr, dateRange, fmt } from "@/lib/format";
import { buildOmset, buildPercup, buildSpg, exportXlsx } from "@/lib/pivot";

const MODES = [
  { id: "omset", label: "Omset" },
  { id: "percup", label: "Percup" },
  { id: "spg", label: "SPG" },
];

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
                    {typeof c === "number" ? (c ? fmt(c) : <span className="text-[#C7C7CC]">0</span>) : c}
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

export default function PivotTab({ stands, items }) {
  const [start, setStart] = useState(addDays(todayStr(), -6));
  const [end, setEnd] = useState(todayStr());
  const [docs, setDocs] = useState([]);
  const [mode, setMode] = useState("omset");
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (start > end) return toast.error("Tanggal awal harus sebelum tanggal akhir");
    setLoading(true);
    try {
      const { data } = await api.get("/daily-inputs", { params: { start, end } });
      setDocs(data);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  useEffect(() => {
    load();
  }, [load]);

  const dates = useMemo(() => (start <= end ? dateRange(start, end) : []), [start, end]);
  const m = useMemo(
    () => ({ omset: buildOmset(stands, docs, dates), percup: buildPercup(stands, items, docs, dates), spg: buildSpg(stands, docs, dates) }),
    [stands, items, docs, dates]
  );

  const onExport = () => {
    exportXlsx(
      [{ name: "Omset", data: m.omset }, { name: "Percup", data: m.percup }, { name: "SPG", data: m.spg }],
      `AMK_Pivot_${start}_${end}.xlsx`
    );
    toast.success("File Excel diunduh");
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
          <button data-testid="btn-export-excel" onClick={onExport} disabled={loading} className="btn-primary">
            <Download className="w-4 h-4" /> Export Excel
          </button>
        </div>
        <p className="text-[11px] text-[#6E6E73]">{dates.length} hari · {docs.length} hari berisi data · 1 file, 3 sheet (Omset, Percup, SPG)</p>
      </section>
      <div className="flex p-1 bg-[#E8E8ED] rounded-xl">
        {MODES.map((x) => (
          <button key={x.id} data-testid={`pivot-mode-${x.id}`} onClick={() => setMode(x.id)} className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${mode === x.id ? "bg-white text-black shadow-sm" : "text-[#6E6E73]"}`}>
            {x.label}
          </button>
        ))}
      </div>
      <Matrix data={m[mode]} textCells={mode === "spg"} />
    </div>
  );
}
