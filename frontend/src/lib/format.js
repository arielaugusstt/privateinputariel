export const fmt = (n) => String(Math.round(Number(n) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export const parseDigits = (s) => {
  const d = String(s ?? "").replace(/\D/g, "");
  return d ? parseInt(d, 10) : 0;
};

const pad = (n) => String(n).padStart(2, "0");

export const toDateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const todayStr = () => toDateStr(new Date());

export const addDays = (s, n) => {
  const [y, m, d] = s.split("-").map(Number);
  return toDateStr(new Date(y, m - 1, d + n));
};

export const ddmm = (s) => {
  const [, m, d] = s.split("-");
  return `${d}/${m}`;
};

export const longDate = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
};

export const dateRange = (start, end) => {
  const out = [];
  let cur = start;
  while (cur <= end && out.length < 93) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
};

export const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const blankEntry = () => ({ omset: 0, cups: {}, spg: ["", "", ""] });
