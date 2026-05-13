"use client";

import { useState, useTransition } from "react";

export default function QuickAdd({ onAdded }: { onAdded?: () => void }) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  async function submit() {
    if (!title.trim()) return;
    const payload: any = { title, notes: notes || null };
    if (dueAt) payload.dueAt = new Date(dueAt).toISOString();
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setTitle("");
      setNotes("");
      setDueAt("");
      setOpen(false);
      onAdded?.();
    }
  }

  return (
    <div className="border border-white/10 rounded-xl p-3 bg-white/5">
      <div className="flex gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="思いついたタスクを追加..."
          className="flex-1 bg-transparent outline-none px-2 py-2 rounded border border-white/10"
          onFocus={() => setOpen(true)}
        />
        <button
          onClick={() => startTransition(submit)}
          disabled={pending || !title.trim()}
          className="px-4 py-2 rounded bg-emerald-500 disabled:opacity-40 text-black font-medium"
        >
          {pending ? "追加中..." : "追加"}
        </button>
      </div>
      {open && (
        <div className="mt-3 grid gap-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="メモ (任意) — AIがこの情報も使って優先度・所要時間を判定します"
            className="bg-transparent outline-none px-2 py-2 rounded border border-white/10"
            rows={2}
          />
          <label className="text-xs text-white/60">
            期限 (任意)
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="mt-1 block w-full bg-transparent outline-none px-2 py-2 rounded border border-white/10"
            />
          </label>
        </div>
      )}
    </div>
  );
}
