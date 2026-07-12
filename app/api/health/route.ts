import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !(session as any).accessToken) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const accessToken = (session as any).accessToken;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startTimeMillis = today.getTime();
  const endTimeMillis = Date.now();

  const body = {
    aggregateBy: [
      { dataTypeName: "com.google.step_count.delta" },
      { dataTypeName: "com.google.calories.expended" },
      { dataTypeName: "com.google.heart_rate.bpm" },
      { dataTypeName: "com.google.distance.delta" },
      { dataTypeName: "com.google.sleep.segment" },
    ],
    bucketByTime: { durationMillis: endTimeMillis - startTimeMillis },
    startTimeMillis,
    endTimeMillis,
  };

  try {
    const response = await fetch(
      "https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();

    const metrics: any = {
      steps: 0,
      calories: 0,
      distance: 0,
      heartRate: 0,
      sleepHours: 0,
    };

    if (data.bucket && data.bucket[0]?.dataset) {
      for (const dataset of data.bucket[0].dataset) {
        if (!dataset.point) continue;

        for (const point of dataset.point) {
          const value = point.value[0];
          if (point.dataTypeName === "com.google.step_count.delta") {
            metrics.steps += value.intVal || 0;
          } else if (point.dataTypeName === "com.google.calories.expended") {
            metrics.calories += Math.round(value.fpVal || 0);
          } else if (point.dataTypeName === "com.google.distance.delta") {
            metrics.distance += (value.fpVal || 0) / 1000; // to km
          } else if (point.dataTypeName === "com.google.heart_rate.bpm") {
            metrics.heartRate = Math.round(value.fpVal || 0);
          } else if (point.dataTypeName === "com.google.sleep.segment") {
            const start = parseInt(point.startTimeNanos);
            const end = parseInt(point.endTimeNanos);
            metrics.sleepHours +=
              (end - start) / (1000 * 1000 * 1000 * 60 * 60);
          }
        }
      }
    }

    metrics.distance = parseFloat(metrics.distance.toFixed(2));
    metrics.sleepHours = parseFloat(metrics.sleepHours.toFixed(1));

    return NextResponse.json({ metrics });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
