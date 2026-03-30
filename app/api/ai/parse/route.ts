import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Simple rate limiter: max 20 requests per minute per user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!checkRateLimit(session.user.id)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute." },
      { status: 429 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your-gemini-api-key-here") {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  try {
    const { message } = await req.json();

    if (!message || typeof message !== "string" || message.length > 2000) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are a data extraction assistant for a Pakistani seller CRM system.

Extract customer information from this WhatsApp message. The message may be in Urdu, English, or a mix of both (Roman Urdu).

Message: "${message}"

Extract and return ONLY a JSON object with these fields (leave empty string if not found):
{
  "name": "customer full name",
  "phone": "phone number with 0 or +92 prefix",
  "city": "city name in Pakistan",
  "address": "street address or area",
  "product": "product or item ordered",
  "amount": number (price in PKR, 0 if not found),
  "notes": "any other important info"
}

Rules:
- Phone numbers: keep as-is with 0 prefix (e.g., 0300-1234567 or 03001234567)
- City: match to common Pakistani cities (Karachi, Lahore, Faisalabad, Rawalpindi, etc.)
- Amount: extract numeric value only, no currency symbol
- Return ONLY valid JSON, nothing else`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "Could not parse message" }, { status: 422 });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Sanitize output
    const safe = {
      name: String(parsed.name || "").slice(0, 100),
      phone: String(parsed.phone || "").replace(/[^\d+\-\s]/g, "").slice(0, 20),
      city: String(parsed.city || "").slice(0, 100),
      address: String(parsed.address || "").slice(0, 500),
      product: String(parsed.product || "").slice(0, 200),
      amount: typeof parsed.amount === "number" ? Math.max(0, parsed.amount) : 0,
      notes: String(parsed.notes || "").slice(0, 500),
    };

    return NextResponse.json({ data: safe });
  } catch (error) {
    console.error("AI parse error:", error);
    return NextResponse.json({ error: "AI parsing failed" }, { status: 500 });
  }
}
