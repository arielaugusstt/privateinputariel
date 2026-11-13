import { useEffect, useState, useCallback } from "react";
import { Plus, Database, Eraser, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api, errMsg } from "@/lib/api";
import { slug } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { ItemDialog, StandDialog } from "@/components/MasterDialogs";
import { Section, Row } from "@/components/SettingsUI";
import { SpgMasterSection, PivotRowsSection } from "@/components/MasterLists";

const dropCleanDraft = (d) => {
  try {
    if (!JSON.parse(localStorage.getItem(`amk_draft_${d}`) || "null")?.dirty) localStorage.removeItem(`amk_draft_${d}`);
  } catch {
    localStorage.removeItem(`amk_draft_${d}`);
  }
};

export default function SettingsTab({ stands, items, spgMaster, pivotRows, reloadMaster, onDataChanged }) {
  const { user, logout } = useAuth();
  const [editItem, setEditItem] = useState(null);
  const [editStand, setEditStand] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [dummy, setDummy] = useState({ dummy_days: 0 });
  const [busy, setBusy] = useState(false);

  const loadDummy = useCallback(() => api.get("/dummy/status").then((r) => setDummy(r.data)).catch(() => {}), []);
  useEffect(() => {
    loadDummy();
  }, [loadDummy]);

  const run = async (fn, okMsg) => {
    setBusy(true);
    try {
      await fn();
      toast.success(okMsg);
    } catch (e) {
      toast.error(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const saveItem = (f) => run(async () => {
    const { id, ...body } = f;
    if (id) await api.put(`/items/${id}`, body);
    else await api.post("/items", body);
    setEditItem(null);
    await reloadMaster();
  }, "Item disimpan");

  const saveStand = (f) => run(async () => {
    const { id, ...body } = f;
    if (id) await api.put(`/stands/${id}`, body);
    else await api.post("/stands", body);
    setEditStand(null);
    await reloadMaster();
  }, "Stand disimpan");

  const doConfirm = () => {
    const c = confirm;
    setConfirm(null);
    if (c.kind === "custom") run(c.fn, `${c.name} dihapus`);
    if (c.kind === "item") run(async () => { await api.delete(`/items/${c.id}`); await reloadMaster(); }, "Item dihapus");
    if (c.kind === "stand") run(async () => { await api.delete(`/stands/${c.id}`); await reloadMaster(); }, "Stand dihapus");
    if (c.kind === "clear") run(async () => {
      const { data } = await api.delete("/dummy");
      (dummy.dates || []).forEach(dropCleanDraft);
      await loadDummy();
      onDataChanged();
      toast.message(`${data.deleted_days} hari data dummy dihapus`);
    }, "Data dummy dibersihkan");
  };

  const generate = () => run(async () => {
    const { data } = await api.post("/dummy/generate");
    (await api.get("/dummy/status")).data.dates.forEach(dropCleanDraft);
    await loadDummy();
    onDataChanged();
    toast.message(`${data.created_days} hari data dummy dibuat`);
  }, "Data dummy siap");

  return (
    <div className="space-y-4 fade-up">
      <Section title="Data Dummy">
        <div className="p-4 space-y-3">
          <p className="text-sm text-[#6E6E73]">
            <span data-testid="dummy-days-count" className="tnum font-semibold text-[#1D1D1F]">{dummy.dummy_days}</span> hari berisi data contoh. Data yang Anda isi sendiri tidak ikut terhapus.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button data-testid="btn-generate-dummy" disabled={busy} onClick={generate} className="btn-secondary">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />} Buat 7 Hari
            </button>
            <button data-testid="btn-clear-dummy" disabled={busy || !dummy.dummy_days} onClick={() => setConfirm({ kind: "clear" })} className="btn-primary">
              <Eraser className="w-4 h-4" /> Hapus Semua Dummy
            </button>
          </div>
        </div>
      </Section>

      <Section title={`Item Cup (${items.length})`} action={<button data-testid="btn-add-item" onClick={() => setEditItem({})} className="btn-chip"><Plus className="w-3.5 h-3.5" /> Tambah</button>}>
        {items.map((it) => (
          <Row key={it.id} testid={`item-row-${slug(it.name)}`} title={it.name} meta={`Kode WA: ${it.code_wa || "-"} · Urutan ${it.sort_order} · ${it.is_active ? "Aktif" : "Nonaktif"}`} onEdit={() => setEditItem(it)} onDelete={() => setConfirm({ kind: "item", id: it.id, name: it.name })} />
        ))}
      </Section>

      <Section title={`Stand (${stands.length})`} action={<button data-testid="btn-add-stand" onClick={() => setEditStand({ input_order: stands.length + 1 })} className="btn-chip"><Plus className="w-3.5 h-3.5" /> Tambah</button>}>
        {stands.map((s) => (
          <Row
            key={s.id}
            testid={`stand-row-${slug(s.form_name)}`}
            title={`${s.input_order}. ${s.form_name}`}
            meta={`${s.category === "AMKOPI" ? "AMKopi" : "AMK"} · WA: ${s.wa_group ? `G${s.wa_group}#${s.wa_order} ${s.wa_name}` : "—"}${s.is_active_input ? "" : " · tidak di form"}${s.show_csedang_wa ? " · Csdng" : ""}`}
            onEdit={() => setEditStand(s)}
            onDelete={() => setConfirm({ kind: "stand", id: s.id, name: s.form_name })}
          />
        ))}
      </Section>

      <SpgMasterSection spgMaster={spgMaster} run={run} busy={busy} reload={reloadMaster} askDelete={(name, fn) => setConfirm({ kind: "custom", name, fn })} />
      <PivotRowsSection pivotRows={pivotRows} stands={stands} run={run} busy={busy} reload={reloadMaster} askDelete={(name, fn) => setConfirm({ kind: "custom", name, fn })} />

      <Section title="Akun">
        <div className="p-4 flex items-center justify-between gap-3">
          <p data-testid="account-email" className="text-sm text-[#1D1D1F] truncate">{user?.email}</p>
          <button data-testid="btn-logout" onClick={logout} className="btn-secondary"><LogOut className="w-4 h-4" /> Keluar</button>
        </div>
      </Section>

      <ItemDialog item={editItem} busy={busy} onClose={() => setEditItem(null)} onSave={saveItem} />
      <StandDialog stand={editStand} busy={busy} stands={stands} onClose={() => setEditStand(null)} onSave={saveStand} />
      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent data-testid="confirm-dialog" className="rounded-2xl max-w-sm">
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm?.kind === "clear" ? "Hapus semua data dummy?" : `Hapus ${confirm?.name}?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm?.kind === "clear" ? `${dummy.dummy_days} hari data contoh akan dihapus permanen. Data asli Anda tetap aman.` : "Tindakan ini tidak bisa dibatalkan."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="confirm-cancel">Batal</AlertDialogCancel>
            <AlertDialogAction data-testid="confirm-ok" onClick={doConfirm} className="bg-black hover:bg-[#1D1D1F]">Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
