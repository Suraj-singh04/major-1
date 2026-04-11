import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Menu,
  LayoutDashboard,
  AlertTriangle,
  Users,
  Inbox,
  Activity,
  TrendingUp,
  Settings,
  LogOut,
  PackageSearch
} from "lucide-react";

export default function Sidebar() {
  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { name: "At-Risk Inventory", href: "/admin/inventory", icon: AlertTriangle, variant: "destructive", badge: "37" },
    { name: "Retailer Matches", href: "/admin/matches", icon: Users },
    { name: "Notification Inbox", href: "/admin/inbox", icon: Inbox },
    { name: "Scoring Analytics", href: "/admin/scoring", icon: Activity },
    { name: "Weight Evolution", href: "/admin/weights", icon: TrendingUp },
  ];

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="fixed top-4 left-4 z-40 bg-white/80 backdrop-blur-sm shadow-sm border-slate-200/60 hover:bg-white hover:shadow-md transition-all">
          <Menu className="h-5 w-5 text-slate-700" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col w-[300px] sm:w-[350px] bg-gradient-to-br from-slate-50 to-white border-r border-slate-200/60 shadow-2xl">
        <SheetHeader className="pb-4 pt-6">
          <div className="flex items-center space-x-3 text-left">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-inner">
              <PackageSearch className="h-6 w-6 text-white" />
            </div>
            <div>
              <SheetTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600">Smart Engine</SheetTitle>
              <SheetDescription className="text-xs font-medium text-slate-500">
                Retailer Matching System
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto mt-4 px-1 custom-scrollbar">
          <nav className="flex flex-col gap-2">
            <h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Menu
            </h4>
            {navItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <SheetClose asChild key={index}>
                  <Link
                    href={item.href}
                    className={`group flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out hover:bg-slate-100/80 hover:text-blue-700 hover:shadow-sm ${
                      item.variant === "destructive" 
                        ? "text-red-600 hover:bg-red-50 hover:text-red-700" 
                        : "text-slate-700"
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon className={`mr-3 h-4 w-4 transition-transform duration-300 group-hover:scale-110 ${
                        item.variant === "destructive" ? "text-red-500" : "text-slate-400 group-hover:text-blue-600"
                      }`} />
                      {item.name}
                    </div>
                    {item.badge && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600 group-hover:bg-red-200 transition-colors">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                </SheetClose>
              )
            })}
          </nav>

          <Separator className="my-6 bg-slate-200/60" />
          
          <nav className="flex flex-col gap-2">
            <h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              System
            </h4>
            <SheetClose asChild>
              <Link href="/admin/settings" className="group flex items-center rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 transition-all hover:bg-slate-100/80 hover:text-blue-700 hover:shadow-sm">
                <Settings className="mr-3 h-4 w-4 text-slate-400 transition-transform duration-300 group-hover:scale-110 group-hover:text-blue-600" />
                Settings
              </Link>
            </SheetClose>
          </nav>
        </div>

        <div className="mt-auto px-1 pt-6">
          <SheetClose asChild>
            <Button variant="ghost" className="w-full justify-start text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent hover:border-slate-200 transition-all shadow-sm">
              <LogOut className="mr-3 h-4 w-4" />
              Sign Out
            </Button>
          </SheetClose>
          <div className="mt-4 pb-2 px-2">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md">
                MA
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800">Merchandiser Admin</p>
                <p className="text-xs text-slate-500">admin@engine.local</p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
