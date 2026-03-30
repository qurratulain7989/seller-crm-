"use client";

import { useState } from "react";
import {
  MessageSquareHeart, Copy, CheckCheck, ExternalLink,
  Edit3, RefreshCw, Sparkles, Users, Star, AlertCircle,
  Heart, ShoppingBag, Gift
} from "lucide-react";
import { getWhatsAppUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";

type Template = {
  id: string;
  icon: React.ElementType;
  category: string;
  label: string;
  description: string;
  color: string;
  message: string;
  variables: string[];
};

const defaultTemplates: Template[] = [
  {
    id: "welcome",
    icon: ShoppingBag,
    category: "Shukriya",
    label: "Welcome Message",
    description: "Naye customer ka shukriya ada karein",
    color: "bg-brand-600",
    message: `Assalamu Alaikum {{name}} bhai! 😊

Hamare store se pehli baar khareedari ka shukriya! 🎉

Aapki order receive ho gayi hai. Hum jaldi deliver karenge InshAllah.

Koi bhi sawaal ho tou beshak poochhen! 🙏`,
    variables: ["name"],
  },
  {
    id: "inactive",
    icon: AlertCircle,
    category: "Reminder",
    label: "Inactive Customer",
    description: "30 din se nahi aaye customers ko bhejein",
    color: "bg-red-500",
    message: `Assalamu Alaikum {{name}} bhai! 💚

Kaafi waqt ho gaya aapko hamare store pe nahi dekha...

Kya sab theek hai? 😊

Hamare paas abhi kuch zabardast naye products aa gaye hain jo aapko zaroor pasand aayenge!

Zaroor aa ke dekhein ya is number pe message karein 🎁`,
    variables: ["name"],
  },
  {
    id: "review",
    icon: Star,
    category: "Review",
    label: "Review Request",
    description: "Purchase ke baad review maangein",
    color: "bg-orange-500",
    message: `Assalamu Alaikum {{name}} bhai! ⭐

Ummeed hai aapko apni purchase pasand aayi hogi!

Kya aap hamare baare mein apna tajurba share karenge? Sirf 2 line ka review bhi hamari bahut madad karta hai 🙏

Aapki rai se hum aur behtar ban sakte hain!

Shukriya 💚`,
    variables: ["name"],
  },
  {
    id: "feedback",
    icon: Heart,
    category: "Feedback",
    label: "Get Feedback",
    description: "Customer se service feedback lein",
    color: "bg-pink-500",
    message: `Assalamu Alaikum {{name}} bhai! 🌟

Hamare store se purchase karne ka shukriya!

Ek chota sa sawaal: Hamaari service kaisi lagi?

1-5 mein rate karein:
⭐ 1 - Bilkul nahi
⭐⭐⭐ 3 - Theek tha
⭐⭐⭐⭐⭐ 5 - Zabardast!

Aapka jawab hamein behtar banayega 🙏`,
    variables: ["name"],
  },
  {
    id: "sale",
    icon: Gift,
    category: "Marketing",
    label: "Sale Announcement",
    description: "Naye sale ya products ka announce karein",
    color: "bg-purple-500",
    message: `Assalamu Alaikum {{name}} bhai! 🎊

Aapke liye khaas khabar!

🔥 SALE 🔥

Hamare store mein aaj se {{discount}} discount hai sabhi items pe!

Yeh offer sirf {{days}} din ke liye hai ⏰

Jaldi aayen aur faida uthayen! 🛍️`,
    variables: ["name", "discount", "days"],
  },
  {
    id: "cod_confirm",
    icon: ShoppingBag,
    category: "Order",
    label: "COD Confirmation",
    description: "COD order confirm karein",
    color: "bg-blue-500",
    message: `Assalamu Alaikum {{name}} bhai! ✅

Aapki order confirm ho gayi hai!

📦 Product: {{product}}
💰 Amount: PKR {{amount}}
🚚 Delivery: Cash on Delivery

Delivery 3-5 working days mein hogi InshAllah.

Koi bhi sawaal ho tou message karein 🙏`,
    variables: ["name", "product", "amount"],
  },
];

export default function TemplatesPage() {
  const [templates, setTemplates] = useState(defaultTemplates);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [customVars, setCustomVars] = useState<Record<string, Record<string, string>>>({});

  function getVars(templateId: string): Record<string, string> {
    return customVars[templateId] || {};
  }

  function setVar(templateId: string, varName: string, value: string) {
    setCustomVars((prev) => ({
      ...prev,
      [templateId]: { ...(prev[templateId] || {}), [varName]: value },
    }));
  }

  function fillTemplate(message: string, vars: Record<string, string>): string {
    let filled = message;
    Object.entries(vars).forEach(([key, val]) => {
      filled = filled.replaceAll(`{{${key}}}`, val || `[${key}]`);
    });
    return filled;
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  function startEdit(t: Template) {
    setEditing(t.id);
    setEditText(t.message);
  }

  function saveEdit(id: string) {
    setTemplates((prev) => prev.map((t) => t.id === id ? { ...t, message: editText } : t));
    setEditing(null);
  }

  function resetTemplate(id: string) {
    const original = defaultTemplates.find((t) => t.id === id);
    if (original) {
      setTemplates((prev) => prev.map((t) => t.id === id ? { ...t, message: original.message } : t));
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="card bg-gradient-to-r from-green-500 to-brand-600 text-white border-0">
        <div className="flex items-start gap-3">
          <MessageSquareHeart className="w-8 h-8 flex-shrink-0" />
          <div>
            <h2 className="text-xl font-bold">WhatsApp Templates</h2>
            <p className="text-green-100 text-sm mt-1">
              Ready-made messages. Edit karein, copy karein, aur directly WhatsApp pe bhejein — ek click se!
            </p>
          </div>
        </div>
        <div className="mt-4">
          <label className="text-green-100 text-sm font-medium block mb-1">
            Test Phone Number (template try karne ke liye)
          </label>
          <input
            type="tel"
            className="bg-white/20 border border-white/30 text-white placeholder-green-200 rounded-xl px-4 py-2.5 text-sm w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-white/50"
            placeholder="03001234567"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
          />
        </div>
      </div>

      {/* Template cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {templates.map((t) => {
          const vars = getVars(t.id);
          const filledMessage = fillTemplate(t.message, vars);
          const isCopied = copied === t.id;
          const isEditing = editing === t.id;

          return (
            <div key={t.id} className="card hover:shadow-md transition-shadow">
              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className={`w-10 h-10 ${t.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <t.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">{t.label}</h3>
                    <span className="badge badge-gray">{t.category}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>
                </div>
              </div>

              {/* Variables input */}
              {t.variables.length > 0 && (
                <div className="mb-3 grid grid-cols-2 gap-2">
                  {t.variables.map((v) => (
                    <div key={v}>
                      <label className="text-xs font-semibold text-gray-500 mb-1 block">
                        {`{{${v}}}`}
                      </label>
                      <input
                        type="text"
                        className="input py-2 text-sm"
                        placeholder={v === "name" ? "Customer naam" : v}
                        value={vars[v] || ""}
                        onChange={(e) => setVar(t.id, v, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Message preview / edit */}
              {isEditing ? (
                <div>
                  <textarea
                    className="input resize-none text-sm font-mono"
                    rows={8}
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                  />
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => saveEdit(t.id)} className="btn-primary text-sm py-2">
                      Save
                    </button>
                    <button onClick={() => setEditing(null)} className="btn-ghost text-sm">Cancel</button>
                    <button onClick={() => resetTemplate(t.id)} className="btn-ghost text-sm text-orange-500">
                      <RefreshCw className="w-3.5 h-3.5" /> Reset
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed border border-gray-100 min-h-[120px]">
                  {filledMessage}
                </div>
              )}

              {/* Actions */}
              {!isEditing && (
                <div className="flex gap-2 mt-4 flex-wrap">
                  <button
                    onClick={() => copyToClipboard(filledMessage, t.id)}
                    className={cn("btn-ghost text-sm", isCopied && "text-brand-600")}
                  >
                    {isCopied ? (
                      <><CheckCheck className="w-4 h-4 text-brand-600" /> Copied!</>
                    ) : (
                      <><Copy className="w-4 h-4" /> Copy</>
                    )}
                  </button>
                  <button onClick={() => startEdit(t)} className="btn-ghost text-sm">
                    <Edit3 className="w-4 h-4" /> Edit
                  </button>
                  {testPhone && (
                    <a
                      href={getWhatsAppUrl(testPhone, filledMessage)}
                      target="_blank" rel="noopener noreferrer"
                      className="btn-primary text-sm py-2"
                    >
                      <ExternalLink className="w-4 h-4" /> WhatsApp pe bhejein
                    </a>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bulk section */}
      <div className="card bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-100">
        <div className="flex items-start gap-3">
          <Users className="w-6 h-6 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-gray-900">Bulk Message</h3>
            <p className="text-sm text-gray-600 mt-1">
              Ek saath sab inactive customers ko message bhejna chahte hain?
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Customer list mein jaen → Filter lagaen → Har customer ke WhatsApp button se bhejein
            </p>
            <div className="flex gap-3 mt-3">
              <a href="/customers?sortBy=lastOrderAt" className="btn-primary text-sm py-2">
                <Users className="w-4 h-4" /> Inactive Customers Dekhen
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="card border-brand-100 bg-brand-50">
        <div className="flex items-start gap-2">
          <Sparkles className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-brand-800 text-sm">Tips for Pakistani Sellers</p>
            <ul className="text-sm text-brand-700 mt-2 space-y-1">
              <li>• Naam ke saath message zyada personal lagta hai — hamesha naam likhein</li>
              <li>• Best time: Subah 10-12 baje ya shaam 6-8 baje</li>
              <li>• Review maangne ka best time: Delivery ke 2-3 din baad</li>
              <li>• Inactive customer ko month mein sirf 1-2 baar message karein</li>
              <li>• Emojis use karein — WhatsApp messages zyada attractive lagti hain</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
