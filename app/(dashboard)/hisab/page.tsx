"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp, DollarSign, ShoppingCart, Minus, Plus,
  Trash2, Loader2, Calendar
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLang } from "@/lib/lang-context";

type Expense = {
  id: string; amount: number; category: string | null;
  description: string | null; date: string; createdAt: string;
};

type HisabData = {
  revenue: number; orderProfit: number;
  totalExpenses: number; netProfit: number;
  orderCount: number; expenses: Expense[];
};

const FILTERS = [
  { key: "daily", label: "Today", labelUr: "آج" },
  { key: "weekly", label: "This Week", labelUr: "اس ہفتہ" },
  { key: "monthly", label: "This Month", labelUr: "اس مہینے" },
  { key: "custom", label: "Custom", labelUr: "خود چنیں" },
] as const;

const EXPENSE_CATEGORIES = [
  "Rent", "Electricity", "Internet", "Transport",
  "Packaging", "Labour", "Marketing", "Other",
];

export default function HisabPage() {
  const [filter, setFilter] = useState<"daily" | "weekly" | "monthly" | "custom">("monthly");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [data, setData] = useState<HisabData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ amount: "", category: "", description: "", date: "" });
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const { t } = useLang();

  const fetchHisab = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ filter });
    if (filter === "custom" && from && to) {
      params.set("from", from);
      params.set("to", to);
    }
    const res = await fetch(`/api/hisab?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [filter, from, to]);

  useEffect(() => {
    if (filter !== "custom" || (from && to)) fetchHisab();
  }, [fetchHisab, filter, from, to]);

  async function addExpense() {
    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) {
      setError("Amount is required"); return;
    }
    setAdding(true); setError("");
    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category || null,
        description: expenseForm.description || null,
        date: expenseForm.date || null,
      }),
    });
    if (res.ok) {
      setExpenseForm({ amount: "", category: "", description: "", date: "" });
      setShowAddExpense(false);
      fetchHisab();
    }
    setAdding(false);
  }

  async function deleteExpense(id: string) {
    setDeletingId(id);
    await fetch(`/api/expenses?id=${id}`, { method: "DELETE" });
    setDeletingId(null);
    fetchHisab();
  }

  const netColor = (data?.netProfit || 0) >= 0 ? "text-green-600" : "text-red-600";

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f.key
                ? "bg-green-600 text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {t(f.label, f.labelUr)}
          </button>
        ))}
      </div>

      {/* Custom Date Picker */}
      {filter === "custom" && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">{t("Select Date Range", "تاریخ چنیں")}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t("From", "سے")}</label>
              <input type="date" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">{t("To", "تک")}</label>
              <input type="date" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: ShoppingCart, label: t("Revenue", "کل آمدنی"), value: data?.revenue || 0, color: "text-blue-600 bg-blue-50" },
          { icon: TrendingUp, label: t("Order Profit", "آرڈر منافع"), value: data?.orderProfit || 0, color: "text-green-600 bg-green-50" },
          { icon: Minus, label: t("Expenses", "اخراجات"), value: data?.totalExpenses || 0, color: "text-red-600 bg-red-50" },
          { icon: DollarSign, label: t("Net Profit", "خالص منافع"), value: data?.netProfit || 0, color: (data?.netProfit || 0) >= 0 ? "text-purple-600 bg-purple-50" : "text-red-600 bg-red-50" },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-100 p-4">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color} mb-3`}>
              <card.icon className="w-4 h-4" />
            </div>
            {loading ? (
              <div className="space-y-1.5">
                <div className="h-6 w-20 bg-gray-100 rounded animate-pulse" />
                <div className="h-3.5 w-16 bg-gray-100 rounded animate-pulse" />
              </div>
            ) : (
              <>
                <p className={`text-xl font-bold ${card.label === t("Net Profit", "خالص منافع") ? netColor : "text-gray-900"}`}>
                  {formatCurrency(card.value)}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {!loading && data && (
        <p className="text-sm text-gray-500 flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          {data.orderCount} {t("orders in this period", "اس مدت میں آرڈر")}
        </p>
      )}

      {/* Expenses Section */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 text-sm">{t("Expense List", "اخراجات کی فہرست")}</h2>
          <button
            onClick={() => setShowAddExpense(!showAddExpense)}
            className="inline-flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> {t("Add Expense", "خرچ شامل کریں")}
          </button>
        </div>

        {/* Add Expense Form */}
        {showAddExpense && (
          <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-3 text-sm">{t("Add New Expense", "نیا خرچ")}</h4>
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs text-gray-500 mb-1 block">{t("Amount (PKR)", "رقم")} *</label>
                <input type="number" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="1500" min={0}
                  value={expenseForm.amount} onChange={(e) => setExpenseForm((p) => ({ ...p, amount: e.target.value }))} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs text-gray-500 mb-1 block">{t("Category", "قسم")}</label>
                <select className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" value={expenseForm.category}
                  onChange={(e) => setExpenseForm((p) => ({ ...p, category: e.target.value }))}>
                  <option value="">{t("Select category", "قسم چنیں")}</option>
                  {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs text-gray-500 mb-1 block">{t("Description", "تفصیل")}</label>
                <input type="text" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder={t("What was this expense for?", "یہ خرچ کس لیے تھا؟")}
                  value={expenseForm.description} onChange={(e) => setExpenseForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs text-gray-500 mb-1 block">{t("Date", "تاریخ")}</label>
                <input type="date" className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  value={expenseForm.date} onChange={(e) => setExpenseForm((p) => ({ ...p, date: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={addExpense} disabled={adding} className="inline-flex items-center gap-1.5 bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {t("Save", "محفوظ کریں")}
              </button>
              <button onClick={() => { setShowAddExpense(false); setError(""); }} className="px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors">
                {t("Cancel", "منسوخ")}
              </button>
            </div>
          </div>
        )}

        {/* Expenses List */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : data?.expenses.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">{t("No expenses in this period", "اس مدت میں کوئی خرچ نہیں")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data?.expenses.map((e) => (
              <div key={e.id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Minus className="w-4 h-4 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm">{e.category || t("Expense", "خرچ")}</p>
                  {e.description && <p className="text-xs text-gray-500">{e.description}</p>}
                  <p className="text-xs text-gray-400">{formatDate(e.date)}</p>
                </div>
                <p className="font-semibold text-red-600 text-sm flex-shrink-0">- {formatCurrency(e.amount)}</p>
                <button
                  onClick={() => deleteExpense(e.id)}
                  disabled={deletingId === e.id}
                  className="p-1.5 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  {deletingId === e.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
