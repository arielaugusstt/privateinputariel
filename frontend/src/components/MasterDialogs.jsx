import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Field = ({ label, children }) => (
  <label className="block">
    <span className="label-text">{label}</span>
    <div className="mt-1">{children}</div>
  </label>
);

const Toggle = ({ label, checked, onChange, testid }) => (
  <label className="flex items-center justify-between py-1.5 cursor-pointer">
    <span className="text-sm text-[#1D1D1F]">{label}</span>
    <input data-testid={testid} type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} className="w-5 h-5 accent-black" />
  </label>
);

function FormDialog({ open, onClose, title, onSubmit, children, testid }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent data-testid={testid} className="max-w-md rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-3">
          {children}
          <div className="grid grid-cols-2 gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
            <button data-testid={`${testid}-save`} type="submit" className="btn-primary">Simpan</button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

const EMPTY_ITEM = { name: "", code_wa: "", sort_order: 0, is_active: true };

export function ItemDialog({ item, onClose, onSave }) {
  const [f, setF] = useState(EMPTY_ITEM);
  useEffect(() => {
    if (item) setF({ ...EMPTY_ITEM, ...item });
  }, [item]);
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <FormDialog open={!!item} onClose={onClose} title={item?.id ? "Edit Item" : "Tambah Item"} onSubmit={() => onSave(f)} testid="item-dialog">
      <Field label="Nama (mis. 12oz)"><input data-testid="item-name-input" required className="field" value={f.name} onChange={(e) => set("name")(e.target.value)} /></Field>
      <Field label="Kode WA (Ck / Cb / Csdng)"><input data-testid="item-code-input" className="field" value={f.code_wa} onChange={(e) => set("code_wa")(e.target.value)} /></Field>
      <Field label="Urutan"><input data-testid="item-order-input" type="number" className="field tnum" value={f.sort_order} onChange={(e) => set("sort_order")(Number(e.target.value))} /></Field>
      <Toggle testid="item-active-toggle" label="Aktif di form input" checked={f.is_active} onChange={set("is_active")} />
    </FormDialog>
  );
}

const EMPTY_STAND = {
  form_name: "", wa_name: "", omset_name: "", percup_name: "", category: "AMK", is_active_input: true,
  input_order: 0, wa_group: null, wa_order: 0, show_csedang_wa: false, extra_wa_suffix: "", parent_stand_id: null,
};

export function StandDialog({ stand, stands = [], onClose, onSave }) {
  const [f, setF] = useState(EMPTY_STAND);
  useEffect(() => {
    if (stand) setF({ ...EMPTY_STAND, ...stand, extra_wa_suffix: stand.extra_wa_suffix || "" });
  }, [stand]);
  const set = (k) => (v) => setF((p) => ({ ...p, [k]: v }));
  const txt = (k, label, testid, required) => (
    <Field label={label}><input data-testid={testid} required={required} className="field" value={f[k]} onChange={(e) => set(k)(e.target.value)} /></Field>
  );
  const submit = () => onSave({ ...f, extra_wa_suffix: f.extra_wa_suffix || null });
  return (
    <FormDialog open={!!stand} onClose={onClose} title={stand?.id ? "Edit Stand" : "Tambah Stand"} onSubmit={submit} testid="stand-dialog">
      {txt("form_name", "Nama di Form", "stand-form-name-input", true)}
      <div className="grid grid-cols-2 gap-2">
        {txt("wa_name", "Nama di WA", "stand-wa-name-input")}
        <Field label="Kategori">
          <select data-testid="stand-category-select" className="field" value={f.category} onChange={(e) => set("category")(e.target.value)}>
            <option value="AMK">AMK</option>
            <option value="AMKOPI">AMKopi</option>
          </select>
        </Field>
        {txt("omset_name", "Nama di Pivot Omset", "stand-omset-name-input")}
        {txt("percup_name", "Nama di Pivot Percup", "stand-percup-name-input")}
        <Field label="Grup WA">
          <select data-testid="stand-wa-group-select" className="field" value={f.wa_group ?? ""} onChange={(e) => set("wa_group")(e.target.value ? Number(e.target.value) : null)}>
            <option value="">Tidak tampil</option>
            <option value="1">Grup 1</option>
            <option value="2">Grup 2</option>
            <option value="3">Grup 3</option>
          </select>
        </Field>
        <Field label="Urutan WA"><input data-testid="stand-wa-order-input" type="number" className="field tnum" value={f.wa_order} onChange={(e) => set("wa_order")(Number(e.target.value))} /></Field>
        <Field label="Urutan Form"><input data-testid="stand-input-order-input" type="number" className="field tnum" value={f.input_order} onChange={(e) => set("input_order")(Number(e.target.value))} /></Field>
        {txt("extra_wa_suffix", "Akhiran WA", "stand-suffix-input")}
      </div>
      {f.category === "AMKOPI" && (
        <Field label="SPG mengikuti stand utama">
          <select data-testid="stand-parent-select" className="field" value={f.parent_stand_id || ""} onChange={(e) => set("parent_stand_id")(e.target.value || null)}>
            <option value="">— Belum diatur —</option>
            {stands.filter((s) => s.category === "AMK").map((s) => <option key={s.id} value={s.id}>{s.form_name}</option>)}
          </select>
        </Field>
      )}
      <Toggle testid="stand-active-toggle" label="Tampil di Input Harian" checked={f.is_active_input} onChange={set("is_active_input")} />
      <Toggle testid="stand-csedang-toggle" label="Tampilkan Csdng di WA" checked={f.show_csedang_wa} onChange={set("show_csedang_wa")} />
    </FormDialog>
  );
}
