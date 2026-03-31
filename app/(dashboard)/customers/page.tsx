"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Search, Filter, UserPlus, Download, Phone,
  MapPin, ChevronDown, Users, MessageCircle,
  ArrowUpDown, X, CheckCircle2, Upload, Crown
} from "lucide-react";
import {
  formatCurrency, formatPhone, daysSince, getWhatsAppUrl, PAKISTAN_CITIES,
  getCustomerTag, TAG_STYLES
} from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/lang-context";

type Customer = {
  id: string;
  name: string;
  phone: string;
  city: string | null;
  totalPurchase: number;
  netProfit: number;
  lastOrderAt: string | null;
  createdAt: string;
  source: string | null;
  _count: { orders: number };
};

const SORT_OPTIONS = [
  { value: "createdAt", label: "Newest first" },
  { value: "totalPurchase", label: "Most purchase" },
  { value: "netProfit", label: "Most profit" },
  { value: "name", label: "Name (A-Z)" },
  { value: "lastOrderAt", label: "Last order" },
];

export default function CustomersPage() {
  const { t } = useLang();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [sentMap, setSentMap] = useState<Record<string, number>>({});
  const [vipThreshold, setVipThreshold] = useState(10000);
  const limit = 20;

  useEffect(() => {
    try {
      setSentMap(JSON.parse(localStorage.getItem("wa_sent") || "{}"));
      setVipThreshold(parseInt(localStorage.getItem("vip_threshold") || "10000"));
    } catch { /* ignore */ }
  }, []);

  function markSent(customerId: string) {
    const updated = { ...sentMap, [customerId]: Date.now() };
    setSentMap(updated);
    localStorage.setItem("wa_sent", JSON.stringify(updated));
  }

  function isSentRecently(customerId: string) {
    const ts = sentMap[customerId];
    return ts ? Date.now() - ts < 24 * 60 * 60 * 1000 : false;
  }

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      search,
      sortBy,
      order: sortBy === "name" ? "asc" : "desc",
      page: page.toString(),
      limit: limit.toString(),
      ...(city && { city }),
    });
    const res = await fetch(`/api/customers?${params}`);
    const data = await res.json();
    setCustomers(data.customers || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [search, city, sortBy, page]);

  useEffect(() => {
    const t = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(t);
  }, [fetchCustomers]);

  function clearFilters() {
    setSearch("");
    setCity("");
    setSortBy("createdAt");
    setPage(1);
  }

  const hasFilters = search || city || sortBy !== "createdAt";

  async function exportCSV() {
    const params = new URLSearchParams(city ? { city } : {});
    const a = document.createElement("a");
    a.href = `/api/customers/export?${params}`;
    a.click();
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            className="input pl-11"
            placeholder={t("Search by name, phone, or city...", "نام، فون، یا شہر سے تلاش کریں...")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn("btn-secondary text-sm", hasFilters && "border-brand-400 bg-brand-50 text-brand-700")}
          >
            <Filter className="w-4 h-4" />
            {t("Filters", "فلٹر")}
            {hasFilters && <span className="w-2 h-2 bg-orange-500 rounded-full" />}
          </button>
          <button onClick={exportCSV} className="btn-ghost text-sm">
            <Download className="w-4 h-4" /> {t("Export", "ایکسپورٹ")}
          </button>
          <Link href="/customers/import" className="btn-ghost text-sm">
            <Upload className="w-4 h-4" /> {t("Import", "امپورٹ")}
          </Link>
          <Link href="/customers/new" className="btn-primary text-sm">
            <UserPlus className="w-4 h-4" /> {t("Add", "شامل کریں")}
          </Link>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="card animate-slide-up">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[160px]">
              <label className="label text-xs">{t("Filter by City", "شہر سے فلٹر")}</label>
              <div className="relative">
                <select
                  className="input text-sm appearance-none pr-8"
                  value={city}
                  onChange={(e) => { setCity(e.target.value); setPage(1); }}
                >
                  <option value="">{t("All cities", "تمام شہر")}</option>
                  {PAKISTAN_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="label text-xs">{t("Sort by", "ترتیب")}</label>
              <div className="relative">
                <select
                  className="input text-sm appearance-none pr-8"
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ArrowUpDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            {hasFilters && (
              <button onClick={clearFilters} className="btn-ghost text-sm text-red-500 hover:text-red-700 hover:bg-red-50">
                <X className="w-4 h-4" /> {t("Clear", "صاف کریں")}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Users className="w-4 h-4" />
        <span>
          {loading ? "..." : `${total} ${t("customers", "گاہک")}`}
          {(search || city) && ` (${t("filtered", "فلٹر شدہ")})`}
        </span>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton h-20 w-full rounded-2xl" />
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="card text-center py-16">
          <Users className="w-14 h-14 text-gray-200 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">
            {search || city ? t("No customers found", "کوئی گاہک نہیں ملا") : t("No customers yet", "ابھی کوئی گاہک نہیں")}
          </p>
          {!search && !city && (
            <div className="flex gap-3 justify-center mt-4">
              <Link href="/customers/new" className="btn-primary inline-flex">
                <UserPlus className="w-4 h-4" /> {t("Add Customer", "گاہک شامل کریں")}
              </Link>
              <Link href="/customers/import" className="btn-secondary inline-flex">
                <Upload className="w-4 h-4" /> {t("Import", "امپورٹ")}
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {customers.map((c) => {
            const tag = getCustomerTag(c._count.orders, c.totalPurchase, c.lastOrderAt, vipThreshold);
            const tagStyle = TAG_STYLES[tag];
            const isVip = tag === "VIP";
            const isInactive = tag === "Inactive";
            return (
              <Link key={c.id} href={`/customers/${c.id}`}>
                <div className="card p-4 hover:shadow-md transition-all duration-150 cursor-pointer flex items-center gap-4">
                  {/* Avatar */}
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg flex-shrink-0 relative",
                    isInactive ? "bg-red-100 text-red-600" :
                    isVip ? "bg-yellow-100 text-yellow-700" : "bg-brand-100 text-brand-700"
                  )}>
                    {c.name[0]?.toUpperCase()}
                    {isVip && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full flex items-center justify-center">
                        <Crown className="w-3 h-3 text-yellow-900" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-gray-900 truncate">{c.name}</p>
                        <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5" />{formatPhone(c.phone)}
                          </span>
                          {c.city && (
                            <span className="text-sm text-gray-400 flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />{c.city}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-brand-700">{formatCurrency(c.totalPurchase)}</p>
                        <p className="text-xs text-gray-400">{c._count.orders} {t("orders", "آرڈر")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", tagStyle)}>
                        {isVip && <Crown className="inline w-3 h-3 mr-0.5" />}{tag}
                      </span>
                      {c.source && (
                        <span className="badge badge-gray">{c.source}</span>
                      )}
                    </div>
                  </div>

                  {/* WhatsApp button */}
                  <a
                    href={getWhatsAppUrl(c.phone, `Assalamu Alaikum ${c.name}! 😊\nThank you for being our valued customer!`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => { e.stopPropagation(); markSent(c.id); }}
                    className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-colors text-xs font-semibold ${
                      isSentRecently(c.id)
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-green-500 text-white hover:bg-green-600"
                    }`}
                    title="Send WhatsApp"
                  >
                    {isSentRecently(c.id) ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Done</span>
                      </>
                    ) : (
                      <MessageCircle className="w-5 h-5" />
                    )}
                  </a>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary text-sm py-2 px-4 disabled:opacity-40"
          >
            {t("Previous", "پہلے")}
          </button>
          <span className="text-sm text-gray-500">
            {t("Page", "صفحہ")} {page} / {Math.ceil(total / limit)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / limit)}
            className="btn-secondary text-sm py-2 px-4 disabled:opacity-40"
          >
            {t("Next", "اگلا")}
          </button>
        </div>
      )}
    </div>
  );
}
