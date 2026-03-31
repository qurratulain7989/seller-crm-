import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().min(7).max(20).optional(),
  city: z.string().max(100).optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
  source: z.string().max(50).optional().nullable(),
  tags: z.string().max(200).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
});

const orderSchema = z.object({
  amount: z.number().min(0),
  expense: z.number().min(0).optional().default(0),
  product: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(["paid", "cod", "pending"]).optional().default("paid"),
});

async function getCustomer(id: string, userId: string) {
  return prisma.customer.findFirst({ where: { id, userId } });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const customer = await prisma.customer.findFirst({
    where: { id, userId: session.user.id },
    include: {
      orders: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ customer });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getCustomer(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await req.json();

    // Handle order addition
    if (body.addOrder) {
      const orderParsed = orderSchema.safeParse(body.order);
      if (!orderParsed.success) {
        return NextResponse.json({ error: "Invalid order data" }, { status: 400 });
      }

      const { amount, expense, product, description, status } = orderParsed.data;
      const profit = amount - (expense || 0);

      const [order] = await prisma.$transaction([
        prisma.order.create({
          data: { amount, expense: expense || 0, profit, product, description, status, customerId: id },
        }),
        prisma.customer.update({
          where: { id },
          data: {
            totalPurchase: { increment: amount },
            totalExpense: { increment: expense || 0 },
            netProfit: { increment: profit },
            lastOrderAt: new Date(),
          },
        }),
      ]);

      return NextResponse.json({ order });
    }

    // Handle customer update
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const { dateOfBirth, ...rest } = parsed.data;
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...rest,
        ...(dateOfBirth !== undefined && {
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        }),
      },
    });

    return NextResponse.json({ customer });
  } catch (error) {
    console.error("Update error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await getCustomer(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
