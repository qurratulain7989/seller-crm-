import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!checkRateLimit(session.user.id)) {
    return NextResponse.json({ error: "Too many requests. Please wait a minute." }, { status: 429 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your-gemini-api-key-here") {
    return NextResponse.json({ error: "AI not configured. Add GEMINI_API_KEY in settings." }, { status: 503 });
  }

  try {
    const { content } = await req.json();

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Invalid content" }, { status: 400 });
    }

    const truncated = content.slice(0, 15000);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a data extraction assistant for a Pakistani seller CRM.

This is an exported WhatsApp chat file. Extract all unique customer orders from this conversation.
The messages may be in Urdu, English, or Roman Urdu.

Chat content:
${truncated}

Extract each unique customer order and return a JSON array. Each item should have:
{
  "name": "customer name",
  "phone": "phone number (with 0 prefix, e.g. 03001234567)",
  "city": "city in Pakistan or empty string",
  "address": "delivery address or area or empty string",
  "product": "product or item name or empty string",
  "amount": number (price in PKR, 0 if not found),
  "notes": "any other important info or empty string"
}

Rules:
- Only extract actual customer orders, not random chat messages
- Skip duplicate customers (same phone number)
- Phone: keep with 0 prefix format
- Amount: number only, no currency symbol
- Return ONLY valid JSON array, nothing else
- If no orders found, return empty array []`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ customers: [] });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(parsed)) {
      return NextResponse.json({ customers: [] });
    }

    const customers = parsed.map((c: Record<string, unknown>) => ({
      name: String(c.name || "").slice(0, 100),
      phone: String(c.phone || "").replace(/[^\d+\-\s]/g, "").slice(0, 20),
      city: String(c.city || "").slice(0, 100),
      address: String(c.address || "").slice(0, 500),
      product: String(c.product || "").slice(0, 200),
      amount: typeof c.amount === "number" ? Math.max(0, c.amount) : 0,
      notes: String(c.notes || "").slice(0, 500),
    })).filter((c) => c.name || c.phone);

    return NextResponse.json({ customers });
  } catch (error) {
    console.error("Bulk parse error:", error);
    return NextResponse.json({ error: "AI parsing failed" }, { status: 500 });
  }
}
