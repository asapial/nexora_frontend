import { useState } from "react";
import { RiCheckLine, RiCloseLine, RiEditLine } from "react-icons/ri";

export function EditableField({ label, value, icon, type = "text", onSave }: {
  label: string; value: string; icon: React.ReactNode; type?: string;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(value);
  const commit = () => { onSave(draft); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-bold tracking-[.08em] uppercase text-muted-foreground/70">{label}</label>
      {editing ? (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 text-base pointer-events-none">{icon}</span>
            <input autoFocus type={type} value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel(); }}
              className="w-full h-10 pl-9 pr-4 rounded-xl text-[13.5px] font-medium
                         bg-muted/50 border border-teal-400/60 dark:border-teal-500/50
                         text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400/25
                         dark:focus:ring-teal-500/25 transition-all duration-150" />
          </div>
          <button onClick={commit}
            className="w-9 h-9 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-600
                       text-white flex items-center justify-center text-sm shadow-sm shadow-teal-600/20
                       transition-all flex-shrink-0"><RiCheckLine /></button>
          <button onClick={cancel}
            className="w-9 h-9 rounded-xl border border-border bg-muted/50 hover:bg-muted
                       text-muted-foreground flex items-center justify-center text-sm
                       transition-all flex-shrink-0"><RiCloseLine /></button>
        </div>
      ) : (
        <div onClick={() => setEditing(true)}
          className="group flex items-center gap-2.5 h-10 px-3 rounded-xl cursor-pointer
                     bg-muted/30 hover:bg-muted/60 border border-transparent hover:border-border transition-all">
          <span className="text-muted-foreground/50 text-base flex-shrink-0">{icon}</span>
          <span className="flex-1 text-[13.5px] text-foreground truncate">
            {value || <span className="text-muted-foreground/35 italic text-[13px]">Not set</span>}
          </span>
          <RiEditLine className="text-sm text-muted-foreground/0 group-hover:text-muted-foreground/40 transition-colors flex-shrink-0" />
        </div>
      )}
    </div>
  );
}
