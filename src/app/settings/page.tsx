import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);
  const hasGoogle =
    Boolean(process.env.GOOGLE_CLIENT_ID) &&
    Boolean(process.env.GOOGLE_CLIENT_SECRET);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Settings</h1>

      <section className="border border-white/10 rounded-xl p-4 bg-white/5">
        <h2 className="font-medium mb-2">Google カレンダー連携</h2>
        {!hasGoogle ? (
          <p className="text-sm text-amber-400">
            .env に GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET を設定してください。
          </p>
        ) : session?.user ? (
          <div className="text-sm">
            <p>連携済み: {session.user.email}</p>
            <a
              href="/api/auth/signout"
              className="inline-block mt-2 px-3 py-1 rounded border border-white/20"
            >
              サインアウト
            </a>
          </div>
        ) : (
          <a
            href="/api/auth/signin"
            className="inline-block px-4 py-2 rounded bg-blue-500 text-white"
          >
            Googleでサインイン
          </a>
        )}
      </section>

      <section className="border border-white/10 rounded-xl p-4 bg-white/5">
        <h2 className="font-medium mb-2">Claude API</h2>
        <p className="text-sm">
          {hasAnthropic
            ? `モデル: ${process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5"} (設定済み)`
            : "未設定 — AIによる優先度判定・所要時間予測は既定値で動作します。"}
        </p>
      </section>

      <section className="border border-white/10 rounded-xl p-4 bg-white/5">
        <h2 className="font-medium mb-2">作業可能時間帯</h2>
        <p className="text-sm">
          {process.env.WORK_DAY_START ?? "09:00"} -{" "}
          {process.env.WORK_DAY_END ?? "22:00"}{" "}
          <span className="text-white/50">
            (.env の WORK_DAY_START / WORK_DAY_END で変更)
          </span>
        </p>
      </section>
    </div>
  );
}
