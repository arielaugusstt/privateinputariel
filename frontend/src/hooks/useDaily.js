import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import { blankEntry } from "@/lib/format";

const key = (d) => `amk_draft_${d}`;
const readDraft = (d) => {
  try {
    return JSON.parse(localStorage.getItem(key(d)) || "null");
  } catch {
    return null;
  }
};
const writeDraft = (d, entries, dirty) =>
  localStorage.setItem(key(d), JSON.stringify({ entries, dirty, savedAt: Date.now() }));

const normalize = (entries) =>
  Object.fromEntries(
    Object.entries(entries).map(([id, e]) => [
      id,
      {
        omset: Number(e.omset) || 0,
        cups: Object.fromEntries(Object.entries(e.cups || {}).map(([k, v]) => [k, Number(v) || 0])),
        spg: [0, 1, 2].map((i) => (e.spg?.[i] || "").trim()),
      },
    ])
  );

export function useDaily(date, reloadKey) {
  const [entries, setEntries] = useState({});
  const [status, setStatus] = useState("synced");
  const [loading, setLoading] = useState(true);
  const timer = useRef(null);
  const dirtyRef = useRef(false);
  const latest = useRef({ date, entries });
  latest.current = { date, entries };

  const sync = useCallback(async (d, ents) => {
    const snapshot = JSON.stringify(ents);
    if (latest.current.date === d) setStatus("syncing");
    try {
      await api.post("/daily-input", { date: d, entries: normalize(ents) });
      const draft = readDraft(d);
      if (!draft || JSON.stringify(draft.entries) === snapshot) {
        writeDraft(d, ents, false);
        if (latest.current.date === d) setStatus("synced");
      }
      return true;
    } catch {
      if (latest.current.date === d) setStatus("draft");
      return false;
    }
  }, []);

  useEffect(() => {
    let cancel = false;
    clearTimeout(timer.current);
    dirtyRef.current = false;
    setLoading(true);
    const draft = readDraft(date);
    if (draft) setEntries(draft.entries || {});
    else setEntries({});
    setStatus(draft?.dirty ? "draft" : "synced");
    api
      .get(`/daily-input/${date}`)
      .then(({ data }) => {
        if (cancel) return;
        if (draft?.dirty) {
          sync(date, draft.entries);
        } else {
          setEntries(data.entries || {});
          writeDraft(date, data.entries || {}, false);
          setStatus("synced");
        }
      })
      .catch(() => !cancel && setStatus("draft"))
      .finally(() => !cancel && setLoading(false));
    return () => {
      cancel = true;
    };
  }, [date, reloadKey, sync]);

  useEffect(() => {
    if (!dirtyRef.current) return;
    writeDraft(date, entries, true);
    setStatus("draft");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => sync(date, entries), 1500);
  }, [entries, date, sync]);

  useEffect(() => {
    const onOnline = () => {
      const d = latest.current.date;
      if (readDraft(d)?.dirty) sync(d, latest.current.entries);
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [sync]);

  const update = useCallback((standId, patch) => {
    dirtyRef.current = true;
    setEntries((prev) => {
      const cur = prev[standId] || blankEntry();
      return { ...prev, [standId]: { ...cur, ...patch(cur) } };
    });
  }, []);

  const saveNow = useCallback(() => {
    clearTimeout(timer.current);
    return sync(latest.current.date, latest.current.entries);
  }, [sync]);

  return { entries, status, loading, update, saveNow };
}
