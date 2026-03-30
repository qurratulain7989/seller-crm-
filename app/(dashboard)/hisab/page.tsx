"use client";

import { useEffect, useState, useCallback } from "react";
import {
  TrendingUp, DollarSign, ShoppingCart, Minus, Plus,
  Trash2, Loader2, Calendar, Filter
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

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
  { key: "daily", label: "Aaj", labelUr: "آج" },
  { key: "weekly", label: "Is Hafta", labelUr: "اس ہفتہ" },
  { key: "monthly", label: "Is Mahine", labelUr: "اس مہینے" },
  { key: "custom", label: "Custom Date", labelUr: "خود چنیں" },
] as const;

const EXPENSE_CATEGORIES = [
  "Kiraya / Rent", "Bijli / Electricity", "Internet", "Transport",
  "Packaging", "Labour", "Marketing", "Other / Aur",
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
    if (filter !== "custom" || (from && to)) {
      fetchHisab();
    }
  }, [fetchHisab, filter, from, to]);

  async function addExpense() {
    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) {
      setError("Amount zaroori hai"); return;
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

  const netColor = (data?.netProfit || 0) >= 0 ? "text-brand-600" : "text-red-600";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">حساب کتاب</h1>
        <p className="text-gray-500 text-sm mt-0.5">Hisab Kitab — Revenue, Profit & Expenses</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filter === f.key
                ? "bg-brand-600 text-white shadow-sm"
                : "bg-white text-gray-600 border border-gray-200 hover:border-brand-300"
            }`}
          >
            <span>{f.labelUr}</span>
            <span className="ml-1.5 opacity-70 text-xs">/ {f.label}</span>
          </button>
        ))}
      </div>

      {/* Custom Date Picker */}
      {filter === "custom" && (
        <div className="card animate-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-brand-600" />
            <p className="font-semibold text-gray-800 text-sm">تاریخ چنیں / Select Date Range</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">سے / From</label>
              <input type="date" className="input text-sm" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">تک / To</label>
              <input type="date" className="input text-sm" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: ShoppingCart, labelUr: "کل آمدنی", label: "Revenue", value: data?.revenue || 0, color: "bg-blue-500", positive: true },
          { icon: TrendingUp, labelUr: "آرڈر منافع", label: "Order Profit", value: data?.orderProfit || 0, color: "bg-brand-600", positive: true },
          { icon: Minus, labelUr: "اخراجات", label: "Expenses", value: data?.totalExpenses || 0, color: "bg-red-500", positive: false },
          { icon: DollarSign, labelUr: "خالص منافع", label: "Net Profit", value: data?.netProfit || 0, color: (data?.netProfit || 0) >= 0 ? "bg-orange-500" : "bg-red-600", positive: (data?.netProfit || 0) >= 0 },
        ].map((card) => (
          <div key={card.label} className="card">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.color}`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            {loading ? (
              <div className="mt-3 space-y-2">
                <div className="skeleton h-6 w-20" />
                <div className="skeleton h-4 w-16" />
              </div>
            ) : (
              <div className="mt-3">
                <p className={`text-xl font-bold ${card.label === "Net Profit" ? netColor : "text-gray-900"}`}>
                  {formatCurrency(card.value)}
                </p>
                <p className="text-sm font-semibold text-gray-600">{card.labelUr}</p>
                <p className="text-xs text-gray-400">{card.label}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {!loading && data && (
        <p className="text-sm text-gray-500 flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          {data.orderCount} orders is period mein
        </p>
      )}

      {/* Expenses Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-gray-900">اخراجات کی فہرست</h2>
            <p className="text-xs text-gray-400">Expense List</p>
          </div>
          <button
            onClick={() => setShowAddExpense(!showAddExpense)}
            className="btn-primary text-sm py-2"
          >
            <Plus className="w-4 h-4" /> Naya Expense
          </button>
        </div>

        {/* Add Expense Form */}
        {showAddExpense && (
          <div className="mb-4 p-4 bg-brand-50 rounded-xl border border-brand-100 animate-slide-up">
            <h4 className="font-semibold text-gray-800 mb-3 text-sm">نیا خرچ / Add Expense</h4>
            {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs text-gray-500 mb-1 block">رقم / Amount (PKR) *</label>
                <input type="number" className="input text-sm" placeholder="1500" min={0}
                  value={expenseForm.amount} onChange={(e) => setExpenseForm((p) => ({ ...p, amount: e.target.value }))} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs text-gray-500 mb-1 block">قسم / Category</label>
                <select className="input text-sm" value={expenseForm.category}
                  onChange={(e) => setExpenseForm((p) => ({ ...p, category: e.target.value }))}>
                  <option value="">Select category</option>
                  {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs text-gray-500 mb-1 block">تفصیل / Description</label>
                <input type="text" className="input text-sm" placeholder="Kya kharch hua..."
                  value={expenseForm.description} onChange={(e) => setExpenseForm((p) => ({ ...p, description: e.target.value }))} />
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs text-gray-500 mb-1 block">تاریخ / Date</label>
                <input type="date" className="input text-sm"
                  value={expenseForm.date} onChange={(e) => setExpenseForm((p) => ({ ...p, date: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={addExpense} disabled={adding} className="btn-primary text-sm">
                {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Save
              </button>
              <button onClick={() => { setShowAddExpense(false); setError(""); }} className="btn-ghost text-sm">Cancel</button>
            </div>
          </div>
        )}

        {/* Expenses List */}
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton h-14 w-full rounded-xl" />)}
          </div>
        ) : data?.expenses.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Is period mein koi expense nahi</p>
            <p className="text-xs mt-1">Upar "+ Naya Expense" se add karein</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data?.expenses.map((e) => (
              <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="w-9 h-9 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Minus className="w-4 h-4 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm">
                    {e.category || "Expense"}
                  </p>
                  {e.description && <p className="text-xs text-gray-500">{e.description}</p>}
                  <p className="text-xs text-gray-400">{formatDate(e.date)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-red-600">- {formatCurrency(e.amount)}</p>
                </div>
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
