import { PencilLine, MessageSquareText, Table2, Settings } from "lucide-react";

const TABS = [
  { id: "input", label: "Input Harian", icon: PencilLine },
  { id: "wa", label: "WA Generator", icon: MessageSquareText },
  { id: "pivot", label: "Pivot & Export", icon: Table2 },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function BottomNav({ tab, setTab }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 backdrop-blur-lg bg-white/85 border-t border-[#D2D2D7] pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-2xl mx-auto grid grid-cols-4">
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              data-testid={`nav-tab-${id}`}
              onClick={() => setTab(id)}
              className={`flex flex-col items-center gap-1 py-2.5 text-[10.5px] font-semibold transition-colors ${active ? "text-black" : "text-[#8E8E93] hover:text-[#1D1D1F]"}`}
            >
              <span className={`flex items-center justify-center w-10 h-7 rounded-full transition-colors ${active ? "bg-black text-white" : ""}`}>
                <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2.2 : 1.8} />
              </span>
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
