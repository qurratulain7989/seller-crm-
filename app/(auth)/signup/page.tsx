"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, ShoppingBag, ArrowRight, CheckCircle } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    shopName: "",
    password: "",
    confirmPassword: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords match nahi hote");
      return;
    }
    if (form.password.length < 8) {
      setError("Password kam az kam 8 characters ka hona chahiye");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          shopName: form.shopName.trim() || undefined,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration fail ho gayi");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Network error. Dobara try karein.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-orange-50 flex items-center justify-center p-4">
        <div className="text-center animate-slide-up">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-100 rounded-full mb-4">
            <CheckCircle className="w-10 h-10 text-brand-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Account ban gaya!</h2>
          <p className="text-gray-500">Login page par ja raha hai...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-600 rounded-2xl mb-4 shadow-lg">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">SellerBook</h1>
          <p className="text-gray-500 mt-1">Free account banayein</p>
        </div>

        <div className="card shadow-xl border-0">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Register karein</h2>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Aapka Naam *</label>
              <input
                type="text"
                className="input"
                placeholder="Ali Khan"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Shop ya Business ka Naam</label>
              <input
                type="text"
                className="input"
                placeholder="Ali Fashion Store"
                value={form.shopName}
                onChange={(e) => update("shopName", e.target.value)}
              />
            </div>

            <div>
              <label className="label">Email Address *</label>
              <input
                type="email"
                className="input"
                placeholder="aap@example.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">Password *</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  className="input pr-12"
                  placeholder="Kam az kam 8 characters"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="label">Password Confirm karein *</label>
              <input
                type="password"
                className="input"
                placeholder="Dobara likhein"
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full text-base py-3">
              {loading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Account ban raha hai...</>
              ) : (
                <>Account Banayein <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Pehle se account hai?{" "}
            <Link href="/login" className="text-brand-600 font-semibold hover:underline">
              Login karein
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
