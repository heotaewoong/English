'use client';

import { useState, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, BookOpen, FileText,
  Calendar, Check, Clock, X, Brain, TrendingUp, Layers,
} from 'lucide-react';
import { useAppStore, VocabularyWord, Sentence } from '@/lib/store';

/* ─── Types ──────────────────────────────────────────────────── */
type FilterType = 'all' | 'vocab' | 'sentences';

/* ─── Constants ──────────────────────────────────────────────── */
const WEEKDAYS   = ['일', '월', '화', '수', '목', '금', '토'];
const MONTH_NAMES = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

const LEVEL_CFG: Record<number, { label: string; color: string; dot: string }> = {
  0: { label: 'New',      color: 'text-zinc-400',    dot: 'bg-zinc-500'    },
  1: { label: 'Learning', color: 'text-orange-400',  dot: 'bg-orange-400'  },
  2: { label: 'Review',   color: 'text-blue-400',    dot: 'bg-blue-400'    },
  3: { label: 'Solid',    color: 'text-indigo-400',  dot: 'bg-indigo-400'  },
  4: { label: 'Mastered', color: 'text-emerald-400', dot: 'bg-emerald-400' },
  5: { label: 'Pro',      color: 'text-yellow-400',  dot: 'bg-yellow-400'  },
};

/* ─── Helpers ─────────────────────────────────────────────────── */
function toIso(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatKo(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]})`;
}

/* heat colours for past-study days */
function studyHeat(n: number): string {
  if (n === 0)  return '';
  if (n < 5)   return 'bg-emerald-500/[0.18]';
  if (n < 15)  return 'bg-emerald-500/[0.32]';
  if (n < 30)  return 'bg-emerald-500/[0.50]';
  return              'bg-emerald-500/[0.70]';
}

/* heat colours for upcoming-review days */
function reviewHeat(n: number): string {
  if (n === 0)  return '';
  if (n < 5)   return 'bg-indigo-500/[0.15]';
  if (n < 15)  return 'bg-indigo-500/[0.28]';
  if (n < 30)  return 'bg-indigo-500/[0.45]';
  return              'bg-indigo-500/[0.65]';
}

/* ─── CalendarView ────────────────────────────────────────────── */
export default function CalendarView() {
  const { user } = useAppStore();
  const vocabulary    = useMemo(() => user?.vocabulary    ?? [], [user]);
  const sentences     = useMemo(() => user?.sentences     ?? [], [user]);
  const studyHistory  = useMemo(() => user?.studyHistory  ?? [], [user]);

  const today = todayStr();
  const [viewDate, setViewDate]     = useState(() => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(today);
  const [filter, setFilter]           = useState<FilterType>('all');

  /* ── Lookup maps ── */
  const studyMap = useMemo(() => {
    const m: Record<string, { reviewed: number; correct: number }> = {};
    studyHistory.forEach(d => { m[d.date] = { reviewed: d.reviewed, correct: d.correct }; });
    return m;
  }, [studyHistory]);

  /* nextReview per date */
  const vocabNextMap = useMemo(() => {
    const m: Record<string, VocabularyWord[]> = {};
    vocabulary.forEach(w => {
      const d = w.nextReview.slice(0, 10);
      (m[d] ??= []).push(w);
    });
    return m;
  }, [vocabulary]);

  const sentNextMap = useMemo(() => {
    const m: Record<string, Sentence[]> = {};
    sentences.filter(s => s.status !== 'hold').forEach(s => {
      const d = s.nextReview.slice(0, 10);
      (m[d] ??= []).push(s);
    });
    return m;
  }, [sentences]);

  /* lastReview per date */
  const vocabLastMap = useMemo(() => {
    const m: Record<string, VocabularyWord[]> = {};
    vocabulary.forEach(w => {
      if (!w.lastReview) return;
      const d = w.lastReview.slice(0, 10);
      (m[d] ??= []).push(w);
    });
    return m;
  }, [vocabulary]);

  const sentLastMap = useMemo(() => {
    const m: Record<string, Sentence[]> = {};
    sentences.forEach(s => {
      if (!s.lastReview) return;
      const d = s.lastReview.slice(0, 10);
      (m[d] ??= []).push(s);
    });
    return m;
  }, [sentences]);

  /* ── Calendar grid ── */
  const { year, month } = viewDate;
  const startOffset  = new Date(year, month, 1).getDay();
  const daysInMonth  = new Date(year, month + 1, 0).getDate();

  const cells = useMemo<(string | null)[]>(() => {
    const arr: (string | null)[] = Array(startOffset).fill(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(toIso(year, month, d));
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [year, month, startOffset, daysInMonth]);

  /* ── Month summary stats ── */
  const monthStats = useMemo(() => {
    let studyDays = 0, totalReviewed = 0, upcomingTotal = 0;
    cells.forEach(date => {
      if (!date) return;
      const rec = studyMap[date];
      if (rec?.reviewed > 0) { studyDays++; totalReviewed += rec.reviewed; }
      if (date > today) {
        const v = filter !== 'sentences' ? (vocabNextMap[date]?.length ?? 0) : 0;
        const s = filter !== 'vocab'     ? (sentNextMap[date]?.length  ?? 0) : 0;
        upcomingTotal += v + s;
      }
    });
    return { studyDays, totalReviewed, upcomingTotal };
  }, [cells, studyMap, vocabNextMap, sentNextMap, today, filter]);

  /* ── Nav ── */
  const prevMonth = () => setViewDate(({ year, month }) =>
    month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 });
  const nextMonth = () => setViewDate(({ year, month }) =>
    month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 });
  const goToday = () => {
    const d = new Date();
    setViewDate({ year: d.getFullYear(), month: d.getMonth() });
    setSelectedDay(today);
  };

  /* ── Selected day detail ── */
  const detail = useMemo(() => {
    if (!selectedDay) return null;
    const isToday  = selectedDay === today;
    const isPast   = selectedDay < today;
    const isFuture = selectedDay > today;
    return {
      isToday, isPast, isFuture,
      study:        studyMap[selectedDay],
      vocabDue:     filter !== 'sentences' ? (vocabNextMap[selectedDay] ?? []) : [],
      sentDue:      filter !== 'vocab'     ? (sentNextMap[selectedDay]  ?? []) : [],
      vocabDone:    filter !== 'sentences' ? (vocabLastMap[selectedDay] ?? []) : [],
      sentDone:     filter !== 'vocab'     ? (sentLastMap[selectedDay]  ?? []) : [],
    };
  }, [selectedDay, today, studyMap, vocabNextMap, sentNextMap, vocabLastMap, sentLastMap, filter]);

  /* ── Next-28-days strip ── */
  const upcomingStrip = useMemo(() => {
    const strip: { date: string; vocab: number; sent: number }[] = [];
    for (let i = 1; i <= 28; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().slice(0, 10);
      strip.push({
        date: iso,
        vocab: filter !== 'sentences' ? (vocabNextMap[iso]?.length ?? 0) : 0,
        sent:  filter !== 'vocab'     ? (sentNextMap[iso]?.length  ?? 0) : 0,
      });
    }
    return strip;
  }, [vocabNextMap, sentNextMap, filter]);

  const maxStrip = Math.max(...upcomingStrip.map(d => d.vocab + d.sent), 1);

  /* ── Total upcoming ── */
  const totalDueToday = useMemo(() => {
    const v = filter !== 'sentences' ? (vocabNextMap[today]?.length ?? 0) : 0;
    const s = filter !== 'vocab'     ? (sentNextMap[today]?.length  ?? 0) : 0;
    return { v, s };
  }, [vocabNextMap, sentNextMap, today, filter]);

  /* ─────────────────────────────────────────────────────────── */
  return (
    <div className="space-y-4">

      {/* ── Card wrapper ── */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">

        {/* ── Header ── */}
        <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center">
                <Calendar size={14} className="text-indigo-400" />
              </div>
              <h3 className="text-sm font-bold text-zinc-200">학습 캘린더</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/15">
                SRS 복습 스케줄
              </span>
            </div>
            {/* Filter tabs */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-white/[0.04] border border-white/[0.06]">
              {(['all', 'vocab', 'sentences'] as FilterType[]).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                    filter === f
                      ? f === 'vocab' ? 'bg-indigo-500 text-white'
                        : f === 'sentences' ? 'bg-violet-500 text-white'
                        : 'bg-zinc-600 text-white'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}>
                  {f === 'all' ? '전체' : f === 'vocab' ? '단어' : '문장'}
                </button>
              ))}
            </div>
          </div>

          {/* Month summary stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-emerald-500/[0.06] border border-emerald-500/[0.12] px-3 py-2.5 text-center">
              <p className="text-lg font-black text-emerald-300 leading-none">{monthStats.studyDays}</p>
              <p className="text-[10px] text-zinc-500 mt-1">이번 달 학습일</p>
            </div>
            <div className="rounded-xl bg-indigo-500/[0.06] border border-indigo-500/[0.12] px-3 py-2.5 text-center">
              <p className="text-lg font-black text-indigo-300 leading-none">{monthStats.totalReviewed}</p>
              <p className="text-[10px] text-zinc-500 mt-1">이번 달 복습</p>
            </div>
            <div className="rounded-xl bg-violet-500/[0.06] border border-violet-500/[0.12] px-3 py-2.5 text-center">
              <p className="text-lg font-black text-violet-300 leading-none">{monthStats.upcomingTotal}</p>
              <p className="text-[10px] text-zinc-500 mt-1">예정된 복습</p>
            </div>
          </div>
        </div>

        {/* ── Calendar ── */}
        <div className="px-4 py-4">

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-200 transition-colors">
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-zinc-200">{year}년 {MONTH_NAMES[month]}</h4>
              <button onClick={goToday}
                className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 font-semibold hover:bg-orange-500/20 transition-colors">
                오늘
              </button>
            </div>
            <button onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-zinc-200 transition-colors">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 mb-1.5">
            {WEEKDAYS.map((d, i) => (
              <div key={d} className={`text-center text-[10px] font-bold py-1 ${i === 0 ? 'text-red-500/60' : i === 6 ? 'text-blue-500/60' : 'text-zinc-600'}`}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} />;

              const isToday   = date === today;
              const isPast    = date < today;
              const isFuture  = date > today;
              const isSelected = selectedDay === date;

              const studied   = studyMap[date]?.reviewed ?? 0;
              const vDue      = filter !== 'sentences' ? (vocabNextMap[date]?.length ?? 0) : 0;
              const sDue      = filter !== 'vocab'     ? (sentNextMap[date]?.length  ?? 0) : 0;
              const totalDue  = vDue + sDue;

              const dayNum = parseInt(date.slice(-2), 10);
              const dayOfWeek = new Date(date + 'T12:00:00').getDay();

              /* background heat */
              let bg = '';
              if (isPast && studied > 0)        bg = studyHeat(studied);
              else if (isFuture && totalDue > 0) bg = reviewHeat(totalDue);

              /* text colour */
              const numColor =
                isToday ? 'text-orange-400 font-black' :
                isPast && studied > 0 ? 'text-emerald-200 font-bold' :
                isFuture && totalDue > 0 ? 'text-indigo-200 font-bold' :
                dayOfWeek === 0 ? 'text-red-500/50' :
                dayOfWeek === 6 ? 'text-blue-400/50' :
                'text-zinc-600';

              return (
                <button
                  key={date}
                  onClick={() => setSelectedDay(isSelected ? null : date)}
                  className={[
                    'relative flex flex-col items-center pt-1 pb-1.5 rounded-xl min-h-[54px] transition-all duration-150 group',
                    bg || 'hover:bg-white/[0.04]',
                    isSelected ? 'ring-2 ring-indigo-400 ring-offset-1 ring-offset-zinc-950 scale-105 shadow-lg shadow-indigo-500/10' : '',
                    isToday    ? 'ring-2 ring-orange-400 ring-offset-1 ring-offset-zinc-950' : '',
                  ].join(' ')}
                >
                  {/* Day number */}
                  <span className={`text-[11px] leading-none mt-0.5 ${numColor}`}>{dayNum}</span>

                  {/* Indicators area */}
                  <div className="flex flex-col items-center gap-0.5 mt-1 w-full px-0.5">
                    {/* Past: reviewed count */}
                    {(isPast || isToday) && studied > 0 && (
                      <span className="text-[9px] font-black text-emerald-300 leading-none">{studied}</span>
                    )}
                    {/* Future / today: dot indicators */}
                    {(isFuture || isToday) && totalDue > 0 && (
                      <div className="flex justify-center gap-0.5">
                        {vDue > 0 && <div className="w-1 h-1 rounded-full bg-indigo-400 flex-shrink-0" />}
                        {sDue > 0 && <div className="w-1 h-1 rounded-full bg-violet-400 flex-shrink-0" />}
                      </div>
                    )}
                    {/* Future: total count */}
                    {isFuture && totalDue > 0 && (
                      <span className="text-[9px] font-bold text-indigo-300 leading-none">{totalDue}</span>
                    )}
                    {/* Today: due count */}
                    {isToday && totalDue > 0 && (
                      <span className="text-[9px] font-bold text-orange-300 leading-none">{totalDue}</span>
                    )}
                  </div>

                  {/* Hover tooltip */}
                  {!isSelected && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-lg bg-zinc-800 border border-white/[0.08] text-[9px] text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-xl">
                      {isToday ? '오늘' : isPast ? (studied > 0 ? `${studied}회 복습` : '학습 없음') : (totalDue > 0 ? `${totalDue}개 예정` : '복습 없음')}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-emerald-500/40" />
              <span className="text-[10px] text-zinc-600">학습 완료</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm bg-indigo-500/35" />
              <span className="text-[10px] text-zinc-600">복습 예정</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <span className="text-[10px] text-zinc-600">단어</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
              <span className="text-[10px] text-zinc-600">문장</span>
            </div>
            <div className="flex items-center gap-1.5 ml-auto">
              <div className="w-3 h-3 rounded-sm border border-orange-400/50" />
              <span className="text-[10px] text-zinc-600">오늘</span>
            </div>
          </div>
        </div>

        {/* ── Selected day detail panel ── */}
        {selectedDay && detail && (
          <div className="border-t border-white/[0.06] px-5 py-4">

            {/* Panel header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {detail.isToday && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 font-bold border border-orange-500/20">오늘</span>
                )}
                {detail.isPast && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/15">과거</span>
                )}
                {detail.isFuture && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-bold border border-indigo-500/15">예정</span>
                )}
                <h4 className="text-sm font-semibold text-zinc-200">{formatKo(selectedDay)}</h4>
              </div>
              <button onClick={() => setSelectedDay(null)}
                className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.05] transition-colors">
                <X size={14} />
              </button>
            </div>

            {/* ── Past / Today: study summary ── */}
            {(detail.isPast || detail.isToday) && (
              <div className="mb-4">
                {detail.study ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/15">
                      <Check size={12} className="text-emerald-400" />
                      <span className="text-xs text-emerald-300 font-bold">{detail.study.reviewed}회 복습</span>
                    </div>
                    {detail.study.reviewed > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                        <TrendingUp size={12} className="text-indigo-400" />
                        <span className="text-xs text-zinc-300">
                          정확도 <span className="font-bold text-indigo-300">
                            {Math.round((detail.study.correct / detail.study.reviewed) * 100)}%
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-zinc-600 italic flex items-center gap-1.5">
                    <Clock size={12} /> 이 날은 학습 기록이 없어요
                  </p>
                )}
              </div>
            )}

            {/* ── Past / Today: reviewed items ── */}
            {(detail.isPast || detail.isToday) && (detail.vocabDone.length > 0 || detail.sentDone.length > 0) && (
              <div className="space-y-3 mb-4">
                {detail.vocabDone.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <BookOpen size={10} className="text-indigo-400" />
                      복습한 단어 ({detail.vocabDone.length}개)
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {detail.vocabDone.slice(0, 12).map(w => (
                        <span key={w.id}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-xs"
                          title={w.meaningKo}>
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${LEVEL_CFG[w.level]?.dot ?? 'bg-zinc-500'}`} />
                          <span className="text-zinc-300">{w.word}</span>
                        </span>
                      ))}
                      {detail.vocabDone.length > 12 && (
                        <span className="text-[10px] text-zinc-600 self-center">+{detail.vocabDone.length - 12}개</span>
                      )}
                    </div>
                  </div>
                )}
                {detail.sentDone.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                      <FileText size={10} className="text-violet-400" />
                      복습한 문장 ({detail.sentDone.length}개)
                    </p>
                    <div className="space-y-1">
                      {detail.sentDone.slice(0, 4).map(s => (
                        <p key={s.id} className="text-xs text-zinc-400 truncate pl-1 border-l border-violet-500/20">{s.text}</p>
                      ))}
                      {detail.sentDone.length > 4 && (
                        <p className="text-[10px] text-zinc-600 pl-1">+{detail.sentDone.length - 4}개 더</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Today: upcoming due ── */}
            {detail.isToday && (detail.vocabDue.length > 0 || detail.sentDue.length > 0) && (
              <div className="pt-3 border-t border-white/[0.06]">
                <p className="text-[10px] font-bold text-orange-400/80 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Clock size={10} /> 오늘 복습 대기 중
                </p>
                <div className="flex gap-2 flex-wrap">
                  {detail.vocabDue.length > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/15">
                      <BookOpen size={11} className="text-indigo-400" />
                      <span className="text-xs text-indigo-300 font-bold">단어 {detail.vocabDue.length}개</span>
                    </div>
                  )}
                  {detail.sentDue.length > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/15">
                      <FileText size={11} className="text-violet-400" />
                      <span className="text-xs text-violet-300 font-bold">문장 {detail.sentDue.length}개</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Future: upcoming reviews ── */}
            {detail.isFuture && (
              <>
                {detail.vocabDue.length === 0 && detail.sentDue.length === 0 ? (
                  <p className="text-xs text-zinc-600 italic flex items-center gap-1.5">
                    <Calendar size={12} /> 예정된 복습이 없어요
                  </p>
                ) : (
                  <div className="space-y-3">
                    {detail.vocabDue.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-indigo-400/70 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <Brain size={10} />
                          단어 복습 예정 ({detail.vocabDue.length}개)
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {detail.vocabDue.slice(0, 12).map(w => (
                            <span key={w.id}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-500/[0.07] border border-indigo-500/15 text-xs"
                              title={w.meaningKo}>
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${LEVEL_CFG[w.level]?.dot ?? 'bg-zinc-500'}`} />
                              <span className={LEVEL_CFG[w.level]?.color ?? 'text-zinc-300'}>{w.word}</span>
                            </span>
                          ))}
                          {detail.vocabDue.length > 12 && (
                            <span className="text-[10px] text-zinc-600 self-center">+{detail.vocabDue.length - 12}개</span>
                          )}
                        </div>
                      </div>
                    )}
                    {detail.sentDue.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-violet-400/70 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                          <FileText size={10} />
                          문장 복습 예정 ({detail.sentDue.length}개)
                        </p>
                        <div className="space-y-1.5">
                          {detail.sentDue.slice(0, 4).map(s => (
                            <div key={s.id} className="flex items-start gap-2">
                              <span className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${LEVEL_CFG[s.level]?.dot ?? 'bg-zinc-500'}`} />
                              <p className="text-xs text-zinc-400 leading-relaxed line-clamp-1">{s.text}</p>
                            </div>
                          ))}
                          {detail.sentDue.length > 4 && (
                            <p className="text-[10px] text-zinc-600 pl-3.5">+{detail.sentDue.length - 4}개 더</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Upcoming 28 days bar chart ── */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-violet-500/15 flex items-center justify-center">
            <Layers size={14} className="text-violet-400" />
          </div>
          <h3 className="text-sm font-bold text-zinc-200">향후 28일 복습 예보</h3>
          <span className="text-[10px] text-zinc-500 ml-auto">SRS 스케줄 기반</span>
        </div>

        {/* Today due banner */}
        {(totalDueToday.v > 0 || totalDueToday.s > 0) && (
          <div className="mb-4 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-orange-500/[0.08] border border-orange-500/15">
            <Clock size={14} className="text-orange-400 flex-shrink-0" />
            <p className="text-xs text-orange-300">
              오늘 복습 대기:
              {totalDueToday.v > 0 && <span className="font-bold ml-1.5">단어 {totalDueToday.v}개</span>}
              {totalDueToday.s > 0 && <span className="font-bold ml-1.5">문장 {totalDueToday.s}개</span>}
            </p>
          </div>
        )}

        {/* Bar chart */}
        <div className="flex items-end gap-[3px] h-20">
          {upcomingStrip.map(({ date, vocab, sent }) => {
            const total = vocab + sent;
            const vPct  = total > 0 ? (vocab / maxStrip) * 100 : 0;
            const sPct  = total > 0 ? (sent  / maxStrip) * 100 : 0;
            const isSelected = selectedDay === date;
            const dayN  = new Date(date + 'T12:00:00');
            const isWeekend = dayN.getDay() === 0 || dayN.getDay() === 6;
            return (
              <button
                key={date}
                onClick={() => { setSelectedDay(isSelected ? null : date); setViewDate({ year: dayN.getFullYear(), month: dayN.getMonth() }); }}
                title={`${dayN.getMonth()+1}/${dayN.getDate()} — 단어 ${vocab}개, 문장 ${sent}개`}
                className={`flex-1 relative flex flex-col-reverse rounded-sm overflow-hidden transition-all cursor-pointer group ${
                  isSelected ? 'ring-1 ring-indigo-400' : ''
                } ${isWeekend ? 'opacity-70' : ''}`}
                style={{ minHeight: '4px' }}
              >
                {/* Background track */}
                <div className="absolute inset-0 bg-white/[0.03]" />
                {/* Vocab bar (indigo) */}
                {vPct > 0 && (
                  <div
                    className="relative z-10 w-full bg-indigo-500/60 group-hover:bg-indigo-400/80 transition-colors"
                    style={{ height: `${vPct}%` }}
                  />
                )}
                {/* Sent bar (violet, stacked on top) */}
                {sPct > 0 && (
                  <div
                    className="relative z-10 w-full bg-violet-500/60 group-hover:bg-violet-400/80 transition-colors"
                    style={{ height: `${sPct}%` }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* X-axis labels: show week marks */}
        <div className="flex mt-1.5">
          {[0, 7, 14, 21, 27].map(offset => {
            const d = new Date();
            d.setDate(d.getDate() + offset + 1);
            return (
              <div key={offset} className="text-[9px] text-zinc-600" style={{ width: `${(offset === 27 ? 1 : 7) / 28 * 100}%` }}>
                {offset === 0 ? '내일' : `${d.getMonth()+1}/${d.getDate()}`}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 mt-2">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-indigo-500/60" />
            <span className="text-[10px] text-zinc-600">단어 복습</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm bg-violet-500/60" />
            <span className="text-[10px] text-zinc-600">문장 복습</span>
          </div>
          <span className="text-[10px] text-zinc-700 ml-auto">
            클릭하면 해당 날짜 상세 보기
          </span>
        </div>
      </div>

      {/* ── SRS 망각 곡선 설명 카드 ── */}
      <div className="rounded-2xl bg-gradient-to-br from-indigo-500/[0.05] to-violet-500/[0.04] border border-indigo-500/[0.12] p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center">
            <Brain size={14} className="text-indigo-400" />
          </div>
          <h3 className="text-sm font-bold text-zinc-200">망각 곡선 & SRS 원리</h3>
        </div>

        {/* Mini forgetting curve illustration */}
        <div className="mb-4">
          <div className="relative h-16 flex items-end gap-0 overflow-hidden rounded-xl bg-white/[0.02] px-4 pb-2 pt-3">
            {/* Forgetting curve bars (illustrative) */}
            {[
              { label: '학습',  pct: 100, color: 'bg-emerald-400' },
              { label: '20분',  pct: 58,  color: 'bg-yellow-400'  },
              { label: '1시간', pct: 44,  color: 'bg-orange-400'  },
              { label: '1일',   pct: 33,  color: 'bg-red-400'     },
              { label: '복습↑', pct: 90,  color: 'bg-indigo-400'  },
              { label: '7일',   pct: 65,  color: 'bg-indigo-400'  },
              { label: '복습↑', pct: 95,  color: 'bg-violet-400'  },
              { label: '30일',  pct: 80,  color: 'bg-violet-400'  },
            ].map((b, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                <div className="w-full flex items-end justify-center" style={{ height: '36px' }}>
                  <div className={`w-2/3 rounded-t-sm ${b.color} opacity-80`} style={{ height: `${b.pct}%` }} />
                </div>
                <span className="text-[7px] text-zinc-600 leading-none text-center">{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2 text-xs text-zinc-400">
          <p>
            <span className="text-emerald-400 font-bold">에빙하우스 망각 곡선</span>에 따르면 학습 직후부터 기억이 급격히 감소해요 —
            1시간 후 44%, 하루 뒤 33%만 남아요.
          </p>
          <p>
            이 앱은 <span className="text-indigo-400 font-bold">SM-2 알고리즘</span>으로 복습을 스케줄링해요.
            기억이 완전히 사라지기 직전에 복습 알림을 보내 <span className="text-violet-300 font-semibold">장기 기억으로 전환</span>시켜요.
          </p>
          <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-white/[0.05]">
            {[
              { label: 'Again',  days: '1일',  color: 'text-red-400',     bg: 'bg-red-500/10'     },
              { label: 'Hard',   days: '4일',  color: 'text-orange-400',  bg: 'bg-orange-500/10'  },
              { label: 'Good',   days: '7일',  color: 'text-blue-400',    bg: 'bg-blue-500/10'    },
              { label: 'Easy',   days: '14일+', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            ].map(b => (
              <div key={b.label} className={`rounded-xl px-2 py-2 ${b.bg} text-center`}>
                <p className={`text-[10px] font-bold ${b.color}`}>{b.label}</p>
                <p className="text-[9px] text-zinc-500 mt-0.5">{b.days} 후</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
