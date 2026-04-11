import Sidebar from "@/components/Merchandiser/Sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Package, Clock, Bell, ShoppingCart, ArrowRight, Zap } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-slate-50 to-slate-100/80">
      <Sidebar />
      
      <main className="mx-auto w-full max-w-[1600px] px-4 pt-24 pb-12 sm:px-8 lg:px-12 xl:px-20">
        <header className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 drop-shadow-sm">
              Good morning, Vikram <span className="inline-block hover:animate-pulse">👋</span>
            </h1>
            <p className="mt-2 text-base font-medium text-slate-500">
              Overview of your merchandiser engine status.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm border border-slate-200/60">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Today: 25 Feb 2026
          </div>
        </header>

        {/* METRICS ROW */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="relative overflow-hidden bg-white/90 backdrop-blur-sm border-slate-200/60 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-rose-400 to-rose-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6">
              <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">At-Risk Batches</CardTitle>
              <div className="p-2.5 bg-gradient-to-br from-rose-50 to-rose-100 rounded-xl shadow-inner">
                <Package className="h-5 w-5 text-rose-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-slate-800 tracking-tight">37</div>
              <p className="text-xs font-semibold text-rose-600 mt-2 bg-rose-50 inline-block px-2 py-0.5 rounded-sm">Requires attention</p>
            </CardContent>
          </Card>
          
          <Card className="relative overflow-hidden bg-white/90 backdrop-blur-sm border-slate-200/60 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-500 to-red-600"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6">
              <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Expiring Today</CardTitle>
              <div className="p-2.5 bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-inner">
                <Clock className="h-5 w-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-slate-800 tracking-tight">8</div>
              <p className="text-xs font-semibold text-red-600 mt-2 bg-red-50 inline-block px-2 py-0.5 rounded-sm">Critical urgency</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-white/90 backdrop-blur-sm border-slate-200/60 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 to-amber-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6">
              <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Notifications Pending</CardTitle>
              <div className="p-2.5 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl shadow-inner">
                <Bell className="h-5 w-5 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-slate-800 tracking-tight">185</div>
              <p className="text-xs font-semibold text-amber-600 mt-2 bg-amber-50 inline-block px-2 py-0.5 rounded-sm">Ready to send</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden bg-white/90 backdrop-blur-sm border-slate-200/60 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-500"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-6">
              <CardTitle className="text-sm font-bold text-slate-600 uppercase tracking-wider">Orders This Week</CardTitle>
              <div className="p-2.5 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl shadow-inner">
                <ShoppingCart className="h-5 w-5 text-emerald-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-slate-800 tracking-tight">12</div>
              <p className="text-xs font-semibold text-emerald-600 mt-2 bg-emerald-50 inline-block px-2 py-0.5 rounded-sm">From matched retailers</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* CRITICAL ALERTS */}
          <Card className="shadow-sm border-slate-200/60 overflow-hidden flex flex-col bg-white">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 pb-5 pt-6">
              <div>
                <CardTitle className="text-xl font-extrabold text-slate-800">Critical Alerts</CardTitle>
                <CardDescription className="font-medium text-slate-500 mt-1">Highest urgency items (urgency &gt; 0.7)</CardDescription>
              </div>
              <Link href="/admin/inventory" className="flex items-center text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50/80 px-4 py-2 rounded-full hover:bg-blue-100/80 shadow-sm">
                View All <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <Table>
                <TableHeader>
                  <TableRow className="bg-white hover:bg-white border-slate-100">
                    <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-xs py-4">Product</TableHead>
                    <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-xs py-4">Time Left</TableHead>
                    <TableHead className="text-right font-bold text-slate-500 uppercase tracking-wider text-xs py-4">Units</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { name: "Maaza Mango 600ml", time: "2 days", units: 298, status: "critical" },
                    { name: "Amul Cheese 200g", time: "2 days", units: 394, status: "critical" },
                    { name: "Mother Dairy Curd", time: "4 days", units: 456, status: "warning" },
                    { name: "Parle-G Gold", time: "6 days", units: 1200, status: "warning" },
                  ].map((alert, i) => (
                    <TableRow key={i} className="hover:bg-slate-50/80 transition-colors border-slate-100 group cursor-pointer">
                      <TableCell className="font-semibold text-slate-800 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`h-2 w-2 rounded-full ring-4 shadow-sm ${alert.status === 'critical' ? 'bg-red-500 ring-red-100 animate-pulse' : 'bg-amber-400 ring-amber-100'}`}></div>
                          {alert.name}
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge variant={alert.status === 'critical' ? 'destructive' : 'secondary'} className={alert.status === 'warning' ? 'bg-amber-100/80 text-amber-800 hover:bg-amber-200 border-amber-200/50 shadow-sm px-2.5 py-0.5' : 'shadow-sm px-2.5 py-0.5 shadow-red-200/50'}>
                          {alert.time} left
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-extrabold text-slate-700 py-4 group-hover:text-blue-600 transition-colors">{alert.units}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="flex flex-col gap-8">
            {/* TOP PERFORMERS */}
            <Card className="shadow-sm border-slate-200/60 overflow-hidden bg-white">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 bg-slate-50/50 pb-5 pt-6">
                <div>
                  <CardTitle className="text-xl font-extrabold text-slate-800">Top Performing Retailers</CardTitle>
                  <CardDescription className="font-medium text-slate-500 mt-1">Ranked by successful conversion</CardDescription>
                </div>
                <Link href="/admin/matches" className="flex items-center text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors bg-blue-50/80 px-4 py-2 rounded-full hover:bg-blue-100/80 shadow-sm">
                  View All <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-white hover:bg-white border-slate-100">
                      <TableHead className="w-16 text-center font-bold text-slate-500 uppercase tracking-wider text-xs py-4">Rank</TableHead>
                      <TableHead className="font-bold text-slate-500 uppercase tracking-wider text-xs py-4">Retailer</TableHead>
                      <TableHead className="text-center font-bold text-slate-500 uppercase tracking-wider text-xs py-4">Match Score</TableHead>
                      <TableHead className="text-right font-bold text-slate-500 uppercase tracking-wider text-xs py-4">Orders</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { name: "Sharma General Store", score: 87, orders: 4 },
                      { name: "Shree Ram Provision", score: 81, orders: 3 },
                      { name: "Jai Hind Stores", score: 76, orders: 2 },
                    ].map((retailer, i) => (
                      <TableRow key={i} className="hover:bg-slate-50/80 transition-colors border-slate-100 group cursor-pointer">
                        <TableCell className="text-center py-4">
                          <div className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs font-black shadow-sm ${
                            i === 0 ? 'bg-gradient-to-br from-amber-100 to-amber-200 text-amber-700 ring-1 ring-amber-300' : 
                            i === 1 ? 'bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 ring-1 ring-slate-300' :
                            'bg-gradient-to-br from-orange-50 to-orange-100 text-orange-800 ring-1 ring-orange-200'
                          }`}>
                            {i + 1}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-slate-800 py-4">{retailer.name}</TableCell>
                        <TableCell className="text-center py-4">
                          <span className="inline-flex items-center justify-center rounded-md bg-blue-50/80 px-3 py-1 text-xs font-extrabold text-blue-700 ring-1 ring-inset ring-blue-700/20 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            {retailer.score}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-extrabold text-slate-600 py-4 group-hover:text-blue-600 transition-colors">{retailer.orders}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* RECENT RUNS */}
            <Card className="shadow-md border-transparent overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white">
              <CardHeader className="border-b border-slate-700/50 pb-5 pt-6 bg-slate-900/50">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <div className="p-1.5 bg-amber-400/20 rounded-md">
                    <Zap className="h-5 w-5 text-amber-400 fill-amber-400" />
                  </div>
                  Recent Engine Runs
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    <TableRow className="hover:bg-slate-800/50 transition-colors border-slate-700/50">
                      <TableCell className="font-bold border-l-2 border-l-blue-500 py-4 px-6 text-slate-100">Today 9:00 AM</TableCell>
                      <TableCell className="text-sm font-medium text-slate-300 py-4">37 at-risk</TableCell>
                      <TableCell className="text-sm font-medium text-slate-300 py-4">185 notified</TableCell>
                      <TableCell className="text-right text-xs font-semibold text-slate-400 py-4">7.5s run time</TableCell>
                    </TableRow>
                    <TableRow className="hover:bg-slate-800/50 transition-colors border-transparent">
                      <TableCell className="font-bold border-l-2 border-l-transparent py-4 px-6 text-slate-200">Yesterday 9:00 AM</TableCell>
                      <TableCell className="text-sm font-medium text-slate-400 py-4">41 at-risk</TableCell>
                      <TableCell className="text-sm font-medium text-slate-400 py-4">200 notified</TableCell>
                      <TableCell className="text-right text-xs font-semibold text-slate-500 py-4">8.1s run time</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}