"use client";

import { useState, useEffect } from "react";
import {
  Settings, Crown, MessageSquare, Bell, Save,
  CheckCircle, RefreshCw, User, Store
} from "lucide-react";
import { useLang } from "@/lib/lang-context";

const DEFAULT_TEMPLATES = {
  greeting: `Assalamu Alaikum {{name}}! 😊\nThank you for shopping with us!\nLet us know if you need anything. 🙏`,
  inactive: `Assalamu Alaikum {{name}}! 💚\nWe miss you! New stock has arrived.\nCome check it out — you'll love it! 🎁`,
  feedback: `Assalamu Alaikum {{name}}! ⭐\nHope you loved your purchase!\nCould you share a quick review? It really helps us grow! 🙏`,
  birthday: `Happy Birthday {{name}}! 🎂🎉\nWishing you a wonderful day!\nSpecial discount just for you today — reply to claim! 🎁`,
  anniversary: `{{name}}, it's been {{years}} year(s) since your first order! 🎉\nThank you so much for your loyalty. You're a valued customer! 🙏`,
  vipWelcome: `Congratulations {{name}}! 🌟\nYou've been upgraded to VIP status!\nEnjoy exclusive offers and priority service. Thank you for your loyalty! 👑`,
};

export default function SettingsPage() {
  const { t } = useLang();
  const [saved, setSaved] = useState(false);
  const [vipThreshold, setVipThreshold] = useState("10000");
  const [sellerName, setSellerName] = useState("");
  const [shopName, setShopName] = useState("");
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [activeTemplate, setActiveTemplate] = useState<string | null>(null);

  useEffect(() => {
    try {
      setVipThreshold(localStorage.getItem("vip_threshold") || "10000");
      setSellerName(localStorage.getItem("seller_name") || "");
      setShopName(localStorage.getItem("shop_name") || "");
      const saved = localStorage.getItem("msg_templates");
      if (saved) setTemplates({ ...DEFAULT_TEMPLATES, ...JSON.parse(saved) });
    } catch { /* ignore */ }
  }, []);

  function saveSettings() {
    try {
      localStorage.setItem("vip_threshold", vipThreshold);
      localStorage.setItem("seller_name", sellerName);
      localStorage.setItem("shop_name", shopName);
      localStorage.setItem("msg_templates", JSON.stringify(templates));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch { /* ignore */ }
  }

  function resetTemplate(key: keyof typeof DEFAULT_TEMPLATES) {
    setTemplates((p) => ({ ...p, [key]: DEFAULT_TEMPLATES[key] }));
  }

  const templateLabels: Record<string, string> = {
    greeting: "Greeting Message",
    inactive: "Inactive Customer",
    feedback: "Feedback Request",
    birthday: "Birthday Wish",
    anniversary: "Order Anniversary",
    vipWelcome: "VIP Upgrade",
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in pb-10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center">
          <Settings className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{t("Settings", "ترتیبات")}</h1>
          <p className="text-sm text-gray-500">{t("Customize your CRM preferences", "اپنی ترجیحات ترتیب دیں")}</p>
        </div>
      </div>

      {/* Seller Info */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
          <Store className="w-4 h-4 text-brand-600" />
          {t("Seller Information", "بیچنے والے کی معلومات")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="label text-xs">{t("Your Name", "آپ کا نام")}</label>
            <input
              type="text"
              className="input"
              placeholder="Ahmed Ali"
              value={sellerName}
              onChange={(e) => setSellerName(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">{t("Used in message templates as {{seller}}", "پیغام ٹیمپلیٹس میں {{seller}} کے طور پر")}</p>
          </div>
          <div>
            <label className="label text-xs">{t("Shop Name", "دکان کا نام")}</label>
            <input
              type="text"
              className="input"
              placeholder="My Online Store"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* VIP Settings */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
          <Crown className="w-4 h-4 text-yellow-500" />
          {t("VIP Customer Settings", "VIP گاہک کی ترتیبات")}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="label text-xs">{t("VIP Threshold (PKR)", "VIP حد (PKR)")}</label>
            <input
              type="number"
              className="input"
              min={1000}
              step={1000}
              value={vipThreshold}
              onChange={(e) => setVipThreshold(e.target.value)}
            />
            <p className="text-xs text-gray-400 mt-1">
              {t("Customers with 5+ orders OR total purchase above this amount get VIP status", "5+ آرڈر یا اس رقم سے زیادہ خریداری والے گاہک VIP بنیں گے")}
            </p>
          </div>
          <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-100 text-sm text-yellow-800">
            <Crown className="inline w-4 h-4 mr-1.5 text-yellow-600" />
            {t("Current VIP Threshold:", "موجودہ VIP حد:")} <strong>PKR {parseInt(vipThreshold || "0").toLocaleString()}</strong>
            {" "}{t("OR 5+ orders", "یا 5+ آرڈر")}
          </div>
        </div>
      </div>

      {/* Message Templates */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2 text-sm">
          <MessageSquare className="w-4 h-4 text-green-600" />
          {t("Message Templates", "پیغام ٹیمپلیٹس")}
        </h2>
        <p className="text-xs text-gray-500 mb-4">
          {t("Use {{name}}, {{seller}}, {{years}} as placeholders", "{{name}}، {{seller}}، {{years}} بطور جگہ نگہبان استعمال کریں")}
        </p>

        <div className="space-y-3">
          {Object.entries(templates).map(([key, value]) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label text-xs">{templateLabels[key] || key}</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTemplate(activeTemplate === key ? null : key)}
                    className="text-xs text-brand-600 font-medium hover:underline"
                  >
                    {activeTemplate === key ? t("Close", "بند کریں") : t("Edit", "ترمیم")}
                  </button>
                  <button
                    onClick={() => resetTemplate(key as keyof typeof DEFAULT_TEMPLATES)}
                    className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5"
                  >
                    <RefreshCw className="w-3 h-3" /> {t("Reset", "ری سیٹ")}
                  </button>
                </div>
              </div>
              {activeTemplate === key ? (
                <textarea
                  className="input resize-none text-sm font-mono"
                  rows={5}
                  value={value}
                  onChange={(e) => setTemplates((p) => ({ ...p, [key]: e.target.value }))}
                />
              ) : (
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm text-gray-600 whitespace-pre-wrap line-clamp-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => setActiveTemplate(key)}>
                  {value.slice(0, 100)}{value.length > 100 ? "..." : ""}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Notifications Info */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-sm">
          <Bell className="w-4 h-4 text-blue-500" />
          {t("Notification Reminders", "اطلاع یاددہانیاں")}
        </h2>
        <div className="space-y-3 text-sm text-gray-600">
          {[
            { icon: "🎂", label: t("Birthday reminders", "سالگرہ یاددہانی"), desc: t("Shown on dashboard when a customer's birthday is today or in 7 days", "ڈیش بورڈ پر دکھایا جائے گا") },
            { icon: "⚠️", label: t("Inactive alerts", "غیر فعال الرٹ"), desc: t("Customers with no orders in 30+ days", "30+ دن سے بغیر آرڈر") },
            { icon: "🎉", label: t("Order anniversary", "آرڈر سالگرہ"), desc: t("Shown on customer detail page on yearly anniversary", "سالانہ سالگرہ پر گاہک صفحے پر") },
          ].map((n) => (
            <div key={n.label} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
              <span className="text-lg">{n.icon}</span>
              <div>
                <p className="font-medium text-gray-900 text-sm">{n.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{n.desc}</p>
              </div>
              <span className="ml-auto text-xs text-green-600 font-medium bg-green-100 px-2 py-0.5 rounded-full">{t("Active", "فعال")}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-3">
        <button onClick={saveSettings} className="btn-primary">
          {saved ? (
            <><CheckCircle className="w-4 h-4 text-white" /> {t("Saved!", "محفوظ ہوگیا!")}</>
          ) : (
            <><Save className="w-4 h-4" /> {t("Save Settings", "ترتیبات محفوظ کریں")}</>
          )}
        </button>
        {saved && <p className="text-sm text-green-600 font-medium">{t("All settings saved successfully.", "تمام ترتیبات محفوظ ہوگئیں۔")}</p>}
      </div>
    </div>
  );
}
