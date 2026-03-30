"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Phone, MapPin, Home, FileText, Edit2, Trash2, MessageCircle,
  ShoppingBag, Plus, Loader2, ArrowLeft, CheckCircle, X, DollarSign,
  TrendingUp, Package, AlertCircle, Star, Calendar, ChevronDown
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
  const [orderForm, setOrderForm] = useState({ amount: "", expense: "", product: "", description: "", status: "paid" });
  const [addingOrder, setAddingOrder] = useState(false);
  const [error, setError] = useState("");

  async function fetchCustomer() {
    const res = await fetch(`/api/customers/${id}`);
    if (!res.ok) { router.push("/customers"); return; }
    const data = await res.json();
    setCustomer(data.customer);
    setLoading(false);
  }

  useEffect(() => { fetchCustomer(); }, [id]);

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
    setAddingOrder(true);
    setError("");
    const res = await fetch(`/api/customers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addOrder: true,
        order: {
          amount: parseFloat(orderForm.amount),
          expense: parseFloat(orderForm.expense) || 0,
          product: orderForm.product || undefined,
          description: orderForm.description || undefined,
          status: orderForm.status,
        },
      }),
    });
    if (res.ok) {
      await fetchCustomer();
      setShowAddOrder(false);
      setOrderForm({ amount: "", expense: "", product: "", description: "", status: "paid" });
    }
    setAddingOrder(false);
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="skeleton h-40 rounded-2xl" />
        <div className="grid grid-cols-3 gap-4">
          <div className="skeleton h-24 rounded-2xl" />
          <div className="skeleton h-24 rounded-2xl" />
          <div className="skeleton h-24 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!customer) return null;
  const inactive = daysSince(customer.lastOrderAt) > 30;
  const orderCount = customer.orders.length;

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in pb-10">
      {/* Back */}
      <Link href="/customers" className="btn-ghost text-sm -ml-2">
        <ArrowLeft className="w-4 h-4" /> Customers
      </Link>

      {/* Header Card */}
      <div className="card bg-gradient-to-br from-brand-600 to-brand-700 text-white border-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-bold flex-shrink-0">
              {customer.name[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{customer.name}</h2>
              <p className="text-brand-200 flex items-center gap-1 mt-0.5">
                <Phone className="w-4 h-4" />{formatPhone(customer.phone)}
              </p>
              {customer.city && (
                <p className="text-brand-200 flex items-center gap-1 text-sm mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />{customer.city}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => { setEditing(!editing); setEditForm({ name: customer.name, phone: customer.phone, city: customer.city || "", address: customer.address || "", notes: customer.notes || "", source: customer.source || "" }); }}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={deleteCustomer}
              disabled={deleting}
              className="p-2 bg-white/20 hover:bg-red-500 rounded-xl transition-colors"
              title="Delete"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex gap-2 mt-4 flex-wrap">
          {inactive && <span className="badge bg-red-500/20 text-red-100">30 din se inactive</span>}
          {customer.source && <span className="badge bg-white/20 text-white">{customer.source}</span>}
          <span className="badge bg-white/20 text-white">
            <Calendar className="w-3 h-3 mr-1" />
            {formatDate(customer.createdAt)} se customer
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Purchase", value: formatCurrency(customer.totalPurchase), icon: TrendingUp, color: "text-blue-600 bg-blue-50" },
          { label: "Net Profit", value: formatCurrency(customer.netProfit), icon: DollarSign, color: "text-brand-600 bg-brand-50" },
          { label: "Orders", value: orderCount.toString(), icon: Package, color: "text-orange-600 bg-orange-50" },
        ].map((s) => (
          <div key={s.label} className="card text-center p-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2 ${s.color}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <p className="font-bold text-gray-900 text-lg">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* WhatsApp Buttons */}
      <div className="card">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-green-500" />
          WhatsApp Message
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <a
            href={getWhatsAppUrl(customer.phone, `Assalamu Alaikum ${customer.name} bhai! Aap ne hamare store se khareedari ki, shukriya! 😊`)}
            target="_blank" rel="noopener noreferrer"
            className="btn-secondary text-sm justify-center"
          >
            <MessageCircle className="w-4 h-4 text-green-500" /> Salam
          </a>
          <a
            href={getWhatsAppUrl(customer.phone, `Assalamu Alaikum ${customer.name} bhai! 🌟\n\nAap ne hamare store se purchase ki, kya aap apna review share karenge? Aapki feedback se hum behtar hote hain.\n\nShukriya! 🙏`)}
            target="_blank" rel="noopener noreferrer"
            className="btn-secondary text-sm justify-center"
          >
            <Star className="w-4 h-4 text-orange-500" /> Review
          </a>
          <a
            href={getWhatsAppUrl(customer.phone, `Assalamu Alaikum ${customer.name} bhai! 😊\n\nKafi waqt ho gaya aapko dekhe. Naye products aa gaye hain. Zaroor dekhein!\n\nHamara number: Available hain aapke liye 🎁`)}
            target="_blank" rel="noopener noreferrer"
            className="btn-secondary text-sm justify-center"
          >
            <AlertCircle className="w-4 h-4 text-red-500" /> Reminder
          </a>
        </div>
        <a
          href={getWhatsAppUrl(customer.phone, `Assalamu Alaikum ${customer.name} bhai! Humein aapka feedback chahiye. Kaisi lagi hamaari service?`)}
          target="_blank" rel="noopener noreferrer"
          className="btn-primary w-full mt-2 justify-center text-sm"
        >
          <MessageCircle className="w-4 h-4" /> Get Feedback — WhatsApp pe bhejein
        </a>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="card border-brand-200 bg-brand-50/50 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">Edit Customer</h3>
            <button onClick={() => setEditing(false)} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label text-sm">Naam</label>
              <input type="text" className="input" value={editForm.name || ""} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="label text-sm">Phone</label>
              <input type="tel" className="input" value={editForm.phone || ""} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <label className="label text-sm">City</label>
              <div className="relative">
                <select className="input appearance-none pr-8" value={editForm.city || ""} onChange={(e) => setEditForm((p) => ({ ...p, city: e.target.value }))}>
                  <option value="">Select city</option>
                  {PAKISTAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="label text-sm">Source</label>
              <div className="relative">
                <select className="input appearance-none pr-8" value={editForm.source || ""} onChange={(e) => setEditForm((p) => ({ ...p, source: e.target.value }))}>
                  <option value="">Select source</option>
                  {CUSTOMER_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="label text-sm">Address</label>
              <input type="text" className="input" value={editForm.address || ""} onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="label text-sm">Notes</label>
              <textarea className="input resize-none" rows={2} value={editForm.notes || ""} onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={saveEdit} disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Save
            </button>
            <button onClick={() => setEditing(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      )}

      {/* Notes */}
      {customer.notes && (
        <div className="card border-l-4 border-orange-400">
          <div className="flex items-start gap-2">
            <FileText className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-orange-600 mb-1">Important Note</p>
              <p className="text-gray-700 text-sm">{customer.notes}</p>
            </div>
          </div>
        </div>
      )}

      {/* Address */}
      {customer.address && (
        <div className="card">
          <div className="flex items-start gap-2">
            <Home className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1">Address</p>
              <p className="text-gray-700 text-sm">{customer.address}</p>
            </div>
          </div>
        </div>
      )}

      {/* Orders */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-brand-600" />
            Order History ({orderCount})
          </h3>
          <button onClick={() => setShowAddOrder(!showAddOrder)} className="btn-primary text-sm py-2">
            <Plus className="w-4 h-4" /> Order Add
          </button>
        </div>

        {/* Add Order Form */}
        {showAddOrder && (
          <div className="mb-4 p-4 bg-brand-50 rounded-xl border border-brand-100 animate-slide-up">
            <h4 className="font-semibold text-gray-800 mb-3">Naya Order</h4>
            {error && (
              <p className="text-red-600 text-sm mb-3">{error}</p>
            )}
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
              <div className="col-span-2">
                <label className="label text-xs">Product / Item</label>
                <input type="text" className="input text-sm" placeholder="Kya likha"
                  value={orderForm.product} onChange={(e) => setOrderForm((p) => ({ ...p, product: e.target.value }))} />
              </div>
              <div>
                <label className="label text-xs">Status</label>
                <select className="input text-sm" value={orderForm.status}
                  onChange={(e) => setOrderForm((p) => ({ ...p, status: e.target.value }))}>
                  <option value="paid">Paid</option>
                  <option value="cod">COD</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              {orderForm.amount && orderForm.expense && (
                <div className="flex items-end">
                  <div className="w-full p-2.5 bg-white rounded-xl border border-brand-200 text-center">
                    <p className="text-xs text-gray-500">Profit</p>
                    <p className="font-bold text-brand-700">
                      PKR {(parseFloat(orderForm.amount||"0") - parseFloat(orderForm.expense||"0")).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={addOrder} disabled={addingOrder} className="btn-primary text-sm">
                {addingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Order
              </button>
              <button onClick={() => { setShowAddOrder(false); setError(""); }} className="btn-ghost text-sm">Cancel</button>
            </div>
          </div>
        )}

        {/* Orders list */}
        {customer.orders.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Abhi koi order nahi</p>
          </div>
        ) : (
          <div className="space-y-2">
            {customer.orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    o.status === "paid" ? "bg-brand-500" :
                    o.status === "cod" ? "bg-orange-500" : "bg-gray-400"
                  )} />
                  <div>
                    {o.product && <p className="font-semibold text-gray-900 text-sm">{o.product}</p>}
                    <p className="text-xs text-gray-400">{formatDate(o.createdAt)} · {o.status.toUpperCase()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(o.amount)}</p>
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
