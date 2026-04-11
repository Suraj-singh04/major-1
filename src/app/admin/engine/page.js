"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Merchandiser/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Play,
  Clock,
  PackageSearch,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Trophy,
  Timer,
  Loader2,
  History,
  BarChart3,
  ArrowRight,
  ChevronRight,
  Cpu,
} from "lucide-react";

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === now.toDateString()) return `Today at ${time}`;
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday at ${time}`;
  return `${d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })} at ${time}`;
}

const PIPELINE_STAGES = [
  { id: 1, label: "Analytics", desc: "Compute thresholds", icon: BarChart3, color: "from-blue-500 to-blue-600" },
  { id: 2, label: "At-Risk", desc: "Flag batches", icon: AlertTriangle, color: "from-amber-500 to-orange-500" },
  { id: 3, label: "Scoring", desc: "Rank retailers", icon: Trophy, color: "from-violet-500 to-purple-600" },
  { id: 4, label: "Notify", desc: "Dispatch alerts", icon: Bell, color: "from-emerald-500 to-teal-600" },
];

const runSteps = (result) => [
  {
    icon: CheckCircle2,
    gradient: "from-emerald-500 to-teal-600",
    label: "Analytics Computed",
    text: "ProductAnalytics refreshed — dynamic thresholds updated across all products",
  },
  {
    icon: AlertTriangle,
    gradient: result.atRiskCount > 0 ? "from-amber-500 to-orange-500" : "from-slate-400 to-slate-500",
    label: "At-Risk Batches Detected",
    text: `${result.atRiskCount} batch${result.atRiskCount !== 1 ? "es" : ""} flagged for imminent expiry`,
  },
  {
    icon: Trophy,
    gradient: "from-violet-500 to-purple-600",
    label: "Retailers Scored",
    text: "Composite scores computed for each retailer × at-risk product pair",
  },
  {
    icon: Bell,
    gradient: "from-blue-500 to-indigo-600",
    label: "Notifications Dispatched",
    text: `${result.notificationsCreated ?? 0} sent, ${result.notificationsSkipped ?? 0} skipped by deduplication guard`,
  },
  {
    icon: Timer,
    gradient: "from-slate-600 to-slate-700",
    label: "Run Complete",
    text: `Total engine time: ${result.engineRunMs?.toLocaleString() ?? "—"}ms`,
  },
];

export default function EnginePage() {
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [activeStage, setActiveStage] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await fetch("/api/engine/run");
        const data = await res.json();
        if (data.success) setHistory(data.runs);
      } catch (err) {
        console.error("Failed to load engine history:", err);
      } finally {
        setHistoryLoading(false);
      }
    }
    fetchHistory();
  }, []);

  async function handleRunEngine() {
    setRunning(true);
    setError(null);
    setLastResult(null);

    // Animate through pipeline stages
    for (let i = 1; i <= 4; i++) {
      setActiveStage(i);
      await new Promise((r) => setTimeout(r, 600));
    }

    try {
      const res = await fetch("/api/engine/run", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setLastResult(data);
        setHistory((prev) =>
          [
            {
              ranAt: new Date().toISOString(),
              atRiskCount: data.atRiskCount,
              notifiedCount: data.notificationsCreated ?? 0,
              runTimeSeconds: (data.engineRunMs / 1000).toFixed(1),
            },
            ...prev,
          ].slice(0, 10)
        );
      } else {
        setError(data.error || "Engine run failed");
      }
    } catch (err) {
      setError(err.message || "Network error");
    } finally {
      setRunning(false);
      setActiveStage(null);
    }
  }

  const lastRun = history[0] || null;

  // Summary stats from history
  const avgAtRisk =
    history.length > 0
      ? Math.round(history.reduce((s, r) => s + r.atRiskCount, 0) / history.length)
      : "—";
  const avgNotified =
    history.length > 0
      ? Math.round(history.reduce((s, r) => s + r.notifiedCount, 0) / history.length)
      : "—";
  const avgTime =
    history.length > 0
      ? (history.reduce((s, r) => s + parseFloat(r.runTimeSeconds), 0) / history.length).toFixed(1)
      : "—";

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-50 to-slate-100/80">
      <Sidebar />

      <main className="mx-auto w-full max-w-[1600px] px-4 pt-24 pb-16 sm:px-8 lg:px-12 xl:px-20">

        {/* HEADER */}
        <header className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 drop-shadow-sm">
              Engine Control
            </h1>
            <p className="mt-2 text-base font-medium text-slate-500">
              Trigger the smart expiry engine and monitor each run in real time.
            </p>
          </div>
          {lastRun && (
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-slate-200/60">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Last run: {formatDate(lastRun.ranAt)}
            </div>
          )}
        </header>

        {/* SUMMARY KPI ROW */}
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4 mb-8">
          {[
            {
              label: "Total Runs",
              value: history.length,
              icon: History,
              gradient: "from-blue-400 to-blue-500",
              iconBg: "from-blue-50 to-blue-100",
              iconColor: "text-blue-600",
              sub: "engine executions",
              subColor: "text-blue-600 bg-blue-50",
            },
            {
              label: "Avg At-Risk",
              value: avgAtRisk,
              icon: AlertTriangle,
              gradient: "from-amber-400 to-orange-500",
              iconBg: "from-amber-50 to-orange-100",
              iconColor: "text-amber-600",
              sub: "batches per run",
              subColor: "text-amber-700 bg-amber-50",
            },
            {
              label: "Avg Notified",
              value: avgNotified,
              icon: Bell,
              gradient: "from-violet-400 to-purple-500",
              iconBg: "from-violet-50 to-purple-100",
              iconColor: "text-violet-600",
              sub: "retailers per run",
              subColor: "text-violet-700 bg-violet-50",
            },
            {
              label: "Avg Duration",
              value: avgTime === "—" ? "—" : `${avgTime}s`,
              icon: Timer,
              gradient: "from-emerald-400 to-teal-500",
              iconBg: "from-emerald-50 to-teal-100",
              iconColor: "text-emerald-600",
              sub: "per run",
              subColor: "text-emerald-700 bg-emerald-50",
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.label}
                className="relative overflow-hidden bg-white/90 backdrop-blur-sm border-slate-200/60 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <div className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${card.gradient}`} />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6">
                  <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">
                    {card.label}
                  </CardTitle>
                  <div className={`p-2.5 bg-gradient-to-br ${card.iconBg} rounded-xl shadow-inner`}>
                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-slate-800 tracking-tight">{card.value}</div>
                  <p className={`text-xs font-semibold mt-2 inline-block px-2 py-0.5 rounded-sm ${card.subColor}`}>
                    {card.sub}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">

          {/* LEFT 2/3 */}
          <div className="lg:col-span-2 flex flex-col gap-8">

            {/* ENGINE HERO — dark premium card */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white shadow-2xl">
              {/* subtle glow blobs */}
              <div className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-indigo-600/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-violet-600/10 blur-3xl" />

              <div className="relative p-8 lg:p-10">
                {/* Top badge */}
                <div className="mb-6 flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-white/10 border border-white/10 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-300">
                    <Cpu className="h-3.5 w-3.5 text-indigo-400" />
                    v2 · Smart Matching Engine
                  </div>
                  {running && (
                    <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      RUNNING
                    </div>
                  )}
                </div>

                {/* Title */}
                <h2 className="text-3xl font-black tracking-tight leading-tight">
                  Smart Expiry Engine
                </h2>
                <p className="mt-2 text-slate-400 text-sm max-w-lg font-medium">
                  A 4-layer pipeline that automatically finds near-expiry inventory, scores the right retailers, and dispatches targeted notifications.
                </p>

                {/* PIPELINE STAGES */}
                <div className="mt-8 flex flex-wrap items-center gap-2">
                  {PIPELINE_STAGES.map((stage, i) => {
                    const Icon = stage.icon;
                    const isActive = running && activeStage === stage.id;
                    const isDone = running && activeStage > stage.id;
                    return (
                      <div key={stage.id} className="flex items-center gap-2">
                        <div
                          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all duration-500 ${
                            isActive
                              ? `bg-gradient-to-r ${stage.color} border-transparent shadow-lg scale-105`
                              : isDone
                              ? "bg-white/15 border-white/20"
                              : "bg-white/5 border-white/10"
                          }`}
                        >
                          <div className={`flex h-6 w-6 items-center justify-center rounded-lg ${isActive ? "bg-white/20" : "bg-white/10"}`}>
                            {isDone ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            ) : (
                              <Icon className={`h-3.5 w-3.5 ${isActive ? "text-white" : "text-slate-400"}`} />
                            )}
                          </div>
                          <div>
                            <p className={`text-xs font-black ${isActive || isDone ? "text-white" : "text-slate-400"}`}>{stage.label}</p>
                            <p className={`text-[10px] font-medium ${isActive ? "text-white/80" : "text-slate-600"}`}>{stage.desc}</p>
                          </div>
                        </div>
                        {i < PIPELINE_STAGES.length - 1 && (
                          <ChevronRight className={`h-4 w-4 shrink-0 transition-colors ${activeStage > stage.id ? "text-emerald-400" : "text-slate-700"}`} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Divider */}
                <div className="my-8 border-t border-white/10" />

                {/* Bottom row — last run info + button */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                  {lastRun ? (
                    <div className="flex flex-wrap gap-3">
                      <span className="flex items-center gap-1.5 bg-white/8 border border-white/10 px-3 py-1.5 rounded-full text-xs font-bold text-slate-300">
                        <PackageSearch className="h-3.5 w-3.5 text-amber-400" />
                        {lastRun.atRiskCount} at-risk last run
                      </span>
                      <span className="flex items-center gap-1.5 bg-white/8 border border-white/10 px-3 py-1.5 rounded-full text-xs font-bold text-slate-300">
                        <Bell className="h-3.5 w-3.5 text-violet-400" />
                        {lastRun.notifiedCount} notified
                      </span>
                      <span className="flex items-center gap-1.5 bg-white/8 border border-white/10 px-3 py-1.5 rounded-full text-xs font-bold text-slate-300">
                        <Clock className="h-3.5 w-3.5 text-emerald-400" />
                        {lastRun.runTimeSeconds}s
                      </span>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 font-medium">No runs recorded yet.</p>
                  )}

                  <button
                    id="run-engine-btn"
                    onClick={handleRunEngine}
                    disabled={running}
                    className="flex shrink-0 items-center gap-3 px-7 py-3.5 rounded-xl font-black text-sm bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
                  >
                    {running ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Running Engine…
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 fill-white" />
                        Run Engine Now
                        <ArrowRight className="h-4 w-4 opacity-70" />
                      </>
                    )}
                  </button>
                </div>

                {error && (
                  <p className="mt-4 text-sm font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-2.5 rounded-xl">
                    ⚠ {error}
                  </p>
                )}
              </div>
            </div>

            {/* LAST RUN RESULTS */}
            {lastResult && (
              <Card className="border-slate-200/60 shadow-sm bg-white/90 backdrop-blur-sm overflow-hidden">
                <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
                <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4 pt-6">
                  <CardTitle className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                    <div className="p-1.5 bg-emerald-100 rounded-lg">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    </div>
                    Last Run Results
                  </CardTitle>
                  <CardDescription className="font-medium text-slate-500 mt-0.5">
                    Pipeline execution log — step by step
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                  {runSteps(lastResult).map((step, i) => {
                    const Icon = step.icon;
                    return (
                      <div
                        key={i}
                        className="flex items-start gap-4 group bg-white border border-slate-200/60 rounded-xl px-5 py-4 shadow-sm hover:shadow-md hover:border-slate-300/80 transition-all duration-200"
                      >
                        <div className={`mt-0.5 shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${step.gradient} shadow-sm`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{step.label}</p>
                          <p className="text-sm font-semibold text-slate-700 mt-0.5 leading-snug">{step.text}</p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Batch table */}
                  {lastResult.batches?.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">
                        At-Risk Batch Preview
                      </p>
                      <div className="flex flex-col gap-2">
                        {lastResult.batches.slice(0, 5).map((b) => (
                          <div
                            key={b.batchId}
                            className="flex items-center justify-between bg-slate-50/80 border border-slate-200/60 rounded-xl px-5 py-3.5 hover:bg-white hover:shadow-sm transition-all"
                          >
                            <div>
                              <p className="text-sm font-bold text-slate-800">{b.product}</p>
                              <p className="text-xs text-slate-400 font-medium">{b.category}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={`text-xs font-bold border ${
                                  b.daysRemaining <= 2
                                    ? "bg-red-50 text-red-700 border-red-200"
                                    : b.daysRemaining <= 5
                                    ? "bg-amber-50 text-amber-700 border-amber-200"
                                    : "bg-slate-50 text-slate-600 border-slate-200"
                                }`}
                              >
                                {b.daysRemaining}d left
                              </Badge>
                              <Badge variant="outline" className="text-xs font-bold bg-indigo-50 text-indigo-700 border-indigo-200">
                                {b.topRetailers.length} matched
                              </Badge>
                            </div>
                          </div>
                        ))}
                        {lastResult.batches.length > 5 && (
                          <p className="text-center text-xs text-slate-400 font-medium py-1">
                            +{lastResult.batches.length - 5} more batches
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT — RUN HISTORY */}
          <div>
            <Card className="shadow-md border-transparent overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white sticky top-24">
              <div className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full bg-indigo-600/15 blur-3xl" />
              <CardHeader className="border-b border-slate-700/50 pb-5 pt-6 bg-slate-900/40 relative">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-500/20 rounded-md">
                    <History className="h-5 w-5 text-indigo-400" />
                  </div>
                  Run History
                </CardTitle>
                <CardDescription className="text-slate-400 font-medium mt-1">
                  {history.length > 0 ? `Last ${history.length} runs` : "No runs yet"}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0 relative">
                {historyLoading ? (
                  <div className="flex flex-col items-center justify-center py-14 gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
                    <p className="text-xs text-slate-500 font-medium">Loading…</p>
                  </div>
                ) : history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-14 gap-3">
                    <Clock className="h-10 w-10 text-slate-700" />
                    <p className="text-sm text-slate-500 font-medium">No runs yet — trigger one!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/60">
                    {history.map((run, i) => (
                      <div
                        key={i}
                        className={`px-5 py-4 hover:bg-white/5 transition-colors flex items-start justify-between gap-3 ${
                          i === 0 ? "border-l-2 border-l-indigo-500" : "border-l-2 border-l-transparent"
                        }`}
                      >
                        <div>
                          <p className={`text-sm font-bold ${i === 0 ? "text-indigo-300" : "text-slate-300"}`}>
                            {formatDate(run.ranAt)}
                          </p>
                          <div className="flex gap-3 mt-2">
                            <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                              <PackageSearch className="h-3 w-3 text-amber-400" />
                              {run.atRiskCount}
                            </span>
                            <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
                              <Bell className="h-3 w-3 text-violet-400" />
                              {run.notifiedCount}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs font-bold shrink-0 mt-0.5 border ${
                            i === 0
                              ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30"
                              : "bg-slate-800 text-slate-500 border-slate-700"
                          }`}
                        >
                          {run.runTimeSeconds}s
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
