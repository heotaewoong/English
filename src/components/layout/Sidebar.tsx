'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home, BookOpen, Mic, MessageCircle, User,
  Play, Flame, Zap, Globe, Headphones, Volume2,
  Menu, X, Brain, Sparkles, Languages, FileText,
  Clock, Target, Gamepad2, Wand2, CheckCircle2,
  ChevronRight, Crown,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'LEARN',
    items: [
      { label: 'Channels',    href: '/learn/channels',     icon: Globe },
      { label: 'Clips',       href: '/learn/clips',        icon: Play },
      { label: 'Word Bank',   href: '/learn/vocabulary',   icon: BookOpen },
      { label: 'Grammar',     href: '/learn/grammar',      icon: Wand2 },
    ],
  },
  {
    title: 'SPEAK',
    items: [
      { label: 'AI Free Talk',    href: '/talk/free',           icon: MessageCircle },
      { label: 'Roleplay',        href: '/talk/roleplay',       icon: Gamepad2 },
      { label: 'Shadowing',       href: '/talk/shadowing',      icon: Headphones },
      { label: 'Pronunciation',   href: '/learn/pronunciation', icon: Volume2 },
    ],
  },
  {
    title: 'OPIc',
    items: [
      { label: 'AI Coach',   href: '/opic/ai-coach',  icon: Brain },
      { label: 'Mock Test',  href: '/opic/mock-test', icon: Target },
      { label: 'Practice',   href: '/opic/practice',  icon: Mic },
      { label: 'Scenarios',  href: '/opic/roleplay',  icon: Languages },
      { label: 'Scripts',    href: '/opic/scripts',   icon: FileText },
      { label: 'History',    href: '/opic/history',   icon: Clock },
    ],
  },
];

const bottomLinks: NavItem[] = [
  { label: 'Habit Tracker', href: '/habits',  icon: CheckCircle2 },
  { label: 'Profile',       href: '/profile', icon: User },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const NavLink = ({ item, onClick }: { item: NavItem; onClick?: () => void }) => {
    const active = isActive(item.href);
    const Icon = item.icon;
    return (
      <Link
        href={item.href}
        onClick={onClick}
        className="relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group"
        style={{
          color: active ? 'var(--accent)' : 'var(--text-muted)',
          background: active ? 'var(--accent-light)' : 'transparent',
        }}
        onMouseEnter={e => { if (!active) { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}}
        onMouseLeave={e => { if (!active) { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'transparent'; }}}
      >
        {active && <div className="nav-active-dot" />}
        <Icon size={17} />
        <span>{item.label}</span>
        {active && <ChevronRight size={13} className="ml-auto opacity-50" />}
        {item.badge && (
          <span className="ml-auto badge badge-pro text-[10px] px-1.5 py-0.5">{item.badge}</span>
        )}
      </Link>
    );
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 pt-5 pb-4">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--gradient-accent)' }}
          >
            <Sparkles size={15} className="text-white" />
          </div>
          <span className="text-[17px] font-bold gradient-text-accent tracking-tight">NeuroEng</span>
        </Link>
      </div>

      {/* Dashboard */}
      <div className="px-3 mb-2">
        <NavLink item={{ label: 'Dashboard', href: '/dashboard', icon: Home }} onClick={() => setMobileOpen(false)} />
      </div>

      {/* Nav Sections */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-5 py-2">
        {navSections.map((section) => (
          <div key={section.title}>
            <p
              className="px-3 mb-1.5 text-[10px] font-bold tracking-[0.14em] uppercase"
              style={{ color: 'var(--text-muted)', opacity: 0.7 }}
            >
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink key={item.href} item={item} onClick={() => setMobileOpen(false)} />
              ))}
            </div>
          </div>
        ))}

        {/* Pricing CTA */}
        <div className="pt-1">
          <Link
            href="/pricing"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: 'var(--pro-light)',
              color: 'var(--pro)',
              border: '1px solid rgba(245,158,11,0.2)',
            }}
          >
            <Crown size={16} />
            <span>Upgrade to Pro</span>
            <ChevronRight size={13} className="ml-auto" />
          </Link>
        </div>

        {/* Utility links */}
        <div
          className="pt-3 space-y-0.5"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          {bottomLinks.map((item) => (
            <NavLink key={item.href} item={item} onClick={() => setMobileOpen(false)} />
          ))}
        </div>
      </nav>

      {/* Stats strip */}
      <div className="mx-3 mb-2 px-4 py-3 rounded-xl flex items-center justify-around" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-1.5">
          <Flame size={15} className="text-orange-400" />
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>7</span>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>streak</span>
        </div>
        <div className="w-px h-4" style={{ background: 'var(--border-strong)' }} />
        <div className="flex items-center gap-1.5">
          <Zap size={15} className="text-amber-400" />
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>1,240</span>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>XP</span>
        </div>
      </div>

      {/* User mini-profile */}
      <div className="px-4 pb-4 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: 'var(--gradient-accent)' }}
            >
              J
            </div>
            <div
              className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center"
              style={{ background: 'var(--success)', borderColor: 'var(--bg-base)' }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>Jimin</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="badge badge-accent text-[10px] px-1.5 py-0.5">Lv.5</span>
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Intermediate</span>
            </div>
            <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <div className="h-full w-[65%] rounded-full xp-bar-shimmer" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl transition-colors"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-in-out ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 right-4 p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)' }}
          aria-label="Close navigation"
        >
          <X size={18} />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:flex flex-col w-60 h-screen sticky top-0 shrink-0"
        style={{ background: 'var(--bg-surface)', borderRight: '1px solid var(--border)' }}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
