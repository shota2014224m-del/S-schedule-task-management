import Anthropic from "@anthropic-ai/sdk";

const apiKey = process.env.ANTHROPIC_API_KEY;
const model = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";

export const claudeReady = Boolean(apiKey);

export const anthropic = apiKey
  ? new Anthropic({ apiKey })
  : (null as unknown as Anthropic);

// AIに渡す共通システムプロンプト (prompt cacheで再利用)
const SYSTEM_PROMPT = `あなたは個人のタスク・スケジュール管理アシスタントです。
以下の判定を行います:
- タスクのカテゴリ (仕事 / 勉強 / 健康 / 家事 / 趣味 / 雑務 など短い日本語ラベル)
- 優先度 (HIGH / MID / LOW)
- 完了に必要なおおよその所要時間 (分単位)

優先度の判断基準:
- HIGH: 期限が近い、影響範囲が大きい、緊急性が高い
- MID:  期限はあるが余裕がある、定期的なもの
- LOW:  期限なし、すぐ終わるが重要度低めの作業

回答は必ず JSON のみ。前置きや説明文・コードブロック装飾は不要。`;

export type EstimateResult = {
  category: string;
  priority: "HIGH" | "MID" | "LOW";
  estimatedMin: number;
  reasoning?: string;
};

export async function estimateTask(input: {
  title: string;
  notes?: string | null;
  dueAt?: string | null;
}): Promise<EstimateResult> {
  if (!claudeReady) {
    // APIキー未設定時のフォールバック
    return {
      category: "雑務",
      priority: "MID",
      estimatedMin: 30,
      reasoning: "ANTHROPIC_API_KEY 未設定のためデフォルト値",
    };
  }

  const userMsg = `タスクを判定してください。
タイトル: ${input.title}
メモ: ${input.notes ?? "(なし)"}
期限: ${input.dueAt ?? "(なし)"}

次のJSONスキーマで答えてください:
{"category": string, "priority": "HIGH"|"MID"|"LOW", "estimatedMin": number, "reasoning": string}`;

  const res = await anthropic.messages.create({
    model,
    max_tokens: 512,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMsg }],
  });

  const text =
    res.content.find((c): c is Anthropic.TextBlock => c.type === "text")
      ?.text ?? "{}";
  const json = extractJson(text);
  return {
    category: String(json.category ?? "雑務"),
    priority: (["HIGH", "MID", "LOW"] as const).includes(json.priority)
      ? json.priority
      : "MID",
    estimatedMin:
      Number.isFinite(json.estimatedMin) && json.estimatedMin > 0
        ? Math.round(json.estimatedMin)
        : 30,
    reasoning: json.reasoning,
  };
}

export type RescheduleSuggestion = {
  start: string; // ISO
  end: string; // ISO
  reasoning?: string;
};

export async function suggestReschedule(input: {
  title: string;
  estimatedMin: number;
  priority: "HIGH" | "MID" | "LOW";
  busy: { start: string; end: string }[];
  workDayStart: string; // "HH:mm"
  workDayEnd: string;
  fromISO: string; // この時刻以降で探す
}): Promise<RescheduleSuggestion> {
  if (!claudeReady) {
    // フォールバック: 単純に翌空きスロットを返す
    const from = new Date(input.fromISO);
    const end = new Date(from.getTime() + input.estimatedMin * 60_000);
    return { start: from.toISOString(), end: end.toISOString() };
  }

  const userMsg = `次の予定をリスケジュールしてください。

タスク: ${input.title}
所要時間(分): ${input.estimatedMin}
優先度: ${input.priority}
1日の作業可能時間: ${input.workDayStart} - ${input.workDayEnd}
探索開始時刻 (これ以降): ${input.fromISO}
既存の予定(busy):
${input.busy.map((b) => `- ${b.start} 〜 ${b.end}`).join("\n") || "(なし)"}

ルール:
- 優先度HIGHほど早い時間に入れる
- 作業可能時間帯の中だけで提案する
- 既存予定と重ならない
- 所要時間ぴったりの長さで枠を作る

JSONスキーマ:
{"start": ISO8601, "end": ISO8601, "reasoning": string}`;

  const res = await anthropic.messages.create({
    model,
    max_tokens: 512,
    system: [
      {
        type: "text",
        text: SYSTEM_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [{ role: "user", content: userMsg }],
  });

  const text =
    res.content.find((c): c is Anthropic.TextBlock => c.type === "text")
      ?.text ?? "{}";
  const json = extractJson(text);
  return {
    start: String(json.start),
    end: String(json.end),
    reasoning: json.reasoning,
  };
}

function extractJson(text: string): any {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : trimmed;
  try {
    return JSON.parse(candidate);
  } catch {
    const m = candidate.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        /* fallthrough */
      }
    }
    return {};
  }
}
