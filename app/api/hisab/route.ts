import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") || "monthly";
  const customFrom = searchParams.get("from");
  const customTo = searchParams.get("to");

  const now = new Date();
  let from: Date;
  let to: Date = new Date(now);
  to.setHours(23, 59, 59, 999);

  if (filter === "daily") {
    from = new Date(now);
    from.setHours(0, 0, 0, 0);
  } else if (filter === "weekly") {
    from = new Date(now);
    from.setDate(now.getDate() - 7);
    from.setHours(0, 0, 0, 0);
  } else if (filter === "monthly") {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (filter === "custom" && customFrom && customTo) {
    from = new Date(customFrom);
    to = new Date(customTo);
    to.setHours(23, 59, 59, 999);
  } else {
    from = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const userId = session.user.id;

  const [orders, expenses] = await Promise.all([
    prisma.order.findMany({
      where: {
        customer: { userId },
        createdAt: { gte: from, lte: to },
      },
      select: { amount: true, profit: true, expense: true, product: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.expense.findMany({
      where: {
        userId,
        date: { gte: from, lte: to },
      },
      orderBy: { date: "desc" },
    }),
  ]);

  const revenue = orders.reduce((s, o) => s + o.amount, 0);
  const orderProfit = orders.reduce((s, o) => s + o.profit, 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netProfit = orderProfit - totalExpenses;

  return NextResponse.json({
    revenue,
    orderProfit,
    totalExpenses,
    netProfit,
    orderCount: orders.length,
    from: from.toISOString(),
    to: to.toISOString(),
    expenses,
  });
}
