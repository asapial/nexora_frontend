// ─────────────────────────────────────────────────────────────
// TAG ARRAY EDITOR
// Handles skills[], researchInterests[] — add by typing + Enter
// or comma, remove by clicking ✕ on each tag.
// Calls onSave(newArray) immediately on every change.

import { cn } from "@/lib/utils";
import { KeyboardEvent, useRef, useState } from "react";
import { RiAddLine, RiCloseLine, RiEditLine } from "react-icons/ri";

// ─────────────────────────────────────────────────────────────
export function TagArrayEditor({
  label,
  values,
  placeholder = "Type and press Enter to add",
  onSave,
}: {
  label:        string;
  values:       string[];
  placeholder?: string;
  onSave:       (tags: string[]) => void;
}) {
  const [tags,    setTags]    = useState<string[]>(values ?? []);
  const [input,   setInput]   = useState("");
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Commit a new tag
  const addTag = (raw: string) => {
    const trimmed = raw.trim().replace(/,+$/, "").trim();
    if (!trimmed || tags.includes(trimmed)) return;
    const next = [...tags, trimmed];
    setTags(next);
    onSave(next);
    setInput("");
  };

  // Remove a tag by index
  const removeTag = (idx: number) => {
    const next = tags.filter((_, i) => i !== idx);
    setTags(next);
    onSave(next);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    }
    // Backspace on empty input → remove last tag
    if (e.key === "Backspace" && input === "" && tags.length > 0) {
      removeTag(tags.length - 1);
    }
    if (e.key === "Escape") {
      setEditing(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-[.08em] uppercase text-muted-foreground/70">
          {label}
        </span>
        <button
          onClick={() => { setEditing(e => !e); if (!editing) setTimeout(() => inputRef.current?.focus(), 50); }}
          className="text-[11.5px] font-semibold text-teal-600 dark:text-teal-400
                     hover:text-teal-700 dark:hover:text-teal-300 transition-colors
                     flex items-center gap-1"
        >
          <RiEditLine className="text-xs" />
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      {/* Tags display */}
      <div className={cn(
        "min-h-[42px] flex flex-wrap gap-2 p-3 rounded-xl border transition-all duration-150",
        editing
          ? "bg-muted/50 border-teal-400/60 dark:border-teal-500/50"
          : "bg-muted/30 border-transparent hover:border-border",
      )}>
        {tags.map((tag, i) => (
          <span
            key={tag}
            className={cn(
              "inline-flex items-center gap-1 px-2.5 py-1 rounded-lg",
              "text-[12px] font-semibold",
              "bg-teal-100/80 dark:bg-teal-950/60",
              "text-teal-700 dark:text-teal-300",
              "border border-teal-200/70 dark:border-teal-800/60",
            )}
          >
            {tag}
            {editing && (
              <button
                onClick={() => removeTag(i)}
                className="text-teal-500 dark:text-teal-400
                           hover:text-red-500 dark:hover:text-red-400
                           transition-colors ml-0.5 leading-none"
              >
                <RiCloseLine className="text-xs" />
              </button>
            )}
          </span>
        ))}

        {/* Inline input — visible when editing */}
        {editing && (
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => { if (input.trim()) addTag(input); }}
            placeholder={tags.length === 0 ? placeholder : "Add more…"}
            className="flex-1 min-w-[140px] bg-transparent text-[13px] text-foreground
                       placeholder:text-muted-foreground/40 outline-none"
          />
        )}

        {/* Prompt when empty and not editing */}
        {!editing && tags.length === 0 && (
          <span className="text-[13px] text-muted-foreground/40 italic self-center">
            None added yet — click Edit to add
          </span>
        )}
      </div>

      {/* Helper text */}
      {editing && (
        <p className="text-[11px] text-muted-foreground/60 flex items-center gap-1.5">
          <RiAddLine className="text-xs" />
          Press <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">Enter</kbd> or
          <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">,</kbd> to add ·
          <kbd className="px-1 py-0.5 rounded bg-muted text-[10px] font-mono">⌫</kbd> to remove last
        </p>
      )}
    </div>
  );
}
