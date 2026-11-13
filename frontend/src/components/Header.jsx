import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { addDays, longDate } from "@/lib/format";

const FILTERS = [
  { id: "all", label: "Semua" },
  { id: "AMK", label: "AMK" },
  { id: "AMKOPI", label: "AMKopi" },
  { id: "empty", label: "Belum Diisi" },
];

export const StatusPill = ({ status }) => {
  const synced = status === "synced";
  return (
    <span
      data-testid="sync-status-pill"
      data-status={status}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap transition-colors duration-300 ${
        synced ? "bg-black text-white" : "bg-[#F2F2F7] text-[#1D1D1F] border border-[#D2D2D7]"
      }`}
    >
      {status === "syncing" ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <span className={`w-2 h-2 rounded-full ${synced ? "bg-white" : "bg-white border border-[#1D1D1F]"}`} />
      )}
      {synced ? "Tersinkronisasi Server" : status === "syncing" ? "Menyinkronkan…" : "Tersimpan di HP (Draft Lokal)"}
    </span>
  );
};

export default function Header({ title, date, setDate, status, filter, setFilter, counts }) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-white/80 border-b border-[#D2D2D7]/70">
      <div className="max-w-2xl mx-auto px-4 pt-3 pb-3 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#6E6E73]">AMK Engine</p>
            <h1 className="text-lg font-bold tracking-tight text-[#1D1D1F] truncate">{title}</h1>
          </div>
          {status && <StatusPill status={status} />}
        </div>
        {setDate && (
          <div className="flex items-center gap-2">
            <button data-testid="date-prev-button" onClick={() => setDate(addDays(date, -1))} className="icon-btn" aria-label="Hari sebelumnya">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <label className="relative flex-1">
              <span className="field flex items-center justify-between tnum font-semibold">
                {longDate(date)}
                <span className="text-[11px] text-[#6E6E73] font-medium">Ganti</span>
              </span>
              <input data-testid="date-picker-input" type="date" value={date} onChange={(e) => e.target.value && setDate(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full" />
            </label>
            <button data-testid="date-next-button" onClick={() => setDate(addDays(date, 1))} className="icon-btn" aria-label="Hari berikutnya">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
        {setFilter && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                data-testid={`filter-chip-${f.id.toLowerCase()}`}
                onClick={() => setFilter(f.id)}
                className={filter === f.id ? "chip chip-active" : "chip"}
              >
                {f.label}
                <span className="tnum opacity-60 ml-1">{counts?.[f.id] ?? 0}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
