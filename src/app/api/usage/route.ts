import { currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const DAILY_LIMIT = 5;

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const metadata = (user.publicMetadata as Record<string, unknown>) || {};
  const usageData = (metadata.usage as Record<string, number>) || {};
  const todayKey = getTodayKey();
  const used = usageData[todayKey] || 0;

  return NextResponse.json({
    limit: DAILY_LIMIT,
    used,
    remaining: Math.max(0, DAILY_LIMIT - used),
  });
}
