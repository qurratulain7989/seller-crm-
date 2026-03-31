"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Search, Filter, UserPlus, Download, Phone,
  MapPin, ChevronDown, Users, MessageCircle,
  ArrowUpDown, X, CheckCircle2
} from "lucide-react";
import { formatCurrency, formatPhone, daysSince, getWhatsAppUrl, PAKISTAN_CITIES } from "@/lib/utils";
import { cn } from "@/lib/utils";

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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [sentMap, setSentMap] = useState<Record<string, number>>({});
  const [feedbackMap, setFeedbackMap] = useState<Record<string, number>>({});
  const limit = 20;

  useEffect(() => {
    try {
      setSentMap(JSON.parse(localStorage.getItem("wa_sent") || "{}"));
      setFeedbackMap(JSON.parse(localStorage.getItem("wa_feedback") || "{}"));
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
            placeholder="Naam, phone, ya city se dhunden..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn("btn-secondary text-sm", hasFilters && "border-brand-400 bg-brand-50 text-brand-700")}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasFilters && <span className="w-2 h-2 bg-orange-500 rounded-full" />}
          </button>
          <button onClick={exportCSV} className="btn-ghost text-sm">
            <Download className="w-4 h-4" /> Export
          </button>
          <Link href="/customers/new" className="btn-primary text-sm">
            <UserPlus className="w-4 h-4" /> Add
          </Link>
        </div>
      </div>

      {/* Filters panel */}
      {showFilters && (
        <div className="card animate-slide-up">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[160px]">
              <label className="label text-xs">City se filter</label>
              <div className="relative">
                <select
                  className="input text-sm appearance-none pr-8"
                  value={city}
                  onChange={(e) => { setCity(e.target.value); setPage(1); }}
                >
                  <option value="">Sab cities</option>
                  {PAKISTAN_CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="label text-xs">Sort karein</label>
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
                <X className="w-4 h-4" /> Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Users className="w-4 h-4" />
        <span>
          {loading ? "..." : `${total} customers`}
          {(search || city) && " (filtered)"}
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
            {search || city ? "Koi customer nahi mila" : "Abhi koi customer nahi"}
          </p>
          {!search && !city && (
            <Link href="/customers/new" className="btn-primary mt-4 inline-flex">
              <UserPlus className="w-4 h-4" /> Pehla Customer Add Karein
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {customers.map((c) => {
            const inactive = daysSince(c.lastOrderAt) > 30;
            return (
              <Link key={c.id} href={`/customers/${c.id}`}>
                <div className="card p-4 hover:shadow-md transition-all duration-150 cursor-pointer flex items-center gap-4">
                  {/* Avatar */}
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg flex-shrink-0",
                    inactive ? "bg-red-100 text-red-600" : "bg-brand-100 text-brand-700"
                  )}>
                    {c.name[0]?.toUpperCase()}
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
                        <p className="text-xs text-gray-400">{c._count.orders} orders</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      {inactive && (
                        <span className="badge badge-red">30 din se inactive</span>
                      )}
                      {c.source && (
                        <span className="badge badge-gray">{c.source}</span>
                      )}
                    </div>
                  </div>

                  {/* WhatsApp button */}
                  <a
                    href={getWhatsAppUrl(c.phone, `Assalamu Alaikum ${c.name}! 😊\nHamare store mein aapka shukriya. Koi zaroorat ho toh zaroor batayein!`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => { e.stopPropagation(); markSent(c.id); }}
                    className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-colors text-xs font-semibold ${
                      isSentRecently(c.id)
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-green-500 text-white hover:bg-green-600"
                    }`}
                    title="WhatsApp send karein"
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
            Pehle
          </button>
          <span className="text-sm text-gray-500">
            Page {page} / {Math.ceil(total / limit)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / limit)}
            className="btn-secondary text-sm py-2 px-4 disabled:opacity-40"
          >
            Agla
          </button>
        </div>
      )}
    </div>
  );
}
