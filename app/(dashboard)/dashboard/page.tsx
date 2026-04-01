"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, TrendingUp, AlertCircle, DollarSign, MessageCircle,
  UserPlus, ChevronRight, Star, Crown, Cake,
  ShoppingCart, Bell, Heart, Package, X,
  ArrowUpRight, Sparkles,
} from "lucide-react";
import {
  formatCurrency, formatPhone, daysSince, getWhatsAppUrl,
  getCustomerTag, TAG_STYLES, isBirthdayToday, daysUntilBirthday,
} from "@/lib/utils";
import { useLang } from "@/lib/lang-context";

type MsgModal = { phone: string; name: string; defaultMsg: string };
type InactiveCustomer = { id: string; name: string; phone: string; city: string | null; lastOrderAt: string | null };
type NewCustomer = { id: string; name: string; phone: string; city: string | null; createdAt: string };
type BirthdayCustomer = { id: string; name: string; phone: string; dateOfBirth: string | null };
type ActiveCustomer = {
  id: string; name: string; phone: string; city: string | null;
  totalPurchase: number; lastOrderAt: string | null;
  _count: { orders: number };
};

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
  activeCustomers?: ActiveCustomer[];
  todayOrders?: number;
  todayRevenue?: number;
  todayNewCustomers?: number;
  birthdayCustomers?: BirthdayCustomer[];
  atRiskCustomers?: InactiveCustomer[];
};

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sentMap, setSentMap] = useState<Record<string, number>>({});
  const [vipThreshold, setVipThreshold] = useState(10000);
  const [msgModal, setMsgModal] = useState<MsgModal | null>(null);
  const [editMsg, setEditMsg] = useState("");
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

  function openMsg(phone: string, name: string, defaultMsg: string) {
    setMsgModal({ phone, name, defaultMsg });
    setEditMsg(defaultMsg);
  }

  function closeMsg() {
    setMsgModal(null);
    setEditMsg("");
  }

  const regularCustomers = (stats?.activeCustomers || []).filter((c) =>
    getCustomerTag(c._count.orders, c.totalPurchase, c.lastOrderAt, vipThreshold) === "Regular"
  ).slice(0, 5);

  const birthdayToday = (stats?.birthdayCustomers || []).filter((c) => isBirthdayToday(c.dateOfBirth));
  const birthdaySoon = (stats?.birthdayCustomers || []).filter((c) => {
    const d = daysUntilBirthday(c.dateOfBirth);
    return d > 0 && d <= 7;
  });
  const notificationCount = birthdayToday.length + birthdaySoon.length + (stats?.atRiskCustomers?.length || 0);

  return (
    <div className="space-y-5 pb-20 lg:pb-6 animate-fade-in">

      {/* ── WA Message Modal ── */}
      {msgModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={closeMsg}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-slate-800">Send to {msgModal.name}</h3>
                <p className="text-xs text-slate-400">{formatPhone(msgModal.phone)}</p>
              </div>
              <button onClick={closeMsg} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
            <div className="p-4">
              <textarea
                value={editMsg}
                onChange={(e) => setEditMsg(e.target.value)}
                className="input resize-none min-h-[120px] text-sm"
                placeholder="Type your message..."
              />
            </div>
            <div className="p-4 pt-0 flex gap-2">
              <a
                href={getWhatsAppUrl(msgModal.phone, editMsg)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => { markSent(msgModal.phone); closeMsg(); }}
                className="btn-primary flex-1 justify-center"
              >
                <MessageCircle className="w-4 h-4" /> Send on WhatsApp
              </a>
              <button onClick={closeMsg} className="btn-ghost">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div className="flex items-center gap-2 flex-wrap">
        <Link href="/customers/new" className="inline-flex items-center gap-1.5 bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors shadow-sm">
          <UserPlus className="w-4 h-4" /> {t("Add Customer", "نیا گاہک")}
        </Link>
        <Link href="/customers/import" className="inline-flex items-center gap-1.5 border border-gray-200 text-slate-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
          <ShoppingCart className="w-4 h-4" /> {t("Import", "امپورٹ")}
        </Link>
        <Link href="/customers" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-700 transition-colors ml-auto">
          {t("All customers", "سب گاہک")} <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* ── Today's Hero Card ── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-purple-800 rounded-2xl p-5 text-white shadow-lg">
        <div className="absolute top-0 right-0 w-44 h-44 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
        <p className="text-brand-200 text-xs font-semibold tracking-widest mb-4 flex items-center gap-1.5 relative">
          <Sparkles className="w-3.5 h-3.5" /> TODAY&apos;S SUMMARY
        </p>
        <div className="grid grid-cols-3 gap-3 relative">
          <Link href="/hisab" className="group">
            <p className="text-2xl font-bold">{loading ? "—" : stats?.todayOrders ?? 0}</p>
            <p className="text-brand-200 text-xs mt-0.5">{t("Orders", "آرڈر")}</p>
            <ArrowUpRight className="w-3.5 h-3.5 text-brand-300 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
          </Link>
          <Link href="/hisab" className="group">
            <p className="text-xl font-bold">{loading ? "—" : formatCurrency(stats?.todayRevenue ?? 0)}</p>
            <p className="text-brand-200 text-xs mt-0.5">{t("Revenue", "آمدنی")}</p>
            <ArrowUpRight className="w-3.5 h-3.5 text-brand-300 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
          </Link>
          <Link href="/customers?filter=new" className="group">
            <p className="text-2xl font-bold">{loading ? "—" : stats?.todayNewCustomers ?? 0}</p>
            <p className="text-brand-200 text-xs mt-0.5">{t("New Customers", "نئے گاہک")}</p>
            <ArrowUpRight className="w-3.5 h-3.5 text-brand-300 opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
          </Link>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        {/* Total Customers */}
        <Link href="/customers">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 min-h-[110px]">
            <div className="w-9 h-9 bg-brand-50 rounded-xl flex items-center justify-center mb-3">
              <Users className="w-4 h-4 text-brand-600" />
            </div>
            {loading ? (
              <><Skeleton className="h-6 w-16 mb-1" /><Skeleton className="h-3 w-24" /></>
            ) : (
              <>
                <p className="text-xl font-bold text-slate-800">{stats?.totalCustomers ?? 0}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t("Total Customers", "کل گاہک")}</p>
                <p className="text-xs text-brand-600 font-medium mt-1">+{stats?.newThisMonth ?? 0} {t("this month", "اس مہینے")}</p>
              </>
            )}
          </div>
        </Link>

        {/* Total Revenue */}
        <Link href="/hisab">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 min-h-[110px]">
            <div className="w-9 h-9 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            {loading ? (
              <><Skeleton className="h-6 w-20 mb-1" /><Skeleton className="h-3 w-20" /></>
            ) : (
              <>
                <p className="text-xl font-bold text-slate-800">{formatCurrency(stats?.totalRevenue ?? 0)}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t("Total Revenue", "کل آمدنی")}</p>
              </>
            )}
          </div>
        </Link>

        {/* Net Profit */}
        <Link href="/hisab">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 min-h-[110px]">
            <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center mb-3">
              <DollarSign className="w-4 h-4 text-purple-600" />
            </div>
            {loading ? (
              <><Skeleton className="h-6 w-20 mb-1" /><Skeleton className="h-3 w-20" /></>
            ) : (
              <>
                <p className="text-xl font-bold text-slate-800">{formatCurrency(stats?.totalProfit ?? 0)}</p>
                <p className="text-xs text-slate-500 mt-0.5">{t("Net Profit", "خالص منافع")}</p>
              </>
            )}
          </div>
        </Link>

        {/* Inactive */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all duration-200 min-h-[110px]">
          <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center mb-3">
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          {loading ? (
            <><Skeleton className="h-6 w-12 mb-1" /><Skeleton className="h-3 w-24 mb-2" /><Skeleton className="h-7 w-full" /></>
          ) : (
            <>
              <p className="text-xl font-bold text-slate-800">{stats?.inactiveCount ?? 0}</p>
              <p className="text-xs text-slate-500 mt-0.5 mb-2">{t("Inactive (30 days)", "غیر فعال")}</p>
              <Link
                href="/customers?filter=inactive"
                className="block w-full text-center py-1.5 text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
              >
                {t("Send Reminder", "یاد دہانی")}
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ── Best Customer + New Customers ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Best Customer */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">{t("Best Customer", "بہترین گاہک")}</h3>
          </div>
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : stats?.bestCustomer ? (
            <div className="space-y-3">
              <Link href={`/customers/${stats.bestCustomer.id}`}>
                <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100 hover:border-amber-200 transition-colors">
                  <div className="w-11 h-11 bg-amber-400 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold">{stats.bestCustomer.name[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-slate-800 truncate text-sm">{stats.bestCustomer.name}</p>
                      {getCustomerTag(stats.bestCustomer.orderCount, stats.bestCustomer.totalPurchase, null, vipThreshold) === "VIP" && (
                        <Crown className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{formatPhone(stats.bestCustomer.phone)} · {stats.bestCustomer.orderCount} {t("orders", "آرڈر")}</p>
                  </div>
                  <p className="font-bold text-amber-600 text-sm flex-shrink-0">{formatCurrency(stats.bestCustomer.totalPurchase)}</p>
                </div>
              </Link>
              <button
                onClick={() => openMsg(
                  stats.bestCustomer!.phone,
                  stats.bestCustomer!.name,
                  `Assalamu Alaikum ${stats.bestCustomer!.name}! 🙏\nThank you so much for your continued support! You're one of our most valued customers. 💚\nNew arrivals are here — come check them out!`
                )}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                <Heart className="w-4 h-4" /> {t("Send Thank You", "شکریہ بھیجیں")}
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">{t("No customers yet", "ابھی کوئی گاہک نہیں")}</p>
              <Link href="/customers/new" className="text-brand-600 text-sm font-medium hover:underline mt-1 block">
                {t("Add first customer →", "پہلا گاہک شامل کریں →")}
              </Link>
            </div>
          )}
        </div>

        {/* New Customers Card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-brand-50 rounded-xl flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-brand-600" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">{t("New This Month", "اس مہینے نئے گاہک")}</h3>
            {!loading && (
              <span className="ml-auto bg-brand-100 text-brand-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {stats?.newThisMonth ?? 0}
              </span>
            )}
          </div>
          {loading ? (
            <div className="space-y-3"><Skeleton className="h-20 w-full" /><Skeleton className="h-10 w-full" /></div>
          ) : (
            <div className="space-y-3">
              <Link
                href="/customers?filter=new"
                className="flex items-center gap-3 p-4 bg-brand-50 rounded-xl border border-brand-100 hover:border-brand-200 transition-colors group"
              >
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-3xl">{stats?.newThisMonth ?? 0}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{t("New customers joined this month", "اس مہینے نئے گاہک")}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-brand-400 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/customers?filter=new"
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> {t("Get Feedback", "فیڈبیک لیں")}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Top Customers Leaderboard ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-amber-600" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">{t("Top Customers", "بہترین گاہک")}</h3>
          </div>
          <Link href="/customers?sortBy=totalPurchase" className="text-xs text-brand-600 font-medium hover:underline flex items-center gap-0.5">
            {t("View all", "سب دیکھیں")} <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : stats?.topCustomers.length ? (
          <div className="space-y-1">
            {stats.topCustomers.slice(0, 5).map((c, i) => {
              const tag = getCustomerTag(c.orderCount, c.totalPurchase, c.lastOrderAt, vipThreshold);
              const tagStyle = TAG_STYLES[tag];
              return (
                <div key={c.id} className="flex items-center gap-2 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i === 0 ? "bg-amber-400 text-amber-900" :
                    i === 1 ? "bg-gray-300 text-gray-700" :
                    i === 2 ? "bg-orange-300 text-orange-800" : "bg-gray-100 text-gray-500"
                  }`}>{i + 1}</span>
                  <Link href={`/customers/${c.id}`} className="flex-1 min-w-0 flex items-center gap-2">
                    <div className="w-8 h-8 bg-brand-100 rounded-xl flex items-center justify-center font-bold text-brand-600 text-sm flex-shrink-0">
                      {c.name[0]?.toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-slate-800 text-sm truncate">{c.name}</p>
                        {tag === "VIP" && <Crown className="w-3 h-3 text-amber-500 flex-shrink-0" />}
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-xs text-slate-400">{c.city || "—"} · {c.orderCount} {t("orders", "آرڈر")}</p>
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${tagStyle}`}>{tag}</span>
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <p className="font-bold text-slate-700 text-sm hidden sm:block">{formatCurrency(c.totalPurchase)}</p>
                    <button
                      onClick={() => openMsg(
                        c.phone, c.name,
                        `Assalamu Alaikum ${c.name}! 🙏\nThank you for being our valued customer! We really appreciate your support. 💚\nNew arrivals are here — come check them out!`
                      )}
                      className="p-2 bg-green-50 hover:bg-green-500 text-green-600 hover:text-white rounded-xl transition-colors"
                      title="Send Thank You"
                    >
                      <Heart className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-slate-400">{t("No customers yet", "ابھی کوئی گاہک نہیں")}</p>
          </div>
        )}
      </div>

      {/* ── Regular Customers + Notifications ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Regular Customers */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-teal-50 rounded-xl flex items-center justify-center">
              <Users className="w-4 h-4 text-teal-600" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">{t("Regular Customers", "مستقل گاہک")}</h3>
            {!loading && regularCustomers.length > 0 && (
              <span className="ml-auto bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {regularCustomers.length}
              </span>
            )}
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : regularCustomers.length > 0 ? (
            <div className="space-y-1.5">
              {regularCustomers.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 bg-teal-100 rounded-xl flex items-center justify-center font-bold text-teal-700 text-sm flex-shrink-0">
                    {c.name[0]?.toUpperCase()}
                  </div>
                  <Link href={`/customers/${c.id}`} className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.city || "—"} · {c._count.orders} {t("orders", "آرڈر")}</p>
                  </Link>
                  <button
                    onClick={() => openMsg(
                      c.phone, c.name,
                      `Assalamu Alaikum ${c.name}! 🎉\nExciting news! Our new collection has just arrived with amazing products.\nCome check it out before it sells out! 🛍️`
                    )}
                    className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-teal-50 hover:bg-teal-500 text-teal-700 hover:text-white rounded-xl transition-colors text-xs font-semibold"
                    title="Share New Collection"
                  >
                    <Package className="w-3.5 h-3.5" /> {t("Share", "شیئر")}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">{t("No regular customers yet", "ابھی کوئی مستقل گاہک نہیں")}</p>
              <p className="text-xs text-slate-300 mt-1">{t("Customers with 3+ orders appear here", "3+ آرڈر والے یہاں آئیں گے")}</p>
            </div>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-rose-50 rounded-xl flex items-center justify-center">
              <Bell className="w-4 h-4 text-rose-500" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">{t("Notifications", "اطلاعات")}</h3>
            {notificationCount > 0 && (
              <span className="w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold ml-auto">
                {notificationCount}
              </span>
            )}
          </div>
          {loading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : notificationCount === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-slate-400">{t("All clear! No alerts", "سب ٹھیک ہے")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {birthdayToday.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-3 bg-pink-50 rounded-xl border border-pink-100">
                  <Cake className="w-4 h-4 text-pink-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-800 truncate">🎂 {c.name}</p>
                    <p className="text-xs text-pink-600">{t("Birthday Today!", "آج سالگرہ!")}</p>
                  </div>
                  <button
                    onClick={() => openMsg(c.phone, c.name, `Happy Birthday ${c.name}! 🎂🎉\nWishing you a wonderful day! Special gift for you today — reply to claim! 🎁`)}
                    className="shrink-0 bg-pink-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-pink-600 transition-colors"
                  >
                    {t("Wish", "مبارکباد")}
                  </button>
                </div>
              ))}
              {birthdaySoon.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl border border-purple-100">
                  <Cake className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-800 truncate">{c.name}</p>
                    <p className="text-xs text-purple-600">{t("Birthday in", "سالگرہ میں")} {daysUntilBirthday(c.dateOfBirth)} {t("days", "دن")}</p>
                  </div>
                  <Link href={`/customers/${c.id}`} className="shrink-0 text-xs text-purple-600 font-semibold hover:underline">
                    {t("View", "دیکھیں")}
                  </Link>
                </div>
              ))}
              {(stats?.atRiskCustomers || []).map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl border border-orange-100">
                  <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-slate-800 truncate">{c.name}</p>
                    <p className="text-xs text-orange-600">{daysSince(c.lastOrderAt)} {t("days — at risk", "دن — خطرے میں")}</p>
                  </div>
                  <button
                    onClick={() => openMsg(c.phone, c.name, `Assalamu Alaikum ${c.name}! 😊\nWe miss you! New stock just arrived — come check it out! 🎁`)}
                    className="shrink-0 bg-orange-500 text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold hover:bg-orange-600 transition-colors"
                  >
                    {t("Remind", "یاد دہانی")}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
