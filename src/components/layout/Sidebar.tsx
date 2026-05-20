'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  BookOpen,
  Mic,
  MessageCircle,
  User,
  ChevronRight,
  Play,
  Flame,
  Zap,
  Globe,
  Headphones,
  Volume2,
  Menu,
  X,
  Brain,
  Sparkles,
  Languages,
  FileText,
  Clock,
  Target,
  Gamepad2,
  Wand2,
  CheckCircle2,
  Quote,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'LEARN',
    items: [
      { label: 'Channels', href: '/learn/channels', icon: <Globe size={18} /> },
      { label: 'Clips', href: '/learn/clips', icon: <Play size={18} /> },
      { label: 'Word Bank', href: '/learn/vocabulary', icon: <BookOpen size={18} /> },
      { label: 'Grammar', href: '/learn/grammar', icon: <Wand2 size={18} /> },
    ],
  },
  {
    title: 'SPEAK',
    items: [
      { label: 'AI Free Talk', href: '/talk/free', icon: <MessageCircle size={18} /> },
      { label: 'Roleplay', href: '/talk/roleplay', icon: <Gamepad2 size={18} /> },
      { label: 'Shadowing', href: '/talk/shadowing', icon: <Headphones size={18} /> },
      { label: 'Pronunciation', href: '/learn/pronunciation', icon: <Volume2 size={18} /> },
    ],
  },
  {
    title: 'OPIc',
    items: [
      { label: 'AI Coach', href: '/opic/ai-coach', icon: <Brain size={18} /> },
      { label: 'Mock Test', href: '/opic/mock-test', icon: <Target size={18} /> },
      { label: 'Practice', href: '/opic/practice', icon: <Mic size={18} /> },
      { label: 'Scenarios', href: '/opic/roleplay', icon: <Languages size={18} /> },
      { label: 'Scripts', href: '/opic/scripts', icon: <FileText size={18} /> },
      { label: 'History', href: '/opic/history', icon: <Clock size={18} /> },
    ],
  },
];

const bottomLinks: NavItem[] = [
  { label: 'Habit Tracker', href: '/habits', icon: <CheckCircle2 size={18} /> },
  { label: 'Profile', href: '/profile', icon: <User size={18} /> },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 pt-6 pb-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold gradient-text tracking-tight">
            NeuroEng
          </span>
        </Link>
      </div>

      {/* Dashboard link */}
      <div className="px-3 mb-1">
        <Link
          href="/dashboard"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
            isActive('/dashboard')
              ? 'bg-gradient-to-r from-indigo-500/10 to-violet-500/10 text-indigo-400 border-l-2 border-indigo-500'
              : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
          }`}
        >
          <Home size={18} className={isActive('/dashboard') ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'} />
          <span>Dashboard</span>
        </Link>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-5">
        {navSections.map((section) => (
          <div key={section.title}>
            <h3 className="px-3 mb-1.5 text-[10px] font-bold tracking-[0.15em] text-zinc-500/70 uppercase">
              {section.title}
            </h3>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                      active
                        ? 'bg-gradient-to-r from-indigo-500/10 to-violet-500/10 text-indigo-400'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                    }`}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500" />
                    )}
                    <span className={active ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                    {active && (
                      <ChevronRight size={14} className="ml-auto text-indigo-400/60" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Bottom utility links */}
        <div className="pt-2 border-t border-white/[0.05] space-y-0.5">
          {bottomLinks.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                  active
                    ? 'bg-gradient-to-r from-indigo-500/10 to-violet-500/10 text-indigo-400'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                }`}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full bg-gradient-to-b from-indigo-500 to-violet-500" />
                )}
                <span className={active ? 'text-indigo-400' : 'text-zinc-500 group-hover:text-zinc-300'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
                {active && <ChevronRight size={14} className="ml-auto text-indigo-400/60" />}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Stats row */}
      <div className="px-4 py-3 mx-3 mb-2 rounded-xl bg-white/[0.03] border border-white/[0.04]">
        <div className="flex items-center justify-around">
          <div className="flex items-center gap-1.5">
            <Flame size={16} className="text-orange-400" />
            <span className="text-sm font-semibold text-zinc-300">7</span>
            <span className="text-[10px] text-zinc-600">streak</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Zap size={16} className="text-yellow-400" />
            <span className="text-sm font-semibold text-zinc-300">1,240</span>
            <span className="text-[10px] text-zinc-600">XP</span>
          </div>
        </div>
      </div>

      {/* User mini-profile */}
      <div className="px-4 py-4 border-t border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-indigo-500/20">
              J
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-900 flex items-center justify-center">
              <span className="text-[7px] font-bold text-white">5</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-200 truncate">Jimin</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-medium text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-full">
                Lv.5
              </span>
              <span className="text-[10px] text-zinc-600">Intermediate</span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full w-[65%] rounded-full xp-bar-shimmer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl glass border border-white/[0.06] text-zinc-400 hover:text-zinc-200 transition-colors"
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 glass border-r border-white/[0.06] transform transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/5 transition-colors"
          aria-label="Close navigation"
        >
          <X size={18} />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 glass border-r border-white/[0.06] shrink-0">
        {sidebarContent}
      </aside>
    </>
  );
}
