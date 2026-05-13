import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { suggestReschedule } from "@/lib/claude";
import {
  createEvent,
  deleteEvent,
  getCalendarClient,
  listBusy,
  priorityToColorId,
} from "@/lib/google";
import { asPriority } from "@/lib/priority";
import { addDays } from "date-fns";

/**
 * POST /api/tasks/:id/reschedule
 * 「実行できなかった」ボタンから呼ばれる。
 * 1. 既存のGCalイベントがあれば削除
 * 2. 今後7日のbusyを取得
 * 3. Claudeに次の空き枠を提案させる
 * 4. 新しいイベントを作成し、DBを更新
 */
export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) {
    return NextResponse.json({ error: "未ログイン" }, { status: 401 });
  }

  const task = await prisma.task.findUnique({ where: { id } });
  if (!task) return NextResponse.json({ error: "not found" }, { status: 404 });

  const cal = await getCalendarClient(userId);

  // 既存イベント削除
  if (task.gcalEventId) {
    try {
      await deleteEvent(cal, task.gcalEventId);
    } catch {
      /* 既に消えていてもOK */
    }
  }

  const now = new Date();
  const horizonEnd = addDays(now, 7);
  const busy = await listBusy(cal, now.toISOString(), horizonEnd.toISOString());

  const priority = asPriority(task.priority);
  const suggestion = await suggestReschedule({
    title: task.title,
    estimatedMin: task.estimatedMin ?? 30,
    priority,
    busy,
    workDayStart: process.env.WORK_DAY_START ?? "09:00",
    workDayEnd: process.env.WORK_DAY_END ?? "22:00",
    fromISO: now.toISOString(),
  });

  const event = await createEvent(cal, {
    summary: task.title,
    description: task.notes ?? undefined,
    startISO: suggestion.start,
    endISO: suggestion.end,
    colorId: priorityToColorId[priority],
  });

  const updated = await prisma.task.update({
    where: { id },
    data: {
      status: "SCHEDULED",
      scheduledStart: new Date(suggestion.start),
      scheduledEnd: new Date(suggestion.end),
      gcalEventId: event.id ?? null,
    },
  });

  return NextResponse.json({ task: updated, reasoning: suggestion.reasoning });
}
