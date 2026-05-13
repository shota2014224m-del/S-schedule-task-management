import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  notes: z.string().nullable().optional(),
  priority: z.enum(["HIGH", "MID", "LOW"]).optional(),
  estimatedMin: z.number().int().positive().optional(),
  dueAt: z.string().datetime().nullable().optional(),
  status: z.enum(["PENDING", "SCHEDULED", "DONE", "MISSED"]).optional(),
});

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const data = parsed.data;
  const task = await prisma.task.update({
    where: { id },
    data: {
      ...data,
      dueAt:
        data.dueAt === undefined
          ? undefined
          : data.dueAt === null
          ? null
          : new Date(data.dueAt),
    },
  });
  return NextResponse.json({ task });
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
