import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import StandCard from "@/components/StandCard";
import { fmt } from "@/lib/format";
import { computeTotals } from "@/lib/wa";

const Stat = ({ label, value, testid }) => (
  <div className="min-w-0">
    <p className="label-text">{label}</p>
    <p data-testid={testid} className="tnum font-bold text-[15px] text-[#1D1D1F] truncate">{value}</p>
  </div>
);

export default function InputTab({ stands, items, daily, visible, spgNames }) {
  const { entries, update, saveNow, status, loading } = daily;
  const inputStands = stands.filter((s) => s.is_active_input);
  const t = computeTotals(stands, items, entries);
  const filled = inputStands.filter((s) => Number(entries[s.id]?.omset) > 0).length;

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
        visible.map((s) => <StandCard key={s.id} stand={s} items={items} entry={entries[s.id]} onChange={update} />)
      )}
      <div className="fixed bottom-[76px] inset-x-0 z-40 pointer-events-none">
        <div className="max-w-2xl mx-auto px-4 flex justify-end">
          <button data-testid="save-now-button" onClick={onSave} disabled={status === "syncing" || loading} className="btn-primary pointer-events-auto shadow-lg rounded-full px-5">
            {status === "syncing" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Simpan Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}
