'use client';

import { useState, useEffect } from 'react';
import {
  History,
  Clock,
  Timer,
  TrendingUp,
  TrendingDown,
  Award,
  BarChart3,
  Calendar,
  Mic,
  MessageSquare,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Eye,
  Flame,
  ChevronRight,
  Sparkles,
  Filter,
  Info,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types & Data                                                       */
/* ------------------------------------------------------------------ */

type SessionType = 'mock' | 'practice' | 'roleplay';
type FilterType = 'all' | SessionType;

interface HistorySession {
  id: string;
  date: string;
  time: string;
  type: SessionType;
  topic: string;
  duration: number;
  grade: string;
}

const mockHistory: HistorySession[] = [
  { id: 'h-1',  date: '2026-04-11', time: '09:30', type: 'mock',     topic: 'Full Mock Test',             duration: 38, grade: 'IH'  },
  { id: 'h-2',  date: '2026-04-10', time: '20:15', type: 'practice', topic: 'Movies & TV Shows',           duration: 12, grade: 'IH'  },
  { id: 'h-3',  date: '2026-04-10', time: '19:00', type: 'roleplay', topic: 'Phone Inquiry',               duration: 8,  grade: 'IM3' },
  { id: 'h-4',  date: '2026-04-09', time: '21:30', type: 'practice', topic: 'Sports & Exercise',           duration: 15, grade: 'IM3' },
  { id: 'h-5',  date: '2026-04-09', time: '08:00', type: 'mock',     topic: 'Full Mock Test',              duration: 42, grade: 'IM3' },
  { id: 'h-6',  date: '2026-04-08', time: '19:45', type: 'practice', topic: 'Your Home',                   duration: 10, grade: 'IH'  },
  { id: 'h-7',  date: '2026-04-07', time: '20:00', type: 'roleplay', topic: 'Problem Solving at Work',     duration: 9,  grade: 'IM2' },
  { id: 'h-8',  date: '2026-04-06', time: '10:30', type: 'mock',     topic: 'Full Mock Test',              duration: 36, grade: 'IM2' },
  { id: 'h-9',  date: '2026-04-05', time: '21:00', type: 'practice', topic: 'Technology in Daily Life',    duration: 14, grade: 'IM3' },
  { id: 'h-10', date: '2026-04-04', time: '19:30', type: 'practice', topic: 'Tell Me About Yourself',      duration: 11, grade: 'IH'  },
  { id: 'h-11', date: '2026-04-03', time: '20:45', type: 'roleplay', topic: 'Making a Complaint',          duration: 7,  grade: 'IM2' },
  { id: 'h-12', date: '2026-04-02', time: '09:00', type: 'mock',     topic: 'Full Mock Test',              duration: 40, grade: 'IM2' },
  { id: 'h-13', date: '2026-04-01', time: '18:30', type: 'practice', topic: 'Travel Experiences',          duration: 13, grade: 'IM3' },
  { id: 'h-14', date: '2026-03-31', time: '20:00', type: 'practice', topic: 'Cooking Habits',              duration: 9,  grade: 'IM2' },
  { id: 'h-15', date: '2026-03-30', time: '10:00', type: 'mock',     topic: 'Full Mock Test',              duration: 35, grade: 'IM1' },
];

const gradeChartData = [
  { date: 'Mar 16', grade: 'IM1', value: 1 },
  { date: 'Mar 20', grade: 'IM1', value: 1 },
  { date: 'Mar 24', grade: 'IM2', value: 2 },
  { date: 'Mar 28', grade: 'IM2', value: 2 },
  { date: 'Mar 30', grade: 'IM2', value: 2 },
  { date: 'Apr 2',  grade: 'IM2', value: 2 },
  { date: 'Apr 6',  grade: 'IM3', value: 3 },
  { date: 'Apr 9',  grade: 'IM3', value: 3 },
];

/* ---- Grade config ---- */
const gradeConfig: Record<string, { color: string; bg: string; border: string; bar: string }> = {
  IL:  { color: 'text-zinc-400',    bg: 'bg-zinc-500/15',   border: 'border-zinc-500/20',   bar: 'bg-zinc-400' },
  IM1: { color: 'text-teal-400',    bg: 'bg-teal-500/15',   border: 'border-teal-500/20',   bar: 'bg-teal-400' },
  IM2: { color: 'text-blue-400',    bg: 'bg-blue-500/15',   border: 'border-blue-500/20',   bar: 'bg-blue-400' },
  IM3: { color: 'text-indigo-400',  bg: 'bg-indigo-500/15', border: 'border-indigo-500/20', bar: 'bg-indigo-400' },
  IH:  { color: 'text-violet-400',  bg: 'bg-violet-500/15', border: 'border-violet-500/20', bar: 'bg-violet-400' },
  AL:  { color: 'text-amber-400',   bg: 'bg-amber-500/15',  border: 'border-amber-500/20',  bar: 'bg-amber-400' },
};

/* ---- Session type config ---- */
const typeConfig: Record<SessionType, { icon: React.ElementType; label: string; color: string; bg: string; border: string }> = {
  mock:     { icon: Target,        label: 'Mock Test',   color: 'text-violet-400', bg: 'bg-violet-500/15', border: 'border-violet-500/20' },
  practice: { icon: Mic,           label: 'Practice',    color: 'text-emerald-400',bg: 'bg-emerald-500/15',border: 'border-emerald-500/20' },
  roleplay: { icon: MessageSquare, label: 'Roleplay',    color: 'text-amber-400',  bg: 'bg-amber-500/15',  border: 'border-amber-500/20' },
};

const gradeOrder = ['IL', 'IM1', 'IM2', 'IM3', 'IH', 'AL'];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function GradeBadge({ grade }: { grade: string }) {
  const conf = gradeConfig[grade] ?? gradeConfig['IM1'];
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${conf.bg} ${conf.color} border ${conf.border}`}>
      {grade}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

interface StoredSession {
  id: string;
  type: SessionType;
  date: string;       // ISO
  topic: string;
  duration: number;   // seconds (from mock-test) or minutes
  grade: string;
  questionsAnswered?: number;
  totalQuestions?: number;
}

const HISTORY_KEY = 'fluentpath_opic_history_v1';

function toDisplaySession(s: StoredSession): HistorySession {
  // Mock-test stores `duration` in seconds; legacy expects minutes
  const totalMinutes = s.duration > 600 || s.duration < 60 ? Math.round(s.duration / 60) : Math.max(1, Math.round(s.duration / 60));
  const d = new Date(s.date);
  const datePart = d.toISOString().split('T')[0];
  const timePart = d.toTimeString().slice(0, 5);
  return {
    id: s.id,
    date: datePart,
    time: timePart,
    type: s.type,
    topic: s.topic,
    duration: totalMinutes,
    grade: s.grade,
  };
}

export default function HistoryPage() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [realSessions, setRealSessions] = useState<HistorySession[]>([]);
  const [hasRealData, setHasRealData] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      if (raw) {
        const arr: StoredSession[] = JSON.parse(raw);
        if (arr.length > 0) {
          setRealSessions(arr.map(toDisplaySession));
          setHasRealData(true);
        }
      }
    } catch { /* ignore */ }
  }, []);

  const dataset = hasRealData ? realSessions : mockHistory;
  const filtered = filter === 'all' ? dataset : dataset.filter((h) => h.type === filter);

  const totalSessions = dataset.length;
  const totalMinutes  = dataset.reduce((s, h) => s + h.duration, 0);
  const totalHours    = Math.floor(totalMinutes / 60);
  const remainingMin  = totalMinutes % 60;

  const gradeValues: Record<string, number> = { IL:1, IM1:2, IM2:3, IM3:4, IH:5, AL:6 };
  const avgGradeValue = dataset.length > 0 ? dataset.reduce((s, h) => s + (gradeValues[h.grade] || 0), 0) / dataset.length : 0;
  const avgGradeIdx   = Math.round(avgGradeValue) - 1;
  const avgGrade      = dataset.length > 0 ? gradeOrder[Math.max(0, Math.min(avgGradeIdx, gradeOrder.length - 1))] : '—';

  // Compute weekly comparison from actual dates
  const today = new Date();
  const sevenDaysAgo = new Date(today); sevenDaysAgo.setDate(today.getDate() - 7);
  const fourteenDaysAgo = new Date(today); fourteenDaysAgo.setDate(today.getDate() - 14);
  const sevenAgoStr = sevenDaysAgo.toISOString().split('T')[0];
  const fourteenAgoStr = fourteenDaysAgo.toISOString().split('T')[0];

  const thisWeekSessions = dataset.filter((h) => h.date >= sevenAgoStr).length;
  const lastWeekSessions = dataset.filter((h) => h.date >= fourteenAgoStr && h.date < sevenAgoStr).length;
  const thisWeekMinutes  = dataset.filter((h) => h.date >= sevenAgoStr).reduce((s, h) => s + h.duration, 0);
  const lastWeekMinutes  = dataset.filter((h) => h.date >= fourteenAgoStr && h.date < sevenAgoStr).reduce((s, h) => s + h.duration, 0);

  // Chart: grade values 0-5 mapped to bar heights
  const chartMax = 5;

  return (
    <div className="space-y-8 animate-fade-in pb-10">

      {/* ── Header ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-6 py-8">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-20 -left-16 h-48 w-48 rounded-full bg-violet-400/10 blur-3xl" />
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 shadow-xl">
              <History className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">OPIc History</h1>
              <p className="text-sm text-indigo-200 mt-0.5">나의 OPIc 학습 여정을 추적해요</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15">
            <Flame className="h-4 w-4 text-orange-300" />
            <span className="text-sm font-semibold text-white">12일 연속</span>
            <span className="text-xs text-indigo-200">streak</span>
          </div>
        </div>
      </div>

      {/* ── Sample data notice (only when no real sessions yet) ── */}
      {!hasRealData && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Info size={15} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300 leading-relaxed">
            아직 완료된 모의고사가 없어요. 아래는 <span className="font-semibold">샘플 데이터</span>입니다.
            <a href="/opic/mock-test" className="underline ml-1">모의고사를 완료하면</a> 실제 기록이 여기에 저장됩니다.
          </p>
        </div>
      )}

      {hasRealData && (
        <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <Info size={15} className="text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-xs text-emerald-300 leading-relaxed">
            <span className="font-semibold">{realSessions.length}개의 실제 세션</span> 기록이 표시되고 있어요.
          </p>
        </div>
      )}

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Sessions',    value: String(totalSessions),          icon: BarChart3,  color: 'text-indigo-400',  bg: 'bg-indigo-500/10' },
          { label: 'Speaking Time',     value: `${totalHours}h ${remainingMin}m`, icon: Clock,   color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Avg. Grade',        value: avgGrade,                       icon: Award,      color: 'text-violet-400',  bg: 'bg-violet-500/10' },
          { label: 'Grade Improvement', value: '+2 levels',                    icon: TrendingUp, color: 'text-amber-400',   bg: 'bg-amber-500/10' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-5">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon size={18} className={s.color} />
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* ── Grade Progress Chart ── */}
      <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-semibold text-zinc-200 flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-400" />
            Grade Progress
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
            <Sparkles size={12} />
            IM1 → IH 향상
          </div>
        </div>

        <div className="flex items-end gap-2 h-44">
          {/* Y-axis labels */}
          <div className="flex flex-col justify-between h-full pb-0 pr-2 shrink-0">
            {['AL', 'IH', 'IM3', 'IM2', 'IM1', 'IL'].map((g) => {
              const conf = gradeConfig[g];
              return (
                <span key={g} className={`text-[10px] font-bold leading-none ${conf.color}`}>{g}</span>
              );
            })}
          </div>

          {/* Bars */}
          <div className="flex-1 flex items-end gap-1.5 h-full relative">
            {/* Grid lines */}
            {[0,1,2,3,4,5].map((i) => (
              <div
                key={i}
                className="absolute left-0 right-0 border-t border-dashed border-white/[0.05]"
                style={{ bottom: `${(i / 5) * 100}%` }}
              />
            ))}
            {gradeChartData.map((d, i) => {
              const conf = gradeConfig[d.grade] ?? gradeConfig['IM1'];
              const heightPct = (d.value / chartMax) * 100;
              const isLast = i === gradeChartData.length - 1;
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end h-full relative z-10">
                  {isLast && (
                    <span className={`text-[10px] font-bold mb-1 ${conf.color}`}>{d.grade}</span>
                  )}
                  <div
                    className={`w-full max-w-[36px] rounded-t-lg ${conf.bar} transition-all duration-700 hover:opacity-80 ${isLast ? 'opacity-100' : 'opacity-60'}`}
                    style={{ height: `${heightPct}%`, transitionDelay: `${i * 60}ms` }}
                    title={`${d.date}: ${d.grade}`}
                  />
                  <span className="text-[9px] text-zinc-600 mt-1.5 text-center leading-tight">{d.date}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Grade legend */}
        <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-white/[0.06]">
          {gradeOrder.map((g) => {
            const conf = gradeConfig[g];
            return (
              <div key={g} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${conf.bar}`} />
                <span className={`text-[10px] font-semibold ${conf.color}`}>{g}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Weekly comparison ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            label: 'This Week',
            sub: 'Apr 6 – 11',
            sessions: thisWeekSessions,
            minutes: thisWeekMinutes,
            compSessions: lastWeekSessions,
            compMinutes: lastWeekMinutes,
            isCurrent: true,
          },
          {
            label: 'Last Week',
            sub: 'Mar 30 – Apr 5',
            sessions: lastWeekSessions,
            minutes: lastWeekMinutes,
            compSessions: thisWeekSessions,
            compMinutes: thisWeekMinutes,
            isCurrent: false,
          },
        ].map((w) => (
          <div key={w.label} className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-zinc-200">{w.label}</h3>
              <span className="text-xs text-zinc-500">{w.sub}</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold text-zinc-100">{w.sessions}</p>
                  {w.isCurrent && (
                    w.sessions > w.compSessions
                      ? <ArrowUpRight size={16} className="text-emerald-400" />
                      : w.sessions < w.compSessions
                      ? <ArrowDownRight size={16} className="text-red-400" />
                      : <Minus size={16} className="text-zinc-500" />
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">Sessions</p>
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold text-zinc-100">{w.minutes}m</p>
                  {w.isCurrent && (
                    w.minutes > w.compMinutes
                      ? <ArrowUpRight size={16} className="text-emerald-400" />
                      : w.minutes < w.compMinutes
                      ? <ArrowDownRight size={16} className="text-red-400" />
                      : <Minus size={16} className="text-zinc-500" />
                  )}
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">Practice time</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter + Session list ── */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-semibold text-zinc-200 flex items-center gap-2">
            <Filter size={15} className="text-zinc-500" />
            Session Log
            <span className="text-xs text-zinc-500 font-normal">({filtered.length})</span>
          </h2>
          <div className="flex gap-1.5">
            {([
              { key: 'all',      label: 'All' },
              { key: 'mock',     label: 'Mock Test' },
              { key: 'practice', label: 'Practice' },
              { key: 'roleplay', label: 'Roleplay' },
            ] as { key: FilterType; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  filter === key
                    ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25'
                    : 'border-white/[0.06] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] overflow-hidden">
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((session) => {
              const tc = typeConfig[session.type];
              const Icon = tc.icon;
              return (
                <div
                  key={session.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.03] transition-colors group"
                >
                  {/* Type icon */}
                  <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${tc.bg} border ${tc.border}`}>
                    <Icon size={18} className={tc.color} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-medium text-zinc-200 truncate">{session.topic}</p>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold ${tc.bg} ${tc.color} border ${tc.border}`}>
                        {tc.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {session.date}
                      </span>
                      <span>{session.time}</span>
                      <span className="flex items-center gap-1">
                        <Timer size={11} />
                        {session.duration}m
                      </span>
                    </div>
                  </div>

                  {/* Grade + eye */}
                  <div className="shrink-0 flex items-center gap-3">
                    <GradeBadge grade={session.grade} />
                    <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-white/[0.06]">
                      <Eye size={14} className="text-zinc-500" />
                    </button>
                    <ChevronRight size={14} className="text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <History size={40} className="text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500">이 필터에 해당하는 세션이 없어요.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
