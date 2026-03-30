import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const customerSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(7).max(20),
  city: z.string().max(100).optional(),
  address: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
  source: z.string().max(50).optional(),
  tags: z.string().max(200).optional(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const city = searchParams.get("city") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const order = searchParams.get("order") || "desc";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  const where = {
    userId: session.user.id,
    ...(search && {
      OR: [
        { name: { contains: search } },
        { phone: { contains: search } },
        { city: { contains: search } },
      ],
    }),
    ...(city && { city: { equals: city } }),
  };

  const validSortFields = ["createdAt", "totalPurchase", "netProfit", "name", "lastOrderAt"];
  const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { [sortField]: order === "asc" ? "asc" : "desc" },
      skip,
      take: limit,
      include: { _count: { select: { orders: true } } },
    }),
    prisma.customer.count({ where }),
  ]);

  return NextResponse.json({ customers, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = customerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const cleanPhone = parsed.data.phone.replace(/\s+/g, "").trim();

    // Duplicate check
    const existing = await prisma.customer.findFirst({
      where: { userId: session.user.id, phone: cleanPhone },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Customer with this phone already exists", customerId: existing.id },
        { status: 409 }
      );
    }

    const customer = await prisma.customer.create({
      data: {
        ...parsed.data,
        phone: cleanPhone,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    console.error("Create customer error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
