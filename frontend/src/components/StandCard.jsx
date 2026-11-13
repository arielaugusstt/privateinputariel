import { memo } from "react";
import { Check, Lock } from "lucide-react";
import { fmt, parseDigits, slug } from "@/lib/format";

const MoneyInput = ({ testid, value, onChange, large }) => (
  <label className="relative block">
    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#8E8E93]">Rp</span>
    <input
      data-testid={testid}
      inputMode="numeric"
      placeholder="0"
      value={value ? fmt(value) : ""}
      onChange={(ev) => onChange(parseDigits(ev.target.value))}
      className={`field pl-9 text-right font-semibold ${large ? "text-base" : ""}`}
    />
  </label>
);

function StandCard({ stand, items, entry, onChange, parent, parentEntry }) {
  const sid = slug(stand.form_name);
  const e = entry || { omset: 0, qris: 0, cups: {}, spg: ["", "", ""] };
  const filled = Number(e.omset) > 0;
  const sisa = (Number(e.omset) || 0) - (Number(e.qris) || 0);
  const inherits = stand.category === "AMKOPI";
  const inherited = (parentEntry?.spg || []).filter(Boolean);
  const setCup = (id, v) => onChange(stand.id, (c) => ({ cups: { ...c.cups, [id]: parseDigits(v) } }));
  const setSpg = (i, v, trim) =>
    onChange(stand.id, (c) => {
      const spg = [...(c.spg || ["", "", ""])];
      const up = v.toUpperCase().replace(/\s+/g, " ");
      spg[i] = trim ? up.trim() : up.replace(/^\s+/, "");
      return { spg };
    });

  return (
    <article data-testid={`stand-card-${sid}`} className="bg-white rounded-2xl border border-[#D2D2D7]/80 p-4 space-y-3 transition-colors duration-200 hover:border-black/40 focus-within:border-black">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 min-w-0 shrink-0 w-[42%]">
          <span className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center border ${filled ? "bg-black border-black" : "border-[#D2D2D7]"}`}>
            {filled && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-[15px] text-[#1D1D1F] truncate leading-tight">{stand.form_name}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8E8E93]">{stand.category === "AMKOPI" ? "AMKopi" : "AMK"}</p>
          </div>
        </div>
        <div className="flex-1">
          <MoneyInput testid={`input-omset-${sid}`} value={e.omset} onChange={(v) => onChange(stand.id, () => ({ omset: v }))} large />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {items.map((it) => (
          <label key={it.id} className="block">
            <span className="label-text">{it.name}</span>
            <input
              data-testid={`input-cup-${slug(it.name)}-${sid}`}
              inputMode="numeric"
              placeholder="0"
              value={e.cups?.[it.id] ? String(e.cups[it.id]) : ""}
              onChange={(ev) => setCup(it.id, ev.target.value)}
              className="field mt-1 text-center"
            />
          </label>
        ))}
      </div>
      {inherits ? (
        <div data-testid={`spg-inherited-${sid}`} className="flex items-center gap-2 rounded-xl border border-dashed border-[#D2D2D7] bg-[#F5F5F7] px-3 py-2">
          <Lock className="w-3.5 h-3.5 shrink-0 text-[#6E6E73]" />
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6E6E73]">SPG Mengikuti Stand Utama{parent ? ` · ${parent.form_name}` : ""}</p>
            <p className="text-xs font-semibold text-[#1D1D1F] truncate">{parent ? inherited.join(" · ") || "Belum diisi" : "Stand utama belum diatur di Settings"}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <input
              key={i}
              data-testid={`input-spg${i + 1}-${sid}`}
              list="spg-names"
              placeholder={`SPG ${i + 1}`}
              value={e.spg?.[i] || ""}
              onChange={(ev) => setSpg(i, ev.target.value)}
              onBlur={(ev) => setSpg(i, ev.target.value, true)}
              className="field text-xs py-1.5 uppercase"
            />
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#F2F2F7]">
        <div>
          <span className="label-text">QRIS (Rp)</span>
          <div className="mt-1">
            <MoneyInput testid={`input-qris-${sid}`} value={e.qris} onChange={(v) => onChange(stand.id, () => ({ qris: v }))} />
          </div>
        </div>
        <div>
          <span className="label-text">Sisa Tunai (Rp)</span>
          <p data-testid={`sisa-tunai-${sid}`} className="mt-1 rounded-xl bg-black text-white px-3 py-2 text-sm text-right font-semibold tnum">
            {sisa < 0 ? `-${fmt(-sisa)}` : fmt(sisa)}
          </p>
        </div>
      </div>
    </article>
  );
}

export default memo(StandCard);
