"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles, Loader2, CheckCircle, AlertCircle,
  MessageSquare, User, Phone, MapPin, Home,
  FileText, ShoppingCart, DollarSign, ChevronDown,
  X, Upload, Users, Trash2, ChevronRight, PenLine
} from "lucide-react";
import { PAKISTAN_CITIES, CUSTOMER_SOURCES } from "@/lib/utils";

type FormData = {
  name: string; phone: string; city: string;
  address: string; notes: string; source: string; dateOfBirth: string;
};

type ParsedData = {
  name?: string; phone?: string; city?: string;
  address?: string; product?: string; amount?: number; notes?: string;
};

type ParsedCustomer = {
  name: string; phone: string; city: string;
  address: string; product: string; amount: number; notes: string;
  selected?: boolean;
};

type Tab = "manual" | "message" | "bulk";

export default function NewCustomerPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("manual");

  // ── Manual tab ──
  const [waMsg, setWaMsg] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [form, setForm] = useState<FormData>({
    name: "", phone: "", city: "", address: "", notes: "", source: "WhatsApp", dateOfBirth: "",
  });
  const [orderAmount, setOrderAmount] = useState("");
  const [orderExpense, setOrderExpense] = useState("");
  const [orderProduct, setOrderProduct] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [duplicate, setDuplicate] = useState<{ id: string } | null>(null);

  // ── Message tab ──
  const [msgText, setMsgText] = useState("");
  const [msgParsing, setMsgParsing] = useState(false);
  const [msgError, setMsgError] = useState("");
  const [msgParsed, setMsgParsed] = useState<ParsedCustomer | null>(null);
  const [msgSaving, setMsgSaving] = useState(false);

  // ── Bulk tab ──
  const [fileContent, setFileContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [bulkParsing, setBulkParsing] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [bulkResults, setBulkResults] = useState<ParsedCustomer[]>([]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkDone, setBulkDone] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  // ── Manual tab helpers ──
  function updateForm(key: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function parseWhatsApp() {
    if (!waMsg.trim()) return;
    setParsing(true); setParseError(""); setParsedData(null);
    try {
      const res = await fetch("/api/ai/parse", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: waMsg }),
      });
      const data = await res.json();
      if (!res.ok) { setParseError(data.error || "Could not read the message."); return; }
      const { data: d } = data;
      setParsedData(d);
      setForm((prev) => ({
        ...prev,
        name: d.name || prev.name, phone: d.phone || prev.phone,
        city: d.city || prev.city, address: d.address || prev.address,
        notes: d.notes || prev.notes,
      }));
      if (d.product) setOrderProduct(d.product);
      if (d.amount) setOrderAmount(d.amount.toString());
    } catch { setParseError("Network error. Please try again."); }
    finally { setParsing(false); }
  }

  function applyParsed(field: keyof ParsedData) {
    if (!parsedData) return;
    const val = parsedData[field];
    if (field === "name") updateForm("name", String(val || ""));
    else if (field === "phone") updateForm("phone", String(val || ""));
    else if (field === "city") updateForm("city", String(val || ""));
    else if (field === "address") updateForm("address", String(val || ""));
    else if (field === "notes") updateForm("notes", String(val || ""));
    else if (field === "product") setOrderProduct(String(val || ""));
    else if (field === "amount") setOrderAmount(String(val || ""));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(""); setDuplicate(null);
    if (!form.name.trim() || !form.phone.trim()) {
      setSaveError("Name and phone number are required"); return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.status === 409) {
        setDuplicate({ id: data.customerId });
        setSaveError("This phone number already exists");
        setSaving(false); return;
      }
      if (!res.ok) { setSaveError(data.error || "Could not save. Please try again."); setSaving(false); return; }
      const customerId = data.customer.id;
      if (orderAmount && parseFloat(orderAmount) > 0) {
        await fetch(`/api/customers/${customerId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            addOrder: true,
            order: { amount: parseFloat(orderAmount), expense: parseFloat(orderExpense) || 0, product: orderProduct || undefined, status: "paid" },
          }),
        });
      }
      router.push(`/customers/${customerId}`);
    } catch { setSaveError("Network error. Please try again."); }
    finally { setSaving(false); }
  }

  // ── Message tab helpers ──
  async function parseSingle() {
    if (!msgText.trim()) return;
    setMsgParsing(true); setMsgError(""); setMsgParsed(null);
    try {
      const res = await fetch("/api/ai/parse", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msgText }),
      });
      const data = await res.json();
      if (!res.ok) { setMsgError(data.error || "Could not read the message."); return; }
      setMsgParsed({ ...data.data, selected: true });
    } catch { setMsgError("Network error."); }
    finally { setMsgParsing(false); }
  }

  async function saveSingle() {
    if (!msgParsed) return;
    setMsgSaving(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: msgParsed.name, phone: msgParsed.phone, city: msgParsed.city || undefined, address: msgParsed.address || undefined, notes: msgParsed.notes || undefined, source: "WhatsApp" }),
      });
      const data = await res.json();
      if (res.status === 409) { router.push(`/customers/${data.customerId}`); return; }
      if (!res.ok) { setMsgSaving(false); return; }
      const customerId = data.customer.id;
      if (msgParsed.amount > 0) {
        await fetch(`/api/customers/${customerId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ addOrder: true, order: { amount: msgParsed.amount, product: msgParsed.product || undefined, status: "paid" } }),
        });
      }
      router.push(`/customers/${customerId}`);
    } catch { setMsgSaving(false); }
  }

  // ── Bulk tab helpers ──
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setFileContent(ev.target?.result as string || "");
    reader.readAsText(file);
  }

  async function parseBulk() {
    if (!fileContent.trim()) return;
    setBulkParsing(true); setBulkError(""); setBulkResults([]);
    try {
      const res = await fetch("/api/ai/parse-bulk", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: fileContent.slice(0, 15000) }),
      });
      const data = await res.json();
      if (!res.ok) { setBulkError(data.error || "Could not process file."); return; }
      setBulkResults((data.customers || []).map((c: ParsedCustomer) => ({ ...c, selected: true })));
    } catch { setBulkError("Network error."); }
    finally { setBulkParsing(false); }
  }

  async function saveBulk() {
    const selected = bulkResults.filter((c) => c.selected);
    if (!selected.length) return;
    setBulkSaving(true);
    let count = 0;
    for (const c of selected) {
      try {
        const res = await fetch("/api/customers", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: c.name, phone: c.phone, city: c.city || undefined, address: c.address || undefined, notes: c.notes || undefined, source: "WhatsApp" }),
        });
        if (res.ok) {
          const { customer } = await res.json();
          if (c.amount > 0) {
            await fetch(`/api/customers/${customer.id}`, {
              method: "PUT", headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ addOrder: true, order: { amount: c.amount, product: c.product || undefined, status: "paid" } }),
            });
          }
          count++;
        }
      } catch { /* skip */ }
    }
    setSavedCount(count); setBulkDone(true); setBulkSaving(false);
  }

  function toggleSelect(i: number) {
    setBulkResults((prev) => prev.map((c, idx) => idx === i ? { ...c, selected: !c.selected } : c));
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "manual", label: "Add Manually", icon: <PenLine className="w-4 h-4" /> },
    { key: "message", label: "From Message", icon: <MessageSquare className="w-4 h-4" /> },
    { key: "bulk", label: "Bulk Import", icon: <Upload className="w-4 h-4" /> },
  ];

  return (
    <div className="max-w-2xl mx-auto pb-10 animate-fade-in">

      {/* Page header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Add Customer</h1>
        <p className="text-sm text-gray-500 mt-0.5">Choose how you want to add customers</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-2xl mb-5">
        {tabs.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === key
                ? "bg-white text-brand-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {icon}
            <span className="hidden xs:inline sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB 1: Manual ── */}
      {tab === "manual" && (
        <div className="space-y-5">
          {/* Smart Auto-Fill */}
          <div className="bg-gradient-to-br from-brand-50 to-indigo-50 border border-brand-100 rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Smart Auto-Fill</h3>
                <p className="text-xs text-gray-500">Paste a WhatsApp message and we'll fill the form instantly</p>
              </div>
            </div>
            <div className="relative">
              <textarea
                value={waMsg}
                onChange={(e) => setWaMsg(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-brand-200 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-300 min-h-[90px] resize-none pr-9"
                placeholder=""
              />
              {waMsg && (
                <button type="button" onClick={() => setWaMsg("")}
                  className="absolute right-3 top-3 p-0.5 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {parseError && (
              <p className="text-red-600 text-xs mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {parseError}
              </p>
            )}
            <button type="button" onClick={parseWhatsApp} disabled={!waMsg.trim() || parsing}
              className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors">
              {parsing
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Filling form...</>
                : <><Sparkles className="w-4 h-4" /> ✦ Auto-Fill from Message</>}
            </button>
            {parsedData && (
              <div className="mt-4 p-3 bg-white rounded-xl border border-brand-200">
                <div className="flex items-center gap-2 mb-2.5">
                  <CheckCircle className="w-4 h-4 text-brand-600" />
                  <p className="text-xs font-semibold text-brand-700">We found this info — tap to apply</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(parsedData).map(([key, val]) => {
                    if (!val) return null;
                    const labels: Record<string, string> = { name: "Name", phone: "Phone", city: "City", address: "Address", product: "Product", amount: "Amount", notes: "Notes" };
                    return (
                      <button key={key} type="button" onClick={() => applyParsed(key as keyof ParsedData)}
                        className="text-left p-2 rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-all text-sm">
                        <p className="text-[10px] text-gray-400 font-medium">{labels[key] || key}</p>
                        <p className="text-gray-800 font-semibold truncate text-xs">{String(val)}</p>
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-gray-400 mt-2">Tap any field to apply it to the form</p>
              </div>
            )}
          </div>

          {/* Manual form */}
          <form onSubmit={handleSave} className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="font-bold text-gray-900 border-b border-gray-100 pb-3">Customer Details</h3>

            {saveError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                <p className="font-semibold">{saveError}</p>
                {duplicate && (
                  <a href={`/customers/${duplicate.id}`} className="text-red-600 underline text-xs mt-1 block">
                    View existing customer →
                  </a>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  <User className="inline w-3.5 h-3.5 mr-1" />Name <span className="text-red-500">*</span>
                </label>
                <input type="text" className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white" placeholder="" value={form.name} onChange={(e) => updateForm("name", e.target.value)} required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  <Phone className="inline w-3.5 h-3.5 mr-1" />Phone <span className="text-red-500">*</span>
                </label>
                <input type="tel" className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white" placeholder="" value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  <MapPin className="inline w-3.5 h-3.5 mr-1" />City
                </label>
                <div className="relative">
                  <select className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white appearance-none pr-9" value={form.city} onChange={(e) => updateForm("city", e.target.value)}>
                    <option value="">Select city</option>
                    {PAKISTAN_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Source</label>
                <div className="relative">
                  <select className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white appearance-none pr-9" value={form.source} onChange={(e) => updateForm("source", e.target.value)}>
                    {CUSTOMER_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">Date of Birth <span className="text-gray-400 font-normal">(optional — for birthday reminders)</span></label>
              <input type="date" className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white" value={form.dateOfBirth} onChange={(e) => updateForm("dateOfBirth", e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                <Home className="inline w-3.5 h-3.5 mr-1" />Address
              </label>
              <input type="text" className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white" placeholder="" value={form.address} onChange={(e) => updateForm("address", e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                <FileText className="inline w-3.5 h-3.5 mr-1" />Notes
              </label>
              <textarea className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white resize-none" rows={3} placeholder="" value={form.notes} onChange={(e) => updateForm("notes", e.target.value)} />
            </div>

            {/* First Order */}
            <div className="border-t border-gray-100 pt-4">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                <ShoppingCart className="w-4 h-4 text-orange-500" /> First Order <span className="text-xs text-gray-400 font-normal">(optional)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Product / Item</label>
                  <input type="text" className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white" placeholder="" value={orderProduct} onChange={(e) => setOrderProduct(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                    <DollarSign className="inline w-3.5 h-3.5 mr-0.5" />Amount (PKR)
                  </label>
                  <input type="number" className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white" placeholder="0" min={0} value={orderAmount} onChange={(e) => setOrderAmount(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Expense (PKR)</label>
                  <input type="number" className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white" placeholder="0" min={0} value={orderExpense} onChange={(e) => setOrderExpense(e.target.value)} />
                </div>
                {orderAmount && orderExpense && (
                  <div className="flex items-center">
                    <div className="w-full p-3 bg-brand-50 rounded-xl border border-brand-100">
                      <p className="text-[10px] text-gray-500 font-medium">Net Profit</p>
                      <p className="font-bold text-brand-700">PKR {(parseFloat(orderAmount || "0") - parseFloat(orderExpense || "0")).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button type="submit" disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold disabled:opacity-50 transition-colors shadow-sm">
                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><CheckCircle className="w-4 h-4" /> Save Customer</>}
              </button>
              <button type="button" onClick={() => router.back()}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TAB 2: From Message ── */}
      {tab === "message" && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Quick Add from Message</h3>
                <p className="text-xs text-gray-500">Paste any WhatsApp order message — we'll extract and save the customer instantly</p>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={msgText}
                onChange={(e) => setMsgText(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-300 min-h-[130px] resize-none pr-9"
                placeholder=""
              />
              {msgText && (
                <button onClick={() => { setMsgText(""); setMsgParsed(null); }}
                  className="absolute right-3 top-3 p-0.5 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {msgError && (
              <p className="text-red-600 text-xs mt-2 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {msgError}
              </p>
            )}

            <button onClick={parseSingle} disabled={!msgText.trim() || msgParsing}
              className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold disabled:opacity-50 transition-colors">
              {msgParsing ? <><Loader2 className="w-4 h-4 animate-spin" /> Reading message...</> : <><Sparkles className="w-4 h-4" /> ✦ Extract & Preview</>}
            </button>
          </div>

          {msgParsed && (
            <div className="bg-white border border-brand-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-brand-600" />
                <p className="font-semibold text-gray-900">Review before saving</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Name", key: "name" }, { label: "Phone", key: "phone" },
                  { label: "City", key: "city" }, { label: "Address", key: "address" },
                  { label: "Product", key: "product" }, { label: "Amount (PKR)", key: "amount" },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <p className="text-[10px] text-gray-400 font-semibold mb-1">{label}</p>
                    <input
                      type={key === "amount" ? "number" : "text"}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white"
                      value={(msgParsed as unknown as Record<string, string | number>)[key] as string || ""}
                      onChange={(e) => setMsgParsed((p) => p ? { ...p, [key]: key === "amount" ? parseFloat(e.target.value) || 0 : e.target.value } : p)}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={saveSingle} disabled={msgSaving || !msgParsed.name || !msgParsed.phone}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold disabled:opacity-50 transition-colors">
                  {msgSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><CheckCircle className="w-4 h-4" /> Save Customer</>}
                </button>
                <button onClick={() => setMsgParsed(null)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: Bulk Import ── */}
      {tab === "bulk" && (
        <div className="space-y-4">
          {bulkDone ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center shadow-sm">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-9 h-9 text-green-500" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{savedCount} Customers Imported!</p>
              <p className="text-sm text-gray-500 mt-1">Successfully saved to your CRM</p>
              <div className="flex gap-3 justify-center mt-6">
                <Link href="/customers"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold transition-colors">
                  <Users className="w-4 h-4" /> View All Customers
                </Link>
                <button onClick={() => { setBulkDone(false); setBulkResults([]); setFileContent(""); setFileName(""); }}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
                  Import More
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Upload card */}
              <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Upload className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Upload WhatsApp Chat</h3>
                    <p className="text-xs text-gray-500">Export a WhatsApp group chat and import all customers at once</p>
                  </div>
                </div>

                {/* How-to steps */}
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4">
                  <p className="text-xs font-semibold text-amber-800 mb-2">How to export from WhatsApp:</p>
                  <ol className="space-y-1">
                    {[
                      "Open the WhatsApp chat or group",
                      'Tap ⋮ Menu → More → "Export Chat"',
                      'Choose "Without Media"',
                      "Share the .txt file and upload below",
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-amber-700">
                        <span className="w-4 h-4 bg-amber-200 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5">{i + 1}</span>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>

                <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-colors group">
                  <Upload className="w-7 h-7 text-gray-300 group-hover:text-brand-500 mb-2 transition-colors" />
                  <span className="text-sm font-semibold text-gray-600">Click to upload .txt file</span>
                  <span className="text-xs text-gray-400 mt-1">{fileName || "No file selected"}</span>
                  <input type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
                </label>

                {bulkError && (
                  <p className="text-red-600 text-xs mt-2 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {bulkError}
                  </p>
                )}

                <button onClick={parseBulk} disabled={!fileContent || bulkParsing}
                  className="mt-4 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold disabled:opacity-50 transition-colors">
                  {bulkParsing
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing file...</>
                    : <><Sparkles className="w-4 h-4" /> ✦ Extract Customers</>}
                </button>
              </div>

              {/* Results */}
              {bulkResults.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900">
                        {bulkResults.filter((c) => c.selected).length} of {bulkResults.length} selected
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">Uncheck any row you don't want to import</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setBulkResults((p) => p.map((c) => ({ ...c, selected: true })))}
                        className="text-xs font-semibold text-brand-600 hover:underline">All</button>
                      <button onClick={() => setBulkResults((p) => p.map((c) => ({ ...c, selected: false })))}
                        className="text-xs font-semibold text-red-500 hover:underline">None</button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {bulkResults.map((c, i) => (
                      <div key={i} onClick={() => toggleSelect(i)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          c.selected ? "border-brand-200 bg-brand-50" : "border-gray-100 bg-gray-50 opacity-50"
                        }`}>
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                          c.selected ? "bg-brand-600 border-brand-600" : "border-gray-300 bg-white"
                        }`}>
                          {c.selected && <CheckCircle className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">{c.name || "Unknown"}</p>
                          <p className="text-xs text-gray-500">{c.phone}{c.city ? ` · ${c.city}` : ""}</p>
                        </div>
                        {c.amount > 0 && (
                          <span className="text-xs font-bold text-brand-700 flex-shrink-0">PKR {c.amount.toLocaleString()}</span>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); setBulkResults((p) => p.filter((_, idx) => idx !== i)); }}
                          className="p-1 text-gray-300 hover:text-red-500 flex-shrink-0 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button onClick={saveBulk} disabled={bulkSaving || !bulkResults.some((c) => c.selected)}
                    className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold disabled:opacity-50 transition-colors shadow-sm">
                    {bulkSaving
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving customers...</>
                      : <><Users className="w-4 h-4" /> Import {bulkResults.filter((c) => c.selected).length} Customers <ChevronRight className="w-4 h-4" /></>}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
