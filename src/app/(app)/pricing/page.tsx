"use client";

import { useState } from "react";
import {
  Check,
  Zap,
  Crown,
  Sparkles,
  ArrowRight,
  Shield,
  Star,
  Mic,
  Globe,
  Target,
  TrendingUp,
  X,
} from "lucide-react";

const plans = [
  {
    id: "free",
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    description: "Perfect for getting started",
    icon: <Sparkles size={22} className="text-zinc-400" />,
    color: "zinc",
    gradient: "from-zinc-500/10 to-zinc-600/10",
    border: "border-zinc-700/40",
    cta: "Get Started Free",
    ctaStyle:
      "bg-white/5 border border-white/10 hover:bg-white/10 text-white",
    features: [
      { text: "5 AI conversations per day", included: true },
      { text: "Basic YouTube channel list", included: true },
      { text: "3 OPIc practice questions", included: true },
      { text: "Basic progress tracking", included: true },
      { text: "Unlimited AI conversations", included: false },
      { text: "Premium channel curation", included: false },
      { text: "Full OPIc mock tests", included: false },
      { text: "Personalized study plans", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: { monthly: 9.99, yearly: 7.99 },
    description: "For serious English learners",
    icon: <Zap size={22} className="text-indigo-400" />,
    color: "indigo",
    gradient: "from-indigo-500/20 to-violet-500/20",
    border: "border-indigo-500/40",
    badge: "Most Popular",
    cta: "Start Pro — 7 Days Free",
    ctaStyle:
      "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40",
    features: [
      { text: "Unlimited AI conversations", included: true },
      { text: "100+ curated YouTube channels", included: true },
      { text: "Full OPIc mock test suite", included: true },
      { text: "Advanced analytics & XP system", included: true },
      { text: "Personalized study plans", included: true },
      { text: "Accent & pronunciation feedback", included: true },
      { text: "Priority AI response speed", included: false },
      { text: "1-on-1 coaching sessions", included: false },
    ],
  },
  {
    id: "elite",
    name: "Elite",
    price: { monthly: 24.99, yearly: 19.99 },
    description: "Maximum fluency, fastest results",
    icon: <Crown size={22} className="text-amber-400" />,
    color: "amber",
    gradient: "from-amber-500/15 to-orange-500/15",
    border: "border-amber-500/30",
    cta: "Go Elite",
    ctaStyle:
      "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Priority AI response speed", included: true },
      { text: "1-on-1 AI coaching sessions", included: true },
      { text: "Custom learning roadmap", included: true },
      { text: "Early access to new features", included: true },
      { text: "Dedicated support channel", included: true },
      { text: "Export progress reports (PDF)", included: true },
      { text: "Community leader badge", included: true },
    ],
  },
];

const faqs = [
  {
    q: "Can I cancel anytime?",
    a: "Yes, absolutely. Cancel from your profile settings anytime — no questions asked. Your access continues until the end of the billing period.",
  },
  {
    q: "Is the 7-day trial really free?",
    a: "Yes. You won't be charged during the trial. You can cancel before it ends and pay nothing.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit/debit cards, PayPal, and PayPal Pay Later — secured by PayPal's trusted payment system.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes. Upgrade or downgrade anytime from your account settings. Changes take effect at the next billing cycle.",
  },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleCheckout = async (planId: string, planName: string, price: number) => {
    if (planId === "free") {
      window.location.href = "/dashboard";
      return;
    }
    setLoadingPlan(planId);
    try {
      const res = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, planName, price, billing }),
      });
      const data = await res.json();
      if (data.approveUrl) {
        window.location.href = data.approveUrl;
      } else {
        alert("Payment initialization failed. Please try again.");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] relative overflow-hidden">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] rounded-full bg-violet-600/10 blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute top-[50%] left-[50%] w-[300px] h-[300px] rounded-full bg-amber-500/5 blur-[100px] animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 sm:py-24">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
            <Crown size={14} className="text-indigo-400" />
            <span className="text-xs font-medium text-indigo-300">
              Transparent Pricing
            </span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-4">
            Invest in Your{" "}
            <span className="gradient-text">Fluency</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Start free. Upgrade when you&apos;re ready. Every plan includes AI-powered speaking practice.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 mt-8 p-1.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                billing === "monthly"
                  ? "bg-white text-zinc-900"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`relative px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                billing === "yearly"
                  ? "bg-white text-zinc-900"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Yearly
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                SAVE 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {plans.map((plan) => {
            const price =
              billing === "monthly" ? plan.price.monthly : plan.price.yearly;
            const isLoading = loadingPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl bg-gradient-to-br ${plan.gradient} border ${plan.border} p-8 flex flex-col ${
                  plan.id === "pro" ? "scale-[1.02] shadow-2xl shadow-indigo-500/10" : ""
                } transition-all duration-300 hover:scale-[1.03]`}
              >
                {/* Background overlay */}
                <div className="absolute inset-0 rounded-2xl bg-zinc-900/70 backdrop-blur-xl" />

                <div className="relative z-10 flex flex-col flex-1">
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold shadow-lg">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  {/* Plan header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/[0.06] flex items-center justify-center">
                      {plan.icon}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">{plan.name}</h2>
                      <p className="text-xs text-zinc-500">{plan.description}</p>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-extrabold text-white">
                        ${price}
                      </span>
                      {price > 0 && (
                        <span className="text-zinc-500 mb-1.5 text-sm">/mo</span>
                      )}
                    </div>
                    {billing === "yearly" && price > 0 && (
                      <p className="text-xs text-emerald-400 mt-1">
                        Billed annually — save ${((plan.price.monthly - plan.price.yearly) * 12).toFixed(0)}/yr
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => handleCheckout(plan.id, plan.name, price)}
                    disabled={isLoading}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 mb-6 ${plan.ctaStyle} disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {isLoading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        {plan.cta}
                        {plan.id !== "free" && <ArrowRight size={15} />}
                      </>
                    )}
                  </button>

                  {/* Features */}
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        {feature.included ? (
                          <Check size={15} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                        ) : (
                          <X size={15} className="text-zinc-700 mt-0.5 flex-shrink-0" />
                        )}
                        <span
                          className={`text-sm ${
                            feature.included ? "text-zinc-300" : "text-zinc-600"
                          }`}
                        >
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap justify-center gap-6 mb-20">
          {[
            { icon: <Shield size={16} />, text: "Secured by PayPal" },
            { icon: <Star size={16} />, text: "4.9/5 Rating" },
            { icon: <Mic size={16} />, text: "AI-Powered Practice" },
            { icon: <Globe size={16} />, text: "Global Learners" },
            { icon: <Target size={16} />, text: "OPIc Certified Content" },
            { icon: <TrendingUp size={16} />, text: "Proven Results" },
          ].map((badge, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06] text-zinc-400 text-sm"
            >
              {badge.icon}
              {badge.text}
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-xl bg-white/[0.02] border border-white/[0.06] overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left"
                >
                  <span className="text-sm font-medium text-zinc-200">{faq.q}</span>
                  <span
                    className={`text-zinc-500 transition-transform duration-200 ${
                      openFaq === i ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-4">
                    <p className="text-sm text-zinc-400 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
