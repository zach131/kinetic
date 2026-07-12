// app/api/sync/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { supabaseAdmin } from "@/lib/supabaseServer";

function calculateWhoopRecovery(hrv: number, rhr: number): number {
  const hrvScore = Math.min(hrv / 120, 1) * 50;
  const rhrScore = Math.max(0, 1 - (rhr - 40) / 40) * 50;
  return Math.round(hrvScore + rhrScore);
}

function calculateWhoopStrain(activeMinutes: number): number {
  if (activeMinutes <= 0) return 4.0;
  const rawStrain = 4.0 + 17.0 * (1 - Math.exp(-activeMinutes / 45));
  return parseFloat(rawStrain.toFixed(1));
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Fetch last 7 days of data for trend analysis
  const { data, error } = await supabaseAdmin
    .from("daily_biometrics")
    .select("*")
    .eq("user_id", (session as any).userId)
    .order("date", { ascending: true })
    .limit(7);

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ history: data });
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session || !(session as any).accessToken) {
    return NextResponse.json(
      { error: "Not authenticated with Google" },
      { status: 401 },
    );
  }

  const accessToken = (session as any).accessToken;
  const today = new Date().toISOString().split("T")[0];
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: "application/json",
  };

  try {
    // Fetch all endpoints in parallel for faster load times
    const [rhrRes, hrvRes, sleepRes, actRes] = await Promise.all([
      fetch(
        `https://health.googleapis.com/v4/users/me/dataTypes/daily-resting-heart-rate/dataPoints?filter=daily_resting_heart_rate.date%3D%22${today}%22`,
        { headers },
      ),
      fetch(
        `https://health.googleapis.com/v4/users/me/dataTypes/daily-heart-rate-variability/dataPoints?filter=daily_heart_rate_variability.date%3D%22${today}%22`,
        { headers },
      ),
      fetch(
        `https://health.googleapis.com/v4/users/me/dataTypes/sleep/dataPoints?filter=sleep.interval.civil_end_time%3D%22${today}%22`,
        { headers },
      ),
      fetch(
        `https://health.googleapis.com/v4/users/me/dataTypes/active-minutes/dataPoints?filter=active_minutes.date%3D%22${today}%22`,
        { headers },
      ),
    ]);

    const [rhrData, hrvData, sleepData, activityData] = await Promise.all([
      rhrRes.json(),
      hrvRes.json(),
      sleepRes.json(),
      actRes.json(),
    ]);

    const restingHeartRate =
      rhrData.dataPoints?.[0]?.dailyRestingHeartRate?.restingHeartRate || 62;
    const hrv = hrvData.dataPoints?.[0]?.dailyHeartRateVariability?.hrv || 58;
    const activeMinutes =
      activityData.dataPoints?.[0]?.activeMinutes?.duration || 35;

    let sleepDuration = 7.5;
    if (sleepData.dataPoints?.[0]?.sleep?.interval) {
      const startTime = new Date(
        sleepData.dataPoints[0].sleep.interval.startTime,
      );
      const endTime = new Date(sleepData.dataPoints[0].sleep.interval.endTime);
      sleepDuration = parseFloat(
        ((endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)).toFixed(
          1,
        ),
      );
    }

    const recoveryScore = calculateWhoopRecovery(hrv, restingHeartRate);
    const strainScore = calculateWhoopStrain(activeMinutes);

    const { data, error } = await supabaseAdmin
      .from("daily_biometrics")
      .upsert(
        {
          user_id: (session as any).userId,
          date: today,
          resting_heart_rate: restingHeartRate,
          hrv: hrv,
          sleep_duration: sleepDuration,
          calculated_recovery: recoveryScore,
          calculated_strain: strainScore,
        },
        { onConflict: "user_id,date" },
      )
      .select();

    if (error) throw error;
    return NextResponse.json({ success: true, metrics: data[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
