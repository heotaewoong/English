'use client';

import { useState, useMemo } from 'react';
import {
  Flame, Target, BookOpen, Brain, Trophy, CheckCircle2,
  AlertCircle, Edit2, Check, X, Zap, TrendingUp, BarChart2,
  Gamepad2,
} from 'lucide-react';
import { useAppStore, DailyGoal } from '@/lib/store';
import CalendarView from './CalendarView';

/* ─── helpers ─────────────────────────────────────────────── */

function getPast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function dayLabel(iso: string): string {
  const d = new Date(iso + 'T12:00:00');
  return DAY_LABELS[d.getDay()];
}

function isToday(iso: string): boolean {
  return iso === new Date().toISOString().slice(0, 10);
}

/* ─── Dashboard ───────────────────────────────────────────── */

export default function Dashboard({ onGoStudy }: { onGoStudy: () => void }) {
  const { user, setDailyGoal } = useAppStore();

  const vocabulary    = user?.vocabulary    || [];
  const sentences     = user?.sentences     || [];
  const studyHistory  = user?.studyHistory  || [];
  const mistakes      = user?.mistakes      || [];
  const streak        = user?.streak        || 0;
  const xp            = user?.xp            || 0;
  const dailyGoal     = user?.dailyGoal     || { vocabTarget: 10, sentenceTarget: 5 };

  const [editGoal, setEditGoal]           = useState(false);
  const [goalVocab, setGoalVocab]         = useState(String(dailyGoal.vocabTarget));
  const [goalSent,  setGoalSent]          = useState(String(dailyGoal.sentenceTarget));

  /* ── stats ── */
  const today = new Date().toISOString().slice(0, 10);
  const todayRecord = studyHistory.find((d) => d.date === today);
  const todayReviewed = todayRecord?.reviewed ?? 0;
  const todayCorrect  = todayRecord?.correct  ?? 0;
  const todayAcc = todayReviewed > 0 ? Math.round((todayCorrect / todayReviewed) * 100) : 0;

  const vocabStats = useMemo(() => ({
    total:    vocabulary.length,
    mastered: vocabulary.filter((w) => w.level >= 4).length,
    learning: vocabulary.filter((w) => w.level >= 1 && w.level < 4).length,
    dueToday: vocabulary.filter((w) => new Date(w.nextReview) <= new Date()).length,
  }), [vocabulary]);

  const sentStats = useMemo(() => ({
    total:    sentences.length,
    known:    sentences.filter((s) => s.status === 'known').length,
    dueToday: sentences.filter((s) => s.status !== 'hold' && new Date(s.nextReview) <= new Date()).length,
  }), [sentences]);

  /* ── weekly chart data ── */
  const past7 = getPast7Days();
  const chartData = past7.map((date) => {
    const rec = studyHistory.find((d) => d.date === date);
    return { date, reviewed: rec?.reviewed ?? 0, correct: rec?.correct ?? 0 };
  });
  const maxReviewed = Math.max(...chartData.map((d) => d.reviewed), 1);

  /* ── weakness: lowest SRS vocab due for review ── */
  const weakVocab = useMemo(
    () =>
      vocabulary
        .filter((w) => new Date(w.nextReview) <= new Date())
        .sort((a, b) => a.level - b.level)
        .slice(0, 5),
    [vocabulary],
  );

  const weakSent = useMemo(
    () =>
      sentences
        .filter((s) => s.status !== 'hold' && new Date(s.nextReview) <= new Date())
        .sort((a, b) => a.level - b.level)
        .slice(0, 3),
    [sentences],
  );

  /* ── save goal ── */
  const saveGoal = () => {
    const vt = Math.max(1, parseInt(goalVocab, 10) || dailyGoal.vocabTarget);
    const st = Math.max(1, parseInt(goalSent,  10) || dailyGoal.sentenceTarget);
    const newGoal: DailyGoal = { vocabTarget: vt, sentenceTarget: st };
    setDailyGoal(newGoal);
    setEditGoal(false);
  };

  /* ── goal progress ── */
  const vocabPct = Math.min(100, (todayReviewed / dailyGoal.vocabTarget) * 100);

  /* ── total study days ── */
  const totalStudyDays = studyHistory.filter((d) => d.reviewed > 0).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
            <BarChart2 className="text-violet-400" size={22} /> 학습 대시보드
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">나의 학습 현황을 한눈에</p>
        </div>
        <button
          onClick={onGoStudy}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:opacity-90 transition-opacity"
        >
          <Gamepad2 size={16} /> 학습 시작
        </button>
      </div>

      {/* Hero stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            icon: Flame,
            label: '연속 학습',
            value: `${streak}일`,
            color: 'text-orange-400',
            bg: 'bg-orange-500/10',
            hl: streak >= 3,
          },
          {
            icon: Zap,
            label: 'XP',
            value: xp.toLocaleString(),
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
          },
          {
            icon: TrendingUp,
            label: '오늘 복습',
            value: `${todayReviewed}회`,
            color: 'text-indigo-400',
            bg: 'bg-indigo-500/10',
            hl: todayReviewed > 0,
          },
          {
            icon: Target,
            label: '오늘 정확도',
            value: `${todayAcc}%`,
            color: todayAcc >= 70 ? 'text-emerald-400' : 'text-zinc-400',
            bg: todayAcc >= 70 ? 'bg-emerald-500/10' : 'bg-zinc-500/10',
          },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className={`rounded-2xl p-4 border ${
                (s as { hl?: boolean }).hl
                  ? 'bg-gradient-to-br from-orange-500/[0.07] to-amber-500/[0.04] border-orange-500/20'
                  : 'bg-white/[0.03] border-white/[0.06]'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon size={18} className={s.color} />
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Daily goal */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target size={16} className="text-indigo-400" />
            <h3 className="text-sm font-bold text-zinc-200">데일리 목표</h3>
          </div>
          {!editGoal ? (
            <button
              onClick={() => { setGoalVocab(String(dailyGoal.vocabTarget)); setGoalSent(String(dailyGoal.sentenceTarget)); setEditGoal(true); }}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <Edit2 size={12} /> 수정
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={saveGoal} className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"><Check size={12} /> 저장</button>
              <button onClick={() => setEditGoal(false)} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"><X size={12} /> 취소</button>
            </div>
          )}
        </div>

        {editGoal ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">복습 목표 (회)</label>
              <input
                type="number"
                value={goalVocab}
                onChange={(e) => setGoalVocab(e.target.value)}
                min={1} max={200}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-zinc-100 text-sm outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1.5">문장 목표 (개)</label>
              <input
                type="number"
                value={goalSent}
                onChange={(e) => setGoalSent(e.target.value)}
                min={1} max={100}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-zinc-100 text-sm outline-none focus:border-indigo-500/50 transition-colors"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Reviewed progress */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-zinc-400">복습 달성률</span>
                <span className={`font-bold ${todayReviewed >= dailyGoal.vocabTarget ? 'text-emerald-400' : 'text-zinc-300'}`}>
                  {todayReviewed} / {dailyGoal.vocabTarget}회
                </span>
              </div>
              <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    vocabPct >= 100 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-indigo-500 to-violet-500'
                  }`}
                  style={{ width: `${vocabPct}%` }}
                />
              </div>
            </div>
            {/* Sentence stats */}
            <div className="flex gap-4 text-xs text-zinc-500">
              <span>문장 목표: <span className="text-zinc-300 font-semibold">{dailyGoal.sentenceTarget}개</span></span>
              <span>오늘 복습: <span className="text-zinc-300 font-semibold">{sentStats.dueToday}개 대기 중</span></span>
            </div>
          </div>
        )}
      </div>

      {/* Weekly Activity Chart */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
        <div className="flex items-center gap-2 mb-5">
          <BarChart2 size={16} className="text-violet-400" />
          <h3 className="text-sm font-bold text-zinc-200">주간 학습 현황</h3>
        </div>
        <div className="flex items-end gap-2 h-28">
          {chartData.map(({ date, reviewed, correct }) => {
            const barH = reviewed > 0 ? Math.max(8, (reviewed / maxReviewed) * 100) : 0;
            const corrH = reviewed > 0 && correct > 0 ? Math.max(4, (correct / maxReviewed) * 100) : 0;
            const today = isToday(date);
            return (
              <div key={date} className="flex-1 flex flex-col items-center gap-1">
                {/* Bar */}
                <div className="relative w-full flex items-end justify-center" style={{ height: '80px' }}>
                  {reviewed > 0 ? (
                    <div
                      className="w-full rounded-t-lg relative overflow-hidden"
                      style={{ height: `${barH}%` }}
                    >
                      {/* Total bar */}
                      <div className={`absolute inset-0 ${today ? 'bg-indigo-500/30' : 'bg-white/[0.08]'}`} />
                      {/* Correct overlay */}
                      {corrH > 0 && (
                        <div
                          className={`absolute bottom-0 left-0 right-0 ${today ? 'bg-indigo-500' : 'bg-emerald-500/60'}`}
                          style={{ height: `${(corrH / barH) * 100}%` }}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-1 rounded bg-white/[0.04]" />
                  )}
                </div>
                {/* Day label */}
                <span className={`text-[10px] font-bold ${today ? 'text-indigo-400' : 'text-zinc-600'}`}>
                  {dayLabel(date)}
                </span>
                {/* Count */}
                {reviewed > 0 && (
                  <span className="text-[9px] text-zinc-700">{reviewed}</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3 text-[10px] text-zinc-600">
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-emerald-500/60 inline-block" /> 정답</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-2 rounded-sm bg-white/[0.08] inline-block" /> 복습 총</span>
          <span className="ml-auto">누적 {totalStudyDays}일 학습</span>
        </div>
      </div>

      {/* Vocab + Sentence overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Vocab */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={15} className="text-indigo-400" />
            <h3 className="text-sm font-bold text-zinc-200">단어장</h3>
            <span className="ml-auto text-xs text-zinc-500">{vocabStats.total}개</span>
          </div>
          {[
            { label: '마스터', value: vocabStats.mastered, color: 'bg-emerald-500', pct: vocabStats.total > 0 ? (vocabStats.mastered / vocabStats.total) * 100 : 0 },
            { label: '학습 중', value: vocabStats.learning, color: 'bg-blue-500', pct: vocabStats.total > 0 ? (vocabStats.learning / vocabStats.total) * 100 : 0 },
            { label: '오늘 복습 대기', value: vocabStats.dueToday, color: 'bg-orange-500', pct: vocabStats.total > 0 ? (vocabStats.dueToday / vocabStats.total) * 100 : 0 },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-zinc-500">{item.label}</span>
                <span className="text-zinc-400 font-semibold">{item.value}</span>
              </div>
              <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <div className={`h-full ${item.color}/60 rounded-full transition-all`} style={{ width: `${item.pct}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Sentences */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Brain size={15} className="text-violet-400" />
            <h3 className="text-sm font-bold text-zinc-200">문장 덱</h3>
            <span className="ml-auto text-xs text-zinc-500">{sentStats.total}개</span>
          </div>
          {[
            { label: '알아요', value: sentStats.known, color: 'bg-emerald-500', pct: sentStats.total > 0 ? (sentStats.known / sentStats.total) * 100 : 0 },
            { label: '오늘 복습 대기', value: sentStats.dueToday, color: 'bg-orange-500', pct: sentStats.total > 0 ? (sentStats.dueToday / sentStats.total) * 100 : 0 },
            { label: '오답 누적', value: mistakes.length, color: 'bg-red-500', pct: 0 },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-zinc-500">{item.label}</span>
                <span className="text-zinc-400 font-semibold">{item.value}</span>
              </div>
              <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                <div className={`h-full ${item.color}/60 rounded-full transition-all`} style={{ width: `${item.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Weakness Detection */}
      {(weakVocab.length > 0 || weakSent.length > 0) && (
        <div className="rounded-2xl bg-gradient-to-br from-orange-500/[0.06] to-red-500/[0.04] border border-orange-500/20 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-orange-400" />
            <h3 className="text-sm font-bold text-zinc-200">약점 감지 — 지금 복습 필요</h3>
          </div>

          {weakVocab.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">취약 단어</p>
              <div className="flex flex-wrap gap-2">
                {weakVocab.map((w) => (
                  <div
                    key={w.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-orange-500/15"
                  >
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-zinc-200">{w.word}</span>
                      <span className="text-[10px] text-zinc-500">{w.meaningKo}</span>
                    </div>
                    <span className="text-[9px] text-orange-400 font-bold ml-1">Lv.{w.level}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {weakSent.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">취약 문장</p>
              <div className="space-y-2">
                {weakSent.map((s) => (
                  <div key={s.id} className="px-3 py-2 rounded-xl bg-white/[0.04] border border-orange-500/15">
                    <p className="text-xs text-zinc-300 line-clamp-1">{s.text}</p>
                    <p className="text-[10px] text-zinc-600 mt-0.5">{s.translation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onGoStudy}
            className="w-full py-3 rounded-xl bg-orange-500/20 border border-orange-500/25 text-orange-300 text-sm font-bold hover:bg-orange-500/30 transition-colors"
          >
            지금 복습하러 가기 →
          </button>
        </div>
      )}

      {/* Achievement summary */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy size={16} className="text-yellow-400" />
          <h3 className="text-sm font-bold text-zinc-200">학습 성과</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
          {[
            { label: '전체 단어', value: vocabStats.total, icon: '📚' },
            { label: '마스터 단어', value: vocabStats.mastered, icon: '⭐' },
            { label: '전체 문장', value: sentStats.total, icon: '📝' },
            { label: '알아요 문장', value: sentStats.known, icon: '✅' },
            { label: '총 학습일', value: totalStudyDays, icon: '📅' },
            { label: '획득 XP', value: xp, icon: '🏆' },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3">
              <div className="text-xl mb-1">{item.icon}</div>
              <p className="text-lg font-black text-zinc-100">{item.value.toLocaleString()}</p>
              <p className="text-[10px] text-zinc-600 mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      {(user?.badges?.length ?? 0) > 0 && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={15} className="text-emerald-400" />
            <h3 className="text-sm font-bold text-zinc-200">획득 뱃지</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {(user?.badges || []).map((b) => (
              <div key={b.id} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <span>{b.icon}</span>
                <span className="text-xs text-yellow-300 font-semibold">{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SRS Learning Calendar ── */}
      <CalendarView />

    </div>
  );
}
