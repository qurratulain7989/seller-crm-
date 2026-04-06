"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, Bell } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { GlobalSearch } from "./GlobalSearch";
import { useSession } from "next-auth/react";

interface HeaderProps {
  onMenuClick: () => void;
  title: string;
}

const titleMap: Record<string, string> = {
  "Dashboard": "ڈیش بورڈ",
  "Customers": "گاہک",
  "Add Customer": "نیا گاہک",
  "Import Customers": "گاہک درآمد",
  "Analytics": "تجزیہ",
  "WhatsApp Templates": "واٹس ایپ ٹیمپلیٹ",
  "Accounting": "حساب کتاب",
  "Settings": "ترتیبات",
  "Customer Detail": "گاہک کی تفصیل",
  "Ordergee": "آرڈرجی",
};

const NOTIFS = [
  {
    id: 1,
    dotColor: "bg-green-500",
    titleEn: "New customer added",
    titleUr: "نیا گاہک شامل ہوا",
    descEn: "Sana Bibi joined • 5 min ago",
    descUr: "ثنا بی بی شامل ہوئیں • 5 منٹ پہلے",
  },
  {
    id: 2,
    dotColor: "bg-yellow-400",
    titleEn: "Order reminder due",
    titleUr: "یاد دہانی باقی ہے",
    descEn: "12 customers pending • 1 hr ago",
    descUr: "12 گاہک زیر التواء • 1 گھنٹہ پہلے",
  },
  {
    id: 3,
    dotColor: "bg-red-500",
    titleEn: "Inactive alert",
    titleUr: "غیر فعال الرٹ",
    descEn: "43 customers need re-engaging • Today",
    descUr: "43 گاہکوں کو توجہ چاہیے • آج",
  },
];

export function Header({ onMenuClick, title }: HeaderProps) {
  const { lang, toggle } = useLang();
  const { data: session } = useSession();

  const [unreadCount, setUnreadCount] = useState(3);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [readAll, setReadAll] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    if (isNotifOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isNotifOpen]);

  function markAllRead() {
    setUnreadCount(0);
    setReadAll(true);
    setIsNotifOpen(false);
  }

  const rawName = session?.user?.name || session?.user?.email || "AB";
  const initials = rawName
    .split(/[\s@]+/)
    .map((n: string) => n[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const displayTitle = lang === "ur" ? (titleMap[title] || title) : title;

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-[#f0f0f0] px-5 py-3 flex items-center justify-between">
      {/* LEFT */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-[18px] font-medium text-gray-900 leading-none">{displayTitle}</h1>
      </div>

      {/* CENTER — global search on larger screens */}
      <div className="hidden md:flex flex-1 justify-center px-4 max-w-xs mx-auto">
        <GlobalSearch />
      </div>

      {/* RIGHT */}
      <div className="flex items-center gap-2.5">

        {/* Language Toggle Pill */}
        <div className="flex items-center bg-gray-100 rounded-full p-1 gap-0.5">
          <button
            onClick={() => lang !== "en" && toggle()}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
              lang === "en"
                ? "bg-[#25D366] text-white shadow-sm"
                : "bg-transparent text-gray-500"
            }`}
          >
            EN
          </button>
          <button
            onClick={() => lang !== "ur" && toggle()}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 ${
              lang === "ur"
                ? "bg-[#25D366] text-white shadow-sm"
                : "bg-transparent text-gray-500"
            }`}
          >
            اردو
          </button>
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen((v) => !v)}
            className="relative w-[34px] h-[34px] rounded-full bg-[#fff3e0] flex items-center justify-center flex-shrink-0"
          >
            <Bell className="w-5 h-5 text-[#f57c00] stroke-[#f57c00]" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-white text-[9px] font-bold leading-none">
                {unreadCount}
              </span>
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 top-11 w-72 bg-white rounded-xl shadow-xl z-50 border border-gray-100 overflow-hidden">
              {/* Dropdown header */}
              <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
                <span className="font-medium text-sm text-gray-800">
                  {lang === "ur" ? "اطلاعات" : "Notifications"}
                </span>
                <button
                  onClick={markAllRead}
                  className="text-xs text-[#25D366] font-medium hover:opacity-75"
                >
                  {lang === "ur" ? "سب پڑھا کریں" : "Mark all read"}
                </button>
              </div>

              {/* Notification items */}
              <div className="max-h-64 overflow-y-auto">
                {NOTIFS.map((n) => (
                  <div
                    key={n.id}
                    className={`flex gap-2 px-3 py-2 border-b border-gray-50 ${
                      !readAll ? "bg-green-50" : "bg-white"
                    }`}
                  >
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.dotColor}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-gray-800 leading-snug">
                        {lang === "ur" ? n.titleUr : n.titleEn}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {lang === "ur" ? n.descUr : n.descEn}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom button */}
              <div className="p-2">
                <button
                  onClick={markAllRead}
                  className="w-full bg-gray-100 hover:bg-gray-200 rounded-lg py-2 text-sm text-gray-600 font-medium transition-colors"
                >
                  {lang === "ur" ? "سب پڑھا کریں" : "Mark all as read"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Avatar */}
        <div className="w-9 h-9 rounded-full bg-green-100 text-green-700 font-medium text-sm flex items-center justify-center flex-shrink-0 select-none">
          {initials}
        </div>
      </div>
    </header>
  );
}
