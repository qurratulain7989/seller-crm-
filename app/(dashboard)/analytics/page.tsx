"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import {
  TrendingUp, Users, MapPin, ShoppingBag,
  Trophy, Star, Loader2, ArrowUpRight
} from "lucide-react";
import { formatCurrency, formatPhone } from "@/lib/utils";

type AnalyticsData = {
  totalCustomers: number;
  newThisMonth: number;
  totalRevenue: number;
  totalProfit: number;
  inactiveCount: number;
  topCustomers: {
    id: string; name: string; phone: string; city: string | null;
    totalPurchase: number; netProfit: number; orderCount: number;
  }[];
  monthlyRevenue: { month: string; revenue: number; profit: number }[];
  cityStats: { city: string; customers: number; revenue: number }[];
  sourceStats: { source: string; count: number }[];
};

const COLORS = ["#16a34a", "#f97316", "#3b82f6", "#8b5cf6", "#ec4899", "#14b8a6", "#f59e0b"];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name: string; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-lg text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {typeof p.value === "number" && p.name.toLowerCase().includes("revenue") || p.name.toLowerCase().includes("profit")
            ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
      </div>
    );
  }

  if (!data) return <p className="text-red-500">Data load nahi hua</p>;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "Total Customers", value: data.totalCustomers.toString(), sub: `+${data.newThisMonth} is mahine`, color: "bg-brand-600" },
          { icon: TrendingUp, label: "Total Revenue", value: formatCurrency(data.totalRevenue), sub: "Sab orders ka total", color: "bg-blue-500" },
          { icon: ShoppingBag, label: "Net Profit", value: formatCurrency(data.totalProfit), sub: "Revenue - Expense", color: "bg-orange-500" },
          { icon: MapPin, label: "Cities", value: data.cityStats.length.toString(), sub: "Jahan customers hain", color: "bg-purple-500" },
        ].map((s) => (
          <div key={s.label} className="card">
            <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center mb-3`}>
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-xs text-brand-600 font-medium mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Monthly Revenue Chart */}
      <div className="card">
        <h3 className="section-title mb-4">Monthly Revenue & Profit</h3>
        {data.monthlyRevenue.every((m) => m.revenue === 0) ? (
          <div className="text-center py-12 text-gray-400">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Abhi koi data nahi. Orders add karein!</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.monthlyRevenue} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="#16a34a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="profit" name="Profit" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-orange-500" />
            <h3 className="section-title">Top 10 Customers</h3>
          </div>
          {data.topCustomers.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">Customers add karein</p>
          ) : (
            <div className="space-y-2">
              {data.topCustomers.map((c, i) => (
                <Link key={c.id} href={`/customers/${c.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      i === 0 ? "bg-yellow-400 text-yellow-900" :
                      i === 1 ? "bg-gray-300 text-gray-700" :
                      i === 2 ? "bg-orange-300 text-orange-800" :
                      "bg-gray-100 text-gray-500"
                    }`}>{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.city || "—"} · {c.orderCount} orders</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-brand-700 text-sm">{formatCurrency(c.totalPurchase)}</p>
                      <p className="text-xs text-orange-500">+{formatCurrency(c.netProfit)}</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* City Stats */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-purple-500" />
            <h3 className="section-title">City-wise Revenue</h3>
          </div>
          {data.cityStats.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">City wali information add karein</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={data.cityStats.slice(0, 6)}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    dataKey="revenue"
                    nameKey="city"
                    paddingAngle={3}
                  >
                    {data.cityStats.slice(0, 6).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {data.cityStats.slice(0, 5).map((c, i) => (
                  <div key={c.city} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-sm font-medium text-gray-700">{c.city}</span>
                      <span className="text-xs text-gray-400">({c.customers} customers)</span>
                    </div>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(c.revenue)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Source Stats */}
      {data.sourceStats.length > 0 && (
        <div className="card">
          <h3 className="section-title mb-4">Customer Sources</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {data.sourceStats.map((s, i) => (
              <div key={s.source} className="text-center p-4 rounded-xl" style={{ backgroundColor: `${COLORS[i % COLORS.length]}15` }}>
                <p className="text-2xl font-bold" style={{ color: COLORS[i % COLORS.length] }}>{s.count}</p>
                <p className="text-sm text-gray-600 font-medium mt-1">{s.source}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
