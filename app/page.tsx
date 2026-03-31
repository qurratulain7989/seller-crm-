import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Navbar */}
      <nav className="border-b border-gray-100 px-6 py-4 sticky top-0 bg-white/95 backdrop-blur-sm z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">O</span>
            </div>
            <span className="font-bold text-gray-900 text-lg">Ordergee</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">How it works</a>
            <a href="#pricing" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Pricing</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
              Sign in
            </Link>
            <Link href="/signup" className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-medium px-3 py-1 rounded-full mb-6">
          🇵🇰 Built for Pakistani Sellers
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
          The CRM built for
          <br />
          <span className="text-green-600">Pakistani sellers</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Manage customers, track orders, monitor profits, and send WhatsApp messages — all in one place. Start free, no credit card needed.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap mb-16">
          <Link href="/signup" className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-lg text-base transition-colors">
            Start for free →
          </Link>
          <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium px-8 py-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors text-base">
            Sign in
          </Link>
        </div>

        {/* Dashboard mockup */}
        <div className="bg-gray-900 rounded-2xl p-4 shadow-2xl max-w-4xl mx-auto">
          <div className="flex gap-1.5 mb-3">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: "Total Customers", value: "248", color: "bg-green-50 border-green-100" },
                { label: "This Month Revenue", value: "Rs 84,500", color: "bg-blue-50 border-blue-100" },
                { label: "Net Profit", value: "Rs 31,200", color: "bg-purple-50 border-purple-100" },
                { label: "Active Orders", value: "12", color: "bg-orange-50 border-orange-100" },
              ].map((card) => (
                <div key={card.label} className={`${card.color} border rounded-xl p-3 text-left`}>
                  <p className="text-xs text-gray-500 mb-1">{card.label}</p>
                  <p className="font-bold text-gray-900 text-sm">{card.value}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-semibold text-gray-500 mb-3">RECENT CUSTOMERS</p>
              {["Ahmed Khan — Lahore", "Sana Mirza — Karachi", "Bilal Ahmed — Islamabad"].map((c) => (
                <div key={c} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <span className="text-xs text-gray-700">{c}</span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Active</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-gray-100 bg-gray-50 py-10 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-3xl font-bold text-gray-900">500+</p>
            <p className="text-sm text-gray-500 mt-1">Active Sellers</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">10,000+</p>
            <p className="text-sm text-gray-500 mt-1">Orders Tracked</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-gray-900">99%</p>
            <p className="text-sm text-gray-500 mt-1">Uptime</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">How it works</h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">Get started in minutes, no technical knowledge required.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { step: "1", title: "Create your free account", desc: "Sign up in 30 seconds. No credit card, no setup fees. Just your name and email." },
            { step: "2", title: "Add your customers", desc: "Import or manually add customer details. Track orders, payments, and purchase history." },
            { step: "3", title: "Grow your business", desc: "Monitor profits, send WhatsApp messages to inactive customers, and make data-driven decisions." },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="w-12 h-12 bg-green-600 text-white rounded-xl flex items-center justify-center text-lg font-bold mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-gray-50 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Everything you need</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Powerful tools designed specifically for Pakistani online sellers.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: "👥", title: "Customer Management", desc: "Complete customer profiles with order history, contact info, and purchase totals.", color: "bg-green-50 border-green-100" },
              { icon: "🧾", title: "Hisab Kitab (Accounting)", desc: "Track daily, weekly, and monthly profits. Add expenses and see your net income clearly.", color: "bg-blue-50 border-blue-100" },
              { icon: "💬", title: "WhatsApp Integration", desc: "One-click WhatsApp links next to every customer. Track who you messaged in the last 24 hours.", color: "bg-green-50 border-green-100" },
              { icon: "📊", title: "Analytics Dashboard", desc: "Visual charts showing revenue trends, top customers, city-wise breakdown, and growth over time.", color: "bg-purple-50 border-purple-100" },
              { icon: "🔔", title: "Inactive Customer Alerts", desc: "See which customers haven't ordered in 30 days. Re-engage them with a single message.", color: "bg-orange-50 border-orange-100" },
              { icon: "📦", title: "Order Tracking", desc: "Log every order with amount, product, and profit. Get a clear picture of what sells best.", color: "bg-pink-50 border-pink-100" },
            ].map((f) => (
              <div key={f.title} className={`${f.color} border rounded-2xl p-7`}>
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-gray-900 text-base mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Simple, transparent pricing</h2>
          <p className="text-gray-500 text-lg">Start free. Upgrade when you grow.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            {
              name: "Free", price: "Rs 0", period: "forever",
              features: ["Up to 100 customers", "Basic order tracking", "WhatsApp links", "Dashboard analytics"],
              cta: "Get started free", highlight: false,
            },
            {
              name: "Pro", price: "Rs 999", period: "per month",
              features: ["Unlimited customers", "Advanced accounting", "Expense tracking", "Priority support", "Export to Excel"],
              cta: "Start Pro", highlight: true,
            },
            {
              name: "Business", price: "Rs 2,499", period: "per month",
              features: ["Everything in Pro", "Multiple users", "AI message suggestions", "Custom branding", "Dedicated support"],
              cta: "Contact us", highlight: false,
            },
          ].map((plan) => (
            <div key={plan.name} className={`rounded-2xl p-7 border ${plan.highlight ? "bg-green-600 border-green-600 text-white" : "bg-white border-gray-200"}`}>
              <p className={`text-sm font-semibold mb-2 ${plan.highlight ? "text-green-100" : "text-gray-500"}`}>{plan.name}</p>
              <p className={`text-3xl font-bold mb-1 ${plan.highlight ? "text-white" : "text-gray-900"}`}>{plan.price}</p>
              <p className={`text-xs mb-6 ${plan.highlight ? "text-green-100" : "text-gray-400"}`}>{plan.period}</p>
              <ul className="space-y-2 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className={`text-sm flex items-center gap-2 ${plan.highlight ? "text-green-50" : "text-gray-600"}`}>
                    <span className={plan.highlight ? "text-green-200" : "text-green-500"}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className={`block text-center text-sm font-semibold py-2.5 rounded-xl transition-colors ${plan.highlight ? "bg-white text-green-600 hover:bg-green-50" : "bg-green-600 text-white hover:bg-green-700"}`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-gray-50 py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Sellers love Ordergee</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Ahmed Raza", city: "Lahore", role: "Clothing Seller", text: "Before Ordergee I used notebooks to track customers. Now everything is digital and I can see my profits instantly. Game changer!" },
              { name: "Sana Mirza", city: "Karachi", role: "Cosmetics Seller", text: "The WhatsApp tracking feature is amazing. I know exactly which customers I need to follow up with. My sales increased by 30%." },
              { name: "Usman Tariq", city: "Islamabad", role: "Electronics Reseller", text: "Hisab Kitab section se mujhe pata chala mera actual net profit kya hai. Bahut helpful tool hai sellers ke liye." },
            ].map((t) => (
              <div key={t.name} className="bg-white rounded-2xl border border-gray-200 p-7">
                <p className="text-yellow-400 text-sm mb-3">★★★★★</p>
                <p className="text-gray-600 text-sm leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.role} · {t.city}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-600 py-20 px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to grow your business?</h2>
        <p className="text-green-100 text-lg mb-8">Join 500+ Pakistani sellers. Free forever, no credit card needed.</p>
        <Link href="/signup" className="bg-white text-green-600 font-bold px-8 py-3 rounded-lg text-base hover:bg-green-50 transition-colors">
          Create free account →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">O</span>
            </div>
            <span className="font-bold text-gray-900 text-sm">Ordergee</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms of Service</Link>
            <a href="mailto:support@ordergee.com" className="hover:text-gray-600 transition-colors">Contact</a>
          </div>
          <p className="text-sm text-gray-400">© 2026 Ordergee. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
