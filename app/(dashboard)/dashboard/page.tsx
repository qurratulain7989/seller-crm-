"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, TrendingUp, AlertCircle, DollarSign,
  MessageCircle, CheckCircle2, UserPlus, ChevronRight, Star,
  Crown, Cake, ShoppingCart, Bell
} from "lucide-react";
import {
  formatCurrency, formatPhone, daysSince, getWhatsAppUrl,
  getCustomerTag, TAG_STYLES, isBirthdayToday, daysUntilBirthday
} from "@/lib/utils";
import { useLang } from "@/lib/lang-context";

type InactiveCustomer = { id: string; name: string; phone: string; city: string | null; lastOrderAt: string | null };
type NewCustomer = { id: string; name: string; phone: string; city: string | null; createdAt: string };
type BirthdayCustomer = { id: string; name: string; phone: string; dateOfBirth: string | null };

type Stats = {
  totalCustomers: number;
  newThisMonth: number;
  totalRevenue: number;
  totalProfit: number;
  inactiveCount: number;
  inactiveCustomers: InactiveCustomer[];
  newCustomersThisMonth: NewCustomer[];
  bestCustomer: { id: string; name: string; phone: string; city: string | null; totalPurchase: number; orderCount: number } | null;
  topCustomers: { id: string; name: string; phone: string; city: string | null; totalPurchase: number; netProfit: number; lastOrderAt: string | null; orderCount: number }[];
  todayOrders?: number;
  todayRevenue?: number;
  todayNewCustomers?: number;
  birthdayCustomers?: BirthdayCustomer[];
  atRiskCustomers?: InactiveCustomer[];
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sentMap, setSentMap] = useState<Record<string, number>>({});
  const [vipThreshold, setVipThreshold] = useState(10000);
  const { t } = useLang();

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
    try {
      setSentMap(JSON.parse(localStorage.getItem("wa_sent") || "{}"));
      setVipThreshold(parseInt(localStorage.getItem("vip_threshold") || "10000"));
    } catch { /* ignore */ }
  }, []);

  function markSent(id: string) {
    const updated = { ...sentMap, [id]: Date.now() };
    setSentMap(updated);
    localStorage.setItem("wa_sent", JSON.stringify(updated));
  }

  function isSentRecently(id: string) {
    const ts = sentMap[id];
    return ts ? Date.now() - ts < 24 * 60 * 60 * 1000 : false;
  }

  const statCards = [
    { icon: Users, label: t("Total Customers", "کل گاہک"), value: stats?.totalCustomers ?? 0, sub: `+${stats?.newThisMonth ?? 0} ${t("this month", "اس مہینے")}`, color: "text-blue-600 bg-blue-50" },
    { icon: TrendingUp, label: t("Total Revenue", "کل آمدنی"), value: formatCurrency(stats?.totalRevenue ?? 0), color: "text-green-600 bg-green-50" },
    { icon: DollarSign, label: t("Net Profit", "خالص منافع"), value: formatCurrency(stats?.totalProfit ?? 0), color: "text-purple-600 bg-purple-50" },
    { icon: AlertCircle, label: t("Inactive (30 days)", "غیر فعال (30 دن)"), value: stats?.inactiveCount ?? 0, color: "text-red-600 bg-red-50" },
  ];

  // Birthday customers from top customers list (those with DOB today or in 7 days)
  const birthdayToday = (stats?.birthdayCustomers || []).filter((c) => isBirthdayToday(c.dateOfBirth));
  const birthdaySoon = (stats?.birthdayCustomers || []).filter((c) => {
    const d = daysUntilBirthday(c.dateOfBirth);
    return d > 0 && d <= 7;
  });

  const notificationCount =
    birthdayToday.length +
    birthdaySoon.length +
    (stats?.atRiskCustomers?.length || 0);

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/customers/new" className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
          <UserPlus className="w-4 h-4" />
          {t("Add Customer", "نیا گاہک")}
        </Link>
        <Link href="/customers/import" className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
          <ShoppingCart className="w-4 h-4" />
          {t("Import", "امپورٹ")}
        </Link>
        <Link href="/hisab" className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
          <DollarSign className="w-4 h-4" />
          {t("Accounting", "حساب کتاب")}
        </Link>
        <Link href="/customers" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors ml-auto">
          {t("All customers", "سب گاہک")} <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Today's Stats */}
      {!loading && (stats?.todayOrders || 0) + (stats?.todayRevenue || 0) > 0 && (
        <div className="bg-gradient-to-r from-green-600 to-brand-700 rounded-xl p-4 text-white">
          <p className="text-green-100 text-xs font-medium mb-2 flex items-center gap-1.5">
            <ShoppingCart className="w-3.5 h-3.5" /> {t("TODAY'S SUMMARY", "آج کا خلاصہ")}
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-2xl font-bold">{stats?.todayOrders || 0}</p>
              <p className="text-green-200 text-xs">{t("Orders", "آرڈر")}</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{formatCurrency(stats?.todayRevenue || 0)}</p>
              <p className="text-green-200 text-xs">{t("Revenue", "آمدنی")}</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{stats?.todayNewCustomers || 0}</p>
              <p className="text-green-200 text-xs">{t("New Customers", "نئے گاہک")}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ icon: Icon, label, value, sub, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color} mb-3`}>
              <Icon className="w-4 h-4" />
            </div>
            {loading ? (
              <div className="space-y-1.5">
                <div className="h-6 w-20 bg-gray-100 rounded animate-pulse" />
                <div className="h-3.5 w-28 bg-gray-100 rounded animate-pulse" />
              </div>
            ) : (
              <>
                <p className="text-xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                {sub && <p className="text-xs text-green-600 font-medium mt-1">{sub}</p>}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Notification Panel */}
      {!loading && notificationCount > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Bell className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold text-gray-900 text-sm">{t("Notifications", "اطلاعات")}</h3>
            <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">{notificationCount}</span>
          </div>
          <div className="space-y-2">
            {/* Birthday Today */}
            {birthdayToday.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-3 bg-pink-50 rounded-xl border border-pink-100">
                <Cake className="w-4 h-4 text-pink-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">🎂 {c.name} — {t("Birthday Today!", "آج سالگرہ!")}</p>
                </div>
                <a
                  href={getWhatsAppUrl(c.phone, `Happy Birthday ${c.name}! 🎂🎉\nWishing you a wonderful day! Special gift for you today — reply to claim! 🎁`)}
                  target="_blank" rel="noopener noreferrer"
                  onClick={() => markSent(c.id)}
                  className="shrink-0 bg-pink-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-pink-600 transition-colors"
                >
                  {t("Send Wish", "مبارکباد")}
                </a>
              </div>
            ))}
            {/* Birthday Soon */}
            {birthdaySoon.map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
                <Cake className="w-4 h-4 text-purple-400 flex-shrink-0" />
                <p className="flex-1 text-sm text-gray-700 truncate">
                  🎂 <span className="font-medium">{c.name}</span> — {t("Birthday in", "سالگرہ میں")} {daysUntilBirthday(c.dateOfBirth)} {t("days", "دن")}
                </p>
                <Link href={`/customers/${c.id}`} className="shrink-0 text-xs text-purple-600 font-medium hover:underline">
                  {t("View", "دیکھیں")}
                </Link>
              </div>
            ))}
            {/* At-Risk Customers (20-29 days inactive) */}
            {(stats?.atRiskCustomers || []).map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-900 truncate">{c.name}</p>
                  <p className="text-xs text-gray-500">{t("No order in", "کوئی آرڈر نہیں")} {daysSince(c.lastOrderAt)} {t("days — at risk!", "دن — خطرے میں!")}</p>
                </div>
                <a
                  href={getWhatsAppUrl(c.phone, `Assalamu Alaikum ${c.name}! 😊\nWe miss you! New stock just arrived — come check it out! 🎁`)}
                  target="_blank" rel="noopener noreferrer"
                  onClick={() => markSent(c.id)}
                  className="shrink-0 bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-orange-600 transition-colors"
                >
                  WhatsApp
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Customer */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-orange-400" />
            <h3 className="font-semibold text-gray-900 text-sm">{t("Best Customer", "بہترین گاہک")}</h3>
          </div>
          {loading ? (
            <div className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ) : stats?.bestCustomer ? (
            <Link href={`/customers/${stats.bestCustomer.id}`}>
              <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100 hover:border-orange-200 transition-colors">
                <div className="relative">
                  <div className="w-10 h-10 bg-orange-400 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Star className="w-5 h-5 text-white fill-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-gray-900 truncate">{stats.bestCustomer.name}</p>
                    {getCustomerTag(stats.bestCustomer.orderCount, stats.bestCustomer.totalPurchase, null, vipThreshold) === "VIP" && (
                      <Crown className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{formatPhone(stats.bestCustomer.phone)} · {stats.bestCustomer.orderCount} {t("orders", "آرڈر")}</p>
                </div>
                <p className="font-bold text-orange-600 text-sm flex-shrink-0">{formatCurrency(stats.bestCustomer.totalPurchase)}</p>
              </div>
            </Link>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm text-gray-400">{t("No customers yet", "ابھی کوئی گاہک نہیں")}</p>
              <Link href="/customers/new" className="text-green-600 text-sm font-medium hover:underline mt-1 block">
                {t("Add first customer →", "پہلا گاہک شامل کریں →")}
              </Link>
            </div>
          )}
        </div>

        {/* New This Month */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 text-sm">{t("New This Month", "اس مہینے نئے گاہک")}</h3>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
              {loading ? "..." : stats?.newThisMonth ?? 0}
            </span>
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-9 bg-gray-100 rounded-lg animate-pulse" />)}
            </div>
          ) : stats?.newCustomersThisMonth?.length ? (
            <div className="space-y-1">
              {stats.newCustomersThisMonth.map((c) => (
                <Link key={c.id} href={`/customers/${c.id}`}>
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center font-semibold text-green-700 text-sm flex-shrink-0">
                      {c.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm truncate">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.city || "—"}</p>
                    </div>
                    <span className="text-xs text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">New</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-gray-400 py-6">{t("No new customers this month", "اس مہینے کوئی نیا گاہک نہیں")}</p>
          )}
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 text-sm">{t("Top Customers", "بہترین گاہک")}</h3>
          <Link href="/customers?sortBy=totalPurchase" className="text-xs text-green-600 font-medium hover:underline">
            {t("View all", "سب دیکھیں")}
          </Link>
        </div>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : stats?.topCustomers.length ? (
          <div className="divide-y divide-gray-50">
            {stats.topCustomers.slice(0, 5).map((c, i) => {
              const tag = getCustomerTag(c.orderCount, c.totalPurchase, c.lastOrderAt, vipThreshold);
              const tagStyle = TAG_STYLES[tag];
              return (
                <Link key={c.id} href={`/customers/${c.id}`}>
                  <div className="flex items-center gap-3 py-2.5 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      i === 0 ? "bg-yellow-400 text-yellow-900" :
                      i === 1 ? "bg-gray-300 text-gray-700" :
                      i === 2 ? "bg-orange-300 text-orange-800" : "bg-gray-100 text-gray-500"
                    }`}>{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-gray-900 text-sm truncate">{c.name}</p>
                        {tag === "VIP" && <Crown className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-gray-400">{c.city || "—"} · {c.orderCount} {t("orders", "آرڈر")}</p>
                        <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${tagStyle}`}>{tag}</span>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm flex-shrink-0">{formatCurrency(c.totalPurchase)}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-sm text-gray-400 py-6">{t("No customers yet", "ابھی کوئی گاہک نہیں")}</p>
        )}
      </div>

      {/* Inactive Customers */}
      {!loading && (stats?.inactiveCount ?? 0) > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <h3 className="font-semibold text-gray-900 text-sm">{t("Re-engage Inactive Customers", "غیر فعال گاہکوں سے رابطہ")}</h3>
            </div>
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
              {stats?.inactiveCount} {t("inactive", "غیر فعال")}
            </span>
          </div>
          <div className="space-y-2">
            {stats?.inactiveCustomers?.map((c) => {
              const sent = isSentRecently(c.id);
              const days = daysSince(c.lastOrderAt);
              return (
                <div key={c.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${sent ? "bg-green-50 border-green-100" : "bg-gray-50 border-gray-100"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0 ${sent ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"}`}>
                    {sent ? <CheckCircle2 className="w-4 h-4" /> : c.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/customers/${c.id}`} className="font-medium text-gray-900 text-sm hover:text-green-600 truncate">
                        {c.name}
                      </Link>
                      {sent && <span className="text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded font-medium">✓ {t("Sent", "بھیجا")}</span>}
                    </div>
                    <p className="text-xs text-gray-400">{c.city || "—"} · {days > 999 ? t("Long time", "بہت عرصہ") : `${days} ${t("days inactive", "دن غیر فعال")}`}</p>
                  </div>
                  <a
                    href={getWhatsAppUrl(c.phone, `Assalamu Alaikum ${c.name}! 😊\nWe miss you! New products available. Reply to order! 🎁`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => markSent(c.id)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${sent ? "bg-green-100 text-green-700" : "bg-green-600 text-white hover:bg-green-700"}`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    {sent ? t("Sent ✓", "بھیجا ✓") : "WhatsApp"}
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
