import TaskList from "@/components/TaskList";

export const dynamic = "force-dynamic";

export default function TodayPage() {
  return (
    <div className="flex flex-col gap-4">
      <section>
        <h1 className="text-xl font-semibold mb-2">Today</h1>
        <p className="text-sm text-white/60">
          優先度の高い順に表示されます。完了できなかったタスクは「できなかった」を
          押すと AI が次の空き時間にリスケジュールします。
        </p>
      </section>
      <TaskList mode="today" />
    </div>
  );
}
