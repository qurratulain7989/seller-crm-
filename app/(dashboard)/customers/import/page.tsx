"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Upload, Sparkles, Loader2, CheckCircle, AlertCircle,
  MessageSquare, ArrowLeft, X, Users, ChevronRight,
  FileText, Trash2
} from "lucide-react";
import { PAKISTAN_CITIES, CUSTOMER_SOURCES } from "@/lib/utils";

type ParsedCustomer = {
  name: string; phone: string; city: string;
  address: string; product: string; amount: number; notes: string;
  selected?: boolean;
};

export default function ImportCustomersPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"paste" | "bulk">("paste");

  // Paste tab state
  const [pasteMsg, setPasteMsg] = useState("");
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [parsed, setParsed] = useState<ParsedCustomer | null>(null);
  const [saving, setSaving] = useState(false);

  // Bulk tab state
  const [fileContent, setFileContent] = useState("");
  const [fileName, setFileName] = useState("");
  const [bulkParsing, setBulkParsing] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [bulkResults, setBulkResults] = useState<ParsedCustomer[]>([]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkDone, setBulkDone] = useState(false);
  const [savedCount, setSavedCount] = useState(0);

  async function parseSingle() {
    if (!pasteMsg.trim()) return;
    setParsing(true); setParseError(""); setParsed(null);
    try {
      const res = await fetch("/api/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: pasteMsg }),
      });
      const data = await res.json();
      if (!res.ok) { setParseError(data.error || "Could not parse"); return; }
      setParsed({ ...data.data, selected: true });
    } catch { setParseError("Network error"); }
    finally { setParsing(false); }
  }

  async function saveSingle() {
    if (!parsed) return;
    setSaving(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: parsed.name,
          phone: parsed.phone,
          city: parsed.city || undefined,
          address: parsed.address || undefined,
          notes: parsed.notes || undefined,
          source: "WhatsApp",
        }),
      });
      const data = await res.json();
      if (res.status === 409) {
        router.push(`/customers/${data.customerId}`);
        return;
      }
      if (!res.ok) { setSaving(false); return; }
      const customerId = data.customer.id;
      if (parsed.amount > 0) {
        await fetch(`/api/customers/${customerId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            addOrder: true,
            order: { amount: parsed.amount, product: parsed.product || undefined, status: "paid" },
          }),
        });
      }
      router.push(`/customers/${customerId}`);
    } catch { setSaving(false); }
  }

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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: fileContent.slice(0, 15000) }),
      });
      const data = await res.json();
      if (!res.ok) { setBulkError(data.error || "Could not parse file"); return; }
      setBulkResults((data.customers || []).map((c: ParsedCustomer) => ({ ...c, selected: true })));
    } catch { setBulkError("Network error"); }
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
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: c.name, phone: c.phone,
            city: c.city || undefined,
            address: c.address || undefined,
            notes: c.notes || undefined,
            source: "WhatsApp",
          }),
        });
        if (res.ok) {
          const { customer } = await res.json();
          if (c.amount > 0) {
            await fetch(`/api/customers/${customer.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                addOrder: true,
                order: { amount: c.amount, product: c.product || undefined, status: "paid" },
              }),
            });
          }
          count++;
        }
      } catch { /* skip */ }
    }
    setSavedCount(count);
    setBulkDone(true);
    setBulkSaving(false);
  }

  function toggleSelect(i: number) {
    setBulkResults((prev) => prev.map((c, idx) => idx === i ? { ...c, selected: !c.selected } : c));
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-in pb-10">
      <Link href="/customers" className="btn-ghost text-sm -ml-2 inline-flex">
        <ArrowLeft className="w-4 h-4" /> Back to Customers
      </Link>

      <div>
        <h1 className="text-xl font-bold text-gray-900">Import Customers</h1>
        <p className="text-sm text-gray-500 mt-1">Paste a WhatsApp message or upload a chat export file to import customers.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        <button
          onClick={() => setTab("paste")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "paste" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          <MessageSquare className="inline w-4 h-4 mr-1.5" />Paste Message
        </button>
        <button
          onClick={() => setTab("bulk")}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === "bulk" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
        >
          <Upload className="inline w-4 h-4 mr-1.5" />Bulk Upload
        </button>
      </div>

      {/* Paste Tab */}
      {tab === "paste" && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-sm">AI WhatsApp Message Parser</h3>
                <p className="text-xs text-gray-500">Paste any customer order message — AI will extract the details</p>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={pasteMsg}
                onChange={(e) => setPasteMsg(e.target.value)}
                className="input resize-none min-h-[120px]"
                placeholder={"Example:\nAli bhai, mera naam Ahmed hai, 03001234567, Lahore Gulberg mein rehta hoon. 1 suit chahiye 2500 ka"}
              />
              {pasteMsg && (
                <button onClick={() => { setPasteMsg(""); setParsed(null); }}
                  className="absolute right-3 top-3 p-1 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {parseError && (
              <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {parseError}
              </p>
            )}

            <button
              onClick={parseSingle}
              disabled={!pasteMsg.trim() || parsing}
              className="btn-primary mt-3"
            >
              {parsing ? <><Loader2 className="w-4 h-4 animate-spin" /> Parsing...</> : <><Sparkles className="w-4 h-4" /> Extract with AI</>}
            </button>
          </div>

          {/* Parsed Result */}
          {parsed && (
            <div className="card border-brand-200">
              <div className="flex items-center gap-2 mb-4">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <p className="font-semibold text-gray-900">AI extracted this data — review and save</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  { label: "Name", value: parsed.name, key: "name" },
                  { label: "Phone", value: parsed.phone, key: "phone" },
                  { label: "City", value: parsed.city, key: "city" },
                  { label: "Address", value: parsed.address, key: "address" },
                  { label: "Product", value: parsed.product, key: "product" },
                  { label: "Amount (PKR)", value: parsed.amount > 0 ? parsed.amount.toString() : "", key: "amount" },
                ].map(({ label, value, key }) => (
                  <div key={key}>
                    <p className="text-xs text-gray-400 font-medium mb-1">{label}</p>
                    <input
                      type="text"
                      className="input text-sm py-1.5"
                      value={value as string || ""}
                      onChange={(e) => setParsed((p) => p ? { ...p, [key]: key === "amount" ? parseFloat(e.target.value) || 0 : e.target.value } : p)}
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={saveSingle} disabled={saving || !parsed.name || !parsed.phone} className="btn-primary">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  Save Customer
                </button>
                <button onClick={() => setParsed(null)} className="btn-ghost">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bulk Upload Tab */}
      {tab === "bulk" && (
        <div className="space-y-4">
          {bulkDone ? (
            <div className="card text-center py-10">
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
              <p className="text-xl font-bold text-gray-900">{savedCount} Customers Imported!</p>
              <p className="text-sm text-gray-500 mt-1">Successfully saved to your CRM</p>
              <div className="flex gap-3 justify-center mt-5">
                <Link href="/customers" className="btn-primary">
                  <Users className="w-4 h-4" /> View Customers
                </Link>
                <button onClick={() => { setBulkDone(false); setBulkResults([]); setFileContent(""); setFileName(""); }} className="btn-ghost">
                  Import More
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="card">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-brand-600" />
                  Upload WhatsApp Chat Export (.txt)
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  In WhatsApp: Open chat → Menu (⋮) → More → Export Chat → Without media → Share the .txt file
                </p>
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-brand-400 hover:bg-brand-50 transition-colors">
                  <Upload className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm font-medium text-gray-600">Click to upload .txt file</span>
                  <span className="text-xs text-gray-400 mt-1">{fileName || "No file selected"}</span>
                  <input type="file" accept=".txt" className="hidden" onChange={handleFileUpload} />
                </label>

                {bulkError && (
                  <p className="text-red-600 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" /> {bulkError}
                  </p>
                )}

                <button
                  onClick={parseBulk}
                  disabled={!fileContent || bulkParsing}
                  className="btn-primary mt-4"
                >
                  {bulkParsing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> AI is analyzing file...</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> Parse with AI</>
                  )}
                </button>
              </div>

              {/* Bulk Results Table */}
              {bulkResults.length > 0 && (
                <div className="card">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {bulkResults.filter((c) => c.selected).length} / {bulkResults.length} selected
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">Uncheck any rows you don't want to import</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setBulkResults((p) => p.map((c) => ({ ...c, selected: true })))}
                        className="text-xs text-brand-600 font-medium hover:underline">All</button>
                      <button onClick={() => setBulkResults((p) => p.map((c) => ({ ...c, selected: false })))}
                        className="text-xs text-red-500 font-medium hover:underline">None</button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {bulkResults.map((c, i) => (
                      <div
                        key={i}
                        onClick={() => toggleSelect(i)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${c.selected ? "border-brand-200 bg-brand-50" : "border-gray-100 bg-gray-50 opacity-50"}`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${c.selected ? "bg-brand-600 border-brand-600" : "border-gray-300"}`}>
                          {c.selected && <CheckCircle className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">{c.name || "Unknown"}</p>
                          <p className="text-xs text-gray-500">{c.phone} {c.city ? `· ${c.city}` : ""}</p>
                        </div>
                        {c.amount > 0 && (
                          <span className="text-xs font-semibold text-brand-700 flex-shrink-0">PKR {c.amount.toLocaleString()}</span>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); setBulkResults((p) => p.filter((_, idx) => idx !== i)); }}
                          className="p-1 text-gray-300 hover:text-red-500 flex-shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={saveBulk}
                    disabled={bulkSaving || !bulkResults.some((c) => c.selected)}
                    className="btn-primary mt-4 w-full"
                  >
                    {bulkSaving ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Saving customers...</>
                    ) : (
                      <><Users className="w-4 h-4" /> Import {bulkResults.filter((c) => c.selected).length} Customers <ChevronRight className="w-4 h-4" /></>
                    )}
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
