'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Flame,
  Zap,
  Clock,
  Check,
  Mic,
  Target,
  Globe,
  Volume2,
  ChevronRight,
  Play,
  ArrowRight,
  Sparkles,
  Wand2,
  Brain,
  MessageCircle,
  Key,
  X,
  BookOpen,
  TrendingUp,
  PartyPopper,
} from 'lucide-react';
import { channels } from '@/data/channels';

/* ------------------------------------------------------------------ */
/*  Word of the Day data                                               */
/* ------------------------------------------------------------------ */

const dailyWords = [
  { word: 'ubiquitous', pronunciation: '/juːˈbɪk.wɪ.t̬əs/', meaning: '어디에나 있는', example: 'Smartphones have become ubiquitous in modern life.', tip: 'Used to describe things that appear everywhere simultaneously.' },
  { word: 'resilient', pronunciation: '/rɪˈzɪl.jənt/', meaning: '회복력 있는', example: 'Children are remarkably resilient and adaptable.', tip: 'Often used in contexts of mental strength or physical durability.' },
  { word: 'procrastinate', pronunciation: '/prəʊˈkræs.tɪ.neɪt/', meaning: '미루다, 꾸물거리다', example: "I tend to procrastinate when I'm stressed.", tip: 'Comes from Latin "cras" meaning "tomorrow."' },
  { word: 'articulate', pronunciation: '/ɑːrˈtɪk.jə.lət/', meaning: '명확하게 표현하다', example: 'She articulated her ideas clearly in the meeting.', tip: 'Can be used as both a verb and an adjective.' },
  { word: 'nuance', pronunciation: '/ˈnjuː.ɑːns/', meaning: '미묘한 차이', example: 'There are many nuances in English conversation.', tip: 'Essential word for advanced English communication.' },
  { word: 'meticulous', pronunciation: '/məˈtɪk.jə.ləs/', meaning: '꼼꼼한, 세심한', example: 'He is meticulous about every detail of his work.', tip: 'Always followed by "about" or "in" when paired with a noun.' },
  { word: 'paradigm', pronunciation: '/ˈpær.ə.daɪm/', meaning: '패러다임, 모범', example: 'AI is creating a paradigm shift in education.', tip: '"Paradigm shift" is a very common business/academic phrase.' },
  { word: 'eloquent', pronunciation: '/ˈel.ə.kwənt/', meaning: '유창한, 설득력 있는', example: 'She gave an eloquent speech that moved the audience.', tip: 'Describes someone who expresses ideas clearly and persuasively.' },
  { word: 'pragmatic', pronunciation: '/præɡˈmæt.ɪk/', meaning: '실용적인', example: 'We need a pragmatic solution, not a theoretical one.', tip: 'The opposite of idealistic — focused on what works in practice.' },
  { word: 'diligent', pronunciation: '/ˈdɪl.ɪ.dʒənt/', meaning: '성실한, 근면한', example: 'She is a diligent student who never misses a deadline.', tip: 'A key word in professional contexts to describe work ethic.' },
  { word: 'concise', pronunciation: '/kənˈsaɪs/', meaning: '간결한', example: 'Please keep your email concise and to the point.', tip: 'Means brief but complete — say more with fewer words.' },
  { word: 'ambiguous', pronunciation: '/æmˈbɪɡ.ju.əs/', meaning: '모호한', example: 'The instructions were ambiguous, so I asked for clarification.', tip: 'Used when something has more than one possible meaning.' },
  { word: 'inevitable', pronunciation: '/ɪnˈev.ɪ.tə.bəl/', meaning: '피할 수 없는, 필연적인', example: 'Change is inevitable — you just have to embrace it.', tip: 'Often paired with "it\'s inevitable that..." in formal speech.' },
  { word: 'profound', pronunciation: '/prəˈfaʊnd/', meaning: '심오한, 깊은', example: 'That TED talk had a profound impact on my thinking.', tip: 'Means deep or significant — stronger than just "important."' },
  { word: 'spontaneous', pronunciation: '/spɒnˈteɪ.ni.əs/', meaning: '자발적인, 즉흥적인', example: 'We made a spontaneous decision to go on a road trip.', tip: 'Done without planning — implies energy and unpredictability.' },
  { word: 'versatile', pronunciation: '/ˈvɜː.sə.taɪl/', meaning: '다재다능한, 다용도의', example: 'She is a versatile writer who handles many genres.', tip: 'Applies to both people and objects with many uses or skills.' },
  { word: 'scrutinize', pronunciation: '/ˈskruː.tɪ.naɪz/', meaning: '면밀히 조사하다', example: 'The committee scrutinized every detail of the proposal.', tip: 'More intense than just "examine" — implies critical inspection.' },
  { word: 'leverage', pronunciation: '/ˈlev.ər.ɪdʒ/', meaning: '활용하다, 레버리지', example: 'We can leverage social media to reach more customers.', tip: 'Very common in business English — means to use something to your advantage.' },
  { word: 'collaborate', pronunciation: '/kəˈlæb.ə.reɪt/', meaning: '협력하다', example: 'Our teams collaborate across different time zones.', tip: 'More formal than "work together" — implies shared goals.' },
  { word: 'transition', pronunciation: '/trænˈzɪʃ.ən/', meaning: '전환, 이행하다', example: 'The company is transitioning to a remote-first model.', tip: 'Can be a noun or verb — useful in both written and spoken English.' },
  { word: 'persist', pronunciation: '/pəˈsɪst/', meaning: '지속하다, 꾸준히 하다', example: 'If you persist with daily practice, fluency will come.', tip: '"Persist" implies continuing despite obstacles — more than just "continue."' },
  { word: 'empathize', pronunciation: '/ˈem.pə.θaɪz/', meaning: '공감하다', example: 'A good listener can empathize without offering advice.', tip: 'Different from "sympathize" — empathy means sharing the feeling, not just acknowledging it.' },
  { word: 'acknowledge', pronunciation: '/əkˈnɒl.ɪdʒ/', meaning: '인정하다, 인식하다', example: 'She acknowledged my effort and thanked me personally.', tip: 'A polite and professional word — acknowledging someone\'s work builds rapport.' },
  { word: 'clarify', pronunciation: '/ˈklær.ɪ.faɪ/', meaning: '명확히 하다', example: 'Could you clarify what you mean by that?', tip: 'Essential in meetings and emails — never be afraid to ask for clarification.' },
  { word: 'convey', pronunciation: '/kənˈveɪ/', meaning: '전달하다, 표현하다', example: 'It\'s hard to convey sarcasm in a text message.', tip: 'Used to describe communicating ideas, emotions, or meaning.' },
  { word: 'navigate', pronunciation: '/ˈnæv.ɪ.ɡeɪt/', meaning: '헤쳐나가다, 탐색하다', example: 'She skillfully navigated the difficult conversation.', tip: 'Commonly used metaphorically — "navigate challenges/situations."' },
  { word: 'prioritize', pronunciation: '/praɪˈɒr.ɪ.taɪz/', meaning: '우선순위를 정하다', example: 'You need to prioritize sleep over late-night scrolling.', tip: 'Key productivity and self-care word — very common in modern speech.' },
  { word: 'elaborate', pronunciation: '/ɪˈlæb.ər.ɪt/', meaning: '자세히 설명하다', example: 'Could you elaborate on your second point?', tip: 'Great for academic and professional discussions — asks for more detail.' },
  { word: 'undermine', pronunciation: '/ˌʌn.dəˈmaɪn/', meaning: '약화시키다, 훼손하다', example: 'Negative self-talk can undermine your confidence.', tip: 'Often used with abstract nouns: undermine confidence/trust/authority.' },
  { word: 'encompass', pronunciation: '/ɪnˈkʌm.pəs/', meaning: '포함하다, 아우르다', example: 'The term "wellness" encompasses physical and mental health.', tip: 'More formal than "include" — implies covering a wide range.' },
  { word: 'substantial', pronunciation: '/səbˈstæn.ʃəl/', meaning: '상당한, 실질적인', example: 'There has been a substantial improvement in her speaking.', tip: '"Substantial" is stronger than "considerable" — implies real weight or size.' },
];

function getTodaysWord() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  return dailyWords[dayOfYear % dailyWords.length];
}

/* ------------------------------------------------------------------ */
/*  XP / Streak persistence                                           */
/* ------------------------------------------------------------------ */

const STREAK_KEY = 'neuroeng_streak_v2';
const XP_DAILY_KEY = 'neuroeng_xp_daily_v1';

function getToday() { return new Date().toISOString().split('T')[0]; }

function loadStreak(): { streak: number; lastDate: string } {
  try { const r = localStorage.getItem(STREAK_KEY); return r ? JSON.parse(r) : { streak: 0, lastDate: '' }; } catch { return { streak: 0, lastDate: '' }; }
}

function updateAndGetStreak(): number {
  const today = getToday();
  const data = loadStreak();
  if (data.lastDate === today) return data.streak || 1;
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const newStreak = data.lastDate === yesterday ? (data.streak + 1) : 1;
  localStorage.setItem(STREAK_KEY, JSON.stringify({ streak: newStreak, lastDate: today }));
  return newStreak;
}

function loadDailyXP(): Record<string, number> {
  try { const r = localStorage.getItem(XP_DAILY_KEY); return r ? JSON.parse(r) : {}; } catch { return {}; }
}

function addDailyXP(amount: number) {
  const today = getToday();
  const data = loadDailyXP();
  data[today] = (data[today] || 0) + amount;
  localStorage.setItem(XP_DAILY_KEY, JSON.stringify(data));
}

function getWeeklyChart(): { day: string; xp: number }[] {
  const data = loadDailyXP();
  const now = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
    return { day: dayName, xp: data[dateStr] || 0 };
  });
}

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const quests = [
  { id: 'q1', title: 'Watch 1 YouTube clip', xp: 10, icon: Play },
  { id: 'q2', title: 'Practice 3 expressions', xp: 15, icon: Sparkles },
  { id: 'q3', title: 'Complete 1 speaking exercise', xp: 30, icon: Mic },
];

const recentChannelIds = ['yt-1', 'yt-5', 'yt-8'];

const leaderboard = [
  { id: 1, name: 'Minjun', xp: 2450, level: 8, avatar: 'M', trend: 'up' },
  { id: 2, name: 'Sarah', xp: 2120, level: 7, avatar: 'S', trend: 'down' },
  { id: 3, name: 'You', xp: 1840, level: 5, avatar: 'J', trend: 'stable', isMe: true },
  { id: 4, name: 'Kevin', xp: 1560, level: 5, avatar: 'K', trend: 'up' },
  { id: 5, name: 'Luna', xp: 1240, level: 4, avatar: 'L', trend: 'up' },
];

const quickActions = [
  {
    title: 'AI Free Talk',
    href: '/talk/free',
    gradient: 'from-violet-600 to-purple-700',
    shadow: 'shadow-violet-500/25',
    icon: Mic,
    desc: 'Practice conversation with AI',
  },
  {
    title: 'OPIc Practice',
    href: '/opic/practice',
    gradient: 'from-blue-600 to-indigo-700',
    shadow: 'shadow-blue-500/25',
    icon: Target,
    desc: 'Prepare for OPIc exam',
  },
  {
    title: 'Explore Channels',
    href: '/learn/channels',
    gradient: 'from-emerald-600 to-green-700',
    shadow: 'shadow-emerald-500/25',
    icon: Globe,
    desc: 'Find new learning content',
  },
  {
    title: 'Pronunciation',
    href: '/learn/pronunciation',
    gradient: 'from-orange-500 to-amber-600',
    shadow: 'shadow-orange-500/25',
    icon: Volume2,
    desc: 'Perfect your accent',
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const QUEST_KEY = 'neuroeng_quests_v1';
const ALERT_KEY = 'neuroeng_api_alert_v1';

function loadQuests(): Set<string> {
  try {
    const raw = localStorage.getItem(QUEST_KEY);
    if (!raw) return new Set();
    const { date, ids } = JSON.parse(raw) as { date: string; ids: string[] };
    const today = new Date().toISOString().split('T')[0];
    return date === today ? new Set<string>(ids) : new Set<string>(); // reset daily
  } catch { return new Set(); }
}

function saveQuests(ids: Set<string>) {
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem(QUEST_KEY, JSON.stringify({ date: today, ids: [...ids] }));
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const upgraded = searchParams.get('upgraded') === 'true';
  const upgradedPlan = searchParams.get('plan') || 'pro';
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false);
  const [completedQuests, setCompletedQuests] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);
  const [showApiAlert, setShowApiAlert] = useState(false);
  const [wordFlipped, setWordFlipped] = useState(false);
  const [vocabCount, setVocabCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [weeklyXP, setWeeklyXP] = useState<{ day: string; xp: number }[]>([
    { day: 'Mon', xp: 0 }, { day: 'Tue', xp: 0 }, { day: 'Wed', xp: 0 },
    { day: 'Thu', xp: 0 }, { day: 'Fri', xp: 0 }, { day: 'Sat', xp: 0 }, { day: 'Sun', xp: 0 },
  ]);
  const todayWord = getTodaysWord();

  useEffect(() => {
    setMounted(true);
    setCompletedQuests(loadQuests());
    if (upgraded) setShowUpgradeBanner(true);
    // Real streak + weekly chart
    setStreak(updateAndGetStreak());
    setWeeklyXP(getWeeklyChart());
    // Check GROQ key via health endpoint — only show alert when key is missing
    fetch('/api/health')
      .then(r => r.json())
      .then(({ groqConfigured }: { groqConfigured: boolean }) => {
        if (!groqConfigured) {
          setShowApiAlert(localStorage.getItem(ALERT_KEY) !== 'dismissed');
        }
      })
      .catch(() => {});
    // Real vocab count
    try {
      const raw = localStorage.getItem('neuroeng_vocab_v2');
      if (raw) setVocabCount(JSON.parse(raw).length);
    } catch {}
    // (script count removed from stats — no display currently)
  }, []);

  const toggleQuest = (id: string) => {
    setCompletedQuests((prev) => {
      const next = new Set(prev);
      const wasCompleted = next.has(id);
      if (wasCompleted) {
        next.delete(id);
      } else {
        next.add(id);
        // Persist XP earned for this quest
        const q = quests.find(q => q.id === id);
        if (q) {
          addDailyXP(q.xp);
          setWeeklyXP(getWeeklyChart());
        }
      }
      saveQuests(next);
      return next;
    });
  };

  const dismissAlert = () => {
    localStorage.setItem(ALERT_KEY, 'dismissed');
    setShowApiAlert(false);
  };

  const recentChs = recentChannelIds
    .map((id) => channels.find((c) => c.id === id))
    .filter(Boolean) as typeof channels;

  const questXP = [...completedQuests].reduce((sum, id) => {
    const q = quests.find(q => q.id === id);
    return sum + (q?.xp ?? 0);
  }, 0);
  const dailyGoalXP = 55;
  const xpProgress = Math.min(100, Math.round((questXP / dailyGoalXP) * 100));

  const stats = [
    {
      label: 'Day Streak',
      value: streak > 0 ? `${streak}🔥` : '—',
      sub: streak > 0 ? `${streak}일 연속 학습 중!` : '오늘 첫 방문',
      icon: Flame,
      iconColor: 'text-orange-400',
      iconBg: 'bg-orange-400/10',
      accent: 'from-orange-500 to-red-500',
    },
    {
      label: 'XP Today',
      value: `${questXP} XP`,
      sub: `Daily goal: ${dailyGoalXP} XP`,
      icon: Zap,
      iconColor: 'text-yellow-400',
      iconBg: 'bg-yellow-400/10',
      accent: 'from-yellow-500 to-amber-500',
      progress: xpProgress,
    },
    {
      label: 'Vocab Saved',
      value: vocabCount > 0 ? `${vocabCount}` : '—',
      sub: vocabCount > 0 ? '내 단어장' : '아직 단어 없음',
      icon: BookOpen,
      iconColor: 'text-indigo-400',
      iconBg: 'bg-indigo-400/10',
      accent: 'from-indigo-500 to-violet-500',
    },
    {
      label: 'Quests Done',
      value: `${completedQuests.size}/${quests.length}`,
      sub: completedQuests.size === quests.length ? '🎉 All done today!' : '오늘의 퀘스트',
      icon: Clock,
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-400/10',
      accent: 'from-cyan-500 to-blue-500',
    },
  ];

  if (!mounted) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 w-80 rounded-xl bg-white/[0.04]" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-white/[0.04]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* ── Upgrade Success Banner ── */}
      {showUpgradeBanner && (
        <div className="relative flex items-center gap-4 px-5 py-4 rounded-xl bg-gradient-to-r from-indigo-500/20 to-violet-500/20 border border-indigo-500/30">
          <PartyPopper size={20} className="text-indigo-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-indigo-300">🎉 Welcome to NeuroEng {upgradedPlan.charAt(0).toUpperCase() + upgradedPlan.slice(1)}!</p>
            <p className="text-xs text-indigo-400/70 mt-0.5">Your payment was successful. Enjoy all premium features!</p>
          </div>
          <button onClick={() => setShowUpgradeBanner(false)} className="text-indigo-400/60 hover:text-indigo-400">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Welcome Header ── */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight">
          {getGreeting()}, Learner! <span className="inline-block animate-float">&#x1F525;</span>
        </h1>
        <p className="mt-1 text-zinc-500 text-sm">{formatDate()}</p>
      </div>

      {/* ── API Key Setup Alert ── */}
      {showApiAlert && (
        <div className="relative flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/25">
          <Key size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-300">AI 기능 활성화 필요</p>
            <p className="text-xs text-amber-400/70 mt-0.5">
              AI Free Talk, Grammar Checker, OPIc Coach를 쓰려면{' '}
              <code className="bg-amber-500/20 px-1 rounded text-amber-300">.env.local</code>에 GROQ_API_KEY를 추가하세요.{' '}
              <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer" className="underline text-amber-300 hover:text-amber-200">
                무료 키 받기 →
              </a>
            </p>
          </div>
          <button onClick={dismissAlert} className="shrink-0 text-amber-400/60 hover:text-amber-400 transition-colors">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Word of the Day ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
            <BookOpen size={18} className="text-indigo-400" /> Word of the Day
          </h2>
          <span className="text-xs text-zinc-500">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        </div>
        <button
          onClick={() => setWordFlipped(!wordFlipped)}
          className="w-full text-left rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 p-5 hover:border-indigo-500/40 transition-all group"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              {!wordFlipped ? (
                <>
                  <p className="text-2xl font-bold text-zinc-100 group-hover:text-indigo-300 transition-colors">{todayWord.word}</p>
                  <p className="text-sm font-mono text-zinc-500 mt-1">{todayWord.pronunciation}</p>
                  <p className="text-xs text-zinc-600 mt-3">탭해서 뜻 확인 →</p>
                </>
              ) : (
                <>
                  <p className="text-xl font-bold text-indigo-300">{todayWord.meaning}</p>
                  <p className="text-sm text-zinc-400 mt-2 italic">&ldquo;{todayWord.example}&rdquo;</p>
                  <p className="text-xs text-indigo-400/70 mt-2">💡 {todayWord.tip}</p>
                </>
              )}
            </div>
            <div className="shrink-0 w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Sparkles size={16} className="text-indigo-400" />
            </div>
          </div>
        </button>
      </section>

      {/* ── AI Features ── */}
      <section>
        <h2 className="text-lg font-bold text-zinc-200 mb-3 flex items-center gap-2">
          <Sparkles size={18} className="text-violet-400" /> AI Features
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { href: '/talk/free', icon: MessageCircle, label: 'AI Free Talk', desc: 'Llama 3.3 · 스트리밍', color: 'from-indigo-500/10 to-violet-500/10', border: 'border-indigo-500/20', iconColor: 'text-indigo-400' },
            { href: '/learn/grammar', icon: Wand2, label: 'Grammar Checker', desc: 'AI 문법 교정', color: 'from-violet-500/10 to-pink-500/10', border: 'border-violet-500/20', iconColor: 'text-violet-400' },
            { href: '/opic/ai-coach', icon: Brain, label: 'OPIc AI Coach', desc: 'IM/IH/AL 레벨별 연습', color: 'from-blue-500/10 to-indigo-500/10', border: 'border-blue-500/20', iconColor: 'text-blue-400' },
          ].map(f => (
            <Link key={f.href} href={f.href}
              className={`flex items-center gap-3 p-4 rounded-xl border bg-gradient-to-br ${f.color} ${f.border} hover:scale-[1.02] transition-all`}
            >
              <f.icon size={20} className={f.iconColor} />
              <div>
                <p className="text-sm font-semibold text-zinc-200">{f.label}</p>
                <p className="text-xs text-zinc-500">{f.desc}</p>
              </div>
              <ChevronRight size={14} className="text-zinc-600 ml-auto" />
            </Link>
          ))}
        </div>
      </section>

      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="relative overflow-hidden rounded-2xl bg-white/[0.04] border border-white/[0.06] p-5 hover-lift group"
            >
              {/* subtle accent gradient line at top */}
              <div
                className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${s.accent} opacity-60`}
              />
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl ${s.iconBg}`}>
                  <Icon size={20} className={s.iconColor} />
                </div>
              </div>
              <p className="text-2xl font-bold text-zinc-100">{s.value}</p>
              <p className="text-xs text-zinc-500 mt-1">{s.sub}</p>
              {s.progress !== undefined && (
                <div className="mt-3 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${s.accent} transition-all duration-700`}
                    style={{ width: `${s.progress}%` }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Daily Quests ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-zinc-200">Daily Quests</h2>
          <span className="text-xs text-zinc-500">
            {completedQuests.size}/{quests.length} completed
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {quests.map((q) => {
            const done = completedQuests.has(q.id);
            const Icon = q.icon;
            return (
              <button
                key={q.id}
                onClick={() => toggleQuest(q.id)}
                className={`relative flex items-center gap-4 rounded-2xl border p-4 text-left transition-all duration-200 hover-lift ${
                  done
                    ? 'bg-emerald-500/[0.07] border-emerald-500/20'
                    : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]'
                }`}
              >
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                    done
                      ? 'bg-emerald-500 text-white'
                      : 'bg-white/[0.06] text-zinc-400'
                  }`}
                >
                  {done ? <Check size={18} /> : <Icon size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-semibold ${
                      done ? 'text-emerald-400 line-through' : 'text-zinc-200'
                    }`}
                  >
                    {q.title}
                  </p>
                </div>
                <span
                  className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
                    done
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-yellow-500/10 text-yellow-400'
                  }`}
                >
                  +{q.xp} XP
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Continue Learning ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-zinc-200">Continue Learning</h2>
          <Link
            href="/learn/channels"
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight size={12} />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {recentChs.map((ch) => (
            <Link
              key={ch.id}
              href="/learn/channels"
              className="group relative overflow-hidden rounded-2xl bg-white/[0.04] border border-white/[0.06] hover-lift"
            >
              {/* Color banner */}
              <div
                className="h-20 w-full relative"
                style={{ backgroundColor: ch.thumbnailColor }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                <div className="absolute bottom-3 left-4 flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-lg"
                    style={{ backgroundColor: ch.thumbnailColor, filter: 'brightness(0.8)' }}
                  >
                    {ch.name[0]}
                  </div>
                  <span className="text-white text-sm font-semibold drop-shadow">
                    {ch.name}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <p className="text-xs text-zinc-500 line-clamp-2">{ch.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                    Lv.{ch.level}
                  </span>
                  <span className="text-xs text-zinc-500 group-hover:text-indigo-400 transition-colors flex items-center gap-1">
                    Continue <ChevronRight size={12} />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Quick Actions ── */}
      <section>
        <h2 className="text-lg font-bold text-zinc-200 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          {quickActions.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.href}
                href={a.href}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${a.gradient} p-5 sm:p-6 hover-lift shadow-lg ${a.shadow} transition-all duration-300`}
              >
                {/* Decorative circles */}
                <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/[0.08]" />
                <div className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full bg-white/[0.05]" />

                <div className="relative">
                  <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300">
                    <Icon size={20} className="text-white" />
                  </div>
                  <p className="text-white font-bold text-base sm:text-lg">{a.title}</p>
                  <p className="text-white/60 text-xs mt-1">{a.desc}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Weekly Activity Chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-zinc-200">Weekly Activity</h2>
            <span className="text-xs text-zinc-500">
              Total:{' '}
              <span className="text-yellow-400 font-semibold">
                {weeklyXP.reduce((a, b) => a + b.xp, 0).toLocaleString()} XP
              </span>
            </span>
          </div>
          <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-6 h-[280px] flex flex-col justify-end">
            <div className="flex items-end justify-between gap-2 h-full pb-2">
              {weeklyXP.map((d, i) => {
                const maxVal = Math.max(...weeklyXP.map(x => x.xp), 1);
                const pct = (d.xp / maxVal) * 100;
                const isToday = i === (new Date().getDay() + 6) % 7;
                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-[10px] font-semibold text-zinc-400">{d.xp}</span>
                    <div className="w-full max-w-[40px] rounded-t-lg overflow-hidden bg-white/[0.04] flex-1 flex flex-col-reverse">
                      <div
                        className={`rounded-t-lg transition-all duration-700 ${
                          isToday
                            ? 'bg-gradient-to-t from-indigo-500 to-violet-400'
                            : 'bg-gradient-to-t from-indigo-500/50 to-violet-400/30'
                        }`}
                        style={{ height: `${pct}%`, transitionDelay: `${i * 80}ms` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${isToday ? 'text-indigo-400' : 'text-zinc-500'}`}>
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Leaderboard ── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-zinc-200">Weekly Leaderboard</h2>
            <Link href="/community" className="text-xs text-indigo-400 font-medium hover:underline">View All</Link>
          </div>
          <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] overflow-hidden">
            <div className="divide-y divide-white/[0.04]">
              {leaderboard.map((user, idx) => (
                <div key={user.id} className={`flex items-center gap-3 p-4 transition-colors ${user.isMe ? 'bg-indigo-500/10' : 'hover:bg-white/[0.02]'}`}>
                  <div className="text-xs font-bold text-zinc-500 w-4">{idx + 1}</div>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-lg ${
                    idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-yellow-500/20' : 
                    idx === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 shadow-slate-500/20' : 
                    idx === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 shadow-amber-900/20' : 
                    'bg-white/[0.08]'
                  }`}>
                    {user.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className={`text-sm font-semibold truncate ${user.isMe ? 'text-indigo-400' : 'text-zinc-200'}`}>{user.name}</p>
                      {user.isMe && <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-indigo-500/20 text-indigo-400 uppercase">You</span>}
                    </div>
                    <p className="text-[10px] text-zinc-500">Lv.{user.level} · {user.xp.toLocaleString()} XP</p>
                  </div>
                  <div className="text-right">
                    {user.trend === 'up' && <TrendingUp size={12} className="text-emerald-400 ml-auto" />}
                    {user.trend === 'down' && <TrendingUp size={12} className="text-rose-400 rotate-180 ml-auto" />}
                    {user.trend === 'stable' && <div className="w-3 h-0.5 bg-zinc-600 ml-auto" />}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-3 bg-white/[0.02] text-center">
              <p className="text-[10px] text-zinc-500">You are in <span className="text-indigo-400 font-bold">Silver League</span> · 3 days left</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="animate-pulse space-y-6"><div className="h-10 w-80 rounded-xl bg-white/[0.04]" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}
