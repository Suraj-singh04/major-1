"use client";

import { useState } from "react";
import Sidebar from "@/components/Merchandiser/Sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Plus, Filter, Users, Calendar, Fingerprint, Package, IndianRupee, Target } from "lucide-react";

export default function InventoryPage() {
  const [filter, setFilter] = useState("All");
  const [selectedBatch, setSelectedBatch] = useState(null);

  const mockBatches = [
    { id: "cmlxazd1", name: "Maaza Mango 600ml", category: "Beverages", qty: 298, days: 2, price: 36.08, urgency: 0.92, status: "critical", retailers: [{ name: "Shree Ram Provision", score: 81 }, { name: "Sharma General Store", score: 66 }, { name: "Bharat Bazaar", score: 56 }] },
    { id: "cmlxazd2", name: "Amul Cheese 200g", category: "Dairy", qty: 394, days: 2, price: 125, urgency: 0.91, status: "critical", retailers: [{ name: "Sharma General Store", score: 87 }, { name: "FreshMart", score: 72 }, { name: "City Store", score: 61 }] },
    { id: "cmlxazd3", name: "Mother Dairy Curd", category: "Dairy", qty: 456, days: 4, price: 45, urgency: 0.72, status: "warning", retailers: [{ name: "Jai Hind Stores", score: 76 }, { name: "Kiran Provision", score: 65 }, { name: "Daily Mart", score: 55 }] },
    { id: "cmlxazd4", name: "Tata Salt 1kg", category: "Staples", qty: 202, days: 30, price: 18, urgency: 0.1, status: "safe", retailers: [{ name: "Mega Store", score: 92 }, { name: "Shree Ram Provision", score: 88 }, { name: "Daily Needs", score: 79 }] },
  ];

  const filterTabs = ["All", "Critical", "Warning", "Safe", "Expired"];

  const filteredBatches = filter === "All"
    ? mockBatches
    : mockBatches.filter(b => b.status.toLowerCase() === filter.toLowerCase());

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-50 to-slate-100/80">
      <Sidebar />

      <main className="mx-auto w-full max-w-[1600px] px-4 pt-24 pb-12 sm:px-8 lg:px-12 xl:px-20">
        {/* HEADER */}
        <header className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 drop-shadow-sm">
              Inventory
            </h1>
            <p className="mt-2 text-base font-medium text-slate-500">
              Manage out-of-stock, safe, and at-risk product batches.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-sm text-slate-700 hover:text-blue-700 hover:bg-slate-50/80 transition-all font-bold">
              <Filter className="mr-2 h-4 w-4" /> Filter
            </Button>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 font-bold">
              <Plus className="mr-2 h-4 w-4" /> Add Batch
            </Button>
          </div>
        </header>

        {/* TABS */}
        <div className="mb-8 flex space-x-1 p-1 bg-slate-200/50 backdrop-blur-sm rounded-xl max-w-fit shadow-inner border border-slate-200/30">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all duration-300 ${filter === tab
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* TABLE CARD */}
        <Card className="shadow-sm border-slate-200/60 overflow-hidden bg-white">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-slate-100">
                  <TableHead className="w-16 text-center font-bold text-slate-500 uppercase tracking-wider text-xs py-4 px-6">Status</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-xs py-4">Product</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-xs py-4">Category</TableHead>
                  <TableHead className="text-right font-bold text-slate-500 uppercase tracking-wider text-xs py-4">Qty</TableHead>
                  <TableHead className="text-center font-bold text-slate-500 uppercase tracking-wider text-xs py-4">Days Left</TableHead>
                  <TableHead className="text-right font-bold text-slate-500 uppercase tracking-wider text-xs py-4 px-6">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBatches.map((batch) => (
                  <TableRow
                    key={batch.id}
                    onClick={() => setSelectedBatch(batch)}
                    className="hover:bg-slate-50/80 transition-colors border-slate-100 cursor-pointer group"
                  >
                    <TableCell className="text-center py-4 px-6">
                      <div className={`mx-auto h-2.5 w-2.5 rounded-full ring-4 shadow-sm ${batch.status === 'critical' ? 'bg-red-500 ring-red-100 animate-pulse' :
                          batch.status === 'warning' ? 'bg-amber-400 ring-amber-100' :
                            'bg-emerald-500 ring-emerald-100'
                        }`}></div>
                    </TableCell>
                    <TableCell className="font-bold text-slate-800 py-4 group-hover:text-blue-700 transition-colors">{batch.name}</TableCell>
                    <TableCell className="font-semibold text-slate-500 py-4">{batch.category}</TableCell>
                    <TableCell className="text-right font-extrabold text-slate-700 py-4">{batch.qty}</TableCell>
                    <TableCell className="text-center py-4">
                      <Badge variant={batch.status === 'critical' ? 'destructive' : 'secondary'} className={
                        batch.status === 'warning' ? 'bg-amber-100/80 text-amber-800 hover:bg-amber-200 border-amber-200/50 shadow-sm px-2.5 py-0.5' :
                          batch.status === 'safe' ? 'bg-emerald-100/80 text-emerald-800 hover:bg-emerald-200 border-emerald-200/50 shadow-sm px-2.5 py-0.5' :
                            'shadow-sm px-2.5 py-0.5 shadow-red-200/50'
                      }>
                        {batch.days}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-bold text-slate-600 py-4 px-6">₹{batch.price.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {filteredBatches.length === 0 && (
              <div className="py-20 text-center flex flex-col items-center">
                <Target className="h-10 w-10 text-slate-300 mb-3" />
                <p className="text-slate-500 font-medium">No inventory matches your current filter.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* ITEM SIDE DRAWER */}
      <Sheet open={!!selectedBatch} onOpenChange={(open) => !open && setSelectedBatch(null)}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px] flex flex-col bg-slate-50/95 backdrop-blur-xl border-l border-slate-200 shadow-2xl p-0">
          {selectedBatch && (
            <>
              {/* Drawer Header Area */}
              <div className="p-6 bg-white border-b border-slate-200/80 shadow-sm relative overflow-hidden">
                <div className={`absolute top-0 inset-x-0 h-1.5 ${selectedBatch.status === 'critical' ? 'bg-gradient-to-r from-red-500 to-rose-600' :
                    selectedBatch.status === 'warning' ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
                      'bg-gradient-to-r from-emerald-400 to-teal-500'
                  }`}></div>
                <SheetHeader className="pt-2">
                  <SheetTitle className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    {selectedBatch.name}
                  </SheetTitle>
                  <SheetDescription className="font-semibold text-slate-500">
                    Category: {selectedBatch.category}
                  </SheetDescription>
                </SheetHeader>
              </div>

              {/* Drawer Details Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">

                {/* Metrcs Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
                      <Fingerprint className="mr-1.5 h-3.5 w-3.5" /> Batch ID
                    </p>
                    <p className="text-lg font-bold text-slate-800 font-mono tracking-tight">{selectedBatch.id}</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
                      <Calendar className="mr-1.5 h-3.5 w-3.5" /> Expiry Status
                    </p>
                    <p className={`text-lg font-bold ${selectedBatch.status === 'critical' ? 'text-red-600' :
                        selectedBatch.status === 'warning' ? 'text-amber-600' : 'text-emerald-600'
                      }`}>{selectedBatch.days} days left</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
                      <Package className="mr-1.5 h-3.5 w-3.5" /> Total Quantity
                    </p>
                    <p className="text-lg font-bold text-slate-800">{selectedBatch.qty} units</p>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center">
                      <IndianRupee className="mr-1.5 h-3.5 w-3.5" /> Price / Unit
                    </p>
                    <p className="text-lg font-bold text-slate-800">₹{selectedBatch.price.toFixed(2)}</p>
                  </div>
                </div>

                {/* Urgency Progress */}
                <div className="bg-white p-5 rounded-xl border border-slate-200/60 shadow-sm">
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-sm font-bold text-slate-700">Urgency Score</p>
                    <p className="text-2xl font-black tracking-tighter text-slate-900">{selectedBatch.urgency.toFixed(2)}</p>
                  </div>
                  <div className="relative h-2.5 w-full rounded-full bg-slate-100 overflow-hidden shadow-inner">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${selectedBatch.status === 'critical' ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-md shadow-red-500/50' :
                          selectedBatch.status === 'warning' ? 'bg-gradient-to-r from-amber-400 to-amber-500' :
                            'bg-gradient-to-r from-emerald-400 to-emerald-500'
                        }`}
                      style={{ width: `${selectedBatch.urgency * 100}%` }}
                    ></div>
                  </div>
                </div>

                {/* Top Retailers section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center">
                    <Users className="mr-2 h-4 w-4 text-slate-400" />
                    Top Match Retailers
                  </h3>
                  <div className="flex flex-col gap-3">
                    {selectedBatch.retailers.map((retailer, i) => (
                      <div key={i} className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all hover:border-slate-300 group">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black shadow-sm ${i === 0 ? 'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700' :
                              i === 1 ? 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700' :
                                'bg-gradient-to-br from-orange-50 to-orange-100 text-orange-800'
                            }`}>
                            #{i + 1}
                          </div>
                          <p className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">{retailer.name}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <Badge variant="outline" className="bg-slate-50 border-slate-200 text-xs font-extrabold text-blue-700 px-2 py-0.5">
                            score: {retailer.score}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button className="w-full mt-2 bg-gradient-to-r from-slate-800 to-slate-900 text-white font-bold hover:shadow-lg transition-all hover:-translate-y-0.5 h-12">
                    Action Matches ({selectedBatch.retailers.length})
                  </Button>
                </div>

              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

    </div>
  );
}
