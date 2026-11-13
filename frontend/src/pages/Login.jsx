import { useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { errMsg } from "@/lib/api";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await login(email, password);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center px-5">
      <form onSubmit={submit} data-testid="login-form" className="w-full max-w-sm bg-white border border-[#D2D2D7] rounded-3xl p-7 space-y-5 fade-up">
        <div className="w-11 h-11 rounded-2xl bg-black flex items-center justify-center">
          <Lock className="w-5 h-5 text-white" strokeWidth={2} />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">AMK Engine</h1>
          <p className="text-sm text-[#6E6E73] mt-1">Masuk sebagai owner untuk mengisi laporan harian.</p>
        </div>
        <div className="space-y-3">
          <label className="block">
            <span className="label-text">Email</span>
            <input data-testid="login-email-input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field mt-1.5" />
          </label>
          <label className="block">
            <span className="label-text">Password</span>
            <input data-testid="login-password-input" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="field mt-1.5" />
          </label>
        </div>
        {error && <p data-testid="login-error" className="text-sm text-[#1D1D1F] bg-[#F5F5F7] border border-[#D2D2D7] rounded-xl px-3 py-2">{error}</p>}
        <button data-testid="login-submit-button" disabled={busy} className="btn-primary w-full">
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Masuk
        </button>
      </form>
    </div>
  );
}
