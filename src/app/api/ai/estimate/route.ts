import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { estimateTask } from "@/lib/claude";

const schema = z.object({
  title: z.string().min(1),
  notes: z.string().optional().nullable(),
  dueAt: z.string().datetime().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const result = await estimateTask(parsed.data);
  return NextResponse.json(result);
}
