"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard, Users, BarChart3, MessageSquareHeart,
  LogOut, X, UserPlus, Calculator, Upload, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/lib/lang-context";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", labelUr: "ڈیش بورڈ" },
  { href: "/customers", icon: Users, label: "Customers", labelUr: "گاہک" },
  { href: "/customers/new", icon: UserPlus, label: "Add Customer", labelUr: "نیا گاہک" },
  { href: "/customers/import", icon: Upload, label: "Import", labelUr: "امپورٹ" },
  { href: "/hisab", icon: Calculator, label: "Accounting", labelUr: "حساب کتاب" },
  { href: "/analytics", icon: BarChart3, label: "Analytics", labelUr: "تجزیہ" },
  { href: "/templates", icon: MessageSquareHeart, label: "WhatsApp", labelUr: "واٹس ایپ" },
  { href: "/settings", icon: Settings, label: "Settings", labelUr: "ترتیبات" },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { t } = useLang();

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside className={cn(
        "fixed top-0 left-0 h-full w-60 bg-white border-r border-gray-100 z-40 flex flex-col transition-transform duration-300",
        "lg:translate-x-0 lg:static lg:z-auto",
        open ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">O</span>
            </div>
            <div>
              <p className="font-bold text-gray-900 text-sm leading-none">Ordergee</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[110px]">
                {session?.user?.shopName || "Seller CRM"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, icon: Icon, label, labelUr }) => {
            const active =
              href === "/customers/new" ? pathname === href :
              href === "/customers/import" ? pathname === href :
              href === "/dashboard" ? pathname === href :
              pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-600 text-white"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{t(label, labelUr)}</span>
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-3 border-t border-gray-100">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
            <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-brand-700 font-bold text-sm">
                {session?.user?.name?.[0]?.toUpperCase() || "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{session?.user?.name || "Seller"}</p>
              <p className="text-xs text-gray-400 truncate">{session?.user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {t("Logout", "لاگ آؤٹ")}
          </button>
        </div>
      </aside>
    </>
  );
}
