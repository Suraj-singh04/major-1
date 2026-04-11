"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Merchandiser/Sidebar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Bell,
  Eye,
  ShoppingCart,
  MessageSquareX,
  Send,
  TrendingDown,
  Package,
} from "lucide-react";

const outcomeConfig = {
  pending: {
    label: "Pending",
    className: "bg-amber-100/80 text-amber-800 border-amber-200/50",
    dot: "bg-amber-400 ring-amber-100 animate-pulse",
  },
  viewed: {
    label: "Viewed",
    className: "bg-blue-100/80 text-blue-800 border-blue-200/50",
    dot: "bg-blue-400 ring-blue-100",
  },
  ordered: {
    label: "Ordered",
    className: "bg-emerald-100/80 text-emerald-800 border-emerald-200/50",
    dot: "bg-emerald-500 ring-emerald-100",
  },
  ignored: {
    label: "Ignored",
    className: "bg-slate-100/80 text-slate-600 border-slate-200/50",
    dot: "bg-slate-300 ring-slate-100",
  },
};

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function FunnelBar({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-4">
      <span className="w-20 text-right text-xs font-bold text-slate-500 uppercase tracking-wider shrink-0">
        {label}
      </span>
      <div className="flex-1 h-5 rounded-full bg-slate-100 overflow-hidden shadow-inner">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${color}`}
          style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }}
        />
      </div>
      <span className="w-12 text-sm font-black text-slate-800 tabular-nums">{value}</span>
    </div>
  );
}

const FILTER_TABS = ["All", "Pending", "Viewed", "Ordered", "Ignored"];

export default function NotificationsPage() {
  const [logs, setLogs] = useState([]);
  const [summary, setSummary] = useState({ total: 0, pending: 0, viewed: 0, ordered: 0, ignored: 0 });
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // NOTE: swap for the authenticated user's ID once auth is wired up
        const MERCHANDISER_ID = "cmlxazd3s0000tt1bqbvqj8en";
        const res = await fetch(`/api/notifications/history?merchandiserId=${MERCHANDISER_ID}`);
        const data = await res.json();
        if (!data.success) {
          console.error("API error:", data.error);
          setLoading(false);
          return;
        }
        setLogs(data.notifications || []);
        const s = data.stats || {};
        setSummary({
          total: s.totalSent || 0,
          viewed: s.totalViewed || 0,
          ordered: s.totalOrdered || 0,
          ignored: s.totalIgnored || 0,
          pending: s.totalPending || 0,
        });
      } catch (err) {
        console.error("Failed to load notifications:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filteredLogs =
    filter === "All"
      ? logs
      : logs.filter((l) => l.outcome.toLowerCase() === filter.toLowerCase());

  const metricCards = [
    {
      label: "Sent",
      value: summary.total,
      icon: Send,
      gradient: "from-blue-400 to-blue-500",
      iconBg: "from-blue-50 to-blue-100",
      iconColor: "text-blue-600",
      subColor: "text-blue-600 bg-blue-50",
      sub: "Total dispatched",
    },
    {
      label: "Viewed",
      value: summary.viewed,
      icon: Eye,
      gradient: "from-indigo-400 to-violet-500",
      iconBg: "from-indigo-50 to-violet-100",
      iconColor: "text-indigo-600",
      subColor: "text-indigo-600 bg-indigo-50",
      sub: "Opened by retailer",
    },
    {
      label: "Ordered",
      value: summary.ordered,
      icon: ShoppingCart,
      gradient: "from-emerald-400 to-teal-500",
      iconBg: "from-emerald-50 to-teal-100",
      iconColor: "text-emerald-600",
      subColor: "text-emerald-600 bg-emerald-50",
      sub: "Converted to orders",
    },
    {
      label: "Ignored",
      value: summary.ignored + summary.pending,
      icon: MessageSquareX,
      gradient: "from-slate-300 to-slate-400",
      iconBg: "from-slate-50 to-slate-100",
      iconColor: "text-slate-500",
      subColor: "text-slate-600 bg-slate-50",
      sub: "Pending / no response",
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-50 to-slate-100/80">
      <Sidebar />

      <main className="mx-auto w-full max-w-[1600px] px-4 pt-24 pb-12 sm:px-8 lg:px-12 xl:px-20">
        {/* HEADER */}
        <header className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 drop-shadow-sm">
              Alerts &amp; Notifications
            </h1>
            <p className="mt-2 text-base font-medium text-slate-500">
              Command center — what was sent, to whom, and what happened.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-slate-200/60">
            <Bell className="h-4 w-4 text-amber-500" />
            {summary.total} notifications total
          </div>
        </header>

        {/* METRIC CARDS */}
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4 mb-10">
          {metricCards.map((card) => {
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

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* MAIN TABLE — 2/3 width */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm border-slate-200/60 overflow-hidden bg-white">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-0 pt-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-5">
                  <div>
                    <CardTitle className="text-xl font-extrabold text-slate-800">Notification Log</CardTitle>
                    <CardDescription className="font-medium text-slate-500 mt-1">
                      Every alert dispatched by the engine
                    </CardDescription>
                  </div>
                  {/* Filter Tabs */}
                  <div className="flex gap-1 bg-slate-100/80 p-1 rounded-lg">
                    {FILTER_TABS.map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setFilter(tab)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all duration-200 ${filter === tab
                            ? "bg-white text-blue-700 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                          }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-white hover:bg-white border-slate-100">
                      <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-xs py-4 pl-6">
                        Product
                      </TableHead>
                      <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-xs py-4">
                        Retailer
                      </TableHead>
                      <TableHead className="text-center font-bold text-slate-500 uppercase tracking-wider text-xs py-4">
                        Status
                      </TableHead>
                      <TableHead className="text-right font-bold text-slate-500 uppercase tracking-wider text-xs py-4 pr-6">
                        Sent
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-20 text-slate-400 font-medium">
                          <div className="flex flex-col items-center gap-3">
                            <div className="h-6 w-6 rounded-full border-t-2 border-b-2 border-blue-600 animate-spin" />
                            <p>Loading notifications...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : filteredLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-20">
                          <div className="flex flex-col items-center gap-3">
                            <Bell className="h-10 w-10 text-slate-200" />
                            <p className="text-slate-400 font-medium">No notifications found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLogs.map((log) => {
                        const cfg = outcomeConfig[log.outcome] || outcomeConfig.pending;
                        return (
                          <TableRow
                            key={log.notificationId}
                            className="hover:bg-slate-50/80 transition-colors border-slate-100 group cursor-default"
                          >
                            <TableCell className="py-4 pl-6">
                              <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-slate-100 rounded-lg">
                                  <Package className="h-3.5 w-3.5 text-slate-500" />
                                </div>
                                <div>
                                  <p className="font-bold text-slate-800 text-sm leading-tight">
                                    {log.batch?.product}
                                  </p>
                                  <p className="text-xs text-slate-400 font-medium">{log.batch?.category}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <div>
                                <p className="font-semibold text-slate-700 text-sm">{log.retailer?.shopName}</p>
                                <p className="text-xs text-slate-400 font-medium">Rank #{log.retailerRank}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-4">
                              <div className="flex items-center justify-center gap-2">
                                <div className={`h-2 w-2 rounded-full ring-4 ${cfg.dot}`} />
                                <Badge
                                  variant="outline"
                                  className={`text-xs font-bold px-2.5 py-0.5 border ${cfg.className}`}
                                >
                                  {cfg.label}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-right py-4 pr-6">
                              <span className="text-sm font-semibold text-slate-500">
                                {timeAgo(log.sentAt)}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN — Conversion Funnel */}
          <div className="flex flex-col gap-6">
            <Card className="shadow-md border-transparent overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white">
              <CardHeader className="border-b border-slate-700/50 pb-5 pt-6 bg-slate-900/50">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <div className="p-1.5 bg-blue-500/20 rounded-md">
                    <TrendingDown className="h-5 w-5 text-blue-400" />
                  </div>
                  Conversion Funnel
                </CardTitle>
                <CardDescription className="text-slate-400 font-medium mt-1">
                  Alert-to-order drop-off
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 flex flex-col gap-5">
                <FunnelBar
                  label="Sent"
                  value={summary.total}
                  max={summary.total}
                  color="bg-gradient-to-r from-blue-500 to-blue-400"
                />
                <FunnelBar
                  label="Viewed"
                  value={summary.viewed}
                  max={summary.total}
                  color="bg-gradient-to-r from-violet-500 to-indigo-400"
                />
                <FunnelBar
                  label="Ordered"
                  value={summary.ordered}
                  max={summary.total}
                  color="bg-gradient-to-r from-emerald-500 to-teal-400"
                />
                <FunnelBar
                  label="Ignored"
                  value={summary.ignored}
                  max={summary.total}
                  color="bg-gradient-to-r from-slate-500 to-slate-400"
                />

                {/* Conversion rate */}
                <div className="mt-4 pt-4 border-t border-slate-700/50">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Conversion Rate
                  </p>
                  <p className="text-3xl font-black text-white tracking-tight">
                    {summary.total > 0
                      ? ((summary.ordered / summary.total) * 100).toFixed(1)
                      : "0.0"}
                    <span className="text-lg font-bold text-slate-400 ml-1">%</span>
                  </p>
                  <p className="text-xs text-slate-500 font-medium mt-1">Alerts → Orders</p>
                </div>
              </CardContent>
            </Card>

            {/* Urgency Score breakdown */}
            <Card className="shadow-sm border-slate-200/60 overflow-hidden bg-white">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4 pt-5">
                <CardTitle className="text-base font-extrabold text-slate-800">Urgency Breakdown</CardTitle>
                <CardDescription className="text-xs font-medium text-slate-500 mt-0.5">
                  Distribution of alert urgency scores
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 flex flex-col gap-3">
                {[
                  { label: "Critical (≥0.8)", threshold: 0.8, color: "bg-gradient-to-r from-red-500 to-rose-400", text: "text-red-600 bg-red-50" },
                  { label: "Warning (0.5–0.8)", threshold: 0.5, maxThreshold: 0.8, color: "bg-gradient-to-r from-amber-400 to-orange-400", text: "text-amber-700 bg-amber-50" },
                  { label: "Low (<0.5)", threshold: 0, maxThreshold: 0.5, color: "bg-gradient-to-r from-blue-300 to-blue-400", text: "text-blue-700 bg-blue-50" },
                ].map((tier) => {
                  const count = logs.filter((l) => {
                    const s = l.urgencyScore;
                    if (tier.maxThreshold !== undefined) {
                      return s >= tier.threshold && s < tier.maxThreshold;
                    }
                    return s >= tier.threshold;
                  }).length;
                  const pct = logs.length > 0 ? (count / logs.length) * 100 : 0;
                  return (
                    <div key={tier.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-600">{tier.label}</span>
                        <span className={`text-xs font-black px-2 py-0.5 rounded-sm ${tier.text}`}>{count}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${tier.color} transition-all duration-1000`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
