import { useCallback, useEffect, useState } from "react";
import { Upload, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api, errMsg } from "@/lib/api";
import { Section } from "@/components/SettingsUI";

export default function ImportNovember({ onDone }) {
  const [status, setStatus] = useState(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => api.get("/import/nov-2026").then((r) => setStatus(r.data)).catch(() => {}), []);
  useEffect(() => {
    load();
  }, [load]);

  const run = async () => {
    setOpen(false);
    setBusy(true);
    try {
      const { data } = await api.post("/import/nov-2026");
      toast.success(`${data.imported_days} hari diimpor${data.new_spg.length ? ` · SPG baru: ${data.new_spg.join(", ")}` : ""}`);
      await load();
      await onDone();
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const existing = status?.existing_real_dates || [];
  return (
    <Section title="Impor Data November 2026">
      <div className="p-4 space-y-3">
        <p className="text-sm text-[#6E6E73]">
          Mengisi omset, cup dan SPG tanggal <b className="text-[#1D1D1F]">3–21 November</b> (19 hari, QRIS 0). Tanggal 1 & 2 November tidak disentuh.
        </p>
        {status?.imported_at && (
          <p data-testid="import-nov-done" className="flex items-center gap-1.5 text-xs font-semibold text-[#1D1D1F]">
            <CheckCircle2 className="w-4 h-4" /> Sudah diimpor {new Date(status.imported_at).toLocaleString("id-ID")}
          </p>
        )}
        <button data-testid="btn-import-nov" disabled={busy || !status} onClick={() => setOpen(true)} className="btn-primary w-full">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {status?.imported_at ? "Impor Ulang 3–21 Nov" : "Impor Data 3–21 Nov"}
        </button>
      </div>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent data-testid="import-nov-dialog" className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Impor data 3–21 November?</AlertDialogTitle>
            <AlertDialogDescription>
              {existing.length
                ? `${existing.length} tanggal di rentang ini sudah berisi data dan akan diganti dengan data impor. Tanggal 1 & 2 November tetap aman.`
                : "19 hari data akan ditambahkan. Tanggal 1 & 2 November tetap aman."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="import-nov-cancel">Batal</AlertDialogCancel>
            <AlertDialogAction data-testid="import-nov-confirm" onClick={run} className="bg-black hover:bg-[#1D1D1F]">Impor</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Section>
  );
}
