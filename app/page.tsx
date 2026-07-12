"use client";

import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    recovery: 0,
    strain: "0.0",
    sleep: "0.0",
    hasData: false,
  });

  const triggerSync = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/sync", { method: "POST" });
      const data = await response.json();

      if (data.success) {
        setMetrics({
          recovery: data.metrics.calculated_recovery,
          strain: data.metrics.calculated_strain.toFixed(1),
          sleep: data.metrics.sleep_duration.toFixed(1),
          hasData: true,
        });
      } else {
        alert("Sync failed: " + data.error);
      }
    } catch (err) {
      alert("Error contacting sync engine.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col justify-between bg-black text-white">
      {/* Top Header */}
      <header className="px-6 pt-12 pb-4 flex justify-between items-center border-b border-zinc-900 bg-zinc-950/50 backdrop-blur">
        <h1 className="text-xl font-black tracking-widest">KINETIC</h1>

        {session ? (
          <button
            onClick={() => signOut()}
            className="w-8 h-8 rounded-full border border-zinc-700 bg-zinc-800 flex items-center justify-center text-xs font-bold overflow-hidden"
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
        ) : (
          <button
            onClick={() => signIn("google")}
            className="px-4 py-1.5 text-xs font-bold bg-white text-black rounded-full hover:bg-zinc-200 transition"
          >
            Login
          </button>
        )}
      </header>

      {/* Main Content View */}
      <main className="flex-1 overflow-y-auto px-6 py-6 flex flex-col justify-center space-y-6">
        {session ? (
          <>
            {/* Dynamic Recovery Ring */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 flex flex-col items-center justify-center space-y-4 shadow-xl">
              <div className="relative w-44 h-44 rounded-full border-8 border-zinc-800 flex items-center justify-center">
                {metrics.hasData && (
                  <div className="absolute inset-0 rounded-full border-8 border-emerald-500 border-t-transparent animate-spin [animation-duration:3s]"></div>
                )}
                <span
                  className={`text-5xl font-black transition-colors ${metrics.hasData ? "text-emerald-400" : "text-zinc-600"}`}
                >
                  {metrics.hasData ? `${metrics.recovery}%` : "--"}
                </span>
              </div>
              <p className="text-xs font-bold text-zinc-400 tracking-widest uppercase">
                {metrics.hasData
                  ? "Daily Recovery Index"
                  : "Awaiting Cloud Sync"}
              </p>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Day Strain
                </p>
                <p className="text-2xl font-black mt-1 text-blue-400">
                  {metrics.hasData ? `${metrics.strain} / 21` : "--"}
                </p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Sleep Duration
                </p>
                <p className="text-2xl font-black mt-1 text-purple-400">
                  {metrics.hasData ? `${metrics.sleep} hrs` : "--"}
                </p>
              </div>
            </div>

            {/* Action Trigger Button */}
            <button
              onClick={triggerSync}
              disabled={loading}
              className="w-full py-4 bg-zinc-900 border border-zinc-800 rounded-2xl text-sm font-bold tracking-wider hover:bg-zinc-800 active:scale-[0.99] transition text-emerald-400 shadow-lg disabled:opacity-50"
            >
              {loading ? "FETCHING BIOMETRICS..." : "SYNC GOOGLE HEALTH"}
            </button>
          </>
        ) : (
          <div className="text-center p-6 space-y-4">
            <span className="text-5xl">🔒</span>
            <h2 className="text-lg font-bold">Connect Your Health Account</h2>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
              Sign in using your Google Account to authorize Kinetic to pull
              your real-time recovery analytics.
            </p>
            <button
              onClick={() => signIn("google")}
              className="px-6 py-3 text-sm font-bold bg-white text-black rounded-xl hover:bg-zinc-200 transition shadow-md"
            >
              Sign In with Google
            </button>
          </div>
        )}
      </main>

      {/* Bottom Nav Bar */}
      <nav className="pb-8 pt-3 px-8 bg-zinc-950 border-t border-zinc-900 flex justify-between items-center text-zinc-500 text-xs font-medium">
        <button className="flex flex-col items-center space-y-1 text-white">
          <span className="text-lg">⚡</span>
          <span>Today</span>
        </button>
        <button className="flex flex-col items-center space-y-1">
          <span className="text-lg">📊</span>
          <span>Trends</span>
        </button>
        <button className="flex flex-col items-center space-y-1">
          <span className="text-lg">👤</span>
          <span>Profile</span>
        </button>
      </nav>
    </div>
  );
}
