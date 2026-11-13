import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import StandCard from "@/components/StandCard";
import { fmt } from "@/lib/format";
import { computeTotals } from "@/lib/wa";

const Stat = ({ label, value, testid }) => (
  <div className="min-w-0">
    <p className="label-text">{label}</p>
    <p data-testid={testid} className="tnum font-bold text-[13px] sm:text-[15px] text-[#1D1D1F] truncate">{value}</p>
  </div>
);

export default function InputTab({ stands, items, daily, visible, spgNames }) {
  const { entries, update, saveNow, status, loading } = daily;
  const inputStands = stands.filter((s) => s.is_active_input);
  const t = computeTotals(stands, items, entries);
  const filled = inputStands.filter((s) => Number(entries[s.id]?.omset) > 0).length;
  const byId = Object.fromEntries(stands.map((s) => [s.id, s]));
  const totOmset = stands.reduce((a, s) => a + (Number(entries[s.id]?.omset) || 0), 0);
  const totQris = stands.reduce((a, s) => a + (Number(entries[s.id]?.qris) || 0), 0);
  const totSisa = totOmset - totQris;

  const onSave = async () => {
    const ok = await saveNow();
    if (ok) toast.success("Tersimpan ke server");
    else toast.error("Gagal sinkron. Data aman di HP, akan dicoba lagi.");
  };

  return (
    <div className="space-y-3">
      <datalist id="spg-names">
        {spgNames.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>
      <section className="grid grid-cols-3 gap-3 bg-white rounded-2xl border border-[#D2D2D7]/80 p-4 fade-up">
        <Stat label="Total AMK" value={fmt(t.amk)} testid="summary-total-amk" />
        <Stat label="Total AMKopi" value={fmt(t.amkopi)} testid="summary-total-amkopi" />
        <Stat label="Terisi" value={`${filled}/${inputStands.length}`} testid="summary-filled-count" />
      </section>
      {loading && Object.keys(entries).length === 0 ? (
        <div className="flex items-center justify-center py-16 text-sm text-[#6E6E73] gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Memuat data…
        </div>
      ) : visible.length === 0 ? (
        <p data-testid="input-empty-state" className="text-center text-sm text-[#6E6E73] py-14">Semua stand di filter ini sudah terisi.</p>
      ) : (
        visible.map((s) => (
          <StandCard
            key={s.id}
            stand={s}
            items={items}
            entry={entries[s.id]}
            onChange={update}
            parent={byId[s.parent_stand_id]}
            parentEntry={entries[s.parent_stand_id]}
          />
        ))
      )}
      <div className="fixed bottom-[68px] inset-x-0 z-40 backdrop-blur-md bg-white/85 border-t border-[#D2D2D7]/70">
        <div className="max-w-2xl mx-auto px-4 py-2 flex items-center gap-3">
          <div className="grid grid-cols-3 gap-2 flex-1 min-w-0">
            <Stat label="Omset Harian" value={fmt(totOmset)} testid="summary-total-omset" />
            <Stat label="QRIS Harian" value={fmt(totQris)} testid="summary-total-qris" />
            <Stat label="Sisa Tunai" value={totSisa < 0 ? `-${fmt(-totSisa)}` : fmt(totSisa)} testid="summary-total-sisa" />
          </div>
          <button data-testid="save-now-button" onClick={onSave} disabled={status === "syncing" || loading} className="btn-primary rounded-full px-4 shrink-0" aria-label="Simpan Sekarang">
            {status === "syncing" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span className="hidden sm:inline">Simpan Sekarang</span>
            <span className="sm:hidden">Simpan</span>
          </button>
        </div>
      </div>
    </div>
  );
}
