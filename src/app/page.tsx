import Link from "next/link";
import {
  Globe,
  MessageCircle,
  Target,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Play,
  Star,
  Zap,
  Users,
  Clock,
  GraduationCap,
  Mic,
  Check,
  Crown,
  ChevronRight,
  Brain,
} from "lucide-react";

const features = [
  {
    icon: Globe,
    iconColor: "text-sky-400",
    iconBg: "bg-sky-400/10 border-sky-400/20",
    title: "Smart Channel Discovery",
    description:
      "Filter 100+ curated YouTube channels by level, topic, and accent. Find exactly the right content for your learning stage.",
  },
  {
    icon: MessageCircle,
    iconColor: "text-violet-400",
    iconBg: "bg-violet-400/10 border-violet-400/20",
    title: "AI Speaking Partner",
    description:
      "Practice real conversations 24/7 with an AI that adapts to your level, gives instant feedback, and never judges.",
  },
  {
    icon: Target,
    iconColor: "text-emerald-400",
    iconBg: "bg-emerald-400/10 border-emerald-400/20",
    title: "OPIc Mastery",
    description:
      "Full mock tests, curated scripts, roleplay scenarios, and AI-powered feedback to ace your OPIc exam.",
  },
  {
    icon: TrendingUp,
    iconColor: "text-amber-400",
    iconBg: "bg-amber-400/10 border-amber-400/20",
    title: "Track Your Growth",
    description:
      "XP system, daily streaks, detailed analytics, and milestones that keep you motivated on your fluency journey.",
  },
];

const stats = [
  { value: "10,000+", label: "Active Learners", icon: Users },
  { value: "95%",     label: "Satisfaction Rate", icon: Star },
  { value: "15 min",  label: "Daily to Fluency",  icon: Clock },
];

const steps = [
  {
    step: "01",
    title: "Set Your Level",
    description:
      "Take a quick assessment or choose manually. We personalize everything from content to AI conversation difficulty.",
    icon: GraduationCap,
    color: "text-sky-400",
    bg: "bg-sky-400/10 border-sky-400/20",
  },
  {
    step: "02",
    title: "Practice Daily",
    description:
      "Watch curated clips, talk to AI, tackle OPIc scenarios, and build vocabulary. Just 15 minutes a day.",
    icon: Mic,
    color: "text-violet-400",
    bg: "bg-violet-400/10 border-violet-400/20",
  },
  {
    step: "03",
    title: "Level Up",
    description:
      "Earn XP, maintain streaks, and watch your speaking confidence soar with measurable, real results.",
    icon: Zap,
    color: "text-amber-400",
    bg: "bg-amber-400/10 border-amber-400/20",
  },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    desc: "Get started today",
    cta: "Start Free",
    href: "/dashboard",
    features: ["5 AI chats / day", "Basic channel list", "3 OPIc questions"],
    highlight: false,
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "/mo",
    desc: "Most popular",
    cta: "Try Pro — 7 Days Free",
    href: "/pricing",
    features: ["Unlimited AI chats", "100+ curated channels", "Full OPIc suite", "Advanced analytics"],
    highlight: true,
    badge: "Most Popular",
  },
  {
    name: "Elite",
    price: "$24.99",
    period: "/mo",
    desc: "Maximum results",
    cta: "Go Elite",
    href: "/pricing",
    features: ["Everything in Pro", "1-on-1 AI coaching", "Custom roadmap", "Priority support"],
    highlight: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>
      {/* Background ambient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <div
          className="absolute top-[-15%] left-[-5%] w-[560px] h-[560px] rounded-full animate-blob"
          style={{ background: "radial-gradient(circle, rgba(75,140,248,0.08) 0%, transparent 70%)" }}
        />
        <div
          className="absolute top-[30%] right-[-10%] w-[440px] h-[440px] rounded-full animate-blob animation-delay-2000"
          style={{ background: "radial-gradient(circle, rgba(129,140,248,0.06) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-[-10%] left-[35%] w-[480px] h-[480px] rounded-full animate-blob animation-delay-4000"
          style={{ background: "radial-gradient(circle, rgba(52,211,153,0.04) 0%, transparent 70%)" }}
        />
      </div>

      {/* ── Navigation ── */}
      <header className="relative z-20 border-b" style={{ borderColor: "var(--border)", background: "rgba(15,17,23,0.85)", backdropFilter: "blur(20px)" }}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--gradient-accent)" }}>
              <Sparkles size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold gradient-text-accent tracking-tight">NeuroEng</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {["Features", "How It Works"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(/\s+/g, "-")}`}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ color: "var(--text-secondary)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--text-primary)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text-secondary)")}
              >
                {item}
              </a>
            ))}
            <Link
              href="/pricing"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: "var(--text-secondary)" }}
            >
              Pricing
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="hidden sm:inline-flex px-4 py-2 rounded-full text-sm font-medium transition-colors"
              style={{ color: "var(--text-secondary)", border: "1px solid var(--border)" }}
            >
              Sign In
            </Link>
            <Link href="/pricing" className="btn btn-primary text-sm px-5 py-2.5">
              Get Started
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 badge badge-accent">
          <Brain size={13} />
          <span>AI-Powered English Speaking Coach</span>
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] max-w-4xl mx-auto mb-6">
          <span style={{ color: "var(--text-primary)" }}>Master English</span>
          <br />
          <span className="gradient-text">Speaking with AI</span>
        </h1>

        <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          YouTube channels, AI conversations, OPIc prep — all in one place.
          Build real fluency with a system that adapts to you.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/dashboard" className="btn btn-primary px-8 py-3.5 text-base">
            Start Learning Free
            <ArrowRight size={18} />
          </Link>
          <Link href="/learn/channels" className="btn btn-ghost px-8 py-3.5 text-base">
            <Play size={16} />
            Explore Channels
          </Link>
        </div>

        {/* Social proof */}
        <div className="mt-10 flex items-center justify-center gap-3">
          <div className="flex -space-x-2">
            {(["#3b82f6","#8b5cf6","#10b981","#f59e0b"] as const).map((color, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[11px] font-bold text-white"
                style={{
                  background: color,
                  borderColor: "var(--bg-base)",
                }}
              >
                {["A","S","M","K"][i]}
              </div>
            ))}
          </div>
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(i => <Star key={i} size={13} className="fill-amber-400 text-amber-400" />)}
          </div>
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            Loved by <strong style={{ color: "var(--text-secondary)" }}>10,000+</strong> learners
          </span>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-20">
        <div className="rounded-2xl p-px" style={{ background: "linear-gradient(135deg, rgba(75,140,248,0.3), rgba(129,140,248,0.1), rgba(52,211,153,0.1))" }}>
          <div className="rounded-2xl px-8 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8" style={{ background: "var(--bg-surface)" }}>
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 badge-accent">
                    <Icon size={18} />
                  </div>
                  <p className="text-4xl font-extrabold mb-1" style={{ color: "var(--text-primary)" }}>{stat.value}</p>
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>{stat.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
            Everything You Need to{" "}
            <span className="gradient-text">Speak Fluently</span>
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "var(--text-secondary)" }}>
            A complete ecosystem for Korean English learners, from beginner to advanced.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div key={feat.title} className="card p-7 group cursor-default">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl border mb-5 ${feat.iconBg}`}>
                  <Icon size={22} className={feat.iconColor} />
                </div>
                <h3 className="text-lg font-semibold mb-2.5" style={{ color: "var(--text-primary)" }}>{feat.title}</h3>
                <p className="leading-relaxed" style={{ color: "var(--text-secondary)", fontSize: "14px" }}>{feat.description}</p>
                <div className="mt-5 flex items-center gap-1 text-sm font-medium" style={{ color: "var(--accent)" }}>
                  Learn more <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
            Three Steps to <span className="gradient-text">Fluency</span>
          </h2>
          <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
            Simple, effective, and built around your schedule.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.step} className="relative">
                <div className="card p-6">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="text-3xl font-black opacity-20 gradient-text">{step.step}</span>
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${step.bg}`}>
                      <Icon size={18} className={step.color} />
                    </div>
                  </div>
                  <h3 className="text-base font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{step.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{step.description}</p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                    <ChevronRight size={18} style={{ color: "var(--text-muted)" }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Pricing Preview ── */}
      <section id="pricing" className="relative z-10 max-w-6xl mx-auto px-6 pb-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
            Simple, <span className="gradient-text">Transparent Pricing</span>
          </h2>
          <p className="text-lg" style={{ color: "var(--text-secondary)" }}>
            Start free. Upgrade when you&apos;re ready.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className="relative rounded-2xl p-6 flex flex-col transition-all duration-300 hover:-translate-y-1"
              style={{
                background: plan.highlight ? "var(--bg-elevated)" : "var(--bg-surface)",
                border: plan.highlight ? "1px solid rgba(75,140,248,0.35)" : "1px solid var(--border)",
                boxShadow: plan.highlight ? "var(--shadow-accent)" : "none",
              }}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="btn btn-primary text-[11px] px-3 py-1 rounded-full font-bold">{plan.badge}</span>
                </div>
              )}
              <div className="mb-5">
                <p className="text-sm font-semibold mb-1" style={{ color: plan.highlight ? "var(--accent)" : "var(--text-muted)" }}>
                  {plan.name}
                </p>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-extrabold" style={{ color: "var(--text-primary)" }}>{plan.price}</span>
                  {plan.period && <span className="text-sm mb-1.5" style={{ color: "var(--text-muted)" }}>{plan.period}</span>}
                </div>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{plan.desc}</p>
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm" style={{ color: "var(--text-secondary)" }}>
                    <Check size={14} className="text-emerald-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`btn text-sm py-2.5 w-full ${plan.highlight ? "btn-primary" : "btn-ghost"}`}
              >
                {plan.cta}
                <ArrowRight size={14} />
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Link href="/pricing" className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--accent)" }}>
            View full pricing details <ArrowRight size={14} />
          </Link>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-24">
        <div
          className="rounded-3xl p-12 text-center relative overflow-hidden"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
        >
          <div className="absolute inset-0 rounded-3xl" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(75,140,248,0.1) 0%, transparent 60%)" }} />
          <div className="relative z-10">
            <Crown size={32} className="mx-auto mb-5 text-amber-400" />
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: "var(--text-primary)" }}>
              Ready to Start Speaking?
            </h2>
            <p className="text-lg mb-8 max-w-md mx-auto" style={{ color: "var(--text-secondary)" }}>
              Join thousands of learners building real English fluency with NeuroEng.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/pricing" className="btn btn-primary px-8 py-3.5 text-base">
                See Plans <ArrowRight size={18} />
              </Link>
              <Link href="/dashboard" className="btn btn-ghost px-8 py-3.5 text-base">
                Try Free First
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-5 text-sm" style={{ color: "var(--text-muted)" }}>
              {["Free forever plan", "7-day Pro trial", "Cancel anytime"].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <Check size={13} className="text-emerald-400" />
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t px-6 py-8" style={{ borderColor: "var(--border)" }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles size={15} style={{ color: "var(--accent)" }} />
            <span className="text-sm font-bold gradient-text-accent">NeuroEng</span>
          </div>
          <div className="flex items-center gap-6">
            {["Features", "Pricing", "Dashboard"].map((item) => (
              <Link
                key={item}
                href={item === "Dashboard" ? "/dashboard" : item === "Pricing" ? "/pricing" : "#features"}
                className="text-xs transition-colors"
                style={{ color: "var(--text-muted)" }}
              >
                {item}
              </Link>
            ))}
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            © {new Date().getFullYear()} NeuroEng. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
