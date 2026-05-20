'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Volume2, Mic, Check, Star, TrendingUp, Target,
  ChevronRight, Sparkles, BarChart3, RefreshCw, Repeat,
  BookOpen, ArrowRight, Award, RotateCcw,
} from 'lucide-react';
import { useTTS, useSpeechRecognition } from '@/hooks/useSpeech';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

interface Phoneme {
  symbol: string; name: string; examples: string[];
  tip: string; difficulty: Difficulty; accuracy?: number;
}

const phonemes: Phoneme[] = [
  { symbol: 'θ / ð', name: 'th sounds',       examples: ['think','this','three','the'],    tip: '혀를 윗니와 아랫니 사이에 넣어요',         difficulty: 'Hard',   accuracy: 45 },
  { symbol: 'r / l',  name: 'r vs l',          examples: ['right','light','road','load'],   tip: 'r은 혀를 구부려요, l은 혀끝을 올려요',    difficulty: 'Hard',   accuracy: 58 },
  { symbol: 'v / b',  name: 'v vs b',          examples: ['vest','best','vine','bine'],     tip: 'v는 아랫입술을 윗니에 닿게 해요',          difficulty: 'Medium', accuracy: 67 },
  { symbol: 'f / p',  name: 'f vs p',          examples: ['fan','pan','feet','peat'],       tip: 'f는 아랫입술+윗니, p는 두 입술을 닫아요', difficulty: 'Medium', accuracy: 72 },
  { symbol: 'æ',      name: 'short a',         examples: ['bat','cat','man','bad'],         tip: '입을 크게 벌려 "에-아" 중간 소리',         difficulty: 'Medium', accuracy: 61 },
  { symbol: 'ɪ / iː', name: 'short / long i', examples: ['sit','seat','bit','beat'],       tip: 'short i는 짧게, long i는 길게 늘려요',    difficulty: 'Easy',   accuracy: 80 },
  { symbol: 'ʌ / ɑː', name: 'cup vs car',     examples: ['cup','car','bus','bar'],         tip: 'ʌ는 입을 작게, ɑː는 턱을 내려요',         difficulty: 'Easy',   accuracy: 75 },
  { symbol: 'ʃ / tʃ', name: 'sh vs ch',       examples: ['ship','chip','shop','chop'],     tip: 'sh는 부드럽게, ch는 파열음을 더해요',      difficulty: 'Easy',   accuracy: 83 },
  { symbol: 'w / v',  name: 'w vs v',          examples: ['wine','vine','west','vest'],     tip: 'w는 입술을 동그랗게, v는 윗니를 사용해요', difficulty: 'Medium', accuracy: 69 },
  { symbol: 'ŋ',      name: 'ng sound',        examples: ['ring','song','long','think'],    tip: '혀 뒤쪽을 입천장에 붙여 코로 내보내요',    difficulty: 'Easy',   accuracy: 78 },
  { symbol: 'z / s',  name: 'z vs s',          examples: ['zoo','sue','zip','sip'],         tip: 'z는 성대를 울려요, s는 조용해요',          difficulty: 'Medium', accuracy: 71 },
  { symbol: 'ʒ',      name: 'zh sound',        examples: ['measure','vision','treasure'],   tip: '"sh"에 성대 진동을 더한 소리예요',         difficulty: 'Hard',   accuracy: 52 },
];

const difficultyConfig: Record<Difficulty, { color: string; bg: string; border: string }> = {
  Easy:   { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  border: 'rgba(16,185,129,0.25)' },
  Medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)' },
  Hard:   { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.25)' },
};

interface Challenge {
  id: string; sentence: string; difficulty: Difficulty;
  focus: string; tip: string;
}

const BATCH_SIZE = 6;

const ALL_CHALLENGES: Challenge[] = [
  /* ── Batch 1: th, sh/s, r/l, w, b/p, vowels ── */
  { id:'c01', sentence:'The thirty-three thieves thought that they thrilled the throne throughout Thursday.', difficulty:'Hard',   focus:'th sounds (θ / ð)',            tip:'혀를 앞니 사이에 넣어 천천히 발음하세요' },
  { id:'c02', sentence:'She sells seashells by the seashore.',                                                difficulty:'Medium', focus:'sh vs s (ʃ / s)',              tip:'sh와 s의 차이에 집중하세요' },
  { id:'c03', sentence:'Red lorry, yellow lorry, red lorry, yellow lorry.',                                   difficulty:'Hard',   focus:'r / l distinction',            tip:'r과 l을 정확히 구별하세요' },
  { id:'c04', sentence:'How much wood would a woodchuck chuck if a woodchuck could chuck wood?',              difficulty:'Medium', focus:'w sound + connected speech',    tip:'w 발음에 집중하세요' },
  { id:'c05', sentence:'Betty Botter bought some butter but the butter Betty bought was bitter.',             difficulty:'Medium', focus:'b vs p sounds',                 tip:'b는 유성음, p는 무성음이에요' },
  { id:'c06', sentence:'Unique New York, unique New York, you know you need unique New York.',                difficulty:'Hard',   focus:'vowels + stress patterns',      tip:'강세 패턴에 집중하세요' },
  /* ── Batch 2: p/k, f/w, s clusters, tongue placement ── */
  { id:'c07', sentence:'Peter Piper picked a peck of pickled peppers.',                                       difficulty:'Medium', focus:'p sound + vowels',              tip:'p를 정확히 파열시키세요' },
  { id:'c08', sentence:'Fuzzy Wuzzy was a bear; Fuzzy Wuzzy had no hair.',                                    difficulty:'Easy',   focus:'f sound + w sound',            tip:'f는 아랫입술을 윗니에 대세요' },
  { id:'c09', sentence:'Six sleek swans swam swiftly southwards.',                                            difficulty:'Hard',   focus:'s + sw consonant clusters',    tip:'s 클러스터를 부드럽게 연결하세요' },
  { id:'c10', sentence:'The lips, the teeth, the tip of the tongue.',                                         difficulty:'Easy',   focus:'tongue and lip placement',      tip:'각 부분을 의식하며 천천히 발음하세요' },
  { id:'c11', sentence:'Lesser leather never weathered wetter weather better.',                               difficulty:'Hard',   focus:'l + th + vowel sounds',        tip:'l과 th의 연속 발음에 주의하세요' },
  { id:'c12', sentence:'A big black bug bit a big black bear.',                                               difficulty:'Easy',   focus:'b sound + vowels',             tip:'b를 두 입술로 가볍게 터뜨리세요' },
  /* ── Batch 3: th, wh, rhythm, vowel reduction ── */
  { id:'c13', sentence:'I thought I thought of thinking of thanking you.',                                    difficulty:'Medium', focus:'th sound (θ) + word boundaries', tip:'thought와 thank의 th가 다를 수 있어요' },
  { id:'c14', sentence:'Which witch watched which wicked witch?',                                             difficulty:'Medium', focus:'wh + w sounds',                tip:'wh와 w를 구별해서 발음하세요' },
  { id:'c15', sentence:'I scream, you scream, we all scream for ice cream.',                                   difficulty:'Easy',   focus:'stress + rhythm',              tip:'리듬을 느끼며 강세에 집중하세요' },
  { id:'c16', sentence:'Can you can a can as a canner can can a can?',                                        difficulty:'Hard',   focus:'vowel reduction + rhythm',     tip:'강세가 없는 음절에서 모음을 줄이세요' },
  { id:'c17', sentence:'Whether the weather is cold or whether the weather is hot.',                          difficulty:'Medium', focus:'wh + th + short vowels',       tip:'weather vs whether 발음 차이를 느끼세요' },
  { id:'c18', sentence:'A proper copper coffee pot.',                                                          difficulty:'Easy',   focus:'p + k sounds',                 tip:'p와 k를 깔끔하게 파열시키세요' },
  /* ── Batch 4: connected speech, contractions, weak forms ── */
  { id:'c19', sentence:'I would have gone if I had known.',                                                    difficulty:'Medium', focus:"would've + contractions",       tip:'단어를 끊지 말고 연결해서 발음하세요' },
  { id:'c20', sentence:'Could you give me a cup of coffee please?',                                           difficulty:'Easy',   focus:'connected speech + reduction',  tip:"'쿠쥬' — 빠른 말에서 단어가 연결돼요" },
  { id:'c21', sentence:'The old man and the sea is a story about determination.',                              difficulty:'Medium', focus:'linked speech + th',            tip:"'and the' — 자연스럽게 연결하세요" },
  { id:'c22', sentence:'She should have told me she was coming.',                                              difficulty:'Easy',   focus:"should've + weak forms",        tip:"should've를 'shudduv'처럼 발음하세요" },
  { id:'c23', sentence:'What do you want to do this weekend?',                                                difficulty:'Easy',   focus:'wanna + gonna reduction',       tip:"want to = 'wanna'처럼 줄여보세요" },
  { id:'c24', sentence:'I am going to have to let you know before the end of the day.',                       difficulty:'Hard',   focus:'multiple reductions',           tip:'gonna / hafta 등 연속 축약을 연습하세요' },
  /* ── Batch 5: intonation, multisyllabic, advanced ── */
  { id:'c25', sentence:"Really? You actually did that? That's incredible!",                                   difficulty:'Medium', focus:'intonation patterns',           tip:'의문문과 감탄문의 음정 변화에 집중하세요' },
  { id:'c26', sentence:'The quick brown fox jumps over the lazy dog.',                                        difficulty:'Easy',   focus:'general articulation',          tip:'각 단어를 또렷하게 발음하세요' },
  { id:'c27', sentence:"You know what I mean, right? It's kind of complicated.",                              difficulty:'Medium', focus:'discourse markers + tag questions', tip:"right?에서 억양을 올리세요" },
  { id:'c28', sentence:'Long long ago in a land far far away there lived a young prince.',                    difficulty:'Easy',   focus:'rhythm + linking',              tip:'리듬감 있게 읽어보세요' },
  { id:'c29', sentence:'Thirty-three thousand people waited patiently at the station.',                       difficulty:'Hard',   focus:'th + numbers + stress',         tip:'th와 숫자 발음을 정확히 하세요' },
  { id:'c30', sentence:'I particularly enjoy the variety of challenges that pronunciation practice provides.', difficulty:'Hard',   focus:'multisyllabic words + stress',  tip:'긴 단어에서 강세 음절을 찾아보세요' },
];

const weeklyProgress = [
  { day:'Mon', accuracy:62 }, { day:'Tue', accuracy:65 }, { day:'Wed', accuracy:68 },
  { day:'Thu', accuracy:71 }, { day:'Fri', accuracy:73 }, { day:'Sat', accuracy:76 }, { day:'Sun', accuracy:78 },
];

/* word-level match scoring */
function scoreWords(original: string, transcript: string): { word: string; status: 'good'|'ok'|'bad' }[] {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z'\s-]/g, '');
  const origWords = original.split(/\s+/);
  const spokenSet = new Set(normalize(transcript).split(/\s+/).filter(Boolean));
  return origWords.map(w => {
    const clean = normalize(w);
    if (spokenSet.has(clean)) return { word: w, status: 'good' };
    // partial match — first 4 chars
    const partial = [...spokenSet].some(s => s.startsWith(clean.slice(0, 4)) || clean.startsWith(s.slice(0, 4)));
    return { word: w, status: partial ? 'ok' : 'bad' };
  });
}

function calcScore(results: { status: string }[]) {
  const good = results.filter(r => r.status === 'good').length;
  const ok   = results.filter(r => r.status === 'ok').length;
  return Math.round(((good + ok * 0.5) / results.length) * 100);
}

const statusColors = { good: '#10b981', ok: '#f59e0b', bad: '#ef4444' };

type ViewMode = 'practice' | 'phonemes' | 'progress';

export default function PronunciationPage() {
  const [viewMode, setViewMode]           = useState<ViewMode>('practice');
  const [currentPage, setCurrentPage]     = useState(0);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge>(ALL_CHALLENGES[0]);
  const [completedChallenges, setCompletedChallenges] = useState<Set<string>>(new Set());
  const [activePhoneme, setActivePhoneme] = useState<Phoneme | null>(null);
  const [filterDiff, setFilterDiff]       = useState<Difficulty | 'All'>('All');

  const totalPages   = Math.ceil(ALL_CHALLENGES.length / BATCH_SIZE);
  const currentBatch = ALL_CHALLENGES.slice(currentPage * BATCH_SIZE, (currentPage + 1) * BATCH_SIZE);
  const allBatchDone = currentBatch.every(c => completedChallenges.has(c.id));

  /* recording state */
  const [isRecording, setIsRecording]     = useState(false);
  const [recordTime, setRecordTime]       = useState(0);
  const [transcript, setTranscript]       = useState('');
  const [showResults, setShowResults]     = useState(false);
  const [wordResults, setWordResults]     = useState<{ word: string; status: 'good'|'ok'|'bad' }[]>([]);
  const [scores, setScores]               = useState({ accuracy: 0, fluency: 0, intonation: 0 });
  const [waveformHeights, setWaveformHeights] = useState<number[]>(Array(28).fill(15));
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const waveRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  /* TTS for playing original */
  const { speak, stop: stopTTS, isSpeaking } = useTTS();

  /* STT for recording user */
  const { isListening, isSupported: sttSupported, startListening, stopListening } =
    useSpeechRecognition((text) => setTranscript(text));

  /* waveform animation while recording */
  useEffect(() => {
    if (!isRecording) { setWaveformHeights(Array(28).fill(15)); return; }
    waveRef.current = setInterval(() => {
      setWaveformHeights(Array(28).fill(0).map(() => Math.random() * 80 + 10));
    }, 120);
    return () => { if (waveRef.current) clearInterval(waveRef.current); };
  }, [isRecording]);

  /* reset when challenge changes */
  useEffect(() => {
    stopTTS();
    setIsRecording(false);
    setShowResults(false);
    setTranscript('');
    setWordResults([]);
    setRecordTime(0);
    if (timerRef.current) clearInterval(timerRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChallenge.id]);

  const startRecording = useCallback(() => {
    setIsRecording(true);
    setShowResults(false);
    setTranscript('');
    setRecordTime(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setRecordTime(t => t + 1), 1000);
    if (sttSupported) startListening();
  }, [sttSupported, startListening]);

  const stopRecording = useCallback(() => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (sttSupported) stopListening();
    // slight delay so STT callback fires first
    setTimeout(() => {
      setShowResults(true);
    }, 400);
  }, [sttSupported, stopListening]);

  /* compute results once transcript + showResults are set */
  useEffect(() => {
    if (!showResults) return;
    const results = scoreWords(selectedChallenge.sentence, transcript);
    setWordResults(results);
    const acc = calcScore(results);
    setScores({
      accuracy:   acc,
      fluency:    Math.min(100, Math.max(20, acc - 5 + Math.floor(Math.random() * 10))),
      intonation: Math.min(100, Math.max(20, acc + 5 + Math.floor(Math.random() * 8))),
    });
  }, [showResults, transcript, selectedChallenge.sentence]);

  const markDone = () => {
    setCompletedChallenges(prev => new Set([...prev, selectedChallenge.id]));
    setShowResults(false);
  };

  const maxAccuracy = Math.max(...weeklyProgress.map(d => d.accuracy));
  const avgAccuracy = Math.round(weeklyProgress.reduce((s, d) => s + d.accuracy, 0) / weeklyProgress.length);
  const filteredPhonemes = filterDiff === 'All' ? phonemes : phonemes.filter(p => p.difficulty === filterDiff);

  const tabs: { id: ViewMode; label: string; icon: React.ElementType }[] = [
    { id: 'practice',  label: '발음 연습',  icon: Mic },
    { id: 'phonemes',  label: '음소 가이드', icon: BookOpen },
    { id: 'progress',  label: '내 진행도',  icon: BarChart3 },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-lg shadow-orange-500/20">
              <Volume2 size={22} className="text-white" />
            </div>
            Pronunciation Coach
          </h1>
          <p className="mt-1.5 text-zinc-500 text-sm">AI 피드백으로 발음을 교정해보세요</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <TrendingUp size={14} className="text-emerald-400" />
            <span className="text-sm text-zinc-300 font-semibold">{avgAccuracy}%</span>
            <span className="text-xs text-zinc-600">avg</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <Check size={14} className="text-indigo-400" />
            <span className="text-sm text-zinc-300 font-semibold">{completedChallenges.size}</span>
            <span className="text-xs text-zinc-600">완료</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setViewMode(id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
              viewMode === id
                ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-300 border border-orange-500/20'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
            }`}>
            <Icon size={15} /><span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* ── PRACTICE TAB ── */}
      {viewMode === 'practice' && (
        <div className="space-y-6">
          {/* Challenge selector */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
                <Sparkles size={18} className="text-yellow-400" /> Practice Sentences
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">
                  배치 {currentPage + 1}/{totalPages} &middot; 전체 {completedChallenges.size}/{ALL_CHALLENGES.length} 완료
                </span>
              </div>
            </div>

            {/* Batch done banner */}
            {allBatchDone && (
              <div className="mb-3 flex flex-col sm:flex-row items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <Check size={16} className="text-emerald-400 flex-shrink-0" />
                <p className="text-sm text-emerald-300 font-semibold flex-1 text-center sm:text-left">이 배치의 문장을 모두 완료했어요! 🎉</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setCompletedChallenges(prev => {
                        const next = new Set(prev);
                        currentBatch.forEach(c => next.delete(c.id));
                        return next;
                      });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] text-zinc-300 text-xs font-medium hover:bg-white/[0.10] border border-white/[0.08] transition-colors"
                  >
                    <RotateCcw size={12} /> 배치 초기화
                  </button>
                  <button
                    onClick={() => {
                      const nextPage = (currentPage + 1) % totalPages;
                      setCurrentPage(nextPage);
                      setSelectedChallenge(ALL_CHALLENGES[nextPage * BATCH_SIZE]);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500 transition-colors"
                  >
                    다음 배치 <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-2">
              {currentBatch.map(ch => {
                const done   = completedChallenges.has(ch.id);
                const active = selectedChallenge.id === ch.id;
                const dc     = difficultyConfig[ch.difficulty];
                return (
                  <div key={ch.id} className={`relative text-left rounded-xl px-4 py-3 border transition-all ${
                    active ? 'bg-orange-500/10 border-orange-500/30'
                    : done  ? 'bg-emerald-500/[0.04] border-emerald-500/15'
                            : 'bg-white/[0.03] border-white/[0.06]'
                  }`}>
                    <button onClick={() => setSelectedChallenge(ch)} className="w-full text-left">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ color: dc.color, backgroundColor: dc.bg }}>{ch.difficulty}</span>
                        {done   ? <Check size={13} className="text-emerald-400" />
                         : active ? <Mic size={13} className="text-orange-400" />
                                  : null}
                      </div>
                      <p className="text-xs text-zinc-300 font-medium leading-relaxed line-clamp-2">{ch.sentence}</p>
                      <p className="text-[10px] text-zinc-500 mt-1">Focus: {ch.focus}</p>
                    </button>
                    {/* Per-sentence reset button — only shown when done */}
                    {done && (
                      <button
                        onClick={() => setCompletedChallenges(prev => {
                          const next = new Set(prev);
                          next.delete(ch.id);
                          return next;
                        })}
                        className="mt-2 flex items-center gap-1 text-[10px] text-zinc-500 hover:text-zinc-300 transition-colors"
                        title="완료 초기화"
                      >
                        <RotateCcw size={10} /> 초기화
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Batch page indicator dots */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1.5 mt-3">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setCurrentPage(i); setSelectedChallenge(ALL_CHALLENGES[i * BATCH_SIZE]); }}
                    className={`rounded-full transition-all ${i === currentPage ? 'w-5 h-2 bg-orange-400' : 'w-2 h-2 bg-white/20 hover:bg-white/40'}`}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Practice area */}
          <section>
            <h2 className="text-lg font-bold text-zinc-200 mb-4">Practice Area</h2>
            <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-6 space-y-5">
              {/* Focus badge */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-bold px-3 py-1 rounded-full"
                  style={{ color: difficultyConfig[selectedChallenge.difficulty].color, backgroundColor: difficultyConfig[selectedChallenge.difficulty].bg, border: `1px solid ${difficultyConfig[selectedChallenge.difficulty].border}` }}>
                  {selectedChallenge.difficulty}
                </span>
                <span className="text-xs text-zinc-500">Focus: <span className="text-zinc-300">{selectedChallenge.focus}</span></span>
              </div>

              {/* Sentence display — shows word-level coloring after recording */}
              <div className="relative p-5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                {showResults && wordResults.length > 0 ? (
                  <p className="text-lg font-medium leading-relaxed flex flex-wrap gap-1.5">
                    {wordResults.map((r, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded-lg font-semibold"
                        style={{ color: statusColors[r.status], backgroundColor: `${statusColors[r.status]}18` }}>
                        {r.word}
                      </span>
                    ))}
                  </p>
                ) : (
                  <p className="text-lg font-medium text-zinc-200 leading-relaxed tracking-wide">
                    {selectedChallenge.sentence}
                  </p>
                )}
                <button onClick={() => { setShowResults(false); setTranscript(''); }}
                  className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/[0.04] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.08] transition-colors">
                  <RefreshCw size={13} />
                </button>
              </div>

              {/* Tip */}
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-yellow-500/[0.06] border border-yellow-500/20">
                <Sparkles size={15} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-zinc-400">{selectedChallenge.tip}</p>
              </div>

              {/* Listen to original button */}
              <button onClick={() => isSpeaking ? stopTTS() : speak(selectedChallenge.sentence, 0.85)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                  isSpeaking ? 'bg-orange-500/10 border-orange-500/30 text-orange-300'
                             : 'border-white/[0.08] text-zinc-400 hover:border-orange-500/30 hover:text-orange-300'
                }`}>
                <Volume2 size={15} />
                {isSpeaking ? '재생 중... (클릭하여 중지)' : '🔊 오리지널 발음 듣기'}
              </button>

              {/* Waveform */}
              <div className="flex items-center justify-center gap-[2.5px] h-14">
                {waveformHeights.map((h, i) => (
                  <div key={i} className={`w-[6px] rounded-full transition-all ${isRecording ? 'bg-gradient-to-t from-orange-500 to-amber-400' : 'bg-white/[0.07]'}`}
                    style={{ height: `${isRecording ? h : 15}%`, transitionDuration: isRecording ? '120ms' : '400ms' }} />
                ))}
              </div>

              {/* Record button */}
              <div className="flex flex-col items-center gap-2">
                <button onClick={isRecording ? stopRecording : startRecording}
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isRecording
                      ? 'bg-red-500 shadow-xl shadow-red-500/40 scale-110'
                      : 'bg-gradient-to-br from-orange-500 to-amber-600 shadow-xl shadow-orange-500/30 hover:scale-105'
                  }`}>
                  {isRecording && (
                    <div className="absolute inset-0 rounded-full animate-ping bg-red-500/30" style={{ animationDuration: '1.5s' }} />
                  )}
                  <Mic size={28} className="text-white relative z-10" />
                </button>
                <p className="text-xs text-zinc-500">
                  {isRecording ? `🔴 녹음 중... ${recordTime}s — 탭하여 종료` : '탭하여 녹음 시작'}
                </p>
                {!sttSupported && (
                  <p className="text-xs text-amber-400">⚠️ 이 브라우저는 음성 인식을 지원하지 않습니다 (Chrome 권장)</p>
                )}
              </div>

              {/* Results */}
              {showResults && (
                <div className="space-y-4 animate-slide-up">
                  {/* Score grid */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Accuracy',   value: scores.accuracy,   color: '#10b981', icon: Target },
                      { label: 'Fluency',    value: scores.fluency,    color: '#3b82f6', icon: Repeat },
                      { label: 'Intonation', value: scores.intonation, color: '#8b5cf6', icon: TrendingUp },
                    ].map(s => {
                      const Icon = s.icon;
                      return (
                        <div key={s.label} className="rounded-xl bg-white/[0.04] border border-white/[0.05] p-4 text-center">
                          <Icon size={16} className="mx-auto mb-2" style={{ color: s.color }} />
                          <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}%</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5">{s.label}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Comparison: original vs yours */}
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-3">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">발음 비교</p>
                    <div>
                      <p className="text-[10px] text-zinc-500 mb-1">🎯 오리지널</p>
                      <p className="text-sm text-zinc-300 leading-relaxed">{selectedChallenge.sentence}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 mb-1">🎤 내 발음 (인식된 텍스트)</p>
                      <p className="text-sm text-zinc-400 leading-relaxed italic">
                        {transcript || '(인식된 텍스트 없음 — Chrome에서 마이크 권한을 허용해주세요)'}
                      </p>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex items-center justify-center gap-4 text-[11px]">
                    {(['good','ok','bad'] as const).map(k => {
                      const labels = { good:'정확해요', ok:'조금 더', bad:'연습 필요' };
                      return (
                        <div key={k} className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: statusColors[k] }} />
                          <span className="text-zinc-500">{labels[k]}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button onClick={() => { setShowResults(false); setTranscript(''); }}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.06] text-zinc-400 text-sm font-medium border border-white/[0.08] hover:bg-white/[0.10] transition-colors">
                      <Repeat size={15} /> 다시 연습
                    </button>
                    <button onClick={markDone}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold shadow-lg hover:opacity-90 transition-all">
                      <Check size={15} /> 완료 표시
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ── PHONEMES TAB ── */}
      {viewMode === 'phonemes' && (
        <div className="space-y-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">난이도</span>
            {(['All','Easy','Medium','Hard'] as const).map(d => {
              const conf = d !== 'All' ? difficultyConfig[d] : null;
              const isActive = filterDiff === d;
              return (
                <button key={d} onClick={() => setFilterDiff(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    isActive && !conf ? 'bg-white/[0.1] text-zinc-200 border-white/[0.12]'
                    : !isActive       ? 'border-white/[0.04] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
                                      : 'border-transparent'
                  }`}
                  style={isActive && conf ? { backgroundColor: conf.bg, color: conf.color, borderColor: conf.border } : undefined}>
                  {d}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredPhonemes.map(p => {
              const conf = difficultyConfig[p.difficulty];
              const acc = p.accuracy ?? 0;
              const accColor = acc < 50 ? '#ef4444' : acc < 70 ? '#f59e0b' : '#10b981';
              const isActive = activePhoneme?.symbol === p.symbol;
              return (
                <button key={p.symbol} onClick={() => setActivePhoneme(isActive ? null : p)}
                  className={`group rounded-2xl p-4 text-left transition-all hover-lift border ${
                    isActive ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/[0.04] border-white/[0.06] hover:border-indigo-500/20'
                  }`}>
                  <div className="flex items-start justify-between mb-2">
                    <p className="text-2xl font-bold text-zinc-100 font-mono group-hover:text-indigo-400 transition-colors">{p.symbol}</p>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ color: conf.color, backgroundColor: conf.bg }}>{p.difficulty}</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mb-2">{p.name}</p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {p.examples.slice(0, 2).map(ex => (
                      <span key={ex} className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-zinc-400">{ex}</span>
                    ))}
                  </div>
                  {p.accuracy !== undefined && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-600">내 정확도</span>
                        <span className="text-[10px] font-bold" style={{ color: accColor }}>{acc}%</span>
                      </div>
                      <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${acc}%`, backgroundColor: accColor }} />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          {activePhoneme && (
            <div className="rounded-2xl bg-indigo-500/[0.06] border border-indigo-500/20 p-6 animate-scale-in space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-bold text-indigo-300 font-mono">{activePhoneme.symbol}</span>
                  <div>
                    <p className="text-base font-semibold text-zinc-200">{activePhoneme.name}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{activePhoneme.examples.join(' · ')}</p>
                  </div>
                </div>
                <button onClick={() => setActivePhoneme(null)} className="p-2 rounded-lg bg-white/[0.04] text-zinc-500 hover:text-zinc-300 text-xs">닫기</button>
              </div>
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-yellow-500/[0.06] border border-yellow-500/15">
                <Sparkles size={15} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-zinc-300">{activePhoneme.tip}</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => speak(activePhoneme.examples.join(', '), 0.8)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold hover:opacity-90 transition-all">
                  <Volume2 size={15} /> 예시 듣기
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── PROGRESS TAB ── */}
      {viewMode === 'progress' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label:'평균 정확도',   value:`${avgAccuracy}%`,              icon:Target,    color:'text-emerald-400', bg:'bg-emerald-500/10' },
              { label:'완료한 챌린지', value:`${completedChallenges.size}/${ALL_CHALLENGES.length}개`, icon:Award, color:'text-amber-400', bg:'bg-amber-500/10' },
              { label:'이번 주 세션',  value:'21회',                          icon:Mic,       color:'text-orange-400',  bg:'bg-orange-500/10' },
              { label:'최고 점수',     value:`${maxAccuracy}%`,              icon:Star,      color:'text-violet-400',  bg:'bg-violet-500/10' },
            ].map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-4">
                  <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                    <Icon size={18} className={s.color} />
                  </div>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">{s.label}</p>
                </div>
              );
            })}
          </div>
          <div className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-zinc-200 flex items-center gap-2">
                <TrendingUp size={16} className="text-emerald-400" /> 이번 주 정확도
              </h3>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <TrendingUp size={11} /> +16% 향상
              </span>
            </div>
            <div className="flex items-end justify-between gap-2 h-32">
              {weeklyProgress.map((d, i) => {
                const pct = ((d.accuracy - 50) / (maxAccuracy - 50)) * 100;
                const isToday = i === weeklyProgress.length - 1;
                return (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-zinc-400">{d.accuracy}%</span>
                    <div className="w-full max-w-[40px] rounded-t-lg overflow-hidden bg-white/[0.04] h-20 flex flex-col-reverse">
                      <div className={`rounded-t-lg transition-all duration-700 ${isToday ? 'bg-gradient-to-t from-emerald-500 to-green-400' : 'bg-gradient-to-t from-emerald-500/40 to-green-400/20'}`}
                        style={{ height: `${Math.max(pct, 8)}%`, transitionDelay: `${i * 80}ms` }} />
                    </div>
                    <span className={`text-xs font-medium ${isToday ? 'text-emerald-400' : 'text-zinc-500'}`}>{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-200 mb-4 flex items-center gap-2">
              <Target size={18} className="text-red-400" /> 집중 연습이 필요한 발음
            </h3>
            <div className="grid gap-3 sm:grid-cols-3">
              {phonemes.filter(p => p.accuracy !== undefined && p.accuracy < 70)
                .sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0)).slice(0, 6)
                .map(ws => {
                  const acc = ws.accuracy ?? 0;
                  const accColor = acc < 50 ? '#ef4444' : '#f59e0b';
                  return (
                    <div key={ws.symbol} className="rounded-2xl bg-white/[0.04] border border-white/[0.06] p-5 hover-lift transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-3xl font-bold font-mono text-zinc-100">{ws.symbol}</span>
                        <span className="text-sm font-bold" style={{ color: accColor }}>{acc}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden mb-3">
                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${acc}%`, backgroundColor: accColor }} />
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {ws.examples.slice(0, 3).map(w => (
                          <span key={w} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-zinc-400">{w}</span>
                        ))}
                      </div>
                      <button onClick={() => setViewMode('practice')}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-semibold hover:bg-indigo-500/20 transition-colors">
                        <Mic size={12} /> 연습하러 가기 <ArrowRight size={11} />
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
