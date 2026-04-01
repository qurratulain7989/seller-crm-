import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000);

  const [
    totalCustomers,
    newThisMonth,
    allCustomers,
    recentOrders,
    cityGroups,
    sourceGroups,
    todayOrders,
    todayNewCustomers,
    atRiskCustomers,
    birthdayCustomers,
    activeCustomers,
  ] = await Promise.all([
    prisma.customer.count({ where: { userId } }),

    prisma.customer.count({
      where: { userId, createdAt: { gte: startOfMonth } },
    }),

    prisma.customer.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        phone: true,
        city: true,
        totalPurchase: true,
        netProfit: true,
        lastOrderAt: true,
        createdAt: true,
        dateOfBirth: true,
        _count: { select: { orders: true } },
      },
      orderBy: { totalPurchase: "desc" },
      take: 10,
    }),

    prisma.order.findMany({
      where: { customer: { userId } },
      select: { amount: true, profit: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),

    prisma.customer.groupBy({
      by: ["city"],
      where: { userId, city: { not: null } },
      _count: { id: true },
      _sum: { totalPurchase: true },
      orderBy: { _sum: { totalPurchase: "desc" } },
      take: 10,
    }),

    prisma.customer.groupBy({
      by: ["source"],
      where: { userId, source: { not: null } },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),

    // Today's orders
    prisma.order.findMany({
      where: { customer: { userId }, createdAt: { gte: startOfToday } },
      select: { amount: true, profit: true },
    }),

    // New customers today
    prisma.customer.count({
      where: { userId, createdAt: { gte: startOfToday } },
    }),

    // At-risk: 20-30 days inactive (going to become inactive soon)
    prisma.customer.findMany({
      where: {
        userId,
        lastOrderAt: { gte: thirtyDaysAgo, lt: twentyDaysAgo },
      },
      select: { id: true, name: true, phone: true, city: true, lastOrderAt: true },
      orderBy: { lastOrderAt: "asc" },
      take: 5,
    }),

    // Birthday customers (all with DOB, we'll filter by upcoming on frontend)
    prisma.customer.findMany({
      where: { userId, dateOfBirth: { not: null } },
      select: { id: true, name: true, phone: true, dateOfBirth: true },
    }),

    // Active customers in last 30 days (for Regular Customers widget)
    prisma.customer.findMany({
      where: { userId, lastOrderAt: { gte: thirtyDaysAgo } },
      select: {
        id: true, name: true, phone: true, city: true,
        totalPurchase: true, lastOrderAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { totalPurchase: "desc" },
      take: 20,
    }),
  ]);

  // Monthly revenue for last 6 months
  const months: { month: string; revenue: number; profit: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleString("en-PK", { month: "short", year: "2-digit" });
    const monthOrders = recentOrders.filter((o: { amount: number; profit: number; createdAt: Date }) => {
      const od = new Date(o.createdAt);
      return od.getFullYear() === d.getFullYear() && od.getMonth() === d.getMonth();
    });
    months.push({
      month: label,
      revenue: monthOrders.reduce((s, o) => s + o.amount, 0),
      profit: monthOrders.reduce((s, o) => s + o.profit, 0),
    });
  }

  const totalRevenue = allCustomers.reduce((s, c) => s + c.totalPurchase, 0);
  const totalProfit = allCustomers.reduce((s, c) => s + c.netProfit, 0);

  const inactiveWhere = {
    userId,
    OR: [
      { lastOrderAt: { lt: thirtyDaysAgo } },
      { lastOrderAt: null, createdAt: { lt: thirtyDaysAgo } },
    ],
  };

  const [inactiveCount, inactiveCustomers, newCustomersThisMonth] = await Promise.all([
    prisma.customer.count({ where: inactiveWhere }),
    prisma.customer.findMany({
      where: inactiveWhere,
      select: { id: true, name: true, phone: true, city: true, lastOrderAt: true },
      orderBy: { lastOrderAt: "asc" },
      take: 10,
    }),
    prisma.customer.findMany({
      where: { userId, createdAt: { gte: startOfMonth } },
      select: { id: true, name: true, phone: true, city: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return NextResponse.json({
    totalCustomers,
    newThisMonth,
    totalRevenue,
    totalProfit,
    inactiveCount,
    inactiveCustomers,
    newCustomersThisMonth,
    todayOrders: todayOrders.length,
    todayRevenue: todayOrders.reduce((s, o) => s + o.amount, 0),
    todayNewCustomers,
    atRiskCustomers,
    birthdayCustomers,
    activeCustomers,
    bestCustomer: allCustomers[0] ? {
      ...allCustomers[0],
      orderCount: allCustomers[0]._count.orders,
    } : null,
    topCustomers: allCustomers.map((c) => ({
      ...c,
      orderCount: c._count.orders,
    })),
    monthlyRevenue: months,
    cityStats: cityGroups.map((g) => ({
      city: g.city || "Unknown",
      customers: g._count.id,
      revenue: g._sum.totalPurchase || 0,
    })),
    sourceStats: sourceGroups.map((g) => ({
      source: g.source || "Unknown",
      count: g._count.id,
    })),
  });
}
