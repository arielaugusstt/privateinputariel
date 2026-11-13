import { memo } from "react";
import { Check } from "lucide-react";
import { fmt, parseDigits, slug } from "@/lib/format";

function StandCard({ stand, items, entry, onChange }) {
  const sid = slug(stand.form_name);
  const e = entry || { omset: 0, cups: {}, spg: ["", "", ""] };
  const filled = Number(e.omset) > 0;
  const setCup = (id, v) => onChange(stand.id, (c) => ({ cups: { ...c.cups, [id]: parseDigits(v) } }));
  const setSpg = (i, v) =>
    onChange(stand.id, (c) => {
      const spg = [...(c.spg || ["", "", ""])];
      spg[i] = v;
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
        <label className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#8E8E93]">Rp</span>
          <input
            data-testid={`input-omset-${sid}`}
            inputMode="numeric"
            placeholder="0"
            value={e.omset ? fmt(e.omset) : ""}
            onChange={(ev) => onChange(stand.id, () => ({ omset: parseDigits(ev.target.value) }))}
            className="field pl-9 text-right text-base font-semibold"
          />
        </label>
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
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <input
            key={i}
            data-testid={`input-spg${i + 1}-${sid}`}
            list="spg-names"
            placeholder={`SPG ${i + 1}`}
            value={e.spg?.[i] || ""}
            onChange={(ev) => setSpg(i, ev.target.value)}
            className="field text-xs py-1.5"
          />
        ))}
      </div>
    </article>
  );
}

export default memo(StandCard);
