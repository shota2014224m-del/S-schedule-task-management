"use client";

import { useCallback, useEffect, useState } from "react";
import QuickAdd from "./QuickAdd";
import TaskCard, { type TaskDTO } from "./TaskCard";

export default function TaskList({
  filter,
}: {
  filter?: (t: TaskDTO) => boolean;
}) {
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

  const visible = filter ? tasks.filter(filter) : tasks;

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
