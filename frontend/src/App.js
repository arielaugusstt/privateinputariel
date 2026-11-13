import { useCallback, useEffect, useMemo, useState } from "react";
import "@/App.css";
import { Toaster } from "sonner";
import { Loader2 } from "lucide-react";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { todayStr } from "@/lib/format";
import { useDaily } from "@/hooks/useDaily";
import Login from "@/pages/Login";
import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";
import InputTab from "@/pages/InputTab";
import WaTab from "@/pages/WaTab";
import PivotTab from "@/pages/PivotTab";
import SettingsTab from "@/pages/SettingsTab";

const TITLES = { input: "Input Harian", wa: "WA Generator", pivot: "Pivot & Export", settings: "Settings" };
const MASTER_KEY = "amk_master";

function useMaster() {
  const [master, setMaster] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(MASTER_KEY)) || { items: [], stands: [], spg_master: [], pivot_rows: [] };
    } catch {
      return { items: [], stands: [], spg_master: [], pivot_rows: [] };
    }
  });
  const [failed, setFailed] = useState(false);
  const reload = useCallback(async () => {
    const { data } = await api.get("/master");
    localStorage.setItem(MASTER_KEY, JSON.stringify(data));
    setMaster(data);
    setFailed(false);
  }, []);
  useEffect(() => {
    reload().catch(() => setFailed(true));
  }, [reload]);
  return { ...master, reload, failed };
}

function Shell() {
  const [tab, setTab] = useState("input");
  const [date, setDate] = useState(todayStr());
  const [filter, setFilter] = useState("all");
  const [reloadKey, setReloadKey] = useState(0);
  const [spgNames, setSpgNames] = useState([]);
  const { items: allItems, stands, spg_master: spgMaster = [], pivot_rows: pivotRows = [], reload, failed } = useMaster();
  const items = useMemo(() => allItems.filter((i) => i.is_active).sort((a, b) => a.sort_order - b.sort_order), [allItems]);
  const daily = useDaily(date, reloadKey);

  useEffect(() => {
    api.get("/spg-names").then((r) => setSpgNames(r.data)).catch(() => {});
  }, [reloadKey, spgMaster]);

  const inputStands = useMemo(() => stands.filter((s) => s.is_active_input).sort((a, b) => a.input_order - b.input_order), [stands]);
  const isEmpty = (s) => !(Number(daily.entries[s.id]?.omset) > 0);
  const counts = {
    all: inputStands.length,
    AMK: inputStands.filter((s) => s.category === "AMK").length,
    AMKOPI: inputStands.filter((s) => s.category === "AMKOPI").length,
    empty: inputStands.filter(isEmpty).length,
  };
  const visible = inputStands.filter((s) => (filter === "all" ? true : filter === "empty" ? isEmpty(s) : s.category === filter));
  const dated = tab === "input" || tab === "wa";

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <Header
        title={TITLES[tab]}
        date={date}
        setDate={dated ? setDate : null}
        status={dated ? daily.status : null}
        filter={filter}
        setFilter={tab === "input" ? setFilter : null}
        counts={counts}
      />
      <main className="max-w-2xl mx-auto px-4 pt-4 pb-40">
        {failed && stands.length === 0 && (
          <div data-testid="master-error" className="bg-white rounded-2xl border border-[#D2D2D7] p-5 text-center space-y-3">
            <p className="text-sm text-[#1D1D1F]">Gagal memuat daftar stand. Periksa koneksi internet.</p>
            <button data-testid="master-retry-button" onClick={() => reload().catch(() => {})} className="btn-primary">Coba Lagi</button>
          </div>
        )}
        {tab === "input" && <InputTab stands={stands} items={items} daily={daily} visible={visible} spgNames={spgNames} />}
        {tab === "wa" && <WaTab date={date} stands={stands} items={items} entries={daily.entries} />}
        {tab === "pivot" && <PivotTab stands={stands} items={items} spgMaster={spgMaster} pivotRows={pivotRows} />}
        {tab === "settings" && (
          <SettingsTab stands={stands} items={allItems} spgMaster={spgMaster} pivotRows={pivotRows} reloadMaster={reload} onDataChanged={() => setReloadKey((k) => k + 1)} />
        )}
      </main>
      <BottomNav tab={tab} setTab={setTab} />
    </div>
  );
}

function Gate() {
  const { user } = useAuth();
  if (user === null)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F7]">
        <Loader2 className="w-5 h-5 animate-spin text-[#1D1D1F]" />
      </div>
    );
  return user ? <Shell /> : <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
      <Toaster position="top-center" toastOptions={{ style: { background: "#1D1D1F", color: "#fff", border: "none", borderRadius: 14 } }} />
    </AuthProvider>
  );
}
