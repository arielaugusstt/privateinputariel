import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api, errMsg } from "@/lib/api";

const EMPTY = { current: "", next: "", repeat: "" };

export default function ChangePassword() {
  const [f, setF] = useState(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (f.next.length < 8) return setError("Password baru minimal 8 karakter.");
    if (f.next !== f.repeat) return setError("Ulangi password baru tidak sama.");
    setBusy(true);
    try {
      await api.post("/auth/change-password", { current_password: f.current, new_password: f.next });
      setF(EMPTY);
      toast.success("Password berhasil diganti");
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const input = (k, label, testid, auto) => (
    <label className="block">
      <span className="label-text">{label}</span>
      <input data-testid={testid} type="password" required autoComplete={auto} value={f[k]} onChange={set(k)} className="field mt-1" />
    </label>
  );

  return (
    <form onSubmit={submit} data-testid="change-password-form" className="p-4 pt-0 space-y-3">
      <p className="text-xs font-semibold text-[#1D1D1F] flex items-center gap-1.5 pt-3 border-t border-[#F2F2F7]"><KeyRound className="w-3.5 h-3.5" /> Ganti Password</p>
      {input("current", "Password saat ini", "input-current-password", "current-password")}
      {input("next", "Password baru (min. 8 karakter)", "input-new-password", "new-password")}
      {input("repeat", "Ulangi password baru", "input-repeat-password", "new-password")}
      {error && <p data-testid="change-password-error" className="text-sm text-[#1D1D1F] bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl px-3 py-2">{error}</p>}
      <button data-testid="btn-change-password" disabled={busy} className="btn-primary w-full">
        {busy && <Loader2 className="w-4 h-4 animate-spin" />} Simpan Password Baru
      </button>
    </form>
  );
}
