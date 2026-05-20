'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Flame, CheckCircle2, Plus, Trash2, Trophy,
  Target, Zap, BookOpen, Brain, BarChart2,
  Edit2, X, Check, ChevronRight, CheckCheck,
  Calendar, RefreshCw, Award,
} from 'lucide-react';
import Link from 'next/link';

/* ─── Constants ───────────────────────────────────────────────────── */
const HABITS_KEY = 'fluentpath_habits_v1';

/* ─── Types ───────────────────────────────────────────────────────── */
type TimeRange = '1M' | '3M' | '6M' | '1Y';

interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string;
  targetDaysPerWeek: number;
  completedDates: string[];
  createdAt: string;
}

interface CalendarCell {
  date: string;
  completed: boolean;
  isToday: boolean;
  isInRange: boolean;
}

/* ─── Time range config ────────────────────────────────────────────── */
const TIME_RANGE_DAYS: Record<TimeRange, number> = {
  '1M': 30,
  '3M': 90,
  '6M': 180,
  '1Y': 365,
};
const TIME_RANGE_MONTHS: Record<TimeRange, number> = {
  '1M': 1,
  '3M': 3,
  '6M': 6,
  '1Y': 12,
};
const TIME_RANGE_LABELS: Record<TimeRange, string> = {
  '1M': '1개월',
  '3M': '3개월',
  '6M': '6개월',
  '1Y': '1년',
};

/* ─── Helpers ─────────────────────────────────────────────────────── */
function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function getDateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
}

function getCurrentStreak(habit: Habit): number {
  const today = getTodayStr();
  const todayDone = habit.completedDates.includes(today);
  const yesterdayDone = habit.completedDates.includes(getDateStr(1));
  if (!todayDone && !yesterdayDone) return 0;
  let streak = 0;
  let checkDay = todayDone ? 0 : 1;
  while (true) {
    const d = getDateStr(checkDay);
    if (habit.completedDates.includes(d)) { streak++; checkDay++; }
    else break;
  }
  return streak;
}

function getLongestStreak(habit: Habit): number {
  if (habit.completedDates.length === 0) return 0;
  const sorted = [...habit.completedDates].sort();
  let best = 1, current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i]).getTime() - new Date(sorted[i - 1]).getTime()) / 86400000;
    if (diff === 1) { current++; best = Math.max(best, current); }
    else if (diff > 1) { current = 1; }
  }
  return best;
}

function getLast30Days(habit: Habit): { date: string; completed: boolean; isToday: boolean }[] {
  return Array.from({ length: 30 }, (_, i) => {
    const date = getDateStr(29 - i);
    return { date, completed: habit.completedDates.includes(date), isToday: i === 29 };
  });
}

function getCompletionRateThisWeek(habit: Habit): number {
  const days = Array.from({ length: 7 }, (_, i) => getDateStr(i));
  const done = days.filter((d) => habit.completedDates.includes(d)).length;
  return Math.round((done / habit.targetDaysPerWeek) * 100);
}

function isCompletedToday(habit: Habit): boolean {
  return habit.completedDates.includes(getTodayStr());
}

/**
 * Build GitHub-style calendar: array of week-columns (Mon→Sun),
 * using UTC dates for consistency with stored completedDates.
 */
function buildCalendarWeeks(habit: Habit, days: number): CalendarCell[][] {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayUTC = new Date(todayStr + 'T00:00:00Z');

  const startUTC = new Date(todayUTC);
  startUTC.setUTCDate(startUTC.getUTCDate() - (days - 1));
  const startStr = startUTC.toISOString().split('T')[0];

  // Pad to Monday (0=Mon…6=Sun)
  const startDow = (startUTC.getUTCDay() + 6) % 7;
  const gridStart = new Date(startUTC);
  gridStart.setUTCDate(gridStart.getUTCDate() - startDow);

  // Pad to Sunday
  const endDow = (todayUTC.getUTCDay() + 6) % 7;
  const gridEnd = new Date(todayUTC);
  gridEnd.setUTCDate(gridEnd.getUTCDate() + (6 - endDow));

  const weeks: CalendarCell[][] = [];
  const cur = new Date(gridStart);

  while (cur.getTime() <= gridEnd.getTime()) {
    const week: CalendarCell[] = [];
    for (let d = 0; d < 7; d++) {
      const dateStr = cur.toISOString().split('T')[0];
      week.push({
        date: dateStr,
        completed: habit.completedDates.includes(dateStr),
        isToday: dateStr === todayStr,
        isInRange: dateStr >= startStr && dateStr <= todayStr,
      });
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

/** Returns Korean month label (or null) for the first week where a new month appears */
function getMonthLabels(weeks: CalendarCell[][]): (string | null)[] {
  const KOR = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  let lastMonth = -1;
  return weeks.map((week) => {
    for (const cell of week) {
      if (!cell.isInRange) continue;
      const m = new Date(cell.date + 'T00:00:00Z').getUTCMonth();
      if (m !== lastMonth) { lastMonth = m; return KOR[m]; }
    }
    return null;
  });
}

/** Monthly completion rates for bar chart */
function getMonthlyBars(habit: Habit, months: number): { label: string; rate: number }[] {
  const KOR = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  const now = new Date();
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1 - i), 1));
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    let completed = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const str = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (habit.completedDates.includes(str)) completed++;
    }
    return { label: KOR[m], rate: Math.round((completed / daysInMonth) * 100) };
  });
}

/* ─── Achievement badges ──────────────────────────────────────────── */
const BADGES = [
  { id: '3-streak',   icon: '🌱', label: '3일 연속',   req: (h: Habit) => getCurrentStreak(h) >= 3 },
  { id: '7-streak',   icon: '🔥', label: '7일 연속',   req: (h: Habit) => getCurrentStreak(h) >= 7 },
  { id: '30-streak',  icon: '💎', label: '30일 연속',  req: (h: Habit) => getCurrentStreak(h) >= 30 },
  { id: '100-streak', icon: '👑', label: '100일 연속', req: (h: Habit) => getCurrentStreak(h) >= 100 },
  { id: '10-total',   icon: '✅', label: '10회 달성',  req: (h: Habit) => h.completedDates.length >= 10 },
  { id: '50-total',   icon: '⭐', label: '50회 달성',  req: (h: Habit) => h.completedDates.length >= 50 },
];

/* ─── Default habits ──────────────────────────────────────────────── */
const DEFAULT_HABITS: Habit[] = [
  { id: 'h-default-1', name: '영어 단어 10개 암기',    emoji: '📚', color: '#6366f1', targetDaysPerWeek: 7, completedDates: [], createdAt: new Date().toISOString() },
  { id: 'h-default-2', name: 'OPIc 스크립트 연습',     emoji: '🎤', color: '#10b981', targetDaysPerWeek: 5, completedDates: [], createdAt: new Date().toISOString() },
  { id: 'h-default-3', name: 'English Shadowing 15분', emoji: '🗣️', color: '#f59e0b', targetDaysPerWeek: 5, completedDates: [], createdAt: new Date().toISOString() },
];

const EMOJI_OPTIONS = ['📚','🎤','🗣️','✍️','🎧','🏃','💪','🧘','🍎','💧','😴','🧠','✅','🎯','⏰','🎵','📖','💻','🌟','🔥'];
const COLOR_OPTIONS = ['#6366f1','#8b5cf6','#ec4899','#ef4444','#f97316','#f59e0b','#10b981','#14b8a6','#3b82f6','#06b6d4'];

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════════════ */
export default function HabitsPage() {
  const [habits, setHabits]           = useState<Habit[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [newName, setNewName]           = useState('');
  const [newEmoji, setNewEmoji]         = useState('📚');
  const [newColor, setNewColor]         = useState('#6366f1');
  const [newTarget, setNewTarget]       = useState(5);
  const [view, setView]                 = useState<'today' | 'stats'>('today');
  const [timeRange, setTimeRange]       = useState<TimeRange>('3M');

  /* ── Load ── */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(HABITS_KEY);
      setHabits(stored ? JSON.parse(stored) : DEFAULT_HABITS);
    } catch { setHabits(DEFAULT_HABITS); }
  }, []);

  /* ── Save ── */
  useEffect(() => {
    if (habits.length === 0) return;
    try { localStorage.setItem(HABITS_KEY, JSON.stringify(habits)); } catch { /* noop */ }
  }, [habits]);

  /* ── Toggle today ── */
  const toggleToday = useCallback((id: string) => {
    const today = getTodayStr();
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const done = h.completedDates.includes(today);
        return {
          ...h,
          completedDates: done
            ? h.completedDates.filter((d) => d !== today)
            : [...h.completedDates, today],
        };
      })
    );
  }, []);

  /* ── Add / Edit modal helpers ── */
  const openAdd = () => {
    setEditingHabit(null); setNewName(''); setNewEmoji('📚'); setNewColor('#6366f1'); setNewTarget(5);
    setShowAddModal(true);
  };
  const openEdit = (h: Habit) => {
    setEditingHabit(h); setNewName(h.name); setNewEmoji(h.emoji); setNewColor(h.color); setNewTarget(h.targetDaysPerWeek);
    setShowAddModal(true);
  };
  const saveHabit = () => {
    if (!newName.trim()) return;
    if (editingHabit) {
      setHabits((prev) =>
        prev.map((h) => h.id === editingHabit.id
          ? { ...h, name: newName.trim(), emoji: newEmoji, color: newColor, targetDaysPerWeek: newTarget }
          : h)
      );
    } else {
      setHabits((prev) => [...prev, {
        id: `h-${Date.now()}`, name: newName.trim(), emoji: newEmoji, color: newColor,
        targetDaysPerWeek: newTarget, completedDates: [], createdAt: new Date().toISOString(),
      }]);
    }
    setShowAddModal(false);
  };
  const deleteHabit = (id: string) => setHabits((prev) => prev.filter((h) => h.id !== id));

  /* ── Overview stats ── */
  const todayDone   = habits.filter(isCompletedToday).length;
  const totalStreak = habits.reduce((s, h) => s + getCurrentStreak(h), 0);

  /* ════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════ */
  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Flame size={22} className="text-orange-400" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Habit Tracker</h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20">
            Daily Check-in
          </span>
        </div>
        <p className="text-sm text-[var(--text-muted)]">매일 습관을 기록하고 스트릭을 이어가세요</p>
      </div>

      {/* ── Overview cards ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: CheckCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: '오늘 완료',  value: `${todayDone} / ${habits.length}` },
          { icon: Flame,      color: 'text-orange-400',  bg: 'bg-orange-500/10 border-orange-500/20',   label: '총 스트릭', value: totalStreak },
          { icon: Target,     color: 'text-indigo-400',  bg: 'bg-indigo-500/10 border-indigo-500/20',   label: '습관 수',   value: habits.length },
        ].map((card) => (
          <div key={card.label} className={`rounded-2xl border ${card.bg} p-4 flex flex-col items-center text-center`}>
            <card.icon size={20} className={`${card.color} mb-1`} />
            <p className="text-xl font-bold text-[var(--text-primary)]">{card.value}</p>
            <p className="text-xs text-[var(--text-muted)]">{card.label}</p>
          </div>
        ))}
      </div>

      {/* ── View toggle + Add ── */}
      <div className="flex items-center justify-between">
        <div className="flex rounded-xl bg-white/[0.04] border border-white/[0.06] p-1">
          {(['today', 'stats'] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                view === v
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              }`}
            >
              {v === 'today' ? <><CheckCircle2 size={13} />오늘</> : <><BarChart2 size={13} />통계</>}
            </button>
          ))}
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium hover:opacity-90 transition-all shadow-md shadow-indigo-500/20"
        >
          <Plus size={15} /> 습관 추가
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          TODAY VIEW
      ══════════════════════════════════════════════════════════ */}
      {view === 'today' && (
        <div className="space-y-3">
          {habits.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center">
                <Target size={28} className="text-[var(--text-muted)]" />
              </div>
              <p className="text-[var(--text-secondary)] font-medium">아직 습관이 없어요</p>
              <p className="text-[var(--text-muted)] text-sm">오른쪽 위 버튼으로 첫 번째 습관을 추가해보세요!</p>
            </div>
          )}

          {habits.map((habit) => {
            const done  = isCompletedToday(habit);
            const streak = getCurrentStreak(habit);
            const rate   = getCompletionRateThisWeek(habit);
            const heatmap = getLast30Days(habit);
            const earnedBadges = BADGES.filter((b) => b.req(habit));

            return (
              <div key={habit.id}
                className={`rounded-2xl border transition-all ${
                  done ? 'bg-[var(--bg-card)] border-emerald-500/30' : 'bg-[var(--bg-card)] border-[var(--border-color)]'
                }`}
              >
                {/* Main row */}
                <div className="flex items-center gap-4 p-4">
                  <button onClick={() => toggleToday(habit.id)}
                    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                      done
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                        : 'border-2 text-[var(--text-muted)]'
                    }`}
                    style={done ? {} : { borderColor: habit.color + '60' }}
                  >
                    {done ? <Check size={20} /> : <span className="text-xl">{habit.emoji}</span>}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold ${done ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-primary)]'}`}>
                        {habit.name}
                      </p>
                      {earnedBadges.length > 0 && (
                        <span className="text-xs">{earnedBadges[earnedBadges.length - 1].icon}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {streak > 0 && (
                        <span className="flex items-center gap-1 text-xs text-orange-400">
                          <Flame size={11} /> {streak}일 연속
                        </span>
                      )}
                      <span className="text-xs text-[var(--text-muted)]">주 {habit.targetDaysPerWeek}회 목표</span>
                      <span className={`text-xs font-medium ${rate >= 100 ? 'text-emerald-400' : rate >= 60 ? 'text-amber-400' : 'text-[var(--text-muted)]'}`}>
                        이번 주 {Math.min(rate, 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(habit)}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all">
                      <Edit2 size={13} />
                    </button>
                    <button onClick={() => deleteHabit(habit.id)}
                      className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* 30-day linear heatmap */}
                <div className="px-4 pb-4">
                  <div className="flex gap-[3px]">
                    {heatmap.map((day) => (
                      <div key={day.date} title={day.date}
                        className={`flex-1 h-2.5 rounded-sm transition-all ${
                          day.isToday ? (day.completed ? 'ring-1 ring-white/30' : 'ring-1 ring-white/20') : ''
                        }`}
                        style={{
                          backgroundColor: day.completed ? habit.color : 'rgba(255,255,255,0.06)',
                          opacity: day.completed ? 1 : 0.4,
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
                    최근 30일 · 총 {habit.completedDates.length}회 완료
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          STATS VIEW
      ══════════════════════════════════════════════════════════ */}
      {view === 'stats' && (
        <div className="space-y-6">

          {/* Time range selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--text-muted)] shrink-0">기간 선택</span>
            <div className="flex rounded-xl bg-white/[0.04] border border-white/[0.06] p-1">
              {(['1M', '3M', '6M', '1Y'] as TimeRange[]).map((r) => (
                <button key={r} onClick={() => setTimeRange(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    timeRange === r
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }`}
                >
                  {TIME_RANGE_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          {habits.map((habit) => {
            const streak      = getCurrentStreak(habit);
            const longest     = getLongestStreak(habit);
            const earnedBadges = BADGES.filter((b) => b.req(habit));
            const notYet      = BADGES.filter((b) => !b.req(habit));
            const days        = TIME_RANGE_DAYS[timeRange];
            const months      = TIME_RANGE_MONTHS[timeRange];
            const weeks       = buildCalendarWeeks(habit, days);
            const monthLabels = getMonthLabels(weeks);
            const monthlyBars = getMonthlyBars(habit, months);
            const completionsInRange = weeks.flat().filter((c) => c.isInRange && c.completed).length;

            return (
              <div key={habit.id} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-5">

                {/* Card header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                    style={{ backgroundColor: habit.color + '25' }}>
                    {habit.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[var(--text-primary)] truncate">{habit.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">주 {habit.targetDaysPerWeek}회 목표</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-[var(--text-primary)]">{completionsInRange}회</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{TIME_RANGE_LABELS[timeRange]} 완료</p>
                  </div>
                </div>

                {/* Streak / Total stats */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[
                    { label: '현재 스트릭', value: `${streak}일`,                          icon: Flame,       color: 'text-orange-400' },
                    { label: '최장 스트릭', value: `${longest}일`,                         icon: Award,       color: 'text-amber-400'  },
                    { label: '총 완료',     value: `${habit.completedDates.length}회`,     icon: CheckCircle2, color: 'text-emerald-400' },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-xl bg-[var(--bg-secondary)] p-3 text-center">
                      <stat.icon size={16} className={`${stat.color} mx-auto mb-1`} />
                      <p className="text-base font-bold text-[var(--text-primary)]">{stat.value}</p>
                      <p className="text-[10px] text-[var(--text-muted)]">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {/* ── GitHub-style calendar heatmap ── */}
                <div className="mb-5">
                  <p className="text-xs text-[var(--text-muted)] mb-2 flex items-center gap-1.5">
                    <Calendar size={12} /> {TIME_RANGE_LABELS[timeRange]} 활동 기록
                  </p>
                  <div className="overflow-x-auto pb-1">
                    {/* Month label row */}
                    <div className="flex gap-[2px] mb-[3px]" style={{ paddingLeft: '22px' }}>
                      {monthLabels.map((label, wi) => (
                        <div key={wi} style={{ width: '10px', minWidth: '10px', position: 'relative', height: '12px' }}>
                          {label && (
                            <span className="absolute left-0 top-0 text-[9px] text-[var(--text-muted)] whitespace-nowrap leading-none">
                              {label}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Day-of-week labels + week columns */}
                    <div className="flex items-start">
                      {/* Day labels (Mon / Wed / Fri) */}
                      <div className="flex flex-col gap-[2px] mr-[4px] shrink-0" style={{ width: '18px' }}>
                        {['월','화','수','목','금','토','일'].map((day, di) => (
                          <div key={di} style={{ height: '10px' }} className="flex items-center justify-end">
                            {di % 2 === 0 && (
                              <span className="text-[9px] text-[var(--text-muted)] leading-none">{day}</span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Week columns */}
                      <div className="flex gap-[2px]">
                        {weeks.map((week, wi) => (
                          <div key={wi} className="flex flex-col gap-[2px]">
                            {week.map((cell, di) => (
                              <div key={di}
                                title={`${cell.date}${cell.completed ? ' ✓' : ''}`}
                                className={`rounded-[2px] transition-all ${cell.isToday ? 'ring-1 ring-white/60 ring-inset' : ''}`}
                                style={{
                                  width: '10px', height: '10px',
                                  backgroundColor: !cell.isInRange
                                    ? 'transparent'
                                    : cell.completed
                                      ? habit.color
                                      : 'rgba(255,255,255,0.07)',
                                }}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center gap-1.5 mt-2 justify-end">
                    <span className="text-[9px] text-[var(--text-muted)]">없음</span>
                    <div className="rounded-[2px]" style={{ width: '10px', height: '10px', backgroundColor: 'rgba(255,255,255,0.07)' }} />
                    <div className="rounded-[2px]" style={{ width: '10px', height: '10px', backgroundColor: habit.color + '70' }} />
                    <div className="rounded-[2px]" style={{ width: '10px', height: '10px', backgroundColor: habit.color }} />
                    <span className="text-[9px] text-[var(--text-muted)]">완료</span>
                  </div>
                </div>

                {/* ── Monthly completion bars (3M / 6M / 1Y) ── */}
                {months > 1 && (
                  <div className="mb-5">
                    <p className="text-xs text-[var(--text-muted)] mb-3 flex items-center gap-1.5">
                      <BarChart2 size={12} /> 월별 완료율
                    </p>
                    <div className="flex items-end gap-1.5">
                      {monthlyBars.map((bar, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-[8px] font-semibold text-[var(--text-secondary)] leading-none">
                            {bar.rate > 0 ? `${bar.rate}%` : ''}
                          </span>
                          <div className="relative w-full rounded-sm bg-white/[0.05]" style={{ height: '36px' }}>
                            <div
                              className="absolute bottom-0 left-0 right-0 rounded-sm transition-all duration-500"
                              style={{
                                height: `${Math.max(bar.rate > 0 ? 6 : 0, bar.rate)}%`,
                                backgroundColor: bar.rate >= 70
                                  ? habit.color
                                  : bar.rate >= 40
                                    ? habit.color + 'aa'
                                    : habit.color + '55',
                              }}
                            />
                          </div>
                          <span className="text-[8px] text-[var(--text-muted)] leading-none">{bar.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── Badges ── */}
                <div>
                  <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">업적</p>
                  <div className="flex flex-wrap gap-2">
                    {earnedBadges.map((b) => (
                      <span key={b.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-medium text-amber-300">
                        {b.icon} {b.label}
                      </span>
                    ))}
                    {notYet.map((b) => (
                      <span key={b.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-xs text-[var(--text-muted)] opacity-50">
                        {b.icon} {b.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          {habits.length === 0 && (
            <p className="text-[var(--text-muted)] text-center py-8">습관을 추가하면 통계가 표시됩니다.</p>
          )}
        </div>
      )}

      {/* ── Quick Links ── */}
      <div>
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
          🔗 연결 대시보드
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/learn/vocabulary', icon: BookOpen,  label: '단어 암기',    color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
            { href: '/learn/memorize',   icon: Brain,     label: '암기 대시보드', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
            { href: '/opic/scripts',     icon: Zap,       label: 'OPIc 스크립트', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
            { href: '/talk/shadowing',   icon: RefreshCw, label: '쉐도잉 연습',  color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20' },
          ].map((link) => (
            <Link key={link.href} href={link.href}
              className={`flex items-center gap-2.5 p-3 rounded-xl border ${link.bg} hover:opacity-80 transition-all`}>
              <link.icon size={16} className={link.color} />
              <span className="text-xs font-medium text-[var(--text-secondary)]">{link.label}</span>
              <ChevronRight size={12} className="ml-auto text-[var(--text-muted)]" />
            </Link>
          ))}
        </div>
      </div>

      {/* ── All done today! ── */}
      {habits.length > 0 && todayDone === habits.length && (
        <div className="rounded-2xl bg-gradient-to-r from-emerald-500/15 to-indigo-500/15 border border-emerald-500/20 p-5 flex items-center gap-4">
          <Trophy size={28} className="text-amber-400 shrink-0" />
          <div>
            <p className="font-bold text-[var(--text-primary)]">🎉 오늘 모든 습관 완료!</p>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              대단해요! 오늘 모든 목표를 달성했습니다. 내일도 이어가세요!
            </p>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          Add / Edit Modal
      ══════════════════════════════════════════════════════════════ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            className="w-full max-w-sm bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-[var(--text-primary)]">
                {editingHabit ? '습관 수정' : '새 습관 추가'}
              </h3>
              <button onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all">
                <X size={18} />
              </button>
            </div>

            {/* Emoji */}
            <p className="text-xs text-[var(--text-muted)] mb-2">이모지 선택</p>
            <div className="flex flex-wrap gap-2 mb-4">
              {EMOJI_OPTIONS.map((e) => (
                <button key={e} onClick={() => setNewEmoji(e)}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                    newEmoji === e ? 'ring-2 ring-indigo-400 bg-indigo-500/20' : 'hover:bg-white/10'
                  }`}>
                  {e}
                </button>
              ))}
            </div>

            {/* Name */}
            <p className="text-xs text-[var(--text-muted)] mb-2">습관 이름</p>
            <input
              type="text" value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="예: 영어 단어 10개 암기"
              className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm mb-4 focus:outline-none focus:border-indigo-500/50 transition-all"
              onKeyDown={(e) => e.key === 'Enter' && saveHabit()}
            />

            {/* Color */}
            <p className="text-xs text-[var(--text-muted)] mb-2">색상</p>
            <div className="flex gap-2 mb-4">
              {COLOR_OPTIONS.map((c) => (
                <button key={c} onClick={() => setNewColor(c)}
                  className={`w-7 h-7 rounded-full transition-all ${newColor === c ? 'ring-2 ring-white/70 scale-110' : 'hover:scale-105'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            {/* Weekly target */}
            <p className="text-xs text-[var(--text-muted)] mb-2">주간 목표 (일/주)</p>
            <div className="flex gap-2 mb-5">
              {[1,2,3,4,5,6,7].map((n) => (
                <button key={n} onClick={() => setNewTarget(n)}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    newTarget === n
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
                      : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                  }`}>
                  {n}
                </button>
              ))}
            </div>

            {/* Preview */}
            <div className="flex items-center gap-3 p-3 rounded-xl border mb-5 transition-all"
              style={{ borderColor: newColor + '40', backgroundColor: newColor + '15' }}>
              <span className="text-xl">{newEmoji}</span>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{newName || '습관 이름'}</p>
                <p className="text-xs text-[var(--text-muted)]">주 {newTarget}회 목표</p>
              </div>
            </div>

            <button onClick={saveHabit} disabled={!newName.trim()}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-40 transition-all">
              {editingHabit ? '수정 완료' : '추가하기'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
