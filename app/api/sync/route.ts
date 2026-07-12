import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";
import { supabase } from "@/lib/supabase";

// Whoop Recovery Formula (HRV + RHR)
function calculateWhoopRecovery(hrv: number, rhr: number): number {
  const hrvScore = Math.min(hrv / 120, 1) * 50;
  const rhrScore = Math.max(0, 1 - (rhr - 40) / 40) * 50;
  return Math.round(hrvScore + rhrScore);
}

// Custom Whoop Strain Formula: Converts raw active minutes to a 4.0 - 21.0 progressive scale
function calculateWhoopStrain(activeMinutes: number): number {
  if (activeMinutes <= 0) return 4.0;
  // Progressive curve: It's easy to get to 10 strain, but exponentially harder to hit 20+
  const rawStrain = 4.0 + 17.0 * (1 - Math.exp(-activeMinutes / 45));
  return parseFloat(rawStrain.toFixed(1));
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

  try {
    // 1. Fetch Live Resting Heart Rate
    const rhrResponse = await fetch(
      `https://health.googleapis.com/v4/users/me/dataTypes/daily-resting-heart-rate/dataPoints?filter=daily_resting_heart_rate.date%3D%22${today}%22`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      },
    );
    const rhrData = await rhrResponse.json();

    // 2. Fetch Live Heart Rate Variability (HRV)
    const hrvResponse = await fetch(
      `https://health.googleapis.com/v4/users/me/dataTypes/daily-heart-rate-variability/dataPoints?filter=daily_heart_rate_variability.date%3D%22${today}%22`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      },
    );
    const hrvData = await hrvResponse.json();

    // 3. Fetch Live Sleep Sessions
    const sleepResponse = await fetch(
      `https://health.googleapis.com/v4/users/me/dataTypes/sleep/dataPoints?filter=sleep.interval.civil_end_time%3D%22${today}%22`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      },
    );
    const sleepData = await sleepResponse.json();

    // 4. Fetch Live Active Minutes for Day Strain calculation
    const activityResponse = await fetch(
      `https://health.googleapis.com/v4/users/me/dataTypes/active-minutes/dataPoints?filter=active_minutes.date%3D%22${today}%22`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      },
    );
    const activityData = await activityResponse.json();

    // Parse data defensively with baseline fallbacks
    const restingHeartRate =
      rhrData.dataPoints?.[0]?.dailyRestingHeartRate?.restingHeartRate || 62;
    const hrv = hrvData.dataPoints?.[0]?.dailyHeartRateVariability?.hrv || 58;
    const activeMinutes =
      activityData.dataPoints?.[0]?.activeMinutes?.duration || 35; // fallback 35 mins if no data yet

    // Compute exact sleep duration hours from timestamps
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

    // Process real athletic analytics
    const recoveryScore = calculateWhoopRecovery(hrv, restingHeartRate);
    const strainScore = calculateWhoopStrain(activeMinutes);

    // Save permanent record to Supabase
    const { data, error } = await supabase
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
