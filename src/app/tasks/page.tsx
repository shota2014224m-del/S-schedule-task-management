import TaskList from "@/components/TaskList";

export const dynamic = "force-dynamic";

export default function TasksPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">All Tasks</h1>
      <TaskList />
    </div>
  );
}
