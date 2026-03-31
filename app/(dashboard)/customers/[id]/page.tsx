"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Phone, MapPin, Edit2, Trash2, MessageCircle,
  ShoppingBag, Plus, Loader2, ArrowLeft, CheckCircle, X,
  TrendingUp, Package, AlertCircle, Calendar, ChevronDown,
  CheckCircle2, Star, DollarSign, Crown, Gift, Cake
} from "lucide-react";
import {
  formatCurrency, formatPhone, formatDate, daysSince,
  getWhatsAppUrl, PAKISTAN_CITIES, CUSTOMER_SOURCES,
  getCustomerTag, TAG_STYLES, isBirthdayToday, daysUntilBirthday
} from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/lang-context";

type Order = {
  id: string; amount: number; expense: number; profit: number;
  product: string | null; description: string | null;
  status: string; createdAt: string;
};

type Customer = {
  id: string; name: string; phone: string; city: string | null;
  address: string | null; notes: string | null; source: string | null;
  tags: string | null; dateOfBirth: string | null;
  totalPurchase: number; totalExpense: number;
  netProfit: number; lastOrderAt: string | null; createdAt: string;
  orders: Order[];
};

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useLang();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Customer & { dateOfBirth: string }>>({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [orderForm, setOrderForm] = useState({ amount: "", expense: "", product: "", status: "paid" });
  const [addingOrder, setAddingOrder] = useState(false);
  const [error, setError] = useState("");
  const [sentRecently, setSentRecently] = useState(false);
  const [feedbackRecently, setFeedbackRecently] = useState(false);
  const [vipThreshold, setVipThreshold] = useState(10000);

  useEffect(() => {
    try { setVipThreshold(parseInt(localStorage.getItem("vip_threshold") || "10000")); } catch { /* ignore */ }
  }, []);

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
    const payload = {
      ...editForm,
      dateOfBirth: editForm.dateOfBirth ? new Date(editForm.dateOfBirth as string).toISOString() : null,
    };
    const res = await fetch(`/api/customers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      await fetchCustomer();
      setEditing(false);
    }
    setSaving(false);
  }

  async function deleteCustomer() {
    if (!confirm(t("Delete this customer?", "یہ گاہک ڈیلیٹ کریں؟"))) return;
    setDeleting(true);
    await fetch(`/api/customers/${id}`, { method: "DELETE" });
    router.push("/customers");
  }

  async function addOrder() {
    if (!orderForm.amount || parseFloat(orderForm.amount) <= 0) {
      setError(t("Amount is required", "رقم ضروری ہے")); return;
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

  const orderCount = customer.orders.length;
  const tag = getCustomerTag(orderCount, customer.totalPurchase, customer.lastOrderAt, vipThreshold);
  const tagStyle = TAG_STYLES[tag];
  const isVip = tag === "VIP";
  const birthdayToday = isBirthdayToday(customer.dateOfBirth);
  const bdDays = daysUntilBirthday(customer.dateOfBirth);
  const firstOrderDate = customer.orders.length > 0
    ? customer.orders[customer.orders.length - 1].createdAt : null;
  const yearsSinceFirst = firstOrderDate ? Math.floor(daysSince(firstOrderDate) / 365) : 0;
  const isAnniversaryWeek = firstOrderDate && daysSince(firstOrderDate) % 365 <= 7 && yearsSinceFirst > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-fade-in pb-10">
      {/* Back */}
      <Link href="/customers" className="btn-ghost text-sm -ml-2 inline-flex">
        <ArrowLeft className="w-4 h-4" /> {t("Back to Customers", "گاہکوں کی فہرست")}
      </Link>

      {/* Birthday Alert */}
      {birthdayToday && (
        <div className="flex items-center gap-3 p-4 bg-pink-50 border border-pink-200 rounded-xl">
          <Cake className="w-5 h-5 text-pink-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-pink-800 text-sm">🎂 {t("Birthday Today!", "آج سالگرہ ہے!")}</p>
            <p className="text-xs text-pink-600">{t("Send a special wish to", "مبارکباد بھیجیں")} {customer.name}</p>
          </div>
          <a
            href={getWhatsAppUrl(customer.phone, `Happy Birthday ${customer.name}! 🎂🎉\nWishing you a wonderful day! Special discount just for you today — reply to claim! 🎁`)}
            target="_blank" rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1.5 bg-pink-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-pink-600 transition-colors"
          >
            <Gift className="w-3.5 h-3.5" /> {t("Send Wish", "مبارکباد")}
          </a>
        </div>
      )}

      {/* Anniversary Alert */}
      {isAnniversaryWeek && (
        <div className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-xl">
          <Star className="w-5 h-5 text-orange-500 flex-shrink-0" />
          <p className="flex-1 text-sm font-semibold text-orange-800">
            🎊 {yearsSinceFirst} {t("year customer anniversary! Say thank you.", "سال پورا ہوا! شکریہ ادا کریں۔")}
          </p>
          <a
            href={getWhatsAppUrl(customer.phone, `${customer.name}, it's been ${yearsSinceFirst} year${yearsSinceFirst > 1 ? "s" : ""} since your first order! 🎉\nThank you so much for your loyalty. You're a valued customer! 🙏`)}
            target="_blank" rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1.5 bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-orange-600 transition-colors"
          >
            {t("Send", "بھیجیں")}
          </a>
        </div>
      )}

      {/* Header Card */}
      <div className="card bg-gradient-to-br from-brand-600 to-brand-700 text-white border-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0">
                {customer.name[0]?.toUpperCase()}
              </div>
              {isVip && (
                <div className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                  <Crown className="w-3.5 h-3.5 text-yellow-900" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold">{customer.name}</h2>
                <a
                  href={getWhatsAppUrl(customer.phone, `Assalamu Alaikum ${customer.name}!`)}
                  target="_blank" rel="noopener noreferrer"
                  onClick={() => trackMessage("sent")}
                  className="w-7 h-7 bg-green-500 hover:bg-green-400 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-white" />
                </a>
                {sentRecently && (
                  <span className="text-xs bg-green-500/30 text-green-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {t("Sent", "بھیجا")}
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
              onClick={() => {
                setEditing(!editing);
                setEditForm({
                  name: customer.name,
                  phone: customer.phone,
                  city: customer.city || "",
                  address: customer.address || "",
                  notes: customer.notes || "",
                  source: customer.source || "",
                  dateOfBirth: customer.dateOfBirth
                    ? new Date(customer.dateOfBirth).toISOString().split("T")[0] : "",
                });
              }}
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
          <span className={cn("px-2 py-0.5 rounded-full text-xs font-semibold", tagStyle)}>
            {isVip && <Crown className="inline w-3 h-3 mr-0.5" />}{tag}
          </span>
          {customer.source && <span className="badge bg-white/20 text-white">{customer.source}</span>}
          <span className="badge bg-white/20 text-white text-xs">
            <Calendar className="w-3 h-3 mr-1" />{t("Since", "سے")} {formatDate(customer.createdAt)}
          </span>
          {customer.dateOfBirth && bdDays <= 7 && !birthdayToday && (
            <span className="badge bg-pink-500/30 text-pink-100 text-xs">
              <Cake className="w-3 h-3 mr-1" />{t("Birthday in", "سالگرہ")} {bdDays} {t("days", "دن")}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: t("Total Purchase", "کل خریداری"), value: formatCurrency(customer.totalPurchase), icon: TrendingUp, color: "text-blue-600 bg-blue-50" },
          { label: t("Net Profit", "خالص منافع"), value: formatCurrency(customer.netProfit), icon: DollarSign, color: "text-brand-600 bg-brand-50" },
          { label: t("Orders", "آرڈر"), value: orderCount.toString(), icon: Package, color: "text-orange-600 bg-orange-50" },
        ].map((s) => (
          <div key={s.label} className="card text-center p-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2 ${s.color}`}>
              <s.icon className="w-4 h-4" />
            </div>
            <p className="font-bold text-gray-900 text-base">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Notes & Address */}
      {(customer.notes || customer.address) && (
        <div className="card space-y-3">
          {customer.notes && (
            <div className="flex gap-2 p-3 bg-orange-50 rounded-xl border-l-4 border-orange-400">
              <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-orange-600 mb-0.5">{t("Note", "نوٹ")}</p>
                <p className="text-sm text-gray-700">{customer.notes}</p>
              </div>
            </div>
          )}
          {customer.address && (
            <div className="flex gap-2 p-3 bg-gray-50 rounded-xl">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-gray-500 mb-0.5">{t("Address", "پتہ")}</p>
                <p className="text-sm text-gray-700">{customer.address}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* WhatsApp Quick Messages */}
      <div className="card">
        <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2 text-sm">
          <MessageCircle className="w-4 h-4 text-green-500" />
          {t("Quick WhatsApp Messages", "فوری پیغامات")}
        </h3>
        <div className="grid grid-cols-3 gap-2">
          <a href={getWhatsAppUrl(customer.phone, `Assalamu Alaikum ${customer.name}! 😊\nThank you for shopping with us!`)}
            target="_blank" rel="noopener noreferrer"
            onClick={() => trackMessage("sent")}
            className={cn("flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer",
              sentRecently ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50 border-gray-200 hover:bg-green-50 hover:border-green-300 text-gray-700")}>
            {sentRecently ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <MessageCircle className="w-5 h-5 text-green-500" />}
            <span>{sentRecently ? t("Sent ✓", "بھیجا ✓") : t("Greeting", "سلام")}</span>
          </a>
          <a href={getWhatsAppUrl(customer.phone, `Assalamu Alaikum ${customer.name}! 🌟\nHope you loved your purchase!\nCould you share a quick review? It really helps us! 🙏`)}
            target="_blank" rel="noopener noreferrer"
            onClick={() => trackMessage("feedback")}
            className={cn("flex flex-col items-center gap-1 p-3 rounded-xl border text-xs font-semibold transition-colors cursor-pointer",
              feedbackRecently ? "bg-orange-50 border-orange-200 text-orange-700" : "bg-gray-50 border-gray-200 hover:bg-orange-50 hover:border-orange-300 text-gray-700")}>
            {feedbackRecently ? <CheckCircle2 className="w-5 h-5 text-orange-500" /> : <Star className="w-5 h-5 text-orange-400" />}
            <span>{feedbackRecently ? t("Sent ✓", "بھیجا ✓") : t("Feedback", "فیڈبیک")}</span>
          </a>
          <a href={getWhatsAppUrl(customer.phone, `Assalamu Alaikum ${customer.name}! 😊\nWe miss you! New stock just arrived — come check it out! 🎁`)}
            target="_blank" rel="noopener noreferrer"
            onClick={() => trackMessage("sent")}
            className="flex flex-col items-center gap-1 p-3 rounded-xl border bg-gray-50 border-gray-200 hover:bg-red-50 hover:border-red-300 text-gray-700 transition-colors text-xs font-semibold cursor-pointer">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span>{t("Reminder", "یاددہانی")}</span>
          </a>
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="card border-brand-200 bg-brand-50/50 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">{t("Edit Customer", "گاہک میں ترمیم")}</h3>
            <button onClick={() => setEditing(false)} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label text-xs">{t("Name", "نام")}</label>
              <input type="text" className="input" value={editForm.name || ""} onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))} />
            </div>
            <div>
              <label className="label text-xs">{t("Phone", "فون")}</label>
              <input type="tel" className="input" value={editForm.phone || ""} onChange={(e) => setEditForm((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <label className="label text-xs">{t("City", "شہر")}</label>
              <div className="relative">
                <select className="input appearance-none pr-8" value={editForm.city || ""} onChange={(e) => setEditForm((p) => ({ ...p, city: e.target.value }))}>
                  <option value="">{t("Select city", "شہر چنیں")}</option>
                  {PAKISTAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="label text-xs">{t("Source", "ذریعہ")}</label>
              <div className="relative">
                <select className="input appearance-none pr-8" value={editForm.source || ""} onChange={(e) => setEditForm((p) => ({ ...p, source: e.target.value }))}>
                  <option value="">{t("Select source", "ذریعہ چنیں")}</option>
                  {CUSTOMER_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="label text-xs">{t("Date of Birth", "تاریخ پیدائش")} ({t("optional", "اختیاری")})</label>
              <input type="date" className="input"
                value={editForm.dateOfBirth?.toString() || ""}
                onChange={(e) => setEditForm((p) => ({ ...p, dateOfBirth: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="label text-xs">{t("Address", "پتہ")}</label>
              <input type="text" className="input" value={editForm.address || ""} onChange={(e) => setEditForm((p) => ({ ...p, address: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="label text-xs">{t("Notes", "نوٹ")}</label>
              <textarea className="input resize-none" rows={2} value={editForm.notes || ""} onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={saveEdit} disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {t("Save", "محفوظ کریں")}
            </button>
            <button onClick={() => setEditing(false)} className="btn-ghost">{t("Cancel", "منسوخ")}</button>
          </div>
        </div>
      )}

      {/* Orders */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-brand-600" />
            {t("Order History", "آرڈر ہسٹری")} ({orderCount})
          </h3>
          <button onClick={() => setShowAddOrder(!showAddOrder)} className="btn-primary text-sm py-2">
            <Plus className="w-4 h-4" /> {t("Add Order", "آرڈر")}
          </button>
        </div>

        {showAddOrder && (
          <div className="mb-4 p-4 bg-brand-50 rounded-xl border border-brand-100 animate-slide-up">
            <h4 className="font-semibold text-gray-800 mb-3 text-sm">{t("New Order", "نیا آرڈر")}</h4>
            {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label text-xs">{t("Amount (PKR)", "رقم")} *</label>
                <input type="number" className="input text-sm" placeholder="2500" min={0}
                  value={orderForm.amount} onChange={(e) => setOrderForm((p) => ({ ...p, amount: e.target.value }))} />
              </div>
              <div>
                <label className="label text-xs">{t("Expense (PKR)", "خرچ")}</label>
                <input type="number" className="input text-sm" placeholder="1500" min={0}
                  value={orderForm.expense} onChange={(e) => setOrderForm((p) => ({ ...p, expense: e.target.value }))} />
              </div>
              <div>
                <label className="label text-xs">{t("Product", "پروڈکٹ")}</label>
                <input type="text" className="input text-sm" placeholder="Item name"
                  value={orderForm.product} onChange={(e) => setOrderForm((p) => ({ ...p, product: e.target.value }))} />
              </div>
              <div>
                <label className="label text-xs">{t("Status", "حیثیت")}</label>
                <select className="input text-sm" value={orderForm.status}
                  onChange={(e) => setOrderForm((p) => ({ ...p, status: e.target.value }))}>
                  <option value="paid">Paid ✓</option>
                  <option value="cod">COD</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              {orderForm.amount && orderForm.expense && (
                <div className="col-span-2 p-2.5 bg-white rounded-xl border border-brand-200 text-center">
                  <p className="text-xs text-gray-500">{t("Net Profit", "خالص منافع")}</p>
                  <p className="font-bold text-brand-700">
                    PKR {(parseFloat(orderForm.amount || "0") - parseFloat(orderForm.expense || "0")).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={addOrder} disabled={addingOrder} className="btn-primary text-sm">
                {addingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {t("Save", "محفوظ")}
              </button>
              <button onClick={() => { setShowAddOrder(false); setError(""); }} className="btn-ghost text-sm">
                {t("Cancel", "منسوخ")}
              </button>
            </div>
          </div>
        )}

        {customer.orders.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">{t("No orders yet", "ابھی کوئی آرڈر نہیں")}</p>
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
