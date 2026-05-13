import { google, calendar_v3 } from "googleapis";
import { prisma } from "./db";

// NextAuth で保存された Google アカウントの access_token を使い、
// Google Calendar クライアントを取得する。
// MVPでは「ログインユーザのprimaryカレンダー」を使う前提。
export async function getCalendarClient(userId: string) {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
  });
  if (!account?.access_token) {
    throw new Error("Googleアカウントが未連携です");
  }

  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token ?? undefined,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
  });
  return google.calendar({ version: "v3", auth: oauth2 });
}

export async function listBusy(
  cal: calendar_v3.Calendar,
  timeMinISO: string,
  timeMaxISO: string
): Promise<{ start: string; end: string }[]> {
  const res = await cal.freebusy.query({
    requestBody: {
      timeMin: timeMinISO,
      timeMax: timeMaxISO,
      items: [{ id: "primary" }],
    },
  });
  const busy = res.data.calendars?.primary?.busy ?? [];
  return busy
    .filter((b): b is { start: string; end: string } => !!b.start && !!b.end)
    .map((b) => ({ start: b.start, end: b.end }));
}

export async function createEvent(
  cal: calendar_v3.Calendar,
  args: {
    summary: string;
    description?: string;
    startISO: string;
    endISO: string;
    colorId?: string;
  }
) {
  const res = await cal.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: args.summary,
      description: args.description,
      start: { dateTime: args.startISO },
      end: { dateTime: args.endISO },
      colorId: args.colorId,
    },
  });
  return res.data;
}

export async function deleteEvent(
  cal: calendar_v3.Calendar,
  eventId: string
) {
  await cal.events.delete({ calendarId: "primary", eventId });
}

// Googleカレンダー側のイベント色IDマッピング (優先度→色)
// 参考: 11=赤, 5=黄, 10=緑
export const priorityToColorId: Record<"HIGH" | "MID" | "LOW", string> = {
  HIGH: "11",
  MID: "5",
  LOW: "10",
};
