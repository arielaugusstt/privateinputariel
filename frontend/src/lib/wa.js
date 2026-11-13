import { fmt, ddmm } from "./format";

export function computeTotals(stands, items, entries) {
  const ck = items.find((i) => i.code_wa === "Ck")?.id;
  let amk = 0, amkopi = 0, ckAmkopi = 0;
  stands.forEach((s) => {
    const e = entries[s.id];
    if (!e) return;
    if (s.category === "AMKOPI") {
      amkopi += Number(e.omset) || 0;
      if (ck) ckAmkopi += Number(e.cups?.[ck]) || 0;
    } else {
      amk += Number(e.omset) || 0;
    }
  });
  return { amk, amkopi, ckAmkopi };
}

export function buildWaReport(date, stands, items, entries) {
  const idOf = (c) => items.find((i) => i.code_wa === c)?.id;
  const ck = idOf("Ck"), cb = idOf("Cb"), cs = idOf("Csdng");
  const cup = (e, id) => {
    const v = id ? Number(e?.cups?.[id]) || 0 : 0;
    return v > 0 ? String(v) : "";
  };
  const line = (s) => {
    const e = entries[s.id] || {};
    const om = fmt(e.omset || 0);
    if (s.category === "AMKOPI") return `${om},Ck ${cup(e, ck)} `;
    let t = `${om},Ck ${cup(e, ck)},Cb ${cup(e, cb)}`;
    if (s.show_csedang_wa) t += `,Csdng ${cup(e, cs)}`;
    if (s.extra_wa_suffix) t += s.extra_wa_suffix;
    return t;
  };
  const head = `TGL ${ddmm(date)}`;
  const blocks = [1, 2, 3]
    .map((g) => stands.filter((s) => s.wa_group === g).sort((a, b) => a.wa_order - b.wa_order))
    .filter((list) => list.length)
    .map((list) => [head, ...list.map((s, i) => ` ${i + 1}. ${s.wa_name} : ${line(s)}`)].join("\n"));
  const t = computeTotals(stands, items, entries);
  const footer = [
    " Keterangan :",
    ` Total AMK : ${fmt(t.amk)}`,
    " Total Kurma : 0, Cb 0",
    ` Total AMKopi : ${fmt(t.amkopi)}, Ck ${fmt(t.ckAmkopi)}`,
  ].join("\n");
  return `${blocks.join("\n\n")}\n\n${footer}`;
}
