"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Phone, MapPin, Edit2, Trash2, MessageCircle,
  ShoppingBag, Plus, Loader2, ArrowLeft, CheckCircle, X,
  TrendingUp, Package, AlertCircle, Calendar, ChevronDown,
  CheckCircle2, Star, DollarSign
} from "lucide-react";
import { formatCurrency, formatPhone, formatDate, daysSince, getWhatsAppUrl, PAKISTAN_CITIES, CUSTOMER_SOURCES } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Order = {
  id: string; amount: number; expense: number; profit: number;
  product: string | null; description: string | null;
  status: string; createdAt: string;
};

type Customer = {
  id: string; name: string; phone: string; city: string | null;
  address: string | null; notes: string | null; source: string | null;
  tags: string | null; totalPurchase: number; totalExpense: number;
  netProfit: number; lastOrderAt: string | null; createdAt: string;
  orders: Order[];
};

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Customer>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [orderForm, setOrderForm] = useState({ amount: "", expense: "", product: "", status: "paid" });
  const [addingOrder, setAddingOrder] = useState(false);
  const [error, setError] = useState("");
  const [sentRecently, setSentRecently] = useState(false);
  const [feedbackRecently, setFeedbackRecently] = useState(false);

  async function fetchCustomer() {
    const res = await fetch(`/api/customers/${id}`);
    if (!res.ok) { router.push("/customers"); return; }
    const data = await res.json();
    setCustomer(data.customer);
    setLoading(false);
  }

  useEffect(() => {
    fetchCustomer();
    try {
      const sent = JSON.parse(localStorage.getItem("wa_sent") || "{}");
      const feedback = JSON.parse(localStorage.getItem("wa_feedback") || "{}");
      const now = Date.now();
      setSentRecently(sent[id] && now - sent[id] < 24 * 60 * 60 * 1000);
      setFeedbackRecently(feedback[id] && now - feedback[id] < 24 * 60 * 60 * 1000);
    } catch { /* ignore */ }
  }, [id]);

  function trackMessage(type: "sent" | "feedback") {
    const key = type === "sent" ? "wa_sent" : "wa_feedback";
    try {
      const stored = JSON.parse(localStorage.getItem(key) || "{}");
      stored[id] = Date.now();
      localStorage.setItem(key, JSON.stringify(stored));
      if (type === "sent") setSentRecently(true);
      else setFeedbackRecently(true);
    } catch { /* ignore */ }
  }

  async function saveEdit() {
    setSaving(true);
    const res = await fetch(`/api/customers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      const data = await res.json();
      setCustomer((prev) => prev ? { ...prev, ...data.customer } : null);
      setEditing(false);
    }
    setSaving(false);
  }

  async function deleteCustomer() {
    if (!confirm("Yeh customer delete karna chahte hain?")) return;
    setDeleting(true);
    await fetch(`/api/customers/${id}`, { method: "DELETE" });
    router.push("/customers");
  }

  async function addOrder() {
    if (!orderForm.amount || parseFloat(orderForm.amount) <= 0) {
      setError("Amount zaroori hai"); return;
    }
    setAddingOrder(true); setError("");
    const res = await fetch(`/api/customers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addOrder: true,
        order: {
          amount: parseFloat(orderForm.amount),
          expense: parseFloat(orderForm.expense) || 0,
          product: orderForm.product || undefined,
          status: orderForm.status,
        },
      }),
    });
    if (res.ok) {
      await fetchCustomer();
      setShowAddOrder(false);
      setOrderForm({ amount: "", expense: "", product: "", status: "paid" });
    }
    setAddingOrder(false);
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse max-w-2xl mx-auto">
        <div className="skeleton h-36 rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!customer) return null;

  const inactive = daysSince(customer.lastOrderAt) > 30;
  const orderCount = customer.orders.length;

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in pb-10">
      {/* Back */}
      <Link href="/customers" className="btn-ghost text-sm -ml-2 inline-flex">
        <ArrowLeft className="w-4 h-4" /> گاہکوں کی فہرست / Customers
      </Link>

      {/* Header Card */}
      <div className="card bg-gradient-to-br from-brand-600 to-brand-700 text-white border-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0">
              {customer.name[0]?.toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold">{customer.name}</h2>
                <a
                  href={getWhatsAppUrl(customer.phone, `Assalamu Alaikum ${customer.name}!`)}
                  target="_blank" rel="noopener noreferrer"
                  onClick={() => trackMessage("sent")}
                  className="w-7 h-7 bg-green-500 hover:bg-green-400 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
                  title="WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-white" />
                </a>
                {sentRecently && (
                  <span className="text-xs bg-green-500/30 text-green-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Done
                  </span>
                )}
              </div>
              <p className="text-brand-200 flex items-center gap-1 mt-0.5 text-sm">
                <Phone className="w-3.5 h-3.5" />{formatPhone(customer.phone)}
              </p>
              {customer.city && (
                <p className="text-brand-200 flex items-center gap-1 text-xs mt-0.5">
                  <MapPin className="w-3 h-3" />{customer.city}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => { setEditing(!editing); setEditForm({ name: customer.name, phone: customer.phone, city: customer.city || "", address: customer.address || "", notes: customer.notes || "", source: customer.source || "" }); }}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={deleteCustomer} disabled={deleting}
              className="p-2 bg-white/20 hover:bg-red-500 rounded-xl transition-colors"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex gap-2 mt-3 flex-wrap">
          {inactive && <span className="badge bg-red-500/20 text-red-100">30 din se inactive</span>}
          {customer.source && <span className="badge bg-white/20 text-white">{customer.source}</span>}
          <span className="badge bg-white/20 text-white">
            <Calendar className="w-3 h-3 mr-1" />{formatDate(customer.createdAt)} se
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "آمدنی", sub: "Purchase", value: formatCurrency(customer.totalPurchase), icon: TrendingUp, color: "text-blue-600 bg-blue-50" },
          { label: "منافع", sub: "Profit", value: formatCurrency(customer.netProfit), icon: DollarSign, color: "text-brand-600 bg-brand-50" },
          { label: "آرڈر", sub: "Orders", value: orderCount.toString(), icon: Package, color: "text-orange-600 bg-orange-50" },
        ].map((s) => (
          <div key={s.sub} className="card text-center p-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2 ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="font-bold text-gray-900 text-base">{s.value}</p>
            <p className="text-xs font-semibold text-gray-600">{s.label}</p>
            <p className="text-xs text-gray-400">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Notes & Address (if exists) */}
      {(customer.notes || customer.address) && (
        <div className="card space-y-3">
          {customer.notes && (
            <div className="flex gap-2 p-3 bg-orange-50 rounded-xl border-l-4 border-orange-400">
              <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-orange-600 mb-0.5">نوٹ / Note</p>
                <p className="text-sm text-gray-700">{customer.notes}</p>
              </div>
            </div>
          )}
          {customer.address && (
            <div className="flex gap-2 p-3 bg-gray-50 rounded-xl">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-gray-500 mb-0.5">پتہ / Address</p>
                <p className="text-sm text-gray-700">{customer.address}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* WhatsApp Messages */}
      <div className="card">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-green-500" />
          واٹس ایپ پیغام / WhatsApp
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <a href={getWhatsAppUrl(customer.phone, `Assalamu Alaikum ${customer.name}! 😊\nHamare store se khareedari ka shukriya!`)}
            target="_blank" rel="noopener noreferrer"
            onClick={() => trackMessage("sent")}
            className={cn("flex flex-col items-center gap-1 p-3 rounded-xl border text-sm font-semibold transition-colors", sentRecently ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50 border-gray-200 hover:bg-green-50 hover:border-green-300 text-gray-700")}>
            {sentRecently ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <MessageCircle className="w-5 h-5 text-green-500" />}
            <span className="text-xs">سلام{sentRecently ? " ✓" : ""}</span>
            <span className="text-xs text-gray-400">Salam</span>
          </a>
          <a href={getWhatsAppUrl(customer.phone, `Assalamu Alaikum ${customer.name}! 🌟\nAapki purchase ka shukriya! Kya aap apna review share karenge?\n\nShukriya! 🙏`)}
            target="_blank" rel="noopener noreferrer"
            onClick={() => trackMessage("feedback")}
            className={cn("flex flex-col items-center gap-1 p-3 rounded-xl border text-sm font-semibold transition-colors", feedbackRecently ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-gray-50 border-gray-200 hover:bg-orange-50 hover:border-orange-300 text-gray-700")}>
            {feedbackRecently ? <CheckCircle2 className="w-5 h-5 text-orange-500" /> : <Star className="w-5 h-5 text-orange-400" />}
            <span className="text-xs">فیڈ بیک{feedbackRecently ? " ✓" : ""}</span>
            <span className="text-xs text-gray-400">Feedback</span>
          </a>
          <a href={getWhatsAppUrl(customer.phone, `Assalamu Alaikum ${customer.name}! 😊\nKafi waqt ho gaya. Naye products aa gaye hain, zaroor dekhein! 🎁`)}
            target="_blank" rel="noopener noreferrer"
            onClick={() => trackMessage("sent")}
            className="flex flex-col items-center gap-1 p-3 rounded-xl border bg-gray-50 border-gray-200 hover:bg-red-50 hover:border-red-300 text-gray-700 transition-colors">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-xs">یاددہانی</span>
            <span className="text-xs text-gray-400">Reminder</span>
          </a>
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="card border-brand-200 bg-brand-50/50 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">تبدیلی / Edit Customer</h3>
            <button onClick={() => setEditing(false)} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label text-xs">نام / Name</label>
              <input type="text" className="input" value={editForm.name || ""} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="label text-xs">فون / Phone</label>
              <input type="tel" className="input" value={editForm.phone || ""} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <label className="label text-xs">شہر / City</label>
              <div className="relative">
                <select className="input appearance-none pr-8" value={editForm.city || ""} onChange={(e) => setEditForm((p) => ({ ...p, city: e.target.value }))}>
                  <option value="">Select city</option>
                  {PAKISTAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="label text-xs">ذریعہ / Source</label>
              <div className="relative">
                <select className="input appearance-none pr-8" value={editForm.source || ""} onChange={(e) => setEditForm((p) => ({ ...p, source: e.target.value }))}>
                  <option value="">Select source</option>
                  {CUSTOMER_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="label text-xs">پتہ / Address</label>
              <input type="text" className="input" value={editForm.address || ""} onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="label text-xs">نوٹ / Notes</label>
              <textarea className="input resize-none" rows={2} value={editForm.notes || ""} onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={saveEdit} disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              محفوظ / Save
            </button>
            <button onClick={() => setEditing(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      {/* Orders */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-brand-600" />
            آرڈر ہسٹری ({orderCount}) / Orders
          </h3>
          <button onClick={() => setShowAddOrder(!showAddOrder)} className="btn-primary text-sm py-2">
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        {showAddOrder && (
          <div className="mb-4 p-4 bg-brand-50 rounded-xl border border-brand-100 animate-slide-up">
            <h4 className="font-semibold text-gray-800 mb-3 text-sm">نیا آرڈ / New Order</h4>
            {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-xs">Amount (PKR) *</label>
                <input type="number" className="input text-sm" placeholder="2500" min={0}
                  value={orderForm.amount} onChange={(e) => setOrderForm((p) => ({ ...p, amount: e.target.value }))} />
              </div>
              <div>
                <label className="label text-xs">Expense (PKR)</label>
                <input type="number" className="input text-sm" placeholder="1500" min={0}
                  value={orderForm.expense} onChange={(e) => setOrderForm((p) => ({ ...p, expense: e.target.value }))} />
              </div>
              <div>
                <label className="label text-xs">Product</label>
                <input type="text" className="input text-sm" placeholder="Item ka naam"
                  value={orderForm.product} onChange={(e) => setOrderForm((p) => ({ ...p, product: e.target.value }))} />
              </div>
              <div>
                <label className="label text-xs">Status</label>
                <select className="input text-sm" value={orderForm.status}
                  onChange={(e) => setOrderForm((p) => ({ ...p, status: e.target.value }))}>
                  <option value="paid">Paid ✓</option>
                  <option value="cod">COD</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              {orderForm.amount && orderForm.expense && (
                <div className="col-span-2 p-2.5 bg-white rounded-xl border border-brand-200 text-center">
                  <p className="text-xs text-gray-500">Profit</p>
                  <p className="font-bold text-brand-700">
                    PKR {(parseFloat(orderForm.amount || "0") - parseFloat(orderForm.expense || "0")).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={addOrder} disabled={addingOrder} className="btn-primary text-sm">
                {addingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Save
              </button>
              <button onClick={() => { setShowAddOrder(false); setError(""); }} className="btn-ghost text-sm">Cancel</button>
            </div>
          </div>
        )}

        {customer.orders.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Abhi koi order nahi</p>
          </div>
        ) : (
          <div className="space-y-2">
            {customer.orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn("w-2 h-2 rounded-full flex-shrink-0",
                    o.status === "paid" ? "bg-brand-500" :
                    o.status === "cod" ? "bg-orange-500" : "bg-gray-400"
                  )} />
                  <div>
                    {o.product && <p className="font-semibold text-gray-900 text-sm">{o.product}</p>}
                    <p className="text-xs text-gray-400">{formatDate(o.createdAt)} · {o.status.toUpperCase()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900 text-sm">{formatCurrency(o.amount)}</p>
                  {o.profit > 0 && (
                    <p className="text-xs text-brand-600 font-medium">+{formatCurrency(o.profit)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
