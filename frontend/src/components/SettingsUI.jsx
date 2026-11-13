import { Pencil, Trash2 } from "lucide-react";

export const Section = ({ title, action, children }) => (
  <section className="bg-white rounded-2xl border border-[#D2D2D7]/80 overflow-hidden">
    <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E5EA]">
      <h2 className="text-sm font-semibold text-[#1D1D1F]">{title}</h2>
      {action}
    </div>
    {children}
  </section>
);

export const Row = ({ title, meta, onEdit, onDelete, testid }) => (
  <div data-testid={testid} className="flex items-center gap-3 px-4 py-2.5 border-b border-[#F2F2F7] last:border-0">
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-[#1D1D1F] truncate">{title}</p>
      <p className="text-[11px] text-[#6E6E73] truncate tnum">{meta}</p>
    </div>
    <button data-testid={`${testid}-edit`} onClick={onEdit} className="icon-btn" aria-label="Edit"><Pencil className="w-3.5 h-3.5" /></button>
    <button data-testid={`${testid}-delete`} onClick={onDelete} className="icon-btn" aria-label="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
  </div>
);
