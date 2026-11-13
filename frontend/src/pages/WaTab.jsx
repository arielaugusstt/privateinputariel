import { useMemo, useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { buildWaReport } from "@/lib/wa";

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  }
}

export default function WaTab({ date, stands, items, entries }) {
  const [copied, setCopied] = useState(false);
  const text = useMemo(() => buildWaReport(date, stands, items, entries), [date, stands, items, entries]);

  const onCopy = async () => {
    if (await copyText(text)) {
      setCopied(true);
      toast.success("Laporan disalin. Tempel di WhatsApp.");
      setTimeout(() => setCopied(false), 1800);
    } else {
      toast.error("Gagal menyalin");
    }
  };

  return (
    <div className="space-y-3 fade-up">
      <div className="grid grid-cols-2 gap-2">
        <button data-testid="btn-copy-wa" onClick={onCopy} className="btn-primary whitespace-nowrap px-2">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {copied ? "Tersalin" : "Copy ke WhatsApp"}
        </button>
        <a data-testid="btn-open-wa" href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer" className="btn-secondary">
          <ExternalLink className="w-4 h-4" /> Buka WhatsApp
        </a>
      </div>
      <div className="rounded-2xl bg-[#1D1D1F] border border-black overflow-hidden">
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/10">
          <span className="w-2.5 h-2.5 rounded-full bg-white/25" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/25" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/25" />
          <span className="ml-2 text-[11px] font-medium text-white/50">Pratinjau langsung</span>
        </div>
        <pre data-testid="wa-preview" className="px-4 py-4 text-[12.5px] leading-relaxed text-white font-mono tnum whitespace-pre-wrap break-words">{text}</pre>
      </div>
    </div>
  );
}
