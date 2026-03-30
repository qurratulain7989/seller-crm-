"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, TrendingUp, AlertCircle,
  Trophy, UserPlus, ChevronRight, Star,
  DollarSign, MessageCircle, CheckCircle2, Calendar
} from "lucide-react";
import { formatCurrency, formatPhone, daysSince, getWhatsAppUrl } from "@/lib/utils";

type InactiveCustomer = { id: string; name: string; phone: string; city: string | null; lastOrderAt: string | null };
type NewCustomer = { id: string; name: string; phone: string; city: string | null; createdAt: string };

type Stats = {
  totalCustomers: number;
  newThisMonth: number;
  totalRevenue: number;
  totalProfit: number;
  inactiveCount: number;
  inactiveCustomers: InactiveCustomer[];
  newCustomersThisMonth: NewCustomer[];
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

function StatCard({ icon: Icon, label, labelUr, value, sub, color, loading }: {
  icon: React.ElementType; label: string; labelUr: string;
  value: string; sub?: string; color: string; loading: boolean;
}) {
  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      {loading ? (
        <div className="mt-3 space-y-2">
          <div className="skeleton h-7 w-24" />
          <div className="skeleton h-4 w-32" />
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm font-semibold text-gray-600">{labelUr}</p>
          <p className="text-xs text-gray-400">{label}</p>
          {sub && <p className="text-xs text-brand-600 font-medium mt-1">{sub}</p>}
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sentMap, setSentMap] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));

    // Load sent map from localStorage
    try {
      const stored = JSON.parse(localStorage.getItem("wa_sent") || "{}");
      setSentMap(stored);
    } catch { /* ignore */ }
  }, []);

  function markSent(customerId: string) {
    const updated = { ...sentMap, [customerId]: Date.now() };
    setSentMap(updated);
    localStorage.setItem("wa_sent", JSON.stringify(updated));
  }

  function isSentRecently(customerId: string) {
    const ts = sentMap[customerId];
    if (!ts) return false;
    return Date.now() - ts < 24 * 60 * 60 * 1000;
  }

  const now = new Date();
  const monthName = now.toLocaleString("ur-PK", { month: "long" });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 rounded-2xl p-6 text-white">
        <p className="text-brand-200 text-sm">
          {now.toLocaleDateString("ur-PK", { weekday: "long" })} · {now.toLocaleDateString("en-PK", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <h2 className="text-2xl font-bold mt-1">خوش آمدید! 👋</h2>
        <p className="text-brand-200 text-sm mt-0.5">Welcome — Aapka dashboard tayyar hai</p>
        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <Link href="/customers/new" className="inline-flex items-center gap-2 bg-white text-brand-700 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-brand-50 transition-colors">
            <UserPlus className="w-4 h-4" /> Naya Customer
          </Link>
          <Link href="/hisab" className="inline-flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-white/30 transition-colors">
            <DollarSign className="w-4 h-4" /> Hisab Kitab
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
          labelUr="کل گاہک"
          label="Total Customers"
          value={loading ? "—" : stats?.totalCustomers.toString() || "0"}
          sub={loading ? "" : `+${stats?.newThisMonth || 0} is mahine`}
          color="bg-brand-600"
          loading={loading}
        />
        <StatCard
          icon={TrendingUp}
          labelUr="کل آمدنی"
          label="Total Revenue"
          value={loading ? "—" : formatCurrency(stats?.totalRevenue || 0)}
          color="bg-blue-500"
          loading={loading}
        />
        <StatCard
          icon={DollarSign}
          labelUr="خالص منافع"
          label="Net Profit"
          value={loading ? "—" : formatCurrency(stats?.totalProfit || 0)}
          color="bg-orange-500"
          loading={loading}
        />
        <StatCard
          icon={AlertCircle}
          labelUr="غیر فعال"
          label="Inactive (30 din)"
          value={loading ? "—" : stats?.inactiveCount.toString() || "0"}
          sub="Reminder bhejein"
          color="bg-red-500"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Customer */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-gray-900">{monthName} کا بہترین گاہک</h3>
            <span className="text-xs text-gray-400">Best Customer</span>
          </div>
          {loading ? (
            <div className="skeleton h-16 w-full rounded-xl" />
          ) : stats?.bestCustomer ? (
            <Link href={`/customers/${stats.bestCustomer.id}`}>
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border border-orange-100 hover:shadow-md transition-shadow">
                <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Star className="w-7 h-7 text-white fill-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-lg truncate">{stats.bestCustomer.name}</p>
                  <p className="text-gray-500 text-sm">{formatPhone(stats.bestCustomer.phone)}</p>
                  {stats.bestCustomer.city && <p className="text-gray-400 text-xs">{stats.bestCustomer.city}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-orange-600 text-lg">{formatCurrency(stats.bestCustomer.totalPurchase)}</p>
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

        {/* New This Month */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-600" />
              <h3 className="font-bold text-gray-900">اس مہینے کے نئے گاہک</h3>
            </div>
            <span className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded-full font-semibold">
              {loading ? "..." : stats?.newThisMonth || 0} New
            </span>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-10 w-full rounded-xl" />)}
            </div>
          ) : stats?.newCustomersThisMonth?.length ? (
            <div className="space-y-2">
              {stats.newCustomersThisMonth.map((c) => (
                <Link key={c.id} href={`/customers/${c.id}`}>
                  <div className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 bg-brand-100 rounded-xl flex items-center justify-center font-bold text-brand-700 flex-shrink-0">
                      {c.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.city || "City nahi"}</p>
                    </div>
                    <span className="text-xs text-brand-600 font-medium flex-shrink-0">Naya ✨</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">Is mahine koi naya customer nahi</p>
              <Link href="/customers/new" className="text-brand-600 text-sm font-semibold hover:underline mt-1 block">
                Add karein →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Top Customers */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900">🏆 Top Customers</h3>
          <Link href="/customers?sortBy=totalPurchase" className="text-sm text-brand-600 font-semibold hover:underline">
            Sab dekhen
          </Link>
        </div>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-12 w-full rounded-xl" />)}
          </div>
        ) : stats?.topCustomers.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {stats.topCustomers.slice(0, 6).map((c, i) => (
              <Link key={c.id} href={`/customers/${c.id}`}>
                <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    i === 0 ? "bg-yellow-400 text-yellow-900" :
                    i === 1 ? "bg-gray-300 text-gray-700" :
                    i === 2 ? "bg-orange-300 text-orange-800" :
                    "bg-gray-100 text-gray-500"
                  }`}>{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.city || "—"} · {c.orderCount} orders</p>
                  </div>
                  <p className="font-bold text-brand-700 text-sm flex-shrink-0">{formatCurrency(c.totalPurchase)}</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400 text-sm py-8">Customers add karein</p>
        )}
      </div>

      {/* Inactive Customers - Send Messages */}
      {!loading && (stats?.inactiveCount || 0) > 0 && (
        <div className="card border border-red-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h3 className="font-bold text-gray-900">غیر فعال گاہکوں کو پیغام بھیجیں</h3>
            </div>
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">
              {stats?.inactiveCount} Inactive
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            In customers ne 30+ din se khareedari nahi ki. WhatsApp pe reminder bhejein.
          </p>
          <div className="space-y-2">
            {stats?.inactiveCustomers?.map((c) => {
              const sent = isSentRecently(c.id);
              const days = daysSince(c.lastOrderAt);
              return (
                <div key={c.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${sent ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-100"}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${sent ? "bg-green-500 text-white" : "bg-red-100 text-red-600"}`}>
                    {sent ? <CheckCircle2 className="w-5 h-5" /> : c.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/customers/${c.id}`} className="font-semibold text-gray-900 text-sm hover:text-brand-600 truncate">
                        {c.name}
                      </Link>
                      {sent && <span className="text-xs text-green-600 font-semibold bg-green-100 px-2 py-0.5 rounded-full">✓ Done</span>}
                    </div>
                    <p className="text-xs text-gray-400">{c.city || "—"} · {days > 999 ? "Bahut din" : `${days} din`} se inactive</p>
                  </div>
                  <a
                    href={getWhatsAppUrl(c.phone, `Assalamu Alaikum ${c.name}! 😊\n\nKafi arsay se aapko nahi dekha. Naye products aa gaye hain, zaroor dekhein!\n\nShukriya 🙏`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => markSent(c.id)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${sent ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-green-500 text-white hover:bg-green-600"}`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    {sent ? "Bheja ✓" : "WhatsApp"}
                  </a>
                </div>
              );
            })}
          </div>
          {(stats?.inactiveCount || 0) > 10 && (
            <Link href="/customers" className="block text-center text-sm text-brand-600 font-semibold mt-3 hover:underline">
              Sab {stats?.inactiveCount} inactive customers dekhen →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
