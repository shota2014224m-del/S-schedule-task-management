"use client";

import { priorityColor, priorityLabel } from "@/lib/priority";
import type { Priority, TaskStatus } from "@prisma/client";

export type TaskDTO = {
  id: string;
  title: string;
  notes: string | null;
  category: string | null;
  priority: Priority;
  estimatedMin: number | null;
  dueAt: string | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  status: TaskStatus;
};

export default function TaskCard({
  task,
  onChanged,
}: {
  task: TaskDTO;
  onChanged?: () => void;
}) {
  async function reschedule() {
    const res = await fetch(`/api/tasks/${task.id}/reschedule`, {
      method: "POST",
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(`リスケジュール失敗: ${j.error ?? res.status}`);
      return;
    }
    onChanged?.();
  }

  async function markDone() {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DONE" }),
    });
    onChanged?.();
  }

  async function remove() {
    if (!confirm("削除しますか?")) return;
    await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
    onChanged?.();
  }

  return (
    <div
      className="border border-white/10 rounded-xl p-3 bg-white/5 flex flex-col gap-2"
      style={{ borderLeft: `4px solid ${priorityColor[task.priority]}` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-medium">{task.title}</div>
          {task.notes && (
            <div className="text-xs text-white/60 whitespace-pre-wrap">
              {task.notes}
            </div>
          )}
        </div>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full"
          style={{ background: priorityColor[task.priority] }}
        >
          優先度 {priorityLabel[task.priority]}
        </span>
      </div>
      <div className="text-xs text-white/60 flex flex-wrap gap-3">
        {task.category && <span>#{task.category}</span>}
        {task.estimatedMin && <span>⏱ {task.estimatedMin} 分</span>}
        {task.scheduledStart && (
          <span>
            📅 {new Date(task.scheduledStart).toLocaleString("ja-JP")}
          </span>
        )}
        {task.dueAt && (
          <span>⏰ 期限 {new Date(task.dueAt).toLocaleString("ja-JP")}</span>
        )}
        <span>状態: {task.status}</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={reschedule}
          className="px-3 py-1 rounded bg-amber-500 text-black text-sm"
          title="実行できなかった→AIが次の空き時間にリスケ"
        >
          できなかった
        </button>
        <button
          onClick={markDone}
          className="px-3 py-1 rounded bg-emerald-500 text-black text-sm"
        >
          完了
        </button>
        <button
          onClick={remove}
          className="px-3 py-1 rounded border border-white/20 text-sm ml-auto"
        >
          削除
        </button>
      </div>
    </div>
  );
}
