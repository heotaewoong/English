'use client';

import { useState, useEffect } from 'react';
import {
  User,
  Award,
  Flame,
  Calendar,
  BarChart3,
  Target,
  Settings,
  Bell,
  Moon,
  Sun,
  Globe,
  Lock,
  LogOut,
  Mail,
  ChevronRight,
  Star,
  Zap,
  BookOpen,
  Mic,
  Headphones,
  Volume2,
  PenTool,
  Clock,
  TrendingUp,
  CheckCircle2,
  Brain,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface Badge {
  icon: string;
  title: string;
  description: string;
  earnedDate?: string;
  locked?: boolean;
  color: string;
}

function buildBadges(vocabCount: number, masteredCount: number, streak: number): Badge[] {
  return [
    { icon: '🗣️', title: 'First Words', description: 'Start your learning journey', earnedDate: 'Started', color: 'from-blue-400 to-indigo-500' },
    { icon: '⚔️', title: 'Week Warrior', description: '7-day habit streak', ...(streak >= 7 ? { earnedDate: `${streak}-day streak` } : { locked: true }), color: 'from-orange-400 to-red-500' },
    { icon: '🏆', title: 'Month Master', description: '30-day habit streak', ...(streak >= 30 ? { earnedDate: `${streak}-day streak` } : { locked: true }), color: 'from-yellow-400 to-amber-500' },
    { icon: '📚', title: 'Vocabulary King', description: 'Save 100 vocabulary words', ...(vocabCount >= 100 ? { earnedDate: `${vocabCount} words` } : { locked: true }), color: 'from-cyan-400 to-blue-500' },
    { icon: '🧠', title: 'Word Master', description: 'Master 50 vocabulary words', ...(masteredCount >= 50 ? { earnedDate: `${masteredCount} mastered` } : { locked: true }), color: 'from-indigo-400 to-violet-500' },
    { icon: '💬', title: 'Chatterbox', description: 'Complete 10 AI Free Talk sessions', locked: true, color: 'from-pink-400 to-rose-500' },
    { icon: '🎯', title: 'OPIc Ready', description: 'Complete your first mock test', locked: true, color: 'from-emerald-400 to-teal-500' },
    { icon: '⭐', title: 'Rising Star', description: 'Reach OPIc IH level', locked: true, color: 'from-violet-400 to-purple-500' },
    { icon: '🌍', title: 'Polyglot', description: 'Save 500 vocabulary words', ...(vocabCount >= 500 ? { earnedDate: `${vocabCount} words` } : { locked: true }), color: 'from-slate-400 to-slate-500' },
    { icon: '🔥', title: 'Inferno', description: '100-day habit streak', ...(streak >= 100 ? { earnedDate: `${streak}-day streak` } : { locked: true }), color: 'from-slate-400 to-slate-500' },
    { icon: '💎', title: 'Diamond', description: 'Reach Diamond League', locked: true, color: 'from-slate-400 to-slate-500' },
    { icon: '👑', title: 'Legend', description: 'Reach OPIc AL level', locked: true, color: 'from-slate-400 to-slate-500' },
  ];
}

interface VocabItem {
  reviewCount?: number;
  stage?: number;
}

interface Habit {
  completedDates: string[];
}

function computeOverallStreak(habits: Habit[]): number {
  if (!habits.length) return 0;
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const anyDone = habits.some((h) => h.completedDates.includes(dateStr));
    if (anyDone) streak++;
    else if (i > 0) break; // gap — stop (allow today to be missed)
  }
  return streak;
}

/* ------------------------------------------------------------------ */
/*  Settings persistence                                               */
/* ------------------------------------------------------------------ */

const SETTINGS_KEY = 'fluentpath_settings_v1';

interface Settings {
  notifications: boolean;
  dailyReminder: boolean;
  language: 'ko' | 'en';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  dailyXpTarget: number;
}

const DEFAULT_SETTINGS: Settings = {
  notifications: true,
  dailyReminder: true,
  language: 'ko',
  difficulty: 'Medium',
  dailyXpTarget: 50,
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
}

function saveSettings(s: Partial<Settings>) {
  try {
    const current = loadSettings();
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...current, ...s }));
  } catch {}
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function ProfilePage() {
  const [notifications, setNotifications] = useState(DEFAULT_SETTINGS.notifications);
  const [dailyReminder, setDailyReminder] = useState(DEFAULT_SETTINGS.dailyReminder);
  const [language, setLanguage] = useState<'ko' | 'en'>(DEFAULT_SETTINGS.language);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>(DEFAULT_SETTINGS.difficulty);
  const [dailyXpTarget, setDailyXpTarget] = useState(DEFAULT_SETTINGS.dailyXpTarget);
  const [vocabCount, setVocabCount] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);
  const [streak, setStreak] = useState(0);

  /* Load settings + vocab stats + habits streak from localStorage */
  useEffect(() => {
    const s = loadSettings();
    setNotifications(s.notifications);
    setDailyReminder(s.dailyReminder);
    setLanguage(s.language);
    setDifficulty(s.difficulty);
    setDailyXpTarget(s.dailyXpTarget);

    try {
      const raw = localStorage.getItem('fluentpath_vocab_v2');
      if (raw) {
        const items: VocabItem[] = JSON.parse(raw);
        setVocabCount(items.length);
        setMasteredCount(items.filter(i => (i.stage ?? 0) >= 4).length);
      }
    } catch { /* ignore */ }

    try {
      const raw = localStorage.getItem('fluentpath_habits_v1');
      if (raw) {
        const habits: Habit[] = JSON.parse(raw);
        setStreak(computeOverallStreak(habits));
      }
    } catch { /* ignore */ }
  }, []);

  const badges = buildBadges(vocabCount, masteredCount, streak);

  const stats = [
    { label: 'Total Learning Time', value: '48h 32m', icon: Clock, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Total Sessions', value: '156', icon: BarChart3, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Words Saved', value: String(vocabCount), icon: BookOpen, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Words Mastered', value: String(masteredCount), icon: Brain, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ];

  const skills = [
    { name: 'Speaking', value: 72, icon: Mic, color: 'from-indigo-500 to-violet-500' },
    { name: 'Listening', value: 65, icon: Headphones, color: 'from-blue-500 to-cyan-500' },
    { name: 'Vocabulary', value: Math.min(100, Math.round((vocabCount / 200) * 100)) || 40, icon: BookOpen, color: 'from-emerald-500 to-teal-500' },
    { name: 'Pronunciation', value: 58, icon: Volume2, color: 'from-amber-500 to-orange-500' },
    { name: 'Grammar', value: 68, icon: PenTool, color: 'from-pink-500 to-rose-500' },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* ── Profile Header Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-6 py-8">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-64 w-64 rounded-full bg-purple-400/10 blur-3xl" />

        <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-2xl font-bold text-white shadow-xl">
              LP
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-white shadow-md">
              3
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold text-white">English Learner</h1>
            <div className="mt-1.5 flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-white border border-white/20">
                <Star className="h-3 w-3" /> Level 3 · Intermediate
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-amber-200 border border-amber-400/20">
                <Flame className="h-3 w-3" /> {streak > 0 ? `${streak}-day streak` : 'No streak yet'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/10 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-white/80 border border-white/15">
                <Calendar className="h-3 w-3" /> Since Mar 2024
              </span>
            </div>
            {/* XP bar */}
            <div className="mt-3 max-w-xs mx-auto sm:mx-0">
              <div className="flex justify-between text-xs text-white/70 mb-1">
                <span>2,450 XP</span>
                <span>3,000 XP → Level 4</span>
              </div>
              <div className="h-2 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full rounded-full bg-white/80 transition-all" style={{ width: '81.7%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Achievement Badges ── */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[var(--text-primary)]">
          <Award className="h-5 w-5 text-amber-400" />
          Achievement Badges
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {badges.map((b) => (
            <div
              key={b.title}
              className={`group relative overflow-hidden rounded-2xl border p-4 transition-all ${
                b.locked
                  ? 'border-[var(--border-color)] bg-[var(--bg-secondary)] opacity-60'
                  : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:-translate-y-0.5 hover:border-indigo-500/30'
              }`}
            >
              {!b.locked && <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r ${b.color}`} />}
              <div className="flex flex-col items-center text-center">
                <span className={`text-3xl ${b.locked ? 'grayscale opacity-40' : ''}`}>{b.icon}</span>
                <h3 className={`mt-2 text-sm font-semibold ${b.locked ? 'text-[var(--text-muted)]' : 'text-[var(--text-primary)]'}`}>{b.title}</h3>
                <p className={`mt-0.5 text-[11px] leading-tight ${b.locked ? 'text-[var(--text-muted)]/60' : 'text-[var(--text-muted)]'}`}>{b.description}</p>
                {b.locked ? (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-[var(--bg-secondary)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-muted)]">
                    🔒 Locked
                  </span>
                ) : (
                  <span className="mt-2 text-[10px] font-medium text-indigo-400">{b.earnedDate}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Statistics ── */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[var(--text-primary)]">
          <BarChart3 className="h-5 w-5 text-indigo-400" />
          Statistics
        </h2>

        {/* Stat cards */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.bg}`}>
                  <Icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <p className="mt-3 text-xl font-bold text-[var(--text-primary)]">{s.value}</p>
                <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Skills */}
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
          <h3 className="mb-5 text-sm font-semibold text-[var(--text-primary)]">Skills Overview</h3>
          <div className="space-y-4">
            {skills.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.name} className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-secondary)]">
                    <Icon className="h-4 w-4 text-[var(--text-muted)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[var(--text-secondary)]">{s.name}</span>
                      <span className="font-semibold text-[var(--text-muted)]">{s.value}%</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${s.color} transition-all`}
                        style={{ width: `${s.value}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Learning Goals ── */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[var(--text-primary)]">
          <Target className="h-5 w-5 text-violet-400" />
          Learning Goals
        </h2>
        <div className="space-y-3">
          {/* Main goal */}
          <div className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
            <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500" />
            <div className="p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-md shadow-indigo-500/20">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text-primary)]">Achieve OPIc IH by June 2024</h3>
                  <p className="mt-0.5 text-xs text-[var(--text-muted)]">Your primary learning objective</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[var(--text-muted)]">Progress</span>
                  <span className="font-semibold text-indigo-400">68%</span>
                </div>
                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
                  <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500" style={{ width: '68%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Daily goal toggle */}
          <div className="flex items-center justify-between rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">Study 30 minutes per day</h3>
                <p className="text-xs text-[var(--text-muted)]">Daily reminder</p>
              </div>
            </div>
            <button
              onClick={() => { const v = !dailyReminder; setDailyReminder(v); saveSettings({ dailyReminder: v }); }}
              className={`relative h-6 w-11 rounded-full transition-colors ${dailyReminder ? 'bg-gradient-to-r from-indigo-500 to-violet-500' : 'bg-white/10'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${dailyReminder ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* XP target */}
          <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-[var(--text-primary)]">Daily XP Target</h3>
                <p className="text-xs text-[var(--text-muted)]">{dailyXpTarget} XP per day</p>
              </div>
            </div>
            <input
              type="range"
              min={10}
              max={200}
              value={dailyXpTarget}
              step={10}
              onChange={e => { const v = Number(e.target.value); setDailyXpTarget(v); saveSettings({ dailyXpTarget: v }); }}
              className="w-full accent-indigo-500"
            />
            <div className="flex justify-between text-[10px] text-[var(--text-muted)] mt-1">
              <span>10 XP</span>
              <span>100 XP</span>
              <span>200 XP</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Settings ── */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[var(--text-primary)]">
          <Settings className="h-5 w-5 text-[var(--text-muted)]" />
          Settings
        </h2>
        <div className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] divide-y divide-[var(--border-color)]">
          {/* Notifications */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Notifications</p>
                <p className="text-[11px] text-[var(--text-muted)]">Receive push notifications</p>
              </div>
            </div>
            <button
              onClick={() => { const v = !notifications; setNotifications(v); saveSettings({ notifications: v }); }}
              className={`relative h-6 w-11 rounded-full transition-colors ${notifications ? 'bg-gradient-to-r from-indigo-500 to-violet-500' : 'bg-white/10'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${notifications ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Theme */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
                <Moon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Theme</p>
                <p className="text-[11px] text-[var(--text-muted)]">Dark mode (always on)</p>
              </div>
            </div>
            <span className="text-xs font-medium text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-full border border-violet-500/20">
              Dark
            </span>
          </div>

          {/* Language */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <Globe className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Language</p>
                <p className="text-[11px] text-[var(--text-muted)]">App display language</p>
              </div>
            </div>
            <div className="flex overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]">
              <button
                onClick={() => { setLanguage('ko'); saveSettings({ language: 'ko' }); }}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${language === 'ko' ? 'bg-indigo-500 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
              >
                한국어
              </button>
              <button
                onClick={() => { setLanguage('en'); saveSettings({ language: 'en' }); }}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${language === 'en' ? 'bg-indigo-500 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
              >
                English
              </button>
            </div>
          </div>

          {/* Difficulty */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">AI Difficulty</p>
                <p className="text-[11px] text-[var(--text-muted)]">Adjust content difficulty</p>
              </div>
            </div>
            <div className="flex overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)]">
              {(['Easy', 'Medium', 'Hard'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => { setDifficulty(d); saveSettings({ difficulty: d }); }}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${difficulty === d ? 'bg-indigo-500 text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Account section */}
          <div className="bg-[var(--bg-secondary)] px-5 py-4">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">Account</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] px-1">
                <Mail className="h-4 w-4" />
                learner@fluentpath.com
              </div>
              <button className="flex w-full items-center justify-between rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] px-4 py-3 text-sm font-medium text-[var(--text-secondary)] hover:border-indigo-500/30 transition-all">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-[var(--text-muted)]" />
                  Change Password
                </div>
                <ChevronRight className="h-4 w-4 text-[var(--text-muted)]" />
              </button>
              <button className="flex w-full items-center gap-2 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition-all">
                <LogOut className="h-4 w-4" />
                Log Out
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* User card info footer */}
      <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
        <User size={12} />
        <span>FluentPath v0.1 · Free plan · Powered by Groq + Llama 3.3</span>
      </div>
    </div>
  );
}
