import Link from "next/link";
import {
  Globe,
  MessageCircle,
  Target,
  TrendingUp,
  ArrowRight,
  Sparkles,
  Play,
  ChevronRight,
  Star,
  Zap,
  Users,
  Clock,
  GraduationCap,
  Mic,
  Check,
} from "lucide-react";

const features = [
  {
    icon: <Globe size={28} className="text-indigo-400" />,
    title: "Smart Channel Discovery",
    description:
      "Filter 100+ curated YouTube channels by level, topic, and accent. Find the perfect content for your learning stage.",
    gradient: "from-indigo-500/20 to-blue-500/20",
    border: "border-indigo-500/20",
  },
  {
    icon: <MessageCircle size={28} className="text-violet-400" />,
    title: "AI Speaking Partner",
    description:
      "Practice real conversations 24/7 with an AI that adapts to your level, gives instant feedback, and never judges.",
    gradient: "from-violet-500/20 to-purple-500/20",
    border: "border-violet-500/20",
  },
  {
    icon: <Target size={28} className="text-fuchsia-400" />,
    title: "OPIc Mastery",
    description:
      "Full mock tests, curated scripts, roleplay scenarios, and AI-powered feedback to ace your OPIc exam.",
    gradient: "from-fuchsia-500/20 to-pink-500/20",
    border: "border-fuchsia-500/20",
  },
  {
    icon: <TrendingUp size={28} className="text-cyan-400" />,
    title: "Track Your Growth",
    description:
      "XP system, daily streaks, detailed analytics, and milestones that keep you motivated on your fluency journey.",
    gradient: "from-cyan-500/20 to-teal-500/20",
    border: "border-cyan-500/20",
  },
];

const stats = [
  { value: "10,000+", label: "Active Learners", icon: <Users size={20} /> },
  { value: "500+", label: "Practice Hours", icon: <Clock size={20} /> },
  { value: "95%", label: "Satisfaction", icon: <Star size={20} /> },
];

const steps = [
  {
    step: "01",
    title: "Choose Your Level",
    description:
      "Take a quick assessment or set your level manually. We personalize everything from content to AI conversation difficulty.",
    icon: <GraduationCap size={24} />,
  },
  {
    step: "02",
    title: "Practice Daily",
    description:
      "Watch curated clips, talk to AI, practice OPIc scenarios, and build vocabulary. Just 15 minutes a day makes a difference.",
    icon: <Mic size={24} />,
  },
  {
    step: "03",
    title: "Level Up",
    description:
      "Earn XP, maintain streaks, track your progress, and watch your speaking confidence soar with measurable results.",
    icon: <Zap size={24} />,
  },
];

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#09090b]">
      {/* Animated gradient blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-600/15 blur-[120px] animate-blob" />
        <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/15 blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-10%] left-[30%] w-[550px] h-[550px] rounded-full bg-fuchsia-600/10 blur-[120px] animate-blob animation-delay-4000" />
      </div>

      {/* Navigation bar */}
      <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 lg:px-16 py-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold gradient-text tracking-tight">
            NeuroEng
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="hidden sm:inline-flex text-sm font-medium text-zinc-400 hover:text-zinc-200 transition-colors px-4 py-2"
          >
            Sign In
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 px-5 py-2.5 rounded-full transition-all duration-200 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero section */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-16 sm:pt-24 pb-20">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-8">
          <Sparkles size={14} className="text-indigo-400" />
          <span className="text-xs font-medium text-indigo-300">
            AI-Powered English Speaking Coach
          </span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] max-w-4xl">
          <span className="text-white">Master English</span>
          <br />
          <span className="gradient-text">Speaking with AI</span>
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-zinc-400 max-w-2xl leading-relaxed">
          YouTube channels, AI conversations, OPIc prep — all in one place.
          Build real fluency with a system that adapts to you.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/dashboard"
            className="group flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-base transition-all duration-200 shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40"
          >
            Start Learning Free
            <ArrowRight
              size={18}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>
          <Link
            href="/learn/channels"
            className="group flex items-center gap-2.5 px-8 py-3.5 rounded-full border border-white/10 hover:border-white/20 bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 font-semibold text-base transition-all duration-200"
          >
            <Play size={16} />
            Explore Channels
          </Link>
        </div>

        {/* Social proof mini */}
        <div className="mt-12 flex items-center gap-3">
          <div className="flex -space-x-2">
            {["bg-indigo-500", "bg-violet-500", "bg-fuchsia-500", "bg-cyan-500"].map(
              (bg, i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full ${bg} border-2 border-zinc-900 flex items-center justify-center text-[10px] font-bold text-white`}
                >
                  {["A", "S", "M", "K"][i]}
                </div>
              )
            )}
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                size={14}
                className="text-yellow-400 fill-yellow-400"
              />
            ))}
          </div>
          <span className="text-sm text-zinc-500">
            Loved by <span className="text-zinc-300 font-medium">10,000+</span>{" "}
            learners
          </span>
        </div>
      </section>

      {/* Features grid */}
      <section className="relative z-10 px-6 sm:px-10 lg:px-16 pb-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Everything You Need to{" "}
              <span className="gradient-text">Speak Fluently</span>
            </h2>
            <p className="mt-4 text-zinc-400 text-lg max-w-2xl mx-auto">
              A complete ecosystem designed for Korean English learners, from
              beginner to advanced.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {features.map((feature, i) => (
              <div
                key={i}
                className={`group relative p-7 rounded-2xl bg-gradient-to-br ${feature.gradient} border ${feature.border} backdrop-blur-sm hover:scale-[1.02] transition-all duration-300`}
              >
                <div className="absolute inset-0 rounded-2xl bg-zinc-900/60 backdrop-blur-xl" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/[0.06] flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-zinc-400 leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-indigo-400 group-hover:text-indigo-300 transition-colors">
                    Learn more
                    <ChevronRight
                      size={14}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats section */}
      <section className="relative z-10 px-6 sm:px-10 lg:px-16 pb-24">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl bg-gradient-to-r from-indigo-500/10 via-violet-500/10 to-fuchsia-500/10 border border-white/[0.06] p-8 sm:p-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/5 text-indigo-400 mb-3">
                    {stat.icon}
                  </div>
                  <p className="text-3xl sm:text-4xl font-bold text-white">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 px-6 sm:px-10 lg:px-16 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Three Steps to{" "}
              <span className="gradient-text">Fluency</span>
            </h2>
            <p className="mt-4 text-zinc-400 text-lg">
              Simple, effective, and built around your schedule.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((step, i) => (
              <div key={i} className="relative group">
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] hover:border-indigo-500/30 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-3xl font-extrabold gradient-text opacity-40">
                      {step.step}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center text-indigo-400">
                      {step.icon}
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                    <ChevronRight size={20} className="text-zinc-700" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="relative z-10 px-6 sm:px-10 lg:px-16 pb-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-10 sm:p-16 rounded-3xl bg-gradient-to-br from-indigo-600/20 via-violet-600/20 to-fuchsia-600/20 border border-white/[0.06] relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15),transparent_70%)]" />
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Ready to Start Speaking?
              </h2>
              <p className="text-zinc-400 text-lg mb-8 max-w-lg mx-auto">
                Join thousands of learners who are building real English fluency
                with NeuroEng.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-base transition-all duration-200 shadow-xl shadow-indigo-500/25 hover:shadow-indigo-500/40"
              >
                Get Started for Free
                <ArrowRight size={18} />
              </Link>
              <div className="mt-6 flex items-center justify-center gap-4 text-sm text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-400" />
                  Free forever plan
                </span>
                <span className="flex items-center gap-1.5">
                  <Check size={14} className="text-emerald-400" />
                  No credit card needed
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/[0.04] px-6 sm:px-10 lg:px-16 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-400" />
            <span className="text-sm font-semibold gradient-text">
              NeuroEng
            </span>
          </div>
          <p className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} NeuroEng. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
