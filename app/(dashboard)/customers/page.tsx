"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search, Filter, UserPlus, Download, Phone,
  MapPin, ChevronDown, Users, ArrowUpDown,
  X, CheckCircle2, Crown, AlertCircle, Upload
} from "lucide-react";
import {
  formatCurrency, formatPhone, getWhatsAppUrl, PAKISTAN_CITIES,
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

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export default function CustomersPage() {
  const { t } = useLang();
  const searchParams = useSearchParams();
  const urlFilter = searchParams.get("filter") || "";

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
      ...(urlFilter && { filter: urlFilter }),
    });
    const res = await fetch(`/api/customers?${params}`);
    const data = await res.json();
    setCustomers(data.customers || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [search, city, sortBy, page, urlFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(timer);
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
    <div className="space-y-4 animate-fade-in">

      {/* Top bar */}
      <div className="flex flex-col gap-3">
        {/* Search row */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            className="w-full pl-10 pr-9 py-2.5 text-sm rounded-xl border border-gray-200 shadow-sm bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-300 focus:border-transparent transition"
            placeholder="Search by name, phone, or city..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Action buttons row */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors",
              hasFilters
                ? "border-brand-400 bg-brand-50 text-brand-700"
                : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
            )}
          >
            <Filter className="w-4 h-4" />
            <span className="hidden xs:inline">Filters</span>
            {hasFilters && <span className="w-1.5 h-1.5 bg-orange-500 rounded-full" />}
          </button>

          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <Link
            href="/customers/new"
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            Add / Import
          </Link>
        </div>
      </div>

      {/* Active filter banners */}
      {urlFilter === "inactive" && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700 font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Showing inactive customers (no order in 30+ days)
          <Link href="/customers" className="ml-auto text-xs underline">Clear</Link>
        </div>
      )}
      {urlFilter === "new" && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-brand-50 border border-brand-100 rounded-xl text-sm text-brand-700 font-medium">
          <Users className="w-4 h-4 flex-shrink-0" />
          Showing new customers — send feedback requests
          <Link href="/customers" className="ml-auto text-xs underline">Clear</Link>
        </div>
      )}

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm animate-slide-up">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
              <div className="relative">
                <select
                  className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2 appearance-none pr-8 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
                  value={city}
                  onChange={(e) => { setCity(e.target.value); setPage(1); }}
                >
                  <option value="">All cities</option>
                  {PAKISTAN_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-gray-500 mb-1">Sort by</label>
              <div className="relative">
                <select
                  className="w-full text-sm rounded-xl border border-gray-200 px-3 py-2 appearance-none pr-8 bg-white focus:outline-none focus:ring-2 focus:ring-brand-300"
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
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm text-red-500 hover:text-red-700 hover:bg-red-50 border border-transparent transition-colors"
              >
                <X className="w-4 h-4" /> Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Count label */}
      <p className="text-xs text-gray-400 font-medium px-1">
        {loading ? "Loading..." : `${total} customer${total !== 1 ? "s" : ""}${(search || city) ? " (filtered)" : ""}`}
      </p>

      {/* Customer list */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-100 rounded w-32" />
                <div className="h-3 bg-gray-100 rounded w-24" />
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-xl flex-shrink-0" />
            </div>
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 text-center py-16 px-4">
          <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium text-sm">
            {search || city ? "No customers found" : "No customers yet"}
          </p>
          {!search && !city && (
            <div className="flex gap-3 justify-center mt-4">
              <Link href="/customers/new" className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold transition-colors">
                <UserPlus className="w-4 h-4" /> Add Customer
              </Link>
              <Link href="/customers/import" className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
                <Upload className="w-4 h-4" /> Import
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100 overflow-hidden shadow-sm">
          {customers.map((c) => {
            const tag = getCustomerTag(c._count.orders, c.totalPurchase, c.lastOrderAt, vipThreshold);
            const tagStyle = TAG_STYLES[tag];
            const isVip = tag === "VIP";
            const isInactive = tag === "Inactive";
            const sent = isSentRecently(c.id);

            return (
              <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group">

                {/* Left: Avatar + tag badge */}
                <Link href={`/customers/${c.id}`} className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-base relative",
                    isInactive ? "bg-red-100 text-red-600" :
                    isVip ? "bg-yellow-100 text-yellow-700" :
                    "bg-brand-100 text-brand-700"
                  )}>
                    {c.name[0]?.toUpperCase()}
                    {isVip && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                        <Crown className="w-2.5 h-2.5 text-yellow-900" />
                      </div>
                    )}
                  </div>
                  <span className={cn("px-1.5 py-0.5 rounded-full text-[9px] font-bold leading-none", tagStyle)}>
                    {tag}
                  </span>
                </Link>

                {/* Center: Info */}
                <Link href={`/customers/${c.id}`} className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate">{c.name}</p>
                  <a
                    href={`tel:${c.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 mt-0.5 w-fit"
                  >
                    <Phone className="w-3 h-3" />
                    {formatPhone(c.phone)}
                  </a>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {c.city && (
                      <span className="flex items-center gap-0.5 text-xs text-gray-400">
                        <MapPin className="w-3 h-3" />{c.city}
                      </span>
                    )}
                    {c.source && (
                      <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full font-medium">
                        {c.source}
                      </span>
                    )}
                  </div>
                </Link>

                {/* Center-right: purchase info */}
                <Link href={`/customers/${c.id}`} className="hidden sm:block text-right flex-shrink-0 mr-2">
                  <p className="font-bold text-brand-700 text-sm">{formatCurrency(c.totalPurchase)}</p>
                  <p className="text-xs text-gray-400">{c._count.orders} orders</p>
                </Link>

                {/* Right: Action buttons */}
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  {/* WhatsApp button — official green #25D366 */}
                  <a
                    href={getWhatsAppUrl(c.phone, `Assalamu Alaikum ${c.name}! 😊\nThank you for being our valued customer!`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => { e.stopPropagation(); markSent(c.id); }}
                    className="flex items-center justify-center w-9 h-9 rounded-xl transition-all hover:scale-105 active:scale-95"
                    style={{ backgroundColor: "#25D366" }}
                    title="Send WhatsApp message"
                  >
                    <WhatsAppIcon className="w-5 h-5 text-white" />
                  </a>

                  {/* Mark Done button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); markSent(c.id); }}
                    className={cn(
                      "flex items-center justify-center w-9 h-9 rounded-xl border transition-all",
                      sent
                        ? "border-green-200 bg-green-50 text-green-600"
                        : "border-gray-200 bg-white text-gray-400 hover:border-green-300 hover:text-green-600 hover:bg-green-50"
                    )}
                    title={sent ? "Sent today" : "Mark as done"}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-center gap-2 pt-1">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-gray-400">
            Page {page} / {Math.ceil(total / limit)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / limit)}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
