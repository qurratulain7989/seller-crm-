"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, Phone, MapPin, Loader2, Users } from "lucide-react";
import { formatPhone, getCustomerTag, TAG_STYLES } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Customer = {
  id: string;
  name: string;
  phone: string;
  city: string | null;
  totalPurchase: number;
  lastOrderAt: string | null;
  _count: { orders: number };
};

export function GlobalSearch() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [vipThreshold, setVipThreshold] = useState(10000);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      setVipThreshold(parseInt(localStorage.getItem("vip_threshold") || "10000"));
    } catch { /* ignore */ }
  }, []);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Keyboard shortcut: / to open
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "/" && !open && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 50);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const fetchResults = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(q)}&limit=8`);
      const data = await res.json();
      setResults(data.customers || []);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchResults(query), 250);
    return () => clearTimeout(timer);
  }, [query, fetchResults]);

  // Load all customers when search box opened with no query
  useEffect(() => {
    if (open && !query) {
      fetchResults(" ");
    }
  }, [open, query, fetchResults]);

  function openSearch() {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function selectCustomer(id: string) {
    setOpen(false);
    setQuery("");
    setResults([]);
    router.push(`/customers/${id}`);
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Search trigger button */}
      <button
        onClick={openSearch}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all text-sm",
          open
            ? "border-brand-400 bg-brand-50 text-brand-700 w-48 sm:w-64"
            : "border-gray-200 bg-gray-50 text-gray-500 hover:bg-white hover:border-gray-300 w-36 sm:w-48"
        )}
      >
        <Search className="w-4 h-4 flex-shrink-0" />
        {!open && <span className="truncate text-xs">Search customers...</span>}
        {open && (
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or phone..."
            className="flex-1 bg-transparent outline-none text-xs text-gray-800 placeholder-gray-400 min-w-0"
            onClick={(e) => e.stopPropagation()}
          />
        )}
        {open && query && (
          <button
            onClick={(e) => { e.stopPropagation(); setQuery(""); inputRef.current?.focus(); }}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </button>

      {/* Dropdown results */}
      {open && (
        <div className="absolute top-full right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl border border-gray-100 shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100">
            <span className="text-xs font-semibold text-gray-500">
              {loading ? "Searching..." : query ? `Results for "${query}"` : "All Customers"}
            </span>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Results */}
          <div className="max-h-72 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-400">
                <Users className="w-8 h-8 mb-2 text-gray-200" />
                <p className="text-xs font-medium">No customers found</p>
              </div>
            ) : (
              results.map((c) => {
                const tag = getCustomerTag(c._count.orders, c.totalPurchase, c.lastOrderAt, vipThreshold);
                const tagStyle = TAG_STYLES[tag];
                return (
                  <button
                    key={c.id}
                    onClick={() => selectCustomer(c.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {c.name[0]?.toUpperCase()}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-900 text-sm truncate">{c.name}</p>
                        <span className={cn("px-1.5 py-0.5 rounded-full text-[9px] font-bold flex-shrink-0", tagStyle)}>
                          {tag}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Phone className="w-3 h-3" />{formatPhone(c.phone)}
                        </span>
                        {c.city && (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <MapPin className="w-3 h-3" />{c.city}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Orders count */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-gray-400">{c._count.orders} orders</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer — view all */}
          <div className="border-t border-gray-100 px-4 py-2.5">
            <button
              onClick={() => { setOpen(false); router.push(query ? `/customers?search=${encodeURIComponent(query)}` : "/customers"); }}
              className="w-full text-xs text-brand-600 hover:text-brand-700 font-semibold text-center flex items-center justify-center gap-1"
            >
              View all customers →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
