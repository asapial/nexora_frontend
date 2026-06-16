"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  RiAddLine,
  RiArrowDownLine,
  RiArrowLeftLine,
  RiArrowUpLine,
  RiDeleteBinLine,
  RiRefreshLine,
  RiSaveLine,
} from "react-icons/ri";

import type { SiteContentSection, SiteContentValue } from "@/content/site-content";

function labelFor(key: string) {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function emptyFrom(value: SiteContentValue): SiteContentValue {
  if (Array.isArray(value)) return value.length ? [emptyFrom(value[0])] : [];
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [key, emptyFrom(child)]),
    );
  }
  if (typeof value === "boolean") return false;
  if (typeof value === "number") return 0;
  return "";
}

function PrimitiveEditor({
  fieldKey,
  value,
  onChange,
}: {
  fieldKey: string;
  value: string | number | boolean | null;
  onChange: (value: SiteContentValue) => void;
}) {
  const label = labelFor(fieldKey);

  if (typeof value === "boolean") {
    return (
      <label className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-background/70 px-4 py-3">
        <span className="text-sm font-semibold">{label}</span>
        <input
          type="checkbox"
          checked={value}
          onChange={(event) => onChange(event.target.checked)}
          className="size-4 accent-teal-600"
        />
      </label>
    );
  }

  if (typeof value === "number") {
    return (
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
        <input
          type="number"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-teal-500"
        />
      </label>
    );
  }

  const stringValue = value ?? "";
  const isLong =
    stringValue.length > 90 ||
    /text|description|headline|answer|tagline|copyright|legal/i.test(fieldKey);

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</span>
      {isLong ? (
        <textarea
          value={stringValue}
          rows={Math.min(8, Math.max(3, stringValue.split("\n").length + 1))}
          onChange={(event) => onChange(event.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm leading-relaxed outline-none focus:border-teal-500"
        />
      ) : (
        <input
          value={stringValue}
          onChange={(event) => onChange(event.target.value)}
          className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-teal-500"
        />
      )}
    </label>
  );
}

function ValueEditor({
  fieldKey,
  value,
  onChange,
  depth = 0,
}: {
  fieldKey: string;
  value: SiteContentValue;
  onChange: (value: SiteContentValue) => void;
  depth?: number;
}) {
  if (Array.isArray(value)) {
    return (
      <section className="rounded-2xl border border-border/70 bg-muted/15 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold">{labelFor(fieldKey)}</h3>
            <p className="text-xs text-muted-foreground">{value.length} item{value.length === 1 ? "" : "s"}</p>
          </div>
          <button
            type="button"
            disabled={!value.length}
            onClick={() => onChange([...value, emptyFrom(value[value.length - 1])])}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-teal-500/30 bg-teal-500/10 px-3 text-xs font-bold text-teal-600 disabled:opacity-40 dark:text-teal-400"
          >
            <RiAddLine /> Add item
          </button>
        </div>

        <div className="space-y-3">
          {value.map((item, index) => (
            <div key={index} className="rounded-xl border border-border/60 bg-background/70 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                  {labelFor(fieldKey)} {index + 1}
                </span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    disabled={index === 0}
                    aria-label="Move item up"
                    onClick={() => {
                      const next = [...value];
                      [next[index - 1], next[index]] = [next[index], next[index - 1]];
                      onChange(next);
                    }}
                    className="rounded-lg border border-border p-1.5 text-muted-foreground disabled:opacity-30"
                  >
                    <RiArrowUpLine />
                  </button>
                  <button
                    type="button"
                    disabled={index === value.length - 1}
                    aria-label="Move item down"
                    onClick={() => {
                      const next = [...value];
                      [next[index], next[index + 1]] = [next[index + 1], next[index]];
                      onChange(next);
                    }}
                    className="rounded-lg border border-border p-1.5 text-muted-foreground disabled:opacity-30"
                  >
                    <RiArrowDownLine />
                  </button>
                  <button
                    type="button"
                    aria-label="Remove item"
                    onClick={() => onChange(value.filter((_, itemIndex) => itemIndex !== index))}
                    className="rounded-lg border border-red-500/20 p-1.5 text-red-500"
                  >
                    <RiDeleteBinLine />
                  </button>
                </div>
              </div>
              <ValueEditor
                fieldKey={`${fieldKey}-${index + 1}`}
                value={item}
                depth={depth + 1}
                onChange={(nextItem) => {
                  const next = [...value];
                  next[index] = nextItem;
                  onChange(next);
                }}
              />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (value && typeof value === "object") {
    return (
      <section className={depth ? "space-y-3" : "grid gap-4"}>
        {Object.entries(value).map(([key, child]) => (
          <ValueEditor
            key={key}
            fieldKey={key}
            value={child}
            depth={depth + 1}
            onChange={(nextChild) => onChange({ ...value, [key]: nextChild })}
          />
        ))}
      </section>
    );
  }

  return <PrimitiveEditor fieldKey={fieldKey} value={value} onChange={onChange} />;
}

export default function SiteContentEditor({ section }: { section: SiteContentSection }) {
  const [content, setContent] = useState<Record<string, SiteContentValue>>(
    structuredClone(section.content),
  );
  const [isVisible, setIsVisible] = useState(section.isVisible);
  const [order, setOrder] = useState(section.order);
  const [baseline, setBaseline] = useState({
    content: section.content,
    isVisible: section.isVisible,
    order: section.order,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/homePage/content/${section.key}`, { credentials: "include", cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (!payload.success || !payload.data) return;
        const saved = payload.data;
        setContent(saved.content);
        setIsVisible(saved.isVisible);
        setOrder(saved.order);
        setBaseline({
          content: saved.content,
          isVisible: saved.isVisible,
          order: saved.order,
        });
      })
      .catch(() => {
        // Defaults remain available when the backend has no saved record yet.
      });
  }, [section.key]);

  const changed = useMemo(
    () =>
      JSON.stringify(content) !== JSON.stringify(baseline.content) ||
      isVisible !== baseline.isVisible ||
      order !== baseline.order,
    [baseline, content, isVisible, order],
  );

  const save = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/homePage/content/${section.key}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, isVisible, order }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message || "Could not save");
      setBaseline({ content: structuredClone(content), isVisible, order });

      // Purge the Next.js ISR cache so the home / public pages reflect
      // the new content immediately instead of waiting up to 10 minutes.
      await fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: "site-content" }),
      }).catch(() => {
        // Non-critical — page will still update on next ISR cycle if this fails.
      });

      toast.success(`${section.label} saved — live in a few seconds`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save content");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/dashboard/admin/site-content"
            className="mb-3 inline-flex items-center gap-1.5 text-xs font-bold text-teal-600 hover:underline dark:text-teal-400"
          >
            <RiArrowLeftLine /> Content studio
          </Link>
          <h1 className="text-2xl font-black tracking-tight">{section.label}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{section.description}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Public pages use Next.js ISR and refresh this content at least every 10 minutes.
          </p>
        </div>

        <button
          type="button"
          disabled={saving || !changed}
          onClick={save}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <RiRefreshLine className="animate-spin" /> : <RiSaveLine />}
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>

      <section className="mb-5 grid gap-4 rounded-2xl border border-border/70 bg-card/70 p-5 sm:grid-cols-2">
        <label className="flex items-center justify-between rounded-xl border border-border/60 bg-background/70 px-4 py-3">
          <div>
            <span className="block text-sm font-bold">Visible</span>
            <span className="text-xs text-muted-foreground">Show this section on the public site</span>
          </div>
          <input
            type="checkbox"
            checked={isVisible}
            onChange={(event) => setIsVisible(event.target.checked)}
            className="size-4 accent-teal-600"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Display order</span>
          <input
            type="number"
            value={order}
            onChange={(event) => setOrder(Number(event.target.value))}
            className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-teal-500"
          />
        </label>
      </section>

      <section className="rounded-2xl border border-border/70 bg-card/70 p-5">
        <ValueEditor fieldKey={section.key} value={content} onChange={(value) => setContent(value as Record<string, SiteContentValue>)} />
      </section>
    </main>
  );
}
