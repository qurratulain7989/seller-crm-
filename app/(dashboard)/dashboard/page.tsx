"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, TrendingUp, PiggyBank, AlertCircle,
  Trophy, UserPlus, ChevronRight, Loader2, Star
} from "lucide-react";
import { formatCurrency, formatPhone, daysSince } from "@/lib/utils";

type Stats = {
  totalCustomers: number;
  newThisMonth: number;
  totalRevenue: number;
  totalProfit: number;
  inactiveCount: number;
  bestCustomer: {
    id: string; name: string; phone: string;
    city: string | null; totalPurchase: number; orderCount: number;
  } | null;
  topCustomers: {
    id: string; name: string; phone: string;
    city: string | null; totalPurchase: number; netProfit: number;
    lastOrderAt: string | null; orderCount: number;
  }[];
};

function StatCard({
  icon: Icon, label, value, sub, color, loading
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  color: string;
  loading: boolean;
}) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {loading ? (
        <div className="mt-4 space-y-2">
          <div className="skeleton h-7 w-24" />
          <div className="skeleton h-4 w-32" />
        </div>
      ) : (
        <div className="mt-4">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          {sub && <p className="text-xs text-brand-600 font-medium mt-1">{sub}</p>}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const now = new Date();
  const monthName = now.toLocaleString("en-PK", { month: "long" });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-6 text-white">
        <p className="text-brand-200 text-sm font-medium">Aaj ka din</p>
        <h2 className="text-2xl font-bold mt-1">
          {now.toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" })}
        </h2>
        <div className="flex items-center gap-4 mt-4">
          <Link href="/customers/new" className="inline-flex items-center gap-2 bg-white text-brand-700 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-brand-50 transition-colors">
            <UserPlus className="w-4 h-4" /> Naya Customer
          </Link>
          <Link href="/customers" className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium transition-colors">
            Sab dekhen <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Customers"
          value={loading ? "—" : stats?.totalCustomers.toString() || "0"}
          sub={loading ? "" : `+${stats?.newThisMonth || 0} is mahine`}
          color="bg-brand-600"
          loading={loading}
        />
        <StatCard
          icon={TrendingUp}
          label="Total Revenue"
          value={loading ? "—" : formatCurrency(stats?.totalRevenue || 0)}
          color="bg-blue-500"
          loading={loading}
        />
        <StatCard
          icon={PiggyBank}
          label="Net Profit"
          value={loading ? "—" : formatCurrency(stats?.totalProfit || 0)}
          color="bg-orange-500"
          loading={loading}
        />
        <StatCard
          icon={AlertCircle}
          label="Inactive (30 din)"
          value={loading ? "—" : stats?.inactiveCount.toString() || "0"}
          sub="Reminder bhejein"
          color="bg-red-500"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Customer of Month */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-orange-500" />
            <h3 className="section-title">{monthName} ka Best Customer</h3>
          </div>
          {loading ? (
            <div className="space-y-3">
              <div className="skeleton h-14 w-full rounded-xl" />
            </div>
          ) : stats?.bestCustomer ? (
            <Link href={`/customers/${stats.bestCustomer.id}`}>
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-100 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Star className="w-7 h-7 text-white fill-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-lg truncate">{stats.bestCustomer.name}</p>
                  <p className="text-gray-500 text-sm">{formatPhone(stats.bestCustomer.phone)}</p>
                  {stats.bestCustomer.city && (
                    <p className="text-gray-400 text-xs mt-0.5">{stats.bestCustomer.city}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-orange-600 text-lg">
                    {formatCurrency(stats.bestCustomer.totalPurchase)}
                  </p>
                  <p className="text-gray-400 text-xs">{stats.bestCustomer.orderCount} orders</p>
                </div>
              </div>
            </Link>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Trophy className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Abhi koi customers nahi</p>
              <Link href="/customers/new" className="text-brand-600 text-sm font-semibold hover:underline mt-1 block">
                Pehla customer add karein →
              </Link>
            </div>
          )}
        </div>

        {/* Top Customers */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title">Top Customers</h3>
            <Link href="/customers?sortBy=totalPurchase" className="text-sm text-brand-600 font-semibold hover:underline">
              Sab dekhen
            </Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-12 w-full rounded-xl" />
              ))}
            </div>
          ) : stats?.topCustomers.length ? (
            <div className="space-y-2">
              {stats.topCustomers.slice(0, 5).map((c, i) => (
                <Link key={c.id} href={`/customers/${c.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      i === 0 ? "bg-yellow-400 text-yellow-900" :
                      i === 1 ? "bg-gray-300 text-gray-700" :
                      i === 2 ? "bg-orange-300 text-orange-800" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.city || "City nahi"} · {c.orderCount} orders</p>
                    </div>
                    <p className="font-bold text-brand-700 text-sm flex-shrink-0">
                      {formatCurrency(c.totalPurchase)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">Customers add karein</p>
            </div>
          )}
        </div>
      </div>

      {/* Inactive customers alert */}
      {!loading && (stats?.inactiveCount || 0) > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-red-800">
              {stats?.inactiveCount} customers ne 30 din se khareedari nahi ki
            </p>
            <p className="text-sm text-red-600 mt-0.5">
              WhatsApp reminder bhejen aur wapas layein
            </p>
          </div>
          <Link href="/templates" className="btn-primary text-sm py-2 px-4 flex-shrink-0">
            Templates
          </Link>
        </div>
      )}
    </div>
  );
}
