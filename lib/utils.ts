import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("92") && cleaned.length === 12) {
    return `+92 ${cleaned.slice(2, 5)}-${cleaned.slice(5, 12)}`;
  }
  if (cleaned.startsWith("0") && cleaned.length === 11) {
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
  }
  return phone;
}

export function getWhatsAppUrl(phone: string, message: string): string {
  const cleaned = phone.replace(/\D/g, "");
  let normalized = cleaned;
  if (cleaned.startsWith("0")) {
    normalized = "92" + cleaned.slice(1);
  } else if (!cleaned.startsWith("92")) {
    normalized = "92" + cleaned;
  }
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function daysSince(date: Date | string | null): number {
  if (!date) return 999;
  const diff = Date.now() - new Date(date).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export const PAKISTAN_CITIES = [
  "Karachi", "Lahore", "Faisalabad", "Rawalpindi", "Gujranwala",
  "Peshawar", "Multan", "Hyderabad", "Islamabad", "Quetta",
  "Bahawalpur", "Sargodha", "Sialkot", "Sukkur", "Larkana",
  "Sheikhupura", "Rahim Yar Khan", "Jhang", "Dera Ghazi Khan",
  "Gujrat", "Kasur", "Mardan", "Mingora", "Nawabshah",
  "Sahiwal", "Mirpur Khas", "Okara", "Mandi Bahauddin", "Abbottabad",
  "Jacobabad", "Muridke", "Khanewal", "Hafizabad", "Kohat",
  "Chishtian", "Kamalia", "Attock", "Khairpur", "Muzaffargarh",
  "Ahmadpur East", "Other"
];

export const CUSTOMER_SOURCES = [
  "WhatsApp", "Instagram", "Facebook", "Daraz", "TikTok", "Referral", "Walk-in", "Other"
];

export type CustomerTag = "New" | "Regular" | "VIP" | "Inactive";

export function getCustomerTag(
  orderCount: number,
  totalPurchase: number,
  lastOrderAt: string | null,
  vipThreshold = 10000
): CustomerTag {
  const days = daysSince(lastOrderAt);
  if (orderCount > 0 && days > 30) return "Inactive";
  if (orderCount >= 5 || totalPurchase >= vipThreshold) return "VIP";
  if (orderCount >= 3) return "Regular";
  return "New";
}

export const TAG_STYLES: Record<CustomerTag, string> = {
  New: "bg-indigo-100 text-indigo-700",
  Regular: "bg-teal-100 text-teal-700",
  VIP: "bg-amber-100 text-amber-800",
  Inactive: "bg-red-100 text-red-600",
};

export function isBirthdayToday(dateOfBirth: string | null): boolean {
  if (!dateOfBirth) return false;
  const dob = new Date(dateOfBirth);
  const today = new Date();
  return dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate();
}

export function daysUntilBirthday(dateOfBirth: string | null): number {
  if (!dateOfBirth) return 999;
  const dob = new Date(dateOfBirth);
  const today = new Date();
  const next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}
