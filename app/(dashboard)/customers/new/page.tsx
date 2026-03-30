"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, Loader2, CheckCircle, AlertCircle,
  MessageSquare, User, Phone, MapPin, Home,
  FileText, ShoppingCart, DollarSign, ChevronDown, X
} from "lucide-react";
import { PAKISTAN_CITIES, CUSTOMER_SOURCES } from "@/lib/utils";

type FormData = {
  name: string;
  phone: string;
  city: string;
  address: string;
  notes: string;
  source: string;
};

type ParsedData = {
  name?: string; phone?: string; city?: string;
  address?: string; product?: string; amount?: number; notes?: string;
};

export default function NewCustomerPage() {
  const router = useRouter();
  const [waMsg, setWaMsg] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [parsedData, setParsedData] = useState<ParsedData | null>(null);
  const [form, setForm] = useState<FormData>({
    name: "", phone: "", city: "", address: "", notes: "", source: "WhatsApp",
  });
  const [orderAmount, setOrderAmount] = useState("");
  const [orderExpense, setOrderExpense] = useState("");
  const [orderProduct, setOrderProduct] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [duplicate, setDuplicate] = useState<{ id: string } | null>(null);

  function updateForm(key: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function parseWhatsApp() {
    if (!waMsg.trim()) return;
    setParsing(true);
    setParseError("");
    setParsedData(null);

    try {
      const res = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: waMsg }),
      });
      const data = await res.json();

      if (!res.ok) {
        setParseError(data.error || "Parse nahi hua");
        return;
      }

      const { data: d } = data;
      setParsedData(d);

      // Auto-fill form
      setForm((prev) => ({
        ...prev,
        name: d.name || prev.name,
        phone: d.phone || prev.phone,
        city: d.city || prev.city,
        address: d.address || prev.address,
        notes: d.notes || prev.notes,
      }));
      if (d.product) setOrderProduct(d.product);
      if (d.amount) setOrderAmount(d.amount.toString());
    } catch {
      setParseError("Network error");
    } finally {
      setParsing(false);
    }
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
    setSaveError("");
    setDuplicate(null);

    if (!form.name.trim() || !form.phone.trim()) {
      setSaveError("Naam aur phone number zaroori hain");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (res.status === 409) {
        setDuplicate({ id: data.customerId });
        setSaveError("Yeh phone number pehle se save hai");
        setSaving(false);
        return;
      }

      if (!res.ok) {
        setSaveError(data.error || "Save nahi hua");
        setSaving(false);
        return;
      }

      const customerId = data.customer.id;

      // Add order if amount provided
      if (orderAmount && parseFloat(orderAmount) > 0) {
        await fetch(`/api/customers/${customerId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            addOrder: true,
            order: {
              amount: parseFloat(orderAmount),
              expense: parseFloat(orderExpense) || 0,
              product: orderProduct || undefined,
              status: "paid",
            },
          }),
        });
      }

      router.push(`/customers/${customerId}`);
    } catch {
      setSaveError("Network error. Dobara try karein.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-10">
      {/* AI Parser */}
      <div className="card border-brand-100 bg-gradient-to-br from-brand-50 to-white">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">AI WhatsApp Parser</h3>
            <p className="text-xs text-gray-500">WhatsApp msg paste karein — AI khud fill karega</p>
          </div>
        </div>

        <div className="relative">
          <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <textarea
            value={waMsg}
            onChange={(e) => setWaMsg(e.target.value)}
            className="input pl-10 pr-20 min-h-[100px] resize-none"
            placeholder="Customer ka WhatsApp message yahan paste karein...&#10;&#10;Example: Ali bhai, mera naam Ahmed hai, 03001234567, Lahore Gulberg se, 1 suit chahiye 2500 ka"
          />
          {waMsg && (
            <button
              type="button"
              onClick={() => setWaMsg("")}
              className="absolute right-3 top-3 p-1 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {parseError && (
          <div className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" /> {parseError}
          </div>
        )}

        <button
          type="button"
          onClick={parseWhatsApp}
          disabled={!waMsg.trim() || parsing}
          className="btn-primary mt-3"
        >
          {parsing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> AI parse kar raha hai...</>
          ) : (
            <><Sparkles className="w-4 h-4" /> AI se Fill Karein</>
          )}
        </button>

        {parsedData && (
          <div className="mt-4 p-4 bg-white rounded-xl border border-brand-200">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-brand-600" />
              <p className="text-sm font-semibold text-brand-700">AI ne yeh data nikala — check karein</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(parsedData).map(([key, val]) => {
                if (!val) return null;
                const labels: Record<string, string> = {
                  name: "Naam", phone: "Phone", city: "City",
                  address: "Address", product: "Product", amount: "Amount", notes: "Notes"
                };
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyParsed(key as keyof ParsedData)}
                    className="text-left p-2.5 rounded-lg border border-gray-200 hover:border-brand-300 hover:bg-brand-50 transition-all text-sm"
                  >
                    <p className="text-xs text-gray-400 font-medium">{labels[key] || key}</p>
                    <p className="text-gray-800 font-semibold truncate">{String(val)}</p>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">Field pe click karein apply karne ke liye</p>
          </div>
        )}
      </div>

      {/* Customer Form */}
      <form onSubmit={handleSave} className="card space-y-5">
        <h3 className="font-bold text-gray-900 text-lg border-b border-gray-100 pb-4">
          Customer Information
        </h3>

        {saveError && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <p className="font-semibold">{saveError}</p>
            {duplicate && (
              <a href={`/customers/${duplicate.id}`} className="text-red-600 underline text-xs mt-1 block">
                Existing customer profile dekhein →
              </a>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label">
              <User className="inline w-4 h-4 mr-1" />Naam <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="input"
              placeholder="Customer ka naam"
              value={form.name}
              onChange={(e) => updateForm("name", e.target.value)}
              required
            />
          </div>

          <div>
            <label className="label">
              <Phone className="inline w-4 h-4 mr-1" />Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              className="input"
              placeholder="03001234567"
              value={form.phone}
              onChange={(e) => updateForm("phone", e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label"><MapPin className="inline w-4 h-4 mr-1" />City</label>
            <div className="relative">
              <select
                className="input appearance-none pr-10"
                value={form.city}
                onChange={(e) => updateForm("city", e.target.value)}
              >
                <option value="">City select karein</option>
                {PAKISTAN_CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="label">Source (Kahan se aaya)</label>
            <div className="relative">
              <select
                className="input appearance-none pr-10"
                value={form.source}
                onChange={(e) => updateForm("source", e.target.value)}
              >
                {CUSTOMER_SOURCES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        <div>
          <label className="label"><Home className="inline w-4 h-4 mr-1" />Address</label>
          <input
            type="text"
            className="input"
            placeholder="Gali, mohalla ya area"
            value={form.address}
            onChange={(e) => updateForm("address", e.target.value)}
          />
        </div>

        <div>
          <label className="label"><FileText className="inline w-4 h-4 mr-1" />Notes</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Koi important baat note karein..."
            value={form.notes}
            onChange={(e) => updateForm("notes", e.target.value)}
          />
        </div>

        {/* First Order */}
        <div className="border-t border-gray-100 pt-5">
          <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-orange-500" />
            Pehla Order (Optional)
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3">
              <label className="label">Product / Item</label>
              <input
                type="text"
                className="input"
                placeholder="Kya purchase kiya"
                value={orderProduct}
                onChange={(e) => setOrderProduct(e.target.value)}
              />
            </div>
            <div>
              <label className="label"><DollarSign className="inline w-4 h-4 mr-1" />Amount (PKR)</label>
              <input
                type="number"
                className="input"
                placeholder="2500"
                min={0}
                value={orderAmount}
                onChange={(e) => setOrderAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Expense (PKR)</label>
              <input
                type="number"
                className="input"
                placeholder="1500"
                min={0}
                value={orderExpense}
                onChange={(e) => setOrderExpense(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              {orderAmount && orderExpense && (
                <div className="w-full p-3 bg-brand-50 rounded-xl border border-brand-100">
                  <p className="text-xs text-gray-500">Net Profit</p>
                  <p className="font-bold text-brand-700 text-lg">
                    PKR {(parseFloat(orderAmount || "0") - parseFloat(orderExpense || "0")).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Save ho raha hai...</>
            ) : (
              <><CheckCircle className="w-4 h-4" /> Customer Save Karein</>
            )}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-ghost"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
