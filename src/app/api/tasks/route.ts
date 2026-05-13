import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { estimateTask } from "@/lib/claude";
import { asPriority, priorityRank } from "@/lib/priority";

const createSchema = z.object({
  title: z.string().min(1),
  notes: z.string().optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
  // 任意: 指定があればAI判定をスキップ
  priority: z.enum(["HIGH", "MID", "LOW"]).optional(),
  estimatedMin: z.number().int().positive().optional(),
});

export async function GET() {
  const tasks = await prisma.task.findMany({
    orderBy: [{ createdAt: "desc" }],
  });
  // 優先度順 → 期限順 にメモリ上で並べ替え
  tasks.sort((a, b) => {
    const p = priorityRank[asPriority(a.priority)] - priorityRank[asPriority(b.priority)];
    if (p !== 0) return p;
    const ad = a.dueAt?.getTime() ?? Infinity;
    const bd = b.dueAt?.getTime() ?? Infinity;
    return ad - bd;
  });
  return NextResponse.json({ tasks });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;

  let priority = data.priority ?? "MID";
  let estimatedMin = data.estimatedMin ?? 30;
  let category: string | undefined;

  // 未指定ならAIに判定させる
  if (!data.priority || !data.estimatedMin) {
    const est = await estimateTask({
      title: data.title,
      notes: data.notes,
      dueAt: data.dueAt,
    });
    if (!data.priority) priority = est.priority;
    if (!data.estimatedMin) estimatedMin = est.estimatedMin;
    category = est.category;
  }

  const task = await prisma.task.create({
    data: {
      title: data.title,
      notes: data.notes ?? null,
      dueAt: data.dueAt ? new Date(data.dueAt) : null,
      priority,
      estimatedMin,
      category,
    },
  });
  return NextResponse.json({ task }, { status: 201 });
}
