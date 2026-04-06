"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users, TrendingUp, AlertCircle, DollarSign, MessageCircle,
  UserPlus, ChevronRight, Star, Crown, Cake,
  ShoppingCart, Bell, Heart, Package, X,
  ArrowUpRight, Sparkles, SlidersHorizontal, UserMinus, Calendar,
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

type ActiveFilter = { type: "today" | "week" | "custom"; from?: string; to?: string } | null;

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-100 rounded-xl ${className}`} />;
}

function WaSvg() {
  return (
    <svg className="w-3.5 h-3.5 fill-white flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { lang, t } = useLang();

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [sentMap, setSentMap] = useState<Record<string, number>>({});
  const [vipThreshold, setVipThreshold] = useState(10000);
  const [msgModal, setMsgModal] = useState<MsgModal | null>(null);
  const [editMsg, setEditMsg] = useState("");

  // Filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>(null);
  const [selectedRange, setSelectedRange] = useState<"today" | "week" | "custom" | null>(null);
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const filterRef = useRef<HTMLDivElement>(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    if (isFilterOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFilterOpen]);

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

  // Format revenue as "12.4k"
  const formatK = (v: number) =>
    v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toString();

  const filterLabels = {
    today: { en: "Today", ur: "آج" },
    week: { en: "This Week", ur: "اس ہفتے" },
    custom: { en: "Custom Range", ur: "اپنی مدت" },
  };

  function getActivePillLabel() {
    if (!activeFilter) return "";
    if (activeFilter.type === "custom" && activeFilter.from && activeFilter.to) {
      return `${activeFilter.from} → ${activeFilter.to}`;
    }
    return lang === "ur"
      ? filterLabels[activeFilter.type].ur
      : filterLabels[activeFilter.type].en;
  }

  return (
    <div className="space-y-0 pb-20 lg:pb-6 animate-fade-in">

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

      {/* ════════════════════════════════════════
          SECTION 2 — ACTION ROW
      ════════════════════════════════════════ */}
      <div className="flex items-center gap-3 py-3 border-b border-gray-100 mb-4">
        {/* Add Customer Button */}
        <Link
          href="/customers/new"
          className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-xl py-3 font-bold text-sm transition-colors shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          {t("+ Add Customer / New Order", "+ نیا گاہک / آرڈر")}
        </Link>

        {/* Filter Button */}
        <div className="relative flex-shrink-0" ref={filterRef}>
          <button
            onClick={() => setIsFilterOpen((v) => !v)}
            className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl py-3 px-4 font-medium text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {t("Filter", "فلٹر")}
          </button>

          {/* Active Filter Pill */}
          {activeFilter && (
            <span className="ml-2 inline-flex items-center gap-1 bg-[#25D366] text-white rounded-full px-3 py-1 text-xs font-medium">
              {getActivePillLabel()}
              <button
                onClick={() => { setActiveFilter(null); setSelectedRange(null); }}
                className="hover:opacity-75 ml-0.5"
              >
                ✕
              </button>
            </span>
          )}

          {/* Filter Dropdown */}
          {isFilterOpen && (
            <div className="absolute right-0 top-12 w-56 bg-white rounded-xl shadow-lg border border-gray-100 z-50 p-2">
              <p className="text-xs text-gray-400 px-3 mb-2">
                {t("Select Range", "مدت منتخب کریں")}
              </p>

              {(["today", "week", "custom"] as const).map((key) => (
                <div key={key}>
                  <button
                    onClick={() => {
                      setSelectedRange(key);
                      if (key !== "custom") {
                        setActiveFilter({ type: key });
                        setIsFilterOpen(false);
                      }
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors ${
                      selectedRange === key
                        ? "bg-green-50 text-[#25D366] font-medium"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    {key === "today" && t("Today", "آج")}
                    {key === "week" && t("This Week", "اس ہفتے")}
                    {key === "custom" && t("Custom Range", "اپنی مدت")}
                  </button>

                  {/* Custom Range date inputs */}
                  {key === "custom" && selectedRange === "custom" && (
                    <div className="px-3 pt-2 pb-1 space-y-2">
                      <div>
                        <label className="text-[10px] text-gray-400 mb-1 block">
                          {t("From", "سے")}
                        </label>
                        <input
                          type="date"
                          value={filterFrom}
                          onChange={(e) => setFilterFrom(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#25D366]"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 mb-1 block">
                          {t("To", "تک")}
                        </label>
                        <input
                          type="date"
                          value={filterTo}
                          onChange={(e) => setFilterTo(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-[#25D366]"
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (filterFrom && filterTo) {
                            setActiveFilter({ type: "custom", from: filterFrom, to: filterTo });
                            setIsFilterOpen(false);
                          }
                        }}
                        className="w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white rounded-lg py-2 font-bold text-sm transition-colors"
                      >
                        {t("Apply", "لاگو کریں")}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════
          SECTION 3 — TODAY'S SUMMARY CARD
      ════════════════════════════════════════ */}
      <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "#1a7a5e" }}>
        {/* Top section */}
        <div className="flex px-4 pt-4 pb-3">
          {/* Left — Today's Orders */}
          <div className="flex-1">
            <p className="text-[9px] font-medium text-white/70 tracking-widest uppercase mb-1">
              {t("TODAY'S ORDERS", "آج کے آرڈرز")}
            </p>
            <p className="text-[32px] font-bold text-white leading-none">
              {loading ? "—" : stats?.todayOrders ?? 0}
            </p>
            <p className="text-[10px] text-white/60 mt-1">
              {t("Orders received today", "آج موصول آرڈرز")}
            </p>
          </div>

          {/* Vertical divider */}
          <div className="w-px bg-white/25 self-stretch mx-1" />

          {/* Right — Today's Revenue */}
          <div className="flex-1 pl-3">
            <p className="text-[9px] font-medium text-white/70 tracking-widest uppercase mb-1">
              {t("TODAY'S REVENUE", "آج کی آمدنی")}
            </p>
            <p className="text-[32px] font-bold text-white leading-none">
              {loading ? "—" : formatK(stats?.todayRevenue ?? 0)}
            </p>
            <p className="text-[10px] text-white/60 mt-1">
              {t("PKR earned today", "آج کی کمائی PKR")}
            </p>
          </div>
        </div>

        {/* Bottom strip */}
        <div
          className="px-4 py-2.5 flex justify-between items-center"
          style={{ background: "rgba(0,0,0,0.20)" }}
        >
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.20)" }}>
              <UserPlus className="w-3 h-3 text-white" />
            </div>
            <span className="text-white text-[11px] font-medium">
              <span className="font-bold">+{stats?.todayNewCustomers ?? 0}</span>{" "}
              {t("new customers today", "نئے گاہک آج")}
            </span>
          </div>
          <button
            onClick={() => router.push("/hisab")}
            className="text-white/85 text-[11px] font-semibold cursor-pointer hover:text-white transition-colors"
          >
            {t("View orders →", "← آرڈرز دیکھیں")}
          </button>
        </div>
      </div>

      {/* ════════════════════════════════════════
          SECTION 4 — 4 ACTION CARDS
      ════════════════════════════════════════ */}
      <div className="mb-5">
        <p className="text-[10px] font-medium text-gray-400 tracking-widest uppercase mb-2">
          {t("QUICK ACTIONS", "فوری اقدام")}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

          {/* Card 1 — New Customers */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 min-h-[170px] flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-200">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#e8f5e9" }}>
                  <UserPlus className="w-4 h-4" style={{ stroke: "#25D366" }} />
                </div>
                <span className="text-[13px] font-medium text-gray-800 leading-tight">
                  {t("New Customers", "نئے گاہک")}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mb-3 leading-snug">
                {t("First-time buyers this month", "اس مہینے پہلی بار خریداری")}
              </p>
              <p className="text-[28px] font-bold text-gray-900 leading-none mb-4">
                {loading ? "—" : stats?.newThisMonth ?? 0}
              </p>
            </div>
            <a
              href="https://wa.me/923000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 text-white font-bold text-[11px] rounded-xl py-2.5 px-3 min-h-[36px] transition-colors"
              style={{ background: "#25D366" }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#1ebe5d")}
              onMouseOut={(e) => (e.currentTarget.style.background = "#25D366")}
            >
              <WaSvg />
              {t("Get Feedback", "رائے لیں")}
            </a>
          </div>

          {/* Card 2 — All Customers */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 min-h-[170px] flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-200">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#e3f2fd" }}>
                  <Users className="w-4 h-4" style={{ stroke: "#1976d2" }} />
                </div>
                <span className="text-[13px] font-medium text-gray-800 leading-tight">
                  {t("All Customers", "تمام گاہک")}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mb-3 leading-snug">
                {t("Your complete customer base", "آپ کا مکمل گاہک ریکارڈ")}
              </p>
              <p className="text-[28px] font-bold text-gray-900 leading-none mb-4">
                {loading ? "—" : stats?.totalCustomers ?? 0}
              </p>
            </div>
            <a
              href="https://wa.me/923000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 text-white font-bold text-[11px] rounded-xl py-2.5 px-3 min-h-[36px] transition-colors"
              style={{ background: "#25D366" }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#1ebe5d")}
              onMouseOut={(e) => (e.currentTarget.style.background = "#25D366")}
            >
              <WaSvg />
              {t("Send Promo Message", "پروموشن میسج بھیجیں")}
            </a>
          </div>

          {/* Card 3 — Order Reminder */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 min-h-[170px] flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-200">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#fff8e1" }}>
                  <Bell className="w-4 h-4" style={{ stroke: "#f9a825" }} />
                </div>
                <span className="text-[13px] font-medium text-gray-800 leading-tight">
                  {t("Order Reminder", "آرڈر یاد دہانی")}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mb-3 leading-snug">
                {t("Customers who forgot to order", "جو گاہک آرڈر بھول گئے")}
              </p>
              <p className="text-[28px] font-bold text-gray-900 leading-none mb-4">
                {loading ? "—" : stats?.atRiskCustomers?.length ?? 0}
              </p>
            </div>
            <a
              href="https://wa.me/923000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 text-white font-bold text-[11px] rounded-xl py-2.5 px-3 min-h-[36px] transition-colors"
              style={{ background: "#25D366" }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#1ebe5d")}
              onMouseOut={(e) => (e.currentTarget.style.background = "#25D366")}
            >
              <WaSvg />
              {t("Remind Customer", "یاد دلائیں")}
            </a>
          </div>

          {/* Card 4 — Inactive Customers */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 min-h-[170px] flex flex-col justify-between hover:-translate-y-1 hover:shadow-md transition-all duration-200">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#fce4ec" }}>
                  <UserMinus className="w-4 h-4" style={{ stroke: "#e91e63" }} />
                </div>
                <span className="text-[13px] font-medium text-gray-800 leading-tight">
                  {t("Inactive Customers", "غیر فعال گاہک")}
                </span>
              </div>
              <p className="text-[10px] text-gray-400 mb-3 leading-snug">
                {t("Bought once, never returned", "صرف ایک بار خریداری کی")}
              </p>
              <p className="text-[28px] font-bold text-gray-900 leading-none mb-4">
                {loading ? "—" : stats?.inactiveCount ?? 0}
              </p>
            </div>
            <a
              href="https://wa.me/923000000000"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-1.5 text-white font-bold text-[11px] rounded-xl py-2.5 px-3 min-h-[36px] transition-colors"
              style={{ background: "#25D366" }}
              onMouseOver={(e) => (e.currentTarget.style.background = "#1ebe5d")}
              onMouseOut={(e) => (e.currentTarget.style.background = "#25D366")}
            >
              <WaSvg />
              {t("Re-engage Now", "دوبارہ جوڑیں")}
            </a>
          </div>
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
