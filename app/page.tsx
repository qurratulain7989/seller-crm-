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
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <span className="font-bold text-gray-900 text-lg">Ordergee</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-gray-600 hover:text-gray-900 text-sm font-medium">
            Login
          </Link>
          <Link
            href="/signup"
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Shuru Karein
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-xs font-medium px-3 py-1 rounded-full mb-6">
          🇵🇰 Pakistani Sellers ke liye
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
          Apne business ka
          <br />
          <span className="text-green-600">complete record</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Customers, orders, hisab kitab — sab kuch ek jagah. WhatsApp messaging aur AI se apna kaam asaan karein.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link
            href="/signup"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3 rounded-lg text-lg transition-colors"
          >
            Free mein shuru karein →
          </Link>
          <Link
            href="/login"
            className="text-gray-600 hover:text-gray-900 font-medium px-8 py-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors text-lg"
          >
            Login karein
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">👥</span>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">Customer Management</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Har customer ki complete profile — orders, history, aur WhatsApp link ek jagah.
            </p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">🧾</span>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">Hisab Kitab</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Daily, weekly, monthly net profit dekhein. Expenses track karein aur apna munafa jaanein.
            </p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">WhatsApp Tracking</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Inactive customers ko message bhejein. 24 ghante ka tracking — kaun message hua, kaun nahi.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-600 py-20 px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Aaj hi shuru karein
        </h2>
        <p className="text-green-100 text-lg mb-8">
          Bilkul free — koi credit card nahi chahiye
        </p>
        <Link
          href="/signup"
          className="bg-white text-green-600 font-bold px-8 py-3 rounded-lg text-lg hover:bg-green-50 transition-colors"
        >
          Account banayein →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6 text-center text-gray-400 text-sm">
        <p>© 2026 Ordergee — Pakistani Sellers ke liye banaya gaya</p>
      </footer>
    </main>
  );
}
