"use client";

import { useState, useEffect, useMemo } from "react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Users,
  Search,
  Store,
  ShoppingCart,
  Bell,
  TrendingUp,
  MapPin,
  Star,
} from "lucide-react";

const MERCHANDISER_ID = "cmlxazd3s0000tt1bqbvqj8en";

function ScoreBar({ label, value, max = 100, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-xs font-semibold text-slate-500 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs font-black text-slate-700 tabular-nums">{value}</span>
    </div>
  );
}

function scoreColor(score) {
  if (score >= 75) return "text-emerald-600 bg-emerald-50 border-emerald-200";
  if (score >= 50) return "text-amber-700 bg-amber-50 border-amber-200";
  return "text-red-600 bg-red-50 border-red-200";
}

function rankBadge(i) {
  if (i === 0) return "bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 ring-amber-300";
  if (i === 1) return "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 ring-slate-300";
  if (i === 2) return "bg-gradient-to-br from-orange-50 to-orange-100 text-orange-800 ring-orange-200";
  return "bg-slate-50 text-slate-500 ring-slate-200";
}

export default function RetailersPage() {
  const [retailers, setRetailers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/retailers?merchandiserId=${MERCHANDISER_ID}`);
        const data = await res.json();
        if (data.success) setRetailers(data.retailers);
        else console.error("Retailers API error:", data.error);
      } catch (err) {
        console.error("Failed:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return retailers;
    const q = search.toLowerCase();
    return retailers.filter(
      (r) =>
        r.shopName.toLowerCase().includes(q) ||
        r.bestCategory.toLowerCase().includes(q) ||
        r.categories.some((c) => c.toLowerCase().includes(q))
    );
  }, [search, retailers]);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-50 to-slate-100/80">
      <Sidebar />

      {/* RETAILER PROFILE DRAWER */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent
          side="right"
          className="w-full sm:w-[440px] p-0 flex flex-col bg-white border-l border-slate-200/80"
        >
          {selected && (
            <>
              {/* Drawer Header */}
              <div className="p-6 bg-white border-b border-slate-200/80 relative overflow-hidden">
                <div
                  className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${
                    selected.compositeScore >= 75
                      ? "from-emerald-400 to-teal-500"
                      : selected.compositeScore >= 50
                      ? "from-amber-400 to-orange-500"
                      : "from-red-500 to-rose-600"
                  }`}
                />
                <SheetHeader className="pt-2">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-lg shadow-md">
                      {selected.shopName[0]}
                    </div>
                    <div>
                      <SheetTitle className="text-xl font-extrabold text-slate-900 leading-tight">
                        {selected.shopName}
                      </SheetTitle>
                      <SheetDescription className="flex items-center gap-1.5 mt-1 text-slate-500 font-medium text-sm">
                        <MapPin className="h-3.5 w-3.5" />
                        {selected.address}
                      </SheetDescription>
                    </div>
                  </div>
                </SheetHeader>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-7">

                {/* Composite Score */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 text-white">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Composite Match Score
                  </p>
                  <div className="flex items-end gap-3">
                    <p className="text-5xl font-black tracking-tighter">{selected.compositeScore}</p>
                    <div className="mb-1">
                      <div className="flex gap-0.5 mb-0.5">
                        {[1,2,3,4,5].map(i => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${i <= Math.round(selected.compositeScore / 20) ? "text-amber-400 fill-amber-400" : "text-slate-600"}`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-slate-400 font-medium">out of 100</p>
                    </div>
                  </div>
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "Alerts Sent", value: selected.notifCount, icon: Bell, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Orders", value: selected.orderCount, icon: ShoppingCart, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Conversion", value: `${selected.conversionRate}%`, icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50" },
                  ].map((s) => {
                    const Icon = s.icon;
                    return (
                      <div key={s.label} className="bg-white border border-slate-200/60 rounded-xl p-3.5 shadow-sm text-center">
                        <div className={`inline-flex p-2 rounded-lg ${s.bg} mb-2`}>
                          <Icon className={`h-4 w-4 ${s.color}`} />
                        </div>
                        <p className="text-lg font-black text-slate-800">{s.value}</p>
                        <p className="text-xs font-medium text-slate-400">{s.label}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Score Breakdown */}
                <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-sm space-y-3.5">
                  <p className="text-sm font-bold text-slate-700 mb-4">Score Breakdown</p>
                  <ScoreBar label="Purchase Freq." value={selected.breakdown.purchaseFrequency} color="bg-gradient-to-r from-blue-500 to-blue-400" />
                  <ScoreBar label="Volume" value={selected.breakdown.volume} color="bg-gradient-to-r from-violet-500 to-indigo-400" />
                  <ScoreBar label="Recency" value={selected.breakdown.recency} color="bg-gradient-to-r from-amber-400 to-orange-400" />
                  <ScoreBar label="Sell-Through" value={selected.breakdown.sellThrough} color="bg-gradient-to-r from-teal-500 to-emerald-400" />
                  <ScoreBar label="Reliability" value={selected.breakdown.reliability} color="bg-gradient-to-r from-rose-400 to-pink-400" />
                </div>

                {/* Best categories */}
                <div className="bg-white border border-slate-200/60 rounded-xl p-5 shadow-sm">
                  <p className="text-sm font-bold text-slate-700 mb-3">Active Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.categories.length > 0 ? selected.categories.map((cat) => (
                      <Badge
                        key={cat}
                        variant="outline"
                        className={`text-xs font-bold px-2.5 py-1 border ${cat === selected.bestCategory ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-50 text-slate-600 border-slate-200"}`}
                      >
                        {cat === selected.bestCategory && <Star className="h-2.5 w-2.5 mr-1 fill-blue-500 text-blue-500 inline" />}
                        {cat}
                      </Badge>
                    )) : <p className="text-sm text-slate-400">No category data</p>}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <main className="mx-auto w-full max-w-[1600px] px-4 pt-24 pb-12 sm:px-8 lg:px-12 xl:px-20">
        {/* HEADER */}
        <header className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 drop-shadow-sm">
              Retailers
            </h1>
            <p className="mt-2 text-base font-medium text-slate-500">
              Know your buyers — who is reliable, who buys what, who converts.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-slate-200/60">
            <Users className="h-4 w-4 text-blue-500" />
            {retailers.length} retailers scored
          </div>
        </header>

        <Card className="shadow-sm border-slate-200/60 overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-5 pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-xl font-extrabold text-slate-800">Retailer Profiles</CardTitle>
                <CardDescription className="font-medium text-slate-500 mt-1">
                  Click any row to view the full performance profile
                </CardDescription>
              </div>
              {/* Search */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="retailer-search"
                  placeholder="Search by name or category…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 text-sm bg-white border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-white hover:bg-white border-slate-100">
                  <TableHead className="w-12 text-center font-bold text-slate-500 uppercase tracking-wider text-xs py-4 pl-6">
                    #
                  </TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-xs py-4">
                    Shop Name
                  </TableHead>
                  <TableHead className="text-center font-bold text-slate-500 uppercase tracking-wider text-xs py-4">
                    Score
                  </TableHead>
                  <TableHead className="text-center font-bold text-slate-500 uppercase tracking-wider text-xs py-4">
                    Orders
                  </TableHead>
                  <TableHead className="text-center font-bold text-slate-500 uppercase tracking-wider text-xs py-4">
                    Conv. Rate
                  </TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-xs py-4 pr-6">
                    Best Category
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20 text-slate-400">
                      <div className="flex flex-col items-center gap-3">
                        <div className="h-6 w-6 rounded-full border-t-2 border-b-2 border-blue-600 animate-spin" />
                        <p className="font-medium">Loading retailers…</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-20">
                      <div className="flex flex-col items-center gap-3">
                        <Store className="h-10 w-10 text-slate-200" />
                        <p className="text-slate-400 font-medium">No retailers found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((retailer, i) => (
                    <TableRow
                      key={retailer.retailerId}
                      onClick={() => setSelected(retailer)}
                      className="hover:bg-slate-50/80 transition-colors border-slate-100 cursor-pointer group"
                    >
                      <TableCell className="text-center py-4 pl-6">
                        <div className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ring-1 shadow-sm ${rankBadge(i)}`}>
                          {i + 1}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-600 font-black text-sm shadow-sm group-hover:from-blue-50 group-hover:to-blue-100 group-hover:text-blue-700 transition-colors">
                            {retailer.shopName[0]}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">
                              {retailer.shopName}
                            </p>
                            <p className="text-xs text-slate-400 font-medium truncate max-w-[180px]">{retailer.address}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <Badge
                          variant="outline"
                          className={`text-xs font-extrabold px-2.5 py-1 border ${scoreColor(retailer.compositeScore)}`}
                        >
                          {retailer.compositeScore}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <span className="font-bold text-slate-700">{retailer.orderCount}</span>
                      </TableCell>
                      <TableCell className="text-center py-4">
                        <span className={`text-sm font-bold ${retailer.conversionRate >= 10 ? "text-emerald-600" : retailer.conversionRate >= 5 ? "text-amber-600" : "text-slate-500"}`}>
                          {retailer.conversionRate}%
                        </span>
                      </TableCell>
                      <TableCell className="py-4 pr-6">
                        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 text-xs font-semibold">
                          {retailer.bestCategory}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
