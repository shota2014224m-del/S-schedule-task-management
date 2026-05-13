"use client";

import { useCallback, useEffect, useState } from "react";
import QuickAdd from "./QuickAdd";
import TaskCard, { type TaskDTO } from "./TaskCard";

type Mode = "today" | "all";

export default function TaskList({ mode = "all" }: { mode?: Mode }) {
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/tasks");
    const j = await res.json();
    setTasks(j.tasks ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = applyFilter(tasks, mode);

  return (
    <div className="flex flex-col gap-3">
      <QuickAdd onAdded={load} />
      {loading ? (
        <div className="text-white/50 text-sm">読み込み中...</div>
      ) : visible.length === 0 ? (
        <div className="text-white/50 text-sm">タスクはありません。</div>
      ) : (
        visible.map((t) => (
          <TaskCard key={t.id} task={t} onChanged={load} />
        ))
      )}
    </div>
  );
}

function applyFilter(tasks: TaskDTO[], mode: Mode): TaskDTO[] {
  if (mode === "all") return tasks;
  const today = new Date().toDateString();
  return tasks.filter(
    (t) =>
      t.status !== "DONE" &&
      (!t.scheduledStart ||
        new Date(t.scheduledStart).toDateString() === today)
  );
}
