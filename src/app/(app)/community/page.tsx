'use client';

import { useState } from 'react';
import {
  Shield,
  Trophy,
  Users,
  TrendingUp,
  TrendingDown,
  Minus,
  Clock,
  MessageCircle,
  Flame,
  Target,
  ChevronRight,
  Crown,
  Medal,
  ArrowUpCircle,
  ArrowDownCircle,
  Zap,
  Star,
  Hash,
  Globe,
  Bell,
  CheckCircle2,
  BookOpen,
  Mic,
  Headphones,
  Plus,
  Sparkles,
  Info,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const leagueTiers = [
  { name: 'Bronze', gradient: 'from-amber-700 to-amber-900', shadow: 'shadow-amber-700/20', ring: 'ring-amber-600/40', label: 'text-amber-600' },
  { name: 'Silver', gradient: 'from-slate-300 to-slate-500', shadow: 'shadow-slate-400/20', ring: 'ring-slate-400/40', label: 'text-slate-400' },
  { name: 'Gold',   gradient: 'from-yellow-400 to-amber-500', shadow: 'shadow-yellow-500/25', ring: 'ring-yellow-400/40', label: 'text-yellow-400' },
  { name: 'Diamond', gradient: 'from-cyan-300 to-blue-500', shadow: 'shadow-cyan-400/25', ring: 'ring-cyan-400/40', label: 'text-cyan-400' },
];
const CURRENT_TIER = 2; // Gold

interface LeaderboardEntry {
  rank: number;
  name: string;
  initials: string;
  avatarGradient: string;
  xp: number;
  streak: number;
  trend: 'up' | 'down' | 'same';
  isCurrentUser?: boolean;
}

const leaderboard: LeaderboardEntry[] = [
  { rank: 1,  name: '김서준',         initials: 'KS', avatarGradient: 'from-red-400 to-pink-500',     xp: 3850, streak: 21, trend: 'up' },
  { rank: 2,  name: '이하은',         initials: 'LH', avatarGradient: 'from-emerald-400 to-teal-500', xp: 3620, streak: 14, trend: 'up' },
  { rank: 3,  name: '박지민',         initials: 'PJ', avatarGradient: 'from-blue-400 to-cyan-500',    xp: 3410, streak: 9,  trend: 'same' },
  { rank: 4,  name: 'You',            initials: 'ME', avatarGradient: 'from-indigo-400 to-violet-500',xp: 3180, streak: 12, trend: 'up', isCurrentUser: true },
  { rank: 5,  name: '최수빈',         initials: 'CS', avatarGradient: 'from-orange-400 to-amber-500', xp: 2950, streak: 6,  trend: 'down' },
  { rank: 6,  name: '정예린',         initials: 'JY', avatarGradient: 'from-pink-400 to-rose-500',    xp: 2740, streak: 8,  trend: 'up' },
  { rank: 7,  name: '한도윤',         initials: 'HD', avatarGradient: 'from-violet-400 to-purple-500',xp: 2580, streak: 4,  trend: 'same' },
  { rank: 8,  name: '윤서아',         initials: 'YS', avatarGradient: 'from-teal-400 to-green-500',   xp: 2410, streak: 7,  trend: 'down' },
  { rank: 9,  name: '송민재',         initials: 'SM', avatarGradient: 'from-sky-400 to-blue-500',     xp: 2250, streak: 3,  trend: 'up' },
  { rank: 10, name: '강유나',         initials: 'KY', avatarGradient: 'from-fuchsia-400 to-pink-500', xp: 2100, streak: 5,  trend: 'same' },
  { rank: 11, name: '임준호',         initials: 'LJ', avatarGradient: 'from-lime-400 to-green-500',   xp: 1920, streak: 2,  trend: 'down' },
  { rank: 12, name: '오서영',         initials: 'OS', avatarGradient: 'from-amber-400 to-yellow-500', xp: 1750, streak: 4,  trend: 'up' },
  { rank: 13, name: '배현우',         initials: 'BH', avatarGradient: 'from-rose-400 to-red-500',     xp: 1580, streak: 1,  trend: 'down' },
  { rank: 14, name: '신지우',         initials: 'SJ', avatarGradient: 'from-cyan-400 to-teal-500',    xp: 1390, streak: 0,  trend: 'down' },
  { rank: 15, name: '류다은',         initials: 'RD', avatarGradient: 'from-slate-400 to-gray-500',   xp: 1210, streak: 0,  trend: 'down' },
];

interface StudyGroup {
  name: string;
  description: string;
  members: number;
  activity: 'Very Active' | 'Active' | 'Moderate';
  emoji: string;
  gradient: string;
  tags: string[];
  joined?: boolean;
}

const studyGroups: StudyGroup[] = [
  { name: 'OPIc IH 목표',    description: 'OPIc IH 이상을 목표로 함께 연습해요',       members: 24, activity: 'Very Active', emoji: '🎯', gradient: 'from-indigo-500 to-violet-600',  tags: ['OPIc', 'Speaking', 'IH'], joined: true },
  { name: 'Morning English', description: 'Kickstart your day with 15-min English',       members: 18, activity: 'Active',      emoji: '🌅', gradient: 'from-amber-500 to-orange-600',  tags: ['Morning', 'Daily'] },
  { name: '영어 프리토킹',    description: '주제 없이 자유롭게 영어로 수다 떨기',         members: 31, activity: 'Very Active', emoji: '💬', gradient: 'from-emerald-500 to-teal-600',   tags: ['Free Talk', 'Casual'] },
  { name: 'TOEIC Speaking',  description: 'Prepare for TOEIC Speaking exam together',     members: 15, activity: 'Moderate',   emoji: '📝', gradient: 'from-blue-500 to-cyan-600',      tags: ['TOEIC', 'Exam Prep'] },
  { name: 'Business English',description: 'Master workplace communication & presentations',members: 22, activity: 'Active',    emoji: '💼', gradient: 'from-slate-500 to-zinc-600',     tags: ['Business', 'Presentation'] },
  { name: '발음 교정 클럽',   description: '미국식 발음을 함께 교정하고 연습해요',         members: 12, activity: 'Active',     emoji: '🎙️', gradient: 'from-pink-500 to-rose-600',    tags: ['Pronunciation', 'Accent'] },
];

interface Activity {
  name: string;
  initials: string;
  gradient: string;
  text: string;
  time: string;
  icon: string;
  type: 'streak' | 'level' | 'vocab' | 'opic' | 'badge';
}

const activities: Activity[] = [
  { name: '김민수', initials: 'KM', gradient: 'from-blue-400 to-indigo-500',    text: 'OPIc Mock Test에서 IH 달성!',          time: '2시간 전', icon: '✅', type: 'opic' },
  { name: '이서연', initials: 'LS', gradient: 'from-pink-400 to-rose-500',      text: '30일 연속 학습 스트릭 달성 🔥',          time: '3시간 전', icon: '🔥', type: 'streak' },
  { name: '박준영', initials: 'PJ', gradient: 'from-cyan-400 to-blue-500',      text: 'Diamond League 진입!',                  time: '5시간 전', icon: '💎', type: 'level' },
  { name: '최유진', initials: 'CY', gradient: 'from-emerald-400 to-green-500',  text: '단어장 100개 마스터 완료 📚',             time: '6시간 전', icon: '📚', type: 'vocab' },
  { name: '정다빈', initials: 'JD', gradient: 'from-violet-400 to-purple-500',  text: '"Week Warrior" 배지 획득!',              time: '8시간 전', icon: '🏅', type: 'badge' },
  { name: '한승우', initials: 'HS', gradient: 'from-amber-400 to-orange-500',   text: 'AI Free Talk 50회 세션 달성',            time: '어제',     icon: '🗣️', type: 'opic' },
];

interface Challenge {
  title: string;
  desc: string;
  progress: number;
  participants: number;
  daysLeft: number;
  reward: string;
  icon: React.ElementType;
  gradient: string;
}

const challenges: Challenge[] = [
  { title: '7-Day Speaking Challenge', desc: '7일 연속 스피킹 연습하기',        progress: 57, participants: 142, daysLeft: 4, reward: '500 XP + 배지',  icon: MessageCircle, gradient: 'from-indigo-500 to-violet-500' },
  { title: 'OPIc Marathon',           desc: '이번 주 모의고사 5회 완료',        progress: 40, participants: 89,  daysLeft: 3, reward: '300 XP + 배지',  icon: Target,        gradient: 'from-blue-500 to-cyan-500' },
  { title: 'Vocab 100 Sprint',        desc: '이번 달 단어 100개 학습',          progress: 72, participants: 204, daysLeft: 11, reward: '400 XP',         icon: BookOpen,      gradient: 'from-emerald-500 to-teal-500' },
  { title: 'Shadowing Week',          desc: '쉐도잉 7일 연속 완료',             progress: 28, participants: 67,  daysLeft: 5, reward: '250 XP + 배지',  icon: Headphones,    gradient: 'from-pink-500 to-rose-500' },
];

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-lg shadow-yellow-400/30">
        <Crown className="h-4 w-4 text-white" />
      </div>
    );
  if (rank === 2)
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-300 to-slate-400 shadow-md shadow-slate-400/20">
        <Medal className="h-4 w-4 text-white" />
      </div>
    );
  if (rank === 3)
    return (
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-amber-800 shadow-md shadow-amber-700/20">
        <Medal className="h-4 w-4 text-white" />
      </div>
    );
  return (
    <span className="flex h-8 w-8 items-center justify-center text-sm font-semibold text-zinc-500">
      #{rank}
    </span>
  );
}

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'same' }) {
  if (trend === 'up') return <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />;
  if (trend === 'down') return <TrendingDown className="h-3.5 w-3.5 text-red-400" />;
  return <Minus className="h-3.5 w-3.5 text-zinc-500" />;
}

function ActivityBadge({ type }: { type: Activity['type'] }) {
  const config = {
    streak: { label: 'Streak', cls: 'bg-orange-500/15 text-orange-400' },
    level:  { label: 'Level Up', cls: 'bg-cyan-500/15 text-cyan-400' },
    vocab:  { label: 'Vocab', cls: 'bg-emerald-500/15 text-emerald-400' },
    opic:   { label: 'OPIc', cls: 'bg-indigo-500/15 text-indigo-400' },
    badge:  { label: 'Badge', cls: 'bg-amber-500/15 text-amber-400' },
  }[type];
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${config.cls}`}>
      {config.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Main                                                               */
/* ------------------------------------------------------------------ */

type Tab = 'league' | 'groups' | 'activity' | 'challenges';

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<Tab>('league');
  const [joinedGroups, setJoinedGroups] = useState<Set<string>>(
    new Set(studyGroups.filter((g) => g.joined).map((g) => g.name))
  );

  const toggleJoin = (name: string) => {
    setJoinedGroups((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'league',     label: 'League',     icon: Shield },
    { id: 'groups',     label: 'Groups',     icon: Users },
    { id: 'activity',   label: 'Activity',   icon: Zap },
    { id: 'challenges', label: 'Challenges', icon: Trophy },
  ];

  return (
    <div className="space-y-6 animate-fade-in pb-10">

      {/* ── Preview notice ── */}
      <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <Info size={15} className="text-blue-400 shrink-0" />
        <p className="text-xs text-blue-300">
          커뮤니티 기능은 <span className="font-semibold">준비 중</span>입니다. 현재 표시되는 데이터는 샘플이며 실제 유저 정보가 아닙니다.
        </p>
      </div>

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 px-6 py-8">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-purple-400/10 blur-3xl" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 shadow-xl">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Community</h1>
              <p className="text-sm text-indigo-200 mt-0.5">함께 성장하는 영어 학습 커뮤니티</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-3 flex-wrap">
            {[
              { label: 'Members', value: '2.4K', icon: Users },
              { label: 'Active Now', value: '142', icon: Globe },
              { label: 'Groups', value: '48', icon: Hash },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-sm px-3 py-2 border border-white/15">
                <Icon className="h-3.5 w-3.5 text-indigo-200" />
                <div>
                  <p className="text-[11px] font-bold text-white leading-none">{value}</p>
                  <p className="text-[10px] text-indigo-300 leading-none mt-0.5">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === id
                ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/20 text-indigo-300 border border-indigo-500/20'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
            }`}
          >
            <Icon size={15} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════ */}
      {/* TAB: LEAGUE                                   */}
      {/* ══════════════════════════════════════════════ */}
      {activeTab === 'league' && (
        <div className="space-y-6">
          {/* League status card */}
          <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Gold shield */}
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-500 shadow-xl shadow-yellow-500/30">
                  <Shield className="h-8 w-8 text-white drop-shadow" />
                  <div className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 border border-yellow-400/30 text-[10px] font-bold text-yellow-400">
                    3
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-100">Gold League</h2>
                  <p className="text-sm text-zinc-500 mt-0.5">Week 12 • Top 15 advance</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-sm text-zinc-400">
                <Clock size={14} />
                <span>3일 후 마감</span>
              </div>
            </div>

            {/* Tier progress */}
            <div className="mt-6 flex items-center justify-center gap-3 sm:gap-6">
              {leagueTiers.map((tier, i) => (
                <div key={tier.name} className="flex flex-col items-center gap-2">
                  <div
                    className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-xl bg-gradient-to-br ${tier.gradient} shadow-md ${tier.shadow} transition-all ${
                      i === CURRENT_TIER ? `scale-110 ring-2 ring-offset-2 ring-offset-zinc-900 ${tier.ring}` : 'opacity-35'
                    }`}
                  >
                    <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <span className={`text-[11px] font-semibold ${i === CURRENT_TIER ? tier.label : 'text-zinc-600'}`}>
                    {tier.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="font-semibold text-zinc-200 flex items-center gap-2">
                <Trophy size={16} className="text-yellow-400" />
                Weekly Leaderboard
              </h3>
              <span className="text-xs text-zinc-500">XP 기준 정렬</span>
            </div>

            <div className="divide-y divide-white/[0.04]">
              {leaderboard.map((entry) => {
                const isTop3 = entry.rank <= 3;
                const promoted = entry.rank <= 5;
                const relegated = entry.rank >= 13;
                return (
                  <div
                    key={entry.rank}
                    className={`flex items-center gap-3 px-5 py-3.5 transition-colors ${
                      entry.isCurrentUser
                        ? 'bg-indigo-500/10 border-l-2 border-indigo-500'
                        : isTop3
                        ? 'bg-yellow-500/[0.04]'
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    {/* Rank */}
                    <RankBadge rank={entry.rank} />

                    {/* Avatar */}
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${entry.avatarGradient} text-xs font-bold text-white shadow-sm`}>
                      {entry.initials}
                    </div>

                    {/* Name + streak */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium truncate ${entry.isCurrentUser ? 'text-indigo-300' : isTop3 ? 'text-zinc-100' : 'text-zinc-300'}`}>
                          {entry.name}
                          {entry.isCurrentUser && (
                            <span className="ml-1.5 text-[10px] font-bold text-indigo-400">(You)</span>
                          )}
                        </span>
                        {entry.streak > 0 && (
                          <span className="hidden sm:flex items-center gap-0.5 text-[10px] text-orange-400">
                            <Flame size={10} />
                            {entry.streak}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Trend */}
                    <TrendIcon trend={entry.trend} />

                    {/* XP */}
                    <span className={`text-sm font-bold tabular-nums w-16 text-right ${isTop3 ? 'text-yellow-400' : entry.isCurrentUser ? 'text-indigo-400' : 'text-zinc-400'}`}>
                      {entry.xp.toLocaleString()}
                      <span className="text-[10px] font-normal text-zinc-600 ml-0.5">XP</span>
                    </span>

                    {/* Status */}
                    <div className="hidden sm:flex w-16 justify-end">
                      {promoted && (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                          <ArrowUpCircle size={10} /> UP
                        </span>
                      )}
                      {relegated && (
                        <span className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-400 border border-red-500/20">
                          <ArrowDownCircle size={10} /> DOWN
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* TAB: GROUPS                                   */}
      {/* ══════════════════════════════════════════════ */}
      {activeTab === 'groups' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-200">Study Groups</h2>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/15 text-indigo-400 text-sm font-medium border border-indigo-500/20 hover:bg-indigo-500/25 transition-colors">
              <Plus size={14} />
              Create
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {studyGroups.map((g) => {
              const joined = joinedGroups.has(g.name);
              const activityConfig = {
                'Very Active': { cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', dot: 'bg-emerald-400' },
                'Active':      { cls: 'bg-blue-500/15 text-blue-400 border-blue-500/20',          dot: 'bg-blue-400' },
                'Moderate':    { cls: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',          dot: 'bg-zinc-400' },
              }[g.activity];

              return (
                <div
                  key={g.name}
                  className="rounded-2xl bg-white/[0.04] border border-white/[0.06] overflow-hidden hover-lift transition-all"
                >
                  {/* Gradient top strip */}
                  <div className={`h-1.5 bg-gradient-to-r ${g.gradient}`} />

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{g.emoji}</span>
                        <div>
                          <h3 className="font-semibold text-zinc-200 text-sm">{g.name}</h3>
                          <p className="text-xs text-zinc-500 mt-0.5">{g.members} members</p>
                        </div>
                      </div>
                      <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold shrink-0 ${activityConfig.cls}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${activityConfig.dot}`} />
                        {g.activity}
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-zinc-500">{g.description}</p>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {g.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Activity bar */}
                    <div className="mt-4 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${g.gradient} transition-all`}
                        style={{ width: `${g.activity === 'Very Active' ? 85 : g.activity === 'Active' ? 60 : 35}%` }}
                      />
                    </div>

                    <button
                      onClick={() => toggleJoin(g.name)}
                      className={`mt-4 w-full rounded-xl py-2.5 text-sm font-semibold transition-all duration-200 ${
                        joined
                          ? 'bg-white/[0.06] text-zinc-400 border border-white/[0.08] hover:bg-white/[0.08]'
                          : `bg-gradient-to-r ${g.gradient} text-white shadow-lg hover:opacity-90 active:scale-[0.98]`
                      }`}
                    >
                      {joined ? '참여 중 ✓' : 'Join Group'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* TAB: ACTIVITY                                 */}
      {/* ══════════════════════════════════════════════ */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
              <Zap size={18} className="text-yellow-400" />
              Recent Activity
            </h2>
            <button className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 transition-colors">
              <Bell size={13} />
              알림 설정
            </button>
          </div>

          <div className="space-y-2">
            {activities.map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-xl bg-white/[0.04] border border-white/[0.06] px-5 py-4 hover:bg-white/[0.06] transition-colors"
              >
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${a.gradient} text-xs font-bold text-white shadow-md`}>
                  {a.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-300">
                    <span className="font-semibold text-zinc-100">{a.name}</span>
                    {' '}
                    {a.text}
                  </p>
                  <span className="text-xs text-zinc-600">{a.time}</span>
                </div>
                <ActivityBadge type={a.type} />
              </div>
            ))}
          </div>

          {/* Your own milestone */}
          <div className="rounded-xl bg-indigo-500/[0.08] border border-indigo-500/20 px-5 py-4 flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 text-xs font-bold text-white shadow-md">
              ME
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-indigo-300 font-medium">나의 최근 활동</p>
              <p className="text-xs text-zinc-500 mt-0.5">AI Free Talk 세션 완료 • 30분 전</p>
            </div>
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════ */}
      {/* TAB: CHALLENGES                               */}
      {/* ══════════════════════════════════════════════ */}
      {activeTab === 'challenges' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
              <Trophy size={18} className="text-violet-400" />
              Community Challenges
            </h2>
            <span className="text-xs text-zinc-500">매주 새로운 챌린지</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {challenges.map((c) => {
              const Icon = c.icon;
              return (
                <div key={c.title} className="rounded-2xl bg-white/[0.04] border border-white/[0.06] overflow-hidden hover-lift transition-all">
                  {/* gradient strip */}
                  <div className={`h-1.5 bg-gradient-to-r ${c.gradient}`} />

                  <div className="p-5">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${c.gradient} shadow-lg`}>
                        <Icon size={20} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-zinc-200 text-sm">{c.title}</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">{c.desc}</p>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="text-zinc-400">{c.progress}% 완료</span>
                        <span className="text-zinc-500">{c.daysLeft}일 남음</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${c.gradient} transition-all`}
                          style={{ width: `${c.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1 text-xs text-zinc-500">
                          <Users size={11} />
                          <span>{c.participants}명 참여 중</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-amber-400">
                          <Sparkles size={11} />
                          <span>{c.reward}</span>
                        </div>
                      </div>
                      <button className={`px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r ${c.gradient} shadow-md hover:opacity-90 active:scale-[0.97] transition-all`}>
                        참여하기
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Upcoming challenge teaser */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] border-dashed px-5 py-4 flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <Mic size={18} className="text-zinc-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-400">다음 챌린지 예정</p>
              <p className="text-xs text-zinc-600 mt-0.5">Pronunciation Battle — 5일 후 시작</p>
            </div>
            <Bell size={16} className="text-zinc-600" />
          </div>
        </div>
      )}
    </div>
  );
}
