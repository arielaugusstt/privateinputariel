import { useEffect, useState } from "react";
import { Plus, ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { slug } from "@/lib/format";
import { Section, Row } from "@/components/SettingsUI";

function SimpleDialog({ open, title, onClose, onSubmit, testid, busy, children }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-testid={testid} className="max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-3">
          {children}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
            <button data-testid={`${testid}-save`} type="submit" disabled={busy} className="btn-primary">Simpan</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const L = ({ label, children }) => (
  <label className="block">
    <span className="label-text">{label}</span>
    <div className="mt-1">{children}</div>
  </label>
);

const useForm = (src, empty) => {
  const [f, setF] = useState(empty);
  useEffect(() => {
    if (src) setF({ ...empty, ...src });
  }, [src]); // eslint-disable-line react-hooks/exhaustive-deps
  return [f, (k) => (v) => setF((p) => ({ ...p, [k]: v }))];
};

export function SpgMasterSection({ spgMaster, run, reload, askDelete, busy }) {
  const [edit, setEdit] = useState(null);
  const [f, set] = useForm(edit, { name: "", sort_order: 0, is_active: true });
  const save = () => run(async () => {
    const { id, ...body } = f;
    if (id) await api.put(`/spg-master/${id}`, body);
    else await api.post("/spg-master", body);
    setEdit(null);
    await reload();
  }, "SPG disimpan");
  return (
    <Section title={`Master Daftar SPG (${spgMaster.length})`} action={<button data-testid="btn-add-spg" onClick={() => setEdit({ sort_order: spgMaster.length + 1 })} className="btn-chip"><Plus className="w-3.5 h-3.5" /> Tambah</button>}>
      {spgMaster.length === 0 && <p className="px-4 py-3 text-xs text-[#6E6E73]">Belum ada. Nama SPG di sini muncul paling atas di saran input dan menentukan urutan kolom Tabel Gaji.</p>}
      {spgMaster.map((s) => (
        <Row key={s.id} testid={`spg-row-${slug(s.name)}`} title={s.name} meta={`Urutan ${s.sort_order} · ${s.is_active ? "Aktif" : "Nonaktif"}`} onEdit={() => setEdit(s)} onDelete={() => askDelete(s.name, async () => { await api.delete(`/spg-master/${s.id}`); await reload(); })} />
      ))}
      <SimpleDialog open={!!edit} title={edit?.id ? "Edit SPG" : "Tambah SPG"} onClose={() => setEdit(null)} onSubmit={save} busy={busy} testid="spg-dialog">
        <L label="Nama SPG"><input data-testid="spg-name-input" required className="field uppercase" value={f.name} onChange={(e) => set("name")(e.target.value.toUpperCase())} /></L>
        <L label="Urutan kolom"><input data-testid="spg-order-input" type="number" className="field tnum" value={f.sort_order} onChange={(e) => set("sort_order")(Number(e.target.value))} /></L>
        <label className="flex items-center justify-between py-1.5">
          <span className="text-sm">Aktif</span>
          <input data-testid="spg-active-toggle" type="checkbox" checked={!!f.is_active} onChange={(e) => set("is_active")(e.target.checked)} className="w-5 h-5 accent-black" />
        </label>
      </SimpleDialog>
    </Section>
  );
}

export function PivotRowsSection({ pivotRows, stands, run, reload, askDelete, busy }) {
  const [edit, setEdit] = useState(null);
  const [open, setOpen] = useState(false);
  const [f, set] = useForm(edit, { label: "", stand_id: null, sort_order: 0 });
  const byId = Object.fromEntries(stands.map((s) => [s.id, s]));
  const save = () => run(async () => {
    const { id, ...body } = f;
    if (id) await api.put(`/pivot-rows/${id}`, body);
    else await api.post("/pivot-rows", body);
    setEdit(null);
    await reload();
  }, "Baris disimpan");
  return (
    <Section
      title={`Baris Pivot OMSET/QRIS/SISA (${pivotRows.length})`}
      action={
        <div className="flex gap-1.5">
          <button data-testid="btn-toggle-pivot-rows" onClick={() => setOpen((o) => !o)} className="icon-btn w-7 h-7" aria-label="Tampilkan"><ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} /></button>
          <button data-testid="btn-add-pivot-row" onClick={() => setEdit({ sort_order: pivotRows.length + 1 })} className="btn-chip"><Plus className="w-3.5 h-3.5" /> Tambah</button>
        </div>
      }
    >
      {!open && <p className="px-4 py-3 text-xs text-[#6E6E73]">Baris tetap yang sama untuk sheet OMSET, QRIS dan SISA TUNAI. Baris tanpa stand = baris placeholder (kosong).</p>}
      {open && pivotRows.map((r) => (
        <Row key={r.id} testid={`pivot-row-${slug(r.label)}`} title={`${r.sort_order}. ${r.label}`} meta={r.stand_id ? `Stand: ${byId[r.stand_id]?.form_name || "(stand terhapus)"}` : "Placeholder"} onEdit={() => setEdit(r)} onDelete={() => askDelete(r.label, async () => { await api.delete(`/pivot-rows/${r.id}`); await reload(); })} />
      ))}
      <SimpleDialog open={!!edit} title={edit?.id ? "Edit Baris" : "Tambah Baris"} onClose={() => setEdit(null)} onSubmit={save} busy={busy} testid="pivot-row-dialog">
        <L label="Label baris"><input data-testid="pivot-row-label-input" required className="field" value={f.label} onChange={(e) => set("label")(e.target.value)} /></L>
        <L label="Ambil data dari stand">
          <select data-testid="pivot-row-stand-select" className="field" value={f.stand_id || ""} onChange={(e) => set("stand_id")(e.target.value || null)}>
            <option value="">— Placeholder (kosong) —</option>
            {stands.map((s) => <option key={s.id} value={s.id}>{s.form_name}</option>)}
          </select>
        </L>
        <L label="Urutan"><input data-testid="pivot-row-order-input" type="number" className="field tnum" value={f.sort_order} onChange={(e) => set("sort_order")(Number(e.target.value))} /></L>
      </SimpleDialog>
    </Section>
  );
}
