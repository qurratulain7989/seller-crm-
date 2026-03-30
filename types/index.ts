import { Customer, Order, User } from "@prisma/client";

export type CustomerWithOrders = Customer & {
  orders: Order[];
  _count?: { orders: number };
};

export type CustomerSummary = {
  id: string;
  name: string;
  phone: string;
  city: string | null;
  totalPurchase: number;
  netProfit: number;
  lastOrderAt: Date | null;
  createdAt: Date;
  orderCount: number;
};

export type DashboardStats = {
  totalCustomers: number;
  newThisMonth: number;
  totalRevenue: number;
  totalProfit: number;
  bestCustomer: CustomerSummary | null;
  inactiveCount: number;
};

export type AnalyticsData = {
  monthlyRevenue: { month: string; revenue: number; profit: number }[];
  cityStats: { city: string; customers: number; revenue: number }[];
  topCustomers: CustomerSummary[];
  sourceStats: { source: string; count: number }[];
};

export type ParsedCustomer = {
  name?: string;
  phone?: string;
  city?: string;
  address?: string;
  product?: string;
  amount?: number;
  notes?: string;
};

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      shopName?: string | null;
    };
  }
}
