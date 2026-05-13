export type Priority = "HIGH" | "MID" | "LOW";
export type TaskStatus = "PENDING" | "SCHEDULED" | "DONE" | "MISSED";

export const priorityRank: Record<Priority, number> = {
  HIGH: 0,
  MID: 1,
  LOW: 2,
};

export const priorityColor: Record<Priority, string> = {
  HIGH: "#ef4444",
  MID: "#f59e0b",
  LOW: "#10b981",
};

export const priorityLabel: Record<Priority, string> = {
  HIGH: "高",
  MID: "中",
  LOW: "低",
};

export function asPriority(v: string | null | undefined): Priority {
  return v === "HIGH" || v === "LOW" ? v : "MID";
}
