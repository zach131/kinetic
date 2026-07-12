"use client";

import { useState, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    steps: 0,
    calories: 0,
    distance: 0,
    heartRate: 0,
    sleepHours: 0,
  });

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/health");
      const data = await res.json();
      if (data.metrics) {
        setMetrics(data.metrics);
      }
    } catch (e) {
      console.error("Failed to fetch health data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchHealth();
  }, [session]);

  if (!session) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-black text-white p-6 space-y-8">
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
            <span className="text-4xl">⚡</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight">Kinetic</h1>
          <p className="text-zinc-400 text-sm max-w-xs">
            Your personal health dashboard. Connect your Google Fit to visualize
            your data beautifully.
          </p>
        </div>
        <button
          onClick={() => signIn("google")}
          className="px-8 py-3.5 bg-white text-black rounded-full font-bold text-sm hover:bg-zinc-200 transition shadow-lg"
        >
          Connect Google Fit
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-black text-white">
      {/* Header */}
      <header className="px-6 pt-12 pb-4 flex justify-between items-center">
        <div>
          <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
          <h1 className="text-2xl font-black tracking-tight">Today</h1>
        </div>
        <button
          onClick={() => signOut()}
          className="w-10 h-10 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center text-sm font-bold overflow-hidden"
        >
          {session.user?.image ? (
            <img
              src={session.user.image}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            "U"
          )}
        </button>
      </header>

      {/* Main Grid View */}
      <main className="flex-1 overflow-y-auto px-6 py-4 grid grid-cols-2 gap-4 auto-rows-min">
        {/* Featured Steps Card */}
        <div className="col-span-2 bg-gradient-to-br from-zinc-900 to-zinc-800/50 border border-zinc-800 rounded-3xl p-6 shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
                Steps
              </p>
              {loading ? (
                <div className="h-10 w-32 bg-zinc-800 rounded-md animate-pulse mt-2"></div>
              ) : (
                <h2 className="text-4xl font-black mt-1">
                  {metrics.steps.toLocaleString()}
                </h2>
              )}
              <p className="text-xs text-zinc-500 mt-1">Goal: 10,000</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
              <span className="text-2xl">👟</span>
            </div>
          </div>
          <div className="mt-4 w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-green-400 rounded-full transition-all duration-500"
              style={{
                width: `${Math.min((metrics.steps / 10000) * 100, 100)}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Heart Rate Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-center">
            <p className="text-xs font-medium text-rose-400 uppercase tracking-wider">
              Heart Rate
            </p>
            <span className="text-xl">❤️</span>
          </div>
          {loading ? (
            <div className="h-8 w-16 bg-zinc-800 rounded-md animate-pulse"></div>
          ) : (
            <div className="mt-2">
              <span className="text-3xl font-black">{metrics.heartRate}</span>
              <span className="text-sm text-zinc-500 ml-1">bpm</span>
            </div>
          )}
        </div>

        {/* Calories Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-center">
            <p className="text-xs font-medium text-orange-400 uppercase tracking-wider">
              Calories
            </p>
            <span className="text-xl">🔥</span>
          </div>
          {loading ? (
            <div className="h-8 w-16 bg-zinc-800 rounded-md animate-pulse"></div>
          ) : (
            <div className="mt-2">
              <span className="text-3xl font-black">{metrics.calories}</span>
              <span className="text-sm text-zinc-500 ml-1">kcal</span>
            </div>
          )}
        </div>

        {/* Distance Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-center">
            <p className="text-xs font-medium text-blue-400 uppercase tracking-wider">
              Distance
            </p>
            <span className="text-xl">📍</span>
          </div>
          {loading ? (
            <div className="h-8 w-16 bg-zinc-800 rounded-md animate-pulse"></div>
          ) : (
            <div className="mt-2">
              <span className="text-3xl font-black">{metrics.distance}</span>
              <span className="text-sm text-zinc-500 ml-1">km</span>
            </div>
          )}
        </div>

        {/* Sleep Card */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 flex flex-col justify-between min-h-[140px]">
          <div className="flex justify-between items-center">
            <p className="text-xs font-medium text-purple-400 uppercase tracking-wider">
              Sleep
            </p>
            <span className="text-xl">🌙</span>
          </div>
          {loading ? (
            <div className="h-8 w-16 bg-zinc-800 rounded-md animate-pulse"></div>
          ) : (
            <div className="mt-2">
              <span className="text-3xl font-black">{metrics.sleepHours}</span>
              <span className="text-sm text-zinc-500 ml-1">hrs</span>
            </div>
          )}
        </div>
      </main>

      {/* Bottom Refresh Bar */}
      <nav className="p-4 bg-zinc-950 border-t border-zinc-900 flex justify-center">
        <button
          onClick={fetchHealth}
          disabled={loading}
          className="px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-bold tracking-wider hover:bg-zinc-800 active:scale-95 transition text-white shadow-lg flex items-center gap-2 disabled:opacity-50"
        >
          {loading ? "SYNCING..." : "↻ REFRESH STATS"}
        </button>
      </nav>
    </div>
  );
}
