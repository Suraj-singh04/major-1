"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Merchandiser/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from "recharts";
import {
  BarChart3, Bell, ShoppingCart, TrendingUp, Lightbulb, Loader2,
  PackageSearch, Users, Award,
} from "lucide-react";


const PERIOD_OPTIONS = [
  { label: "Last 7d", value: 7 },
  { label: "Last 30d", value: 30 },
  { label: "Last 90d", value: 90 },
];

// Premium color palette
const CHART_COLORS = {
  sent: "#6366f1",
  ordered: "#10b981",
  viewed: "#8b5cf6",
  bars: ["#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd", "#818cf8", "#4f46e5", "#7c3aed", "#5b21b6"],
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-slate-200/80 rounded-xl shadow-xl px-4 py-3 text-sm">
      <p className="font-bold text-slate-700 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 font-semibold" style={{ color: p.color }}>
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span className="text-slate-500 capitalize">{p.dataKey}:</span>
          <span>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

function EmptyChart({ message }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-3">
      <BarChart3 className="h-10 w-10 text-slate-200" />
      <p className="text-sm font-medium text-slate-400">{message}</p>
    </div>
  );
}

function StatPill({ icon: Icon, label, value, color }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold ${color}`}>
      <Icon className="h-3.5 w-3.5" />
      <span className="text-slate-500">{label}:</span>
      <span>{value}</span>
    </div>
  );
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setData(null);
    async function fetchData() {
      try {
        // Dynamically resolve the merchandiser ID — never hardcode IDs that break on re-seed
        const meRes = await fetch("/api/users/me");
        const meData = await meRes.json();
        if (!meData.success) {
          console.error("Could not resolve merchandiser:", meData.error);
          return;
        }
        const MERCHANDISER_ID = meData.user.id;

        const res = await fetch(`/api/analytics?merchandiserId=${MERCHANDISER_ID}&days=${period}`);
        const json = await res.json();
        if (json.success) setData(json);
        else console.error("Analytics error:", json.error);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [period]);

  const totalSent = data?.notificationsOverTime?.reduce((s, d) => s + d.sent, 0) ?? 0;
  const totalOrdered = data?.notificationsOverTime?.reduce((s, d) => s + d.ordered, 0) ?? 0;
  const convRate = totalSent > 0 ? ((totalOrdered / totalSent) * 100).toFixed(1) : "0.0";

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-50 to-slate-100/80">
      <Sidebar />

      <main className="mx-auto w-full max-w-[1600px] px-4 pt-24 pb-16 sm:px-8 lg:px-12 xl:px-20">

        {/* HEADER */}
        <header className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 drop-shadow-sm">
              Analytics
            </h1>
            <p className="mt-2 text-base font-medium text-slate-500">
              Performance over time — this is what impresses in a demo.
            </p>
          </div>
          {/* Period selector */}
          <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-slate-200/60">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200 ${
                  period === opt.value
                    ? "bg-slate-900 text-white shadow-md"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/80"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </header>

        {/* SUMMARY KPI ROW */}
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4 mb-8">
          {[
            { label: "Alerts Sent", value: loading ? "—" : totalSent, icon: Bell, gradient: "from-indigo-400 to-indigo-500", iconBg: "from-indigo-50 to-indigo-100", iconColor: "text-indigo-600", sub: "this period", subColor: "text-indigo-600 bg-indigo-50" },
            { label: "Orders Placed", value: loading ? "—" : totalOrdered, icon: ShoppingCart, gradient: "from-emerald-400 to-teal-500", iconBg: "from-emerald-50 to-teal-100", iconColor: "text-emerald-600", sub: "conversions", subColor: "text-emerald-600 bg-emerald-50" },
            { label: "Conversion Rate", value: loading ? "—" : `${convRate}%`, icon: TrendingUp, gradient: "from-violet-400 to-purple-500", iconBg: "from-violet-50 to-purple-100", iconColor: "text-violet-600", sub: "alert → order", subColor: "text-violet-700 bg-violet-50" },
            { label: "Categories", value: loading ? "—" : (data?.conversionByCategory?.length ?? 0), icon: PackageSearch, gradient: "from-amber-400 to-orange-500", iconBg: "from-amber-50 to-orange-100", iconColor: "text-amber-600", sub: "tracked", subColor: "text-amber-700 bg-amber-50" },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.label} className="relative overflow-hidden bg-white/90 backdrop-blur-sm border-slate-200/60 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <div className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${card.gradient}`} />
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6">
                  <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">{card.label}</CardTitle>
                  <div className={`p-2.5 bg-gradient-to-br ${card.iconBg} rounded-xl shadow-inner`}>
                    <Icon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-black text-slate-800 tracking-tight">{card.value}</div>
                  <p className={`text-xs font-semibold mt-2 inline-block px-2 py-0.5 rounded-sm ${card.subColor}`}>{card.sub}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* CHARTS ROW 1 */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 mb-8">

          {/* Notifications Over Time */}
          <Card className="relative overflow-hidden border-slate-200/60 shadow-sm bg-white/90 backdrop-blur-sm">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-400 to-violet-500" />
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4 pt-6">
              <CardTitle className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 rounded-lg"><Bell className="h-4 w-4 text-indigo-600" /></div>
                Notifications Over Time
              </CardTitle>
              <CardDescription className="font-medium text-slate-500 mt-0.5">
                Alerts sent vs orders placed daily
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="flex items-center justify-center h-48"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" /></div>
              ) : !data?.notificationsOverTime?.length ? (
                <EmptyChart message="No notification data for this period" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data.notificationsOverTime} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} tickLine={false} axisLine={false} tickFormatter={(v) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend formatter={(v) => <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "capitalize" }}>{v}</span>} />
                    <Line type="monotone" dataKey="sent" stroke={CHART_COLORS.sent} strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                    <Line type="monotone" dataKey="ordered" stroke={CHART_COLORS.ordered} strokeWidth={2.5} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Conversion by Category */}
          <Card className="relative overflow-hidden border-slate-200/60 shadow-sm bg-white/90 backdrop-blur-sm">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4 pt-6">
              <CardTitle className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <div className="p-1.5 bg-emerald-100 rounded-lg"><BarChart3 className="h-4 w-4 text-emerald-600" /></div>
                Conversion by Category
              </CardTitle>
              <CardDescription className="font-medium text-slate-500 mt-0.5">
                Orders ÷ Alerts per product category
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="flex items-center justify-center h-48"><Loader2 className="h-6 w-6 animate-spin text-emerald-500" /></div>
              ) : !data?.conversionByCategory?.length ? (
                <EmptyChart message="No category data for this period" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.conversionByCategory} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="category" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 600 }} tickLine={false} axisLine={false} unit="%" />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="conversionRate" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {data.conversionByCategory.map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS.bars[i % CHART_COLORS.bars.length]} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        {/* CHARTS ROW 2 */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 mb-8">

          {/* Top Products by At-Risk Frequency */}
          <Card className="relative overflow-hidden border-slate-200/60 shadow-sm bg-white/90 backdrop-blur-sm">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 to-orange-500" />
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4 pt-6">
              <CardTitle className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 rounded-lg"><PackageSearch className="h-4 w-4 text-amber-600" /></div>
                Top Products by At-Risk Frequency
              </CardTitle>
              <CardDescription className="font-medium text-slate-500 mt-0.5">
                Products flagged most often by the engine
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {loading ? (
                <div className="flex items-center justify-center h-48"><Loader2 className="h-6 w-6 animate-spin text-amber-500" /></div>
              ) : !data?.topProductsByRisk?.length ? (
                <EmptyChart message="No product data for this period" />
              ) : (
                <div className="flex flex-col gap-3">
                  {data.topProductsByRisk.map((p, i) => {
                    const maxCount = data.topProductsByRisk[0].count;
                    const pct = maxCount > 0 ? (p.count / maxCount) * 100 : 0;
                    return (
                      <div key={p.product} className="flex items-center gap-3 group">
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black shadow-sm ${
                          i === 0 ? "bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700" :
                          i === 1 ? "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700" :
                          i === 2 ? "bg-gradient-to-br from-orange-50 to-orange-100 text-orange-700" :
                          "bg-slate-50 text-slate-500"
                        }`}>{i + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-bold text-slate-700 truncate">{p.product}</p>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <span className="text-xs font-black text-slate-800">{p.count}</span>
                              <Badge variant="outline" className="text-[10px] font-bold bg-slate-50 text-slate-500 border-slate-200 px-1.5">{p.category}</Badge>
                            </div>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Retailer Rankings */}
          <Card className="relative overflow-hidden border-slate-200/60 shadow-sm bg-white/90 backdrop-blur-sm">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-violet-400 to-purple-500" />
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4 pt-6">
              <CardTitle className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <div className="p-1.5 bg-violet-100 rounded-lg"><Award className="h-4 w-4 text-violet-600" /></div>
                Retailer Rankings
              </CardTitle>
              <CardDescription className="font-medium text-slate-500 mt-0.5">
                Composite score · orders · conversion rate
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center h-48"><Loader2 className="h-6 w-6 animate-spin text-violet-500" /></div>
              ) : !data?.retailerRankings?.length ? (
                <EmptyChart message="No retailer data for this period" />
              ) : (
                <div className="divide-y divide-slate-100">
                  {data.retailerRankings.map((r, i) => (
                    <div key={r.name} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/80 transition-colors group">
                      <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ring-1 shadow-sm ${
                        i === 0 ? "bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 ring-amber-300" :
                        i === 1 ? "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 ring-slate-300" :
                        i === 2 ? "bg-gradient-to-br from-orange-50 to-orange-100 text-orange-800 ring-orange-200" :
                        "bg-slate-50 text-slate-500 ring-slate-200"
                      }`}>{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-700 transition-colors truncate">{r.name}</p>
                        <div className="flex gap-3 mt-0.5">
                          <span className="text-xs text-slate-400 font-semibold">{r.orders} orders</span>
                          <span className="text-xs text-slate-400 font-semibold">{r.notifs} alerts</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-xs font-extrabold bg-indigo-50 text-indigo-700 border-indigo-200 px-2">
                          {r.compositeScore}
                        </Badge>
                        <Badge variant="outline" className={`text-xs font-extrabold border px-2 ${
                          r.conversionRate >= 10 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          r.conversionRate >= 5 ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-slate-50 text-slate-500 border-slate-200"
                        }`}>
                          {r.conversionRate}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* INSIGHT CARDS */}
        {!loading && data?.insights?.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-xl shadow-inner">
                <Lightbulb className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">Auto Insights</h2>
                <p className="text-sm text-slate-500 font-medium">Engine-generated observations from your data</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {data.insights.map((insight, i) => (
                <div
                  key={i}
                  className="relative overflow-hidden flex items-start gap-4 bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-2xl px-5 py-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                >
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 opacity-80" />
                  <span className="text-2xl shrink-0 mt-0.5">{insight.icon}</span>
                  <p className="text-sm font-semibold text-slate-700 leading-relaxed">{insight.text}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
