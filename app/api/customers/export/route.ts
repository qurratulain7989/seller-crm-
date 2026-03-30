import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city") || undefined;

  const customers = await prisma.customer.findMany({
    where: { userId: session.user.id, ...(city ? { city } : {}) },
    include: { _count: { select: { orders: true } } },
    orderBy: { totalPurchase: "desc" },
  });

  // Build CSV
  const headers = ["Name", "Phone", "City", "Address", "Total Purchase (PKR)", "Profit (PKR)", "Orders", "Source", "Notes", "Added On"];
  const rows = customers.map((c) => [
    c.name,
    c.phone,
    c.city || "",
    c.address || "",
    c.totalPurchase.toString(),
    c.netProfit.toString(),
    c._count.orders.toString(),
    c.source || "",
    c.notes || "",
    new Date(c.createdAt).toLocaleDateString("en-PK"),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="customers-${Date.now()}.csv"`,
    },
  });
}
