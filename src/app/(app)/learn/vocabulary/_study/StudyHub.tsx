'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  ChevronLeft, Brain, Zap, CheckCircle2, X, Volume2, Trophy,
  RotateCcw, Trash2, Play, Pause, ListChecks, Mic,
  Layers, Gamepad2, Shuffle,
} from 'lucide-react';
import { useAppStore, VocabularyWord, Sentence } from '@/lib/store';
import { useTTS } from '@/hooks/useSpeech';

/* ─── Types ─────────────────────────────────────────────────── */

type StudyMode =
  | 'select'
  | 'mc-quiz'
  | 'fill-blank'
  | 'dictation'
  | 'speed'
  | 'matching'
  | 'builder'
  | 'mistakes-review';

interface MCQuestion {
  id: string;
  question: string;
  correct: string;
  options: string[];
  sourceType: 'vocab' | 'sentence';
  sourceId: string;
  dir: 'en-ko' | 'ko-en';
  hint?: string;
}

interface MatchCard {
  id: string;
  pairId: string;
  content: string;
  type: 'en' | 'ko';
  matched: boolean;
}

interface BuilderWord {
  uid: string;
  word: string;
}

interface FillBlankQ {
  sentence: Sentence;
  blankWord: string;
  display: string;
}

/* ─── Pure helpers ───────────────────────────────────────────── */

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function norm(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z가-힣0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function fuzzyMatch(a: string, b: string): boolean {
  const na = norm(a);
  const nb = norm(b);
  if (na === nb) return true;
  const wa = na.split(' ').filter(Boolean);
  const wb = new Set(nb.split(' ').filter(Boolean));
  if (wa.length === 0) return false;
  return wa.filter((w) => wb.has(w)).length / wa.length >= 0.8;
}

function buildMCQuestions(
  vocabulary: VocabularyWord[],
  sentences: Sentence[],
): MCQuestion[] {
  const qs: MCQuestion[] = [];

  // Vocab EN→KO
  const vocabWithKo = vocabulary.filter((w) => w.meaningKo && w.meaningKo.length > 0);
  for (const word of vocabWithKo) {
    const wrongPool = vocabWithKo.filter((w) => w.id !== word.id).map((w) => w.meaningKo);
    if (wrongPool.length < 3) continue;
    qs.push({
      id: `mc-enko-${word.id}`,
      question: word.word,
      correct: word.meaningKo,
      options: shuffle([word.meaningKo, ...shuffle(wrongPool).slice(0, 3)]),
      sourceType: 'vocab',
      sourceId: word.id,
      dir: 'en-ko',
      hint: word.pronunciation,
    });
  }

  // Vocab KO→EN
  for (const word of vocabWithKo) {
    const wrongPool = vocabWithKo.filter((w) => w.id !== word.id).map((w) => w.word);
    if (wrongPool.length < 3) continue;
    qs.push({
      id: `mc-koen-${word.id}`,
      question: word.meaningKo,
      correct: word.word,
      options: shuffle([word.word, ...shuffle(wrongPool).slice(0, 3)]),
      sourceType: 'vocab',
      sourceId: word.id,
      dir: 'ko-en',
    });
  }

  // Sentence EN→KO
  const sentWithTrans = sentences.filter((s) => s.translation && s.translation.length > 0);
  for (const sent of sentWithTrans) {
    const wrongPool = sentWithTrans
      .filter((s) => s.id !== sent.id)
      .map((s) => s.translation);
    if (wrongPool.length < 3) continue;
    qs.push({
      id: `mc-sent-${sent.id}`,
      question: sent.text,
      correct: sent.translation,
      options: shuffle([sent.translation, ...shuffle(wrongPool).slice(0, 3)]),
      sourceType: 'sentence',
      sourceId: sent.id,
      dir: 'en-ko',
    });
  }

  return shuffle(qs).slice(0, 20);
}

function buildFillBlank(sentences: Sentence[]): FillBlankQ | null {
  const eligible = sentences.filter((s) => s.text.split(' ').length >= 5);
  if (eligible.length === 0) return null;
  const sent = eligible[Math.floor(Math.random() * eligible.length)];
  const words = sent.text.split(' ');
  const stops = new Set([
    'the','a','an','in','on','at','to','of','and','or','but','is','are','was',
    'were','be','i','you','he','she','it','we','they','this','that','for','with',
    'as','if','so','my','your','his','her','their','our','do','does','did','have',
    'has','had','can','will','would','could','should',
  ]);
  const candidates = words
    .map((w, i) => ({ w, i }))
    .filter(({ w }) => {
      const clean = w.toLowerCase().replace(/[^a-z]/g, '');
      return !stops.has(clean) && clean.length > 3;
    });
  if (candidates.length === 0) return null;
  const { w: blankWordRaw, i: blankIdx } =
    candidates[Math.floor(Math.random() * candidates.length)];
  const blankWord = blankWordRaw.replace(/[^a-zA-Z'-]/g, '');
  if (!blankWord) return null;
  const display = words.map((w, i) => (i === blankIdx ? '___' : w)).join(' ');
  return { sentence: sent, blankWord, display };
}

function buildMatchCards(vocabulary: VocabularyWord[]): MatchCard[] {
  const pool = vocabulary
    .filter((w) => w.meaningKo && w.meaningKo.length > 0)
    .sort(() => Math.random() - 0.5)
    .slice(0, 6);
  if (pool.length < 3) return [];
  const cards: MatchCard[] = [];
  for (const w of pool) {
    cards.push({ id: `en-${w.id}`, pairId: w.id, content: w.word, type: 'en', matched: false });
    cards.push({ id: `ko-${w.id}`, pairId: w.id, content: w.meaningKo, type: 'ko', matched: false });
  }
  return shuffle(cards);
}

function buildSentenceBuilder(
  sentences: Sentence[],
): { sentence: Sentence; pool: BuilderWord[] } | null {
  const eligible = sentences.filter(
    (s) => s.translation && s.text.split(' ').length >= 4 && s.text.split(' ').length <= 14,
  );
  if (eligible.length === 0) return null;
  const sentence = eligible[Math.floor(Math.random() * eligible.length)];
  const pool = shuffle(
    sentence.text
      .split(' ')
      .map((word, i) => ({
        uid: `bw-${i}-${Math.random().toString(36).slice(2)}`,
        word,
      })),
  );
  return { sentence, pool };
}

/* ─── StudyHub Component ────────────────────────────────────── */

export default function StudyHub({ onClose }: { onClose: () => void }) {
  const {
    user,
    updateWordSRS,
    updateSentenceSRS,
    addMistake,
    removeMistake,
    clearMistakes,
    recordStudy,
    addXP,
  } = useAppStore();

  const vocabulary = user?.vocabulary || [];
  const sentences  = user?.sentences  || [];
  const mistakes   = user?.mistakes   || [];

  const { speak, stop: stopTTS, isSpeaking } = useTTS();

  const [mode, setMode] = useState<StudyMode>('select');

  /* ── MC Quiz ── */
  const [mcQs,       setMCQs]      = useState<MCQuestion[]>([]);
  const [mcIdx,      setMCIdx]     = useState(0);
  const [mcSelected, setMCSelected] = useState<string | null>(null);
  const [mcResult,   setMCResult]  = useState<'correct' | 'incorrect' | null>(null);
  const [mcScore,    setMCScore]   = useState(0);
  const [mcDone,     setMCDone]    = useState(false);
  const mcNextTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Fill-blank ── */
  const [fbQ,      setFBQ]      = useState<FillBlankQ | null>(null);
  const [fbInput,  setFBInput]  = useState('');
  const [fbResult, setFBResult] = useState<'correct' | 'incorrect' | null>(null);
  const [fbScore,  setFBScore]  = useState(0);
  const [fbTotal,  setFBTotal]  = useState(0);
  const fbInputRef = useRef<HTMLInputElement>(null);

  /* ── Dictation ── */
  const [dictSent,   setDictSent]   = useState<Sentence | null>(null);
  const [dictInput,  setDictInput]  = useState('');
  const [dictResult, setDictResult] = useState<'correct' | 'incorrect' | null>(null);
  const [dictScore,  setDictScore]  = useState(0);
  const [dictTotal,  setDictTotal]  = useState(0);
  const [dictPlayed, setDictPlayed] = useState(false);
  const dictInputRef = useRef<HTMLInputElement>(null);

  /* ── Speed Round ── */
  const [speedSetup,    setSpeedSetup]    = useState(true);
  const [speedSecs,     setSpeedSecs]     = useState(60);
  const [speedTimeLeft, setSpeedTimeLeft] = useState(60);
  const [speedQs,       setSpeedQs]       = useState<MCQuestion[]>([]);
  const [speedIdx,      setSpeedIdx]      = useState(0);
  const [speedScore,    setSpeedScore]    = useState(0);
  const [speedTotal,    setSpeedTotal]    = useState(0);
  const [speedDone,     setSpeedDone]     = useState(false);
  const [speedSelected, setSpeedSelected] = useState<string | null>(null);

  /* ── Matching ── */
  const [matchCards, setMatchCards] = useState<MatchCard[]>([]);
  const [matchSel,   setMatchSel]   = useState<string | null>(null);
  const [matchWrong, setMatchWrong] = useState<string[]>([]);
  const [matchDone,  setMatchDone]  = useState(false);

  /* ── Sentence Builder ── */
  const [builderData,   setBuilderData]   = useState<{ sentence: Sentence; pool: BuilderWord[] } | null>(null);
  const [builderAnswer, setBuilderAnswer] = useState<BuilderWord[]>([]);
  const [builderResult, setBuilderResult] = useState<'correct' | 'incorrect' | null>(null);
  const [builderScore,  setBuilderScore]  = useState(0);
  const [builderTotal,  setBuilderTotal]  = useState(0);

  /* ─── Timer effects for Speed Round ─── */
  useEffect(() => {
    if (mode !== 'speed' || speedSetup || speedDone) return;
    const id = setInterval(() => {
      setSpeedTimeLeft((t) => Math.max(0, t - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [mode, speedSetup, speedDone]);

  useEffect(() => {
    if (mode === 'speed' && !speedSetup && !speedDone && speedTimeLeft === 0) {
      setSpeedDone(true);
    }
  }, [speedTimeLeft, mode, speedSetup, speedDone]);

  useEffect(() => {
    if (speedDone && mode === 'speed' && !speedSetup) {
      recordStudy(speedTotal, speedScore);
      addXP(speedScore * 2 + 5);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speedDone]);

  /* ─── Matching done detection ─── */
  useEffect(() => {
    if (mode === 'matching' && !matchDone && matchCards.length > 0 && matchCards.every((c) => c.matched)) {
      setMatchDone(true);
      recordStudy(matchCards.length / 2, matchCards.length / 2);
      addXP(20);
    }
  }, [matchCards, mode, matchDone, recordStudy, addXP]);

  /* ─── Cleanup ─── */
  useEffect(() => {
    return () => {
      if (mcNextTimer.current) clearTimeout(mcNextTimer.current);
      stopTTS();
    };
  }, [stopTTS]);

  /* ─── Mode initializers ─── */
  const startMC = useCallback(() => {
    const qs = buildMCQuestions(vocabulary, sentences);
    if (qs.length === 0) return;
    setMCQs(qs);
    setMCIdx(0); setMCSelected(null); setMCResult(null);
    setMCScore(0); setMCDone(false);
    setMode('mc-quiz');
  }, [vocabulary, sentences]);

  const startFillBlank = useCallback(() => {
    const q = buildFillBlank(sentences);
    setFBQ(q); setFBInput(''); setFBResult(null); setFBScore(0); setFBTotal(0);
    setMode('fill-blank');
    setTimeout(() => fbInputRef.current?.focus(), 100);
  }, [sentences]);

  const nextFillBlank = useCallback(() => {
    const q = buildFillBlank(sentences);
    setFBQ(q); setFBInput(''); setFBResult(null);
    setTimeout(() => fbInputRef.current?.focus(), 80);
  }, [sentences]);

  const startDictation = useCallback(() => {
    const eligible = sentences.filter((s) => s.text.length > 0);
    if (eligible.length === 0) return;
    const sent = eligible[Math.floor(Math.random() * eligible.length)];
    setDictSent(sent); setDictInput(''); setDictResult(null); setDictPlayed(false);
    setDictScore(0); setDictTotal(0);
    setMode('dictation');
    setTimeout(() => dictInputRef.current?.focus(), 100);
  }, [sentences]);

  const nextDictation = useCallback(() => {
    const eligible = sentences.filter((s) => s.text.length > 0);
    if (eligible.length === 0) return;
    const sent = eligible[Math.floor(Math.random() * eligible.length)];
    setDictSent(sent); setDictInput(''); setDictResult(null); setDictPlayed(false);
    setTimeout(() => dictInputRef.current?.focus(), 80);
  }, [sentences]);

  const startSpeed = useCallback(() => {
    const qs = buildMCQuestions(vocabulary, sentences);
    if (qs.length === 0) return;
    setSpeedQs(shuffle([...qs, ...qs, ...qs]).slice(0, 60));
    setSpeedIdx(0); setSpeedScore(0); setSpeedTotal(0);
    setSpeedDone(false); setSpeedSelected(null);
    setSpeedSetup(false);
    setSpeedTimeLeft(speedSecs);
    setMode('speed');
  }, [vocabulary, sentences, speedSecs]);

  const startMatching = useCallback(() => {
    const cards = buildMatchCards(vocabulary);
    if (cards.length === 0) return;
    setMatchCards(cards); setMatchSel(null); setMatchWrong([]); setMatchDone(false);
    setMode('matching');
  }, [vocabulary]);

  const startBuilder = useCallback(() => {
    const data = buildSentenceBuilder(sentences);
    setBuilderData(data); setBuilderAnswer([]); setBuilderResult(null);
    setBuilderScore(0); setBuilderTotal(0);
    setMode('builder');
  }, [sentences]);

  /* ─── goBack ─── */
  const goBack = useCallback(() => {
    stopTTS();
    if (mcNextTimer.current) clearTimeout(mcNextTimer.current);
    setMode('select');
    setSpeedSetup(true);
    setSpeedDone(false);
  }, [stopTTS]);

  /* ─── MC Quiz handler ─── */
  const handleMCAnswer = useCallback(
    (option: string) => {
      if (mcSelected !== null) return;
      const q = mcQs[mcIdx];
      if (!q) return;
      setMCSelected(option);
      const correct = option === q.correct;
      setMCResult(correct ? 'correct' : 'incorrect');

      const newScore = mcScore + (correct ? 1 : 0);
      if (correct) {
        setMCScore(newScore);
        addXP(3);
      } else {
        addMistake({
          type: q.sourceType,
          itemId: q.sourceId,
          mode: 'multiple-choice',
          question: q.question,
          userAnswer: option,
          correctAnswer: q.correct,
        });
      }
      if (q.sourceType === 'vocab') updateWordSRS(q.sourceId, correct ? 4 : 1);
      else updateSentenceSRS(q.sourceId, correct ? 4 : 1);

      mcNextTimer.current = setTimeout(() => {
        if (mcIdx + 1 >= mcQs.length) {
          setMCDone(true);
          recordStudy(mcQs.length, newScore);
          addXP(10);
        } else {
          setMCIdx((i) => i + 1);
          setMCSelected(null);
          setMCResult(null);
        }
      }, 1200);
    },
    [mcSelected, mcQs, mcIdx, mcScore, addXP, addMistake, updateWordSRS, updateSentenceSRS, recordStudy],
  );

  /* ─── Speed Round handler ─── */
  const handleSpeedAnswer = useCallback(
    (option: string) => {
      if (speedDone || speedSelected !== null) return;
      const q = speedQs[speedIdx];
      if (!q) return;
      setSpeedSelected(option);
      const correct = option === q.correct;
      setSpeedTotal((t) => t + 1);
      if (correct) setSpeedScore((s) => s + 1);
      setTimeout(() => {
        setSpeedIdx((i) => {
          const next = i + 1;
          if (next >= speedQs.length) { setSpeedDone(true); return i; }
          return next;
        });
        setSpeedSelected(null);
      }, 500);
    },
    [speedDone, speedSelected, speedQs, speedIdx],
  );

  /* ─── Matching handler ─── */
  const handleMatchClick = useCallback(
    (cardId: string) => {
      const card = matchCards.find((c) => c.id === cardId);
      if (!card || card.matched || matchWrong.includes(cardId)) return;

      if (!matchSel) {
        setMatchSel(cardId);
        return;
      }
      if (matchSel === cardId) { setMatchSel(null); return; }

      const selCard = matchCards.find((c) => c.id === matchSel);
      if (!selCard) { setMatchSel(cardId); return; }

      if (selCard.pairId === card.pairId) {
        setMatchCards((cards) =>
          cards.map((c) => (c.pairId === card.pairId ? { ...c, matched: true } : c)),
        );
        setMatchSel(null);
        addXP(5);
      } else {
        const wrongIds = [matchSel, cardId];
        setMatchWrong(wrongIds);
        setMatchSel(null);
        setTimeout(() => setMatchWrong([]), 900);
      }
    },
    [matchCards, matchSel, matchWrong, addXP],
  );

  /* ─── Builder handlers ─── */
  const handleBuilderWord = useCallback(
    (word: BuilderWord, from: 'pool' | 'answer') => {
      if (builderResult !== null) return;
      if (from === 'pool') {
        setBuilderAnswer((a) => [...a, word]);
        setBuilderData((d) => d ? { ...d, pool: d.pool.filter((w) => w.uid !== word.uid) } : null);
      } else {
        setBuilderData((d) => d ? { ...d, pool: [...d.pool, word] } : null);
        setBuilderAnswer((a) => a.filter((w) => w.uid !== word.uid));
      }
    },
    [builderResult],
  );

  const handleBuilderSubmit = useCallback(() => {
    if (!builderData) return;
    const userSentence = builderAnswer.map((w) => w.word).join(' ');
    const correct = fuzzyMatch(userSentence, builderData.sentence.text);
    setBuilderResult(correct ? 'correct' : 'incorrect');
    setBuilderTotal((t) => t + 1);
    if (correct) {
      setBuilderScore((s) => s + 1);
      addXP(8);
      recordStudy(1, 1);
    } else {
      addMistake({
        type: 'sentence',
        itemId: builderData.sentence.id,
        mode: 'sentence-builder',
        question: builderData.sentence.translation || builderData.sentence.text,
        userAnswer: userSentence,
        correctAnswer: builderData.sentence.text,
      });
      recordStudy(1, 0);
    }
  }, [builderData, builderAnswer, addXP, addMistake, recordStudy]);

  const nextBuilder = useCallback(() => {
    const data = buildSentenceBuilder(sentences);
    setBuilderData(data);
    setBuilderAnswer([]);
    setBuilderResult(null);
  }, [sentences]);

  /* ─── Fill-blank handler ─── */
  const handleFBSubmit = useCallback(() => {
    if (!fbQ || fbResult !== null) return;
    const correct =
      fbInput.trim().toLowerCase() === fbQ.blankWord.toLowerCase() ||
      fuzzyMatch(fbInput, fbQ.blankWord);
    setFBResult(correct ? 'correct' : 'incorrect');
    setFBTotal((t) => t + 1);
    if (correct) {
      setFBScore((s) => s + 1);
      addXP(4);
      recordStudy(1, 1);
    } else {
      addMistake({
        type: 'sentence',
        itemId: fbQ.sentence.id,
        mode: 'fill-blank',
        question: fbQ.display,
        userAnswer: fbInput,
        correctAnswer: fbQ.blankWord,
      });
      recordStudy(1, 0);
    }
  }, [fbQ, fbInput, fbResult, addXP, addMistake, recordStudy]);

  /* ─── Dictation handler ─── */
  const handleDictPlay = useCallback(() => {
    if (!dictSent) return;
    speak(dictSent.text, 0.75);
    setDictPlayed(true);
  }, [dictSent, speak]);

  const handleDictSubmit = useCallback(() => {
    if (!dictSent || dictResult !== null) return;
    const correct = fuzzyMatch(dictInput, dictSent.text);
    setDictResult(correct ? 'correct' : 'incorrect');
    setDictTotal((t) => t + 1);
    if (correct) {
      setDictScore((s) => s + 1);
      addXP(5);
      recordStudy(1, 1);
    } else {
      addMistake({
        type: 'sentence',
        itemId: dictSent.id,
        mode: 'dictation',
        question: '[받아쓰기]',
        userAnswer: dictInput,
        correctAnswer: dictSent.text,
      });
      recordStudy(1, 0);
    }
  }, [dictSent, dictInput, dictResult, addXP, addMistake, recordStudy]);

  /* ════════════════════════════════════════════════════════════
     MODE: SELECT
  ═══════════════════════════════════════════════════════════ */
  if (mode === 'select') {
    const hasVocab = vocabulary.filter((w) => w.meaningKo).length >= 4;
    const hasSent  = sentences.length >= 2;

    const cards = [
      {
        icon: Brain,
        title: '객관식 퀴즈',
        desc: '4개 보기에서 정답 선택',
        grad: 'from-indigo-500/20 to-violet-500/20',
        border: 'border-indigo-500/30',
        ic: 'text-indigo-400',
        ok: hasVocab || hasSent,
        msg: '단어 4개 (뜻 포함) 또는 문장 2개 필요',
        fn: startMC,
        badge: '추천',
      },
      {
        icon: Layers,
        title: '빈칸 채우기',
        desc: '문장에서 빠진 단어 입력',
        grad: 'from-violet-500/20 to-fuchsia-500/20',
        border: 'border-violet-500/30',
        ic: 'text-violet-400',
        ok: hasSent,
        msg: '문장 2개 이상 필요',
        fn: startFillBlank,
      },
      {
        icon: Mic,
        title: '받아쓰기',
        desc: '들리는 영어 문장을 받아쓰기',
        grad: 'from-fuchsia-500/20 to-pink-500/20',
        border: 'border-fuchsia-500/30',
        ic: 'text-fuchsia-400',
        ok: hasSent,
        msg: '문장 2개 이상 필요',
        fn: startDictation,
      },
      {
        icon: Zap,
        title: '스피드 라운드',
        desc: '제한 시간 안에 최대한 많이!',
        grad: 'from-amber-500/20 to-orange-500/20',
        border: 'border-amber-500/30',
        ic: 'text-amber-400',
        ok: hasVocab || hasSent,
        msg: '단어 또는 문장 필요',
        fn: () => { setSpeedSetup(true); setMode('speed'); },
        badge: '🔥',
      },
      {
        icon: Gamepad2,
        title: '짝 맞추기',
        desc: '영어-한국어 쌍을 빠르게 매칭',
        grad: 'from-emerald-500/20 to-teal-500/20',
        border: 'border-emerald-500/30',
        ic: 'text-emerald-400',
        ok: hasVocab,
        msg: '뜻이 있는 단어 3개 이상 필요',
        fn: startMatching,
      },
      {
        icon: Shuffle,
        title: '문장 조합',
        desc: '흩어진 단어로 문장 만들기',
        grad: 'from-cyan-500/20 to-sky-500/20',
        border: 'border-cyan-500/30',
        ic: 'text-cyan-400',
        ok: hasSent,
        msg: '4단어 이상 문장 필요',
        fn: startBuilder,
      },
      {
        icon: ListChecks,
        title: '오답 노트',
        desc: `틀린 문제 복습 (${mistakes.length}개)`,
        grad: 'from-red-500/20 to-rose-500/20',
        border: 'border-red-500/30',
        ic: 'text-red-400',
        ok: mistakes.length > 0,
        msg: '아직 오답이 없어요',
        fn: () => setMode('mistakes-review'),
      },
    ];

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/[0.05] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.08] transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
              <Gamepad2 className="text-indigo-400" size={22} /> 학습 모드 선택
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">원하는 방식으로 학습하세요</p>
          </div>
        </div>

        {/* Mode grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.title}
                onClick={card.ok ? card.fn : undefined}
                disabled={!card.ok}
                className={`relative text-left rounded-2xl border p-5 transition-all duration-200 ${
                  card.ok
                    ? `bg-gradient-to-br ${card.grad} ${card.border} hover:scale-[1.02] hover:shadow-lg hover:shadow-black/25 cursor-pointer`
                    : 'bg-white/[0.02] border-white/[0.04] opacity-40 cursor-not-allowed'
                }`}
              >
                {card.badge && card.ok && (
                  <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                    {card.badge}
                  </span>
                )}
                <div className={`w-10 h-10 rounded-xl bg-white/[0.08] flex items-center justify-center mb-3 ${card.ic}`}>
                  <Icon size={20} />
                </div>
                <h3 className="text-sm font-bold text-zinc-100 mb-1">{card.title}</h3>
                <p className="text-xs text-zinc-500">{card.ok ? card.desc : card.msg}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     MODE: MULTIPLE CHOICE QUIZ
  ═══════════════════════════════════════════════════════════ */
  if (mode === 'mc-quiz') {
    if (mcDone || mcQs.length === 0) {
      const pct = mcQs.length > 0 ? Math.round((mcScore / mcQs.length) * 100) : 0;
      return (
        <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-5">
          <div className="w-20 h-20 rounded-full bg-indigo-500/15 flex items-center justify-center mx-auto">
            <Trophy className="text-indigo-400" size={40} />
          </div>
          <h3 className="text-2xl font-bold text-zinc-100">퀴즈 완료!</h3>
          <p className="text-5xl font-black text-indigo-400">{mcScore} <span className="text-2xl text-zinc-500">/ {mcQs.length}</span></p>
          <p className="text-sm text-zinc-400">정확도 {pct}%</p>
          <div className="flex gap-3 justify-center pt-4">
            <button onClick={startMC} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-400 transition-colors">
              <RotateCcw size={15} /> 다시 하기
            </button>
            <button onClick={goBack} className="px-5 py-3 rounded-xl bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1] transition-colors">모드 선택</button>
          </div>
        </div>
      );
    }
    const q = mcQs[mcIdx];
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={goBack} className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors text-sm">
            <ChevronLeft size={18} /> 나가기
          </button>
          <span className="text-sm font-bold text-zinc-300">{mcIdx + 1} / {mcQs.length}</span>
          <span className="text-sm text-emerald-400 font-bold">✓ {mcScore}</span>
        </div>
        <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
            style={{ width: `${(mcIdx / mcQs.length) * 100}%` }}
          />
        </div>
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">
            {q.dir === 'en-ko'
              ? q.sourceType === 'vocab' ? '영어 단어 → 한국어 뜻' : '영어 문장 → 한국어'
              : '한국어 → 영어 단어'}
          </p>
          <p className={`font-bold text-zinc-100 leading-relaxed ${q.sourceType === 'sentence' ? 'text-base' : 'text-3xl'}`}>
            {q.question}
          </p>
          {q.hint && <p className="text-xs text-indigo-300/70 font-mono mt-1">{q.hint}</p>}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {q.options.map((opt) => {
            const isSel = mcSelected === opt;
            const isCorrect = opt === q.correct;
            let cls = 'bg-white/[0.03] border-white/[0.08] text-zinc-300 hover:bg-white/[0.07] hover:border-indigo-500/30 hover:text-zinc-100';
            if (mcResult !== null && isCorrect) cls = 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200';
            else if (isSel && mcResult === 'incorrect') cls = 'bg-red-500/20 border-red-500/40 text-red-200';
            return (
              <button
                key={opt}
                onClick={() => handleMCAnswer(opt)}
                disabled={mcResult !== null}
                className={`text-left rounded-xl border px-4 py-3.5 text-sm font-medium transition-all ${cls}`}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {mcResult !== null && (
          <div className={`rounded-xl px-4 py-3 border text-sm font-semibold flex items-center gap-2 ${
            mcResult === 'correct'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
              : 'bg-red-500/10 border-red-500/20 text-red-300'
          }`}>
            {mcResult === 'correct'
              ? <><CheckCircle2 size={15} /> 정답! +3 XP</>
              : <><X size={15} /> 오답 — 정답: <span className="font-bold text-zinc-200 ml-1">{q.correct}</span></>}
          </div>
        )}
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     MODE: FILL-IN-BLANK
  ═══════════════════════════════════════════════════════════ */
  if (mode === 'fill-blank') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={goBack} className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors text-sm">
            <ChevronLeft size={18} /> 나가기
          </button>
          <span className="text-sm text-zinc-400">빈칸 채우기 · {fbScore}/{fbTotal}</span>
        </div>

        {!fbQ ? (
          <div className="py-16 text-center space-y-4">
            <p className="text-zinc-400">5단어 이상의 문장이 필요해요.</p>
            <button onClick={goBack} className="px-5 py-3 rounded-xl bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1] transition-colors">돌아가기</button>
          </div>
        ) : (
          <>
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-6 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">빈칸에 알맞은 영어 단어를 입력하세요</p>
              <p className="text-xl font-bold text-zinc-100 leading-relaxed">{fbQ.display}</p>
              {fbQ.sentence.translation && (
                <p className="text-sm text-emerald-300/70 italic border-t border-white/[0.05] pt-2 mt-2">
                  {fbQ.sentence.translation}
                </p>
              )}
            </div>

            {fbResult === null ? (
              <div className="flex gap-2">
                <input
                  ref={fbInputRef}
                  type="text"
                  value={fbInput}
                  onChange={(e) => setFBInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fbInput.trim() && handleFBSubmit()}
                  placeholder="단어를 입력하세요..."
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-zinc-100 outline-none focus:border-violet-500/50 transition-colors placeholder:text-zinc-600"
                />
                <button
                  onClick={handleFBSubmit}
                  disabled={!fbInput.trim()}
                  className="px-5 py-3 rounded-xl bg-violet-500 text-white font-bold hover:bg-violet-400 disabled:opacity-40 transition-colors"
                >
                  확인
                </button>
              </div>
            ) : (
              <div className={`rounded-xl border px-5 py-4 space-y-3 ${
                fbResult === 'correct'
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : 'bg-red-500/10 border-red-500/20'
              }`}>
                <p className={`font-bold flex items-center gap-2 ${fbResult === 'correct' ? 'text-emerald-300' : 'text-red-300'}`}>
                  {fbResult === 'correct' ? <><CheckCircle2 size={15} /> 정답! +4 XP</> : <><X size={15} /> 오답</>}
                </p>
                {fbResult === 'incorrect' && (
                  <p className="text-sm text-zinc-400">
                    정답: <span className="text-zinc-200 font-semibold">{fbQ.blankWord}</span>
                  </p>
                )}
                <div className="flex gap-2 pt-1">
                  <button onClick={nextFillBlank} className="flex-1 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-bold hover:bg-violet-400 transition-colors">
                    다음 문제 →
                  </button>
                  <button onClick={goBack} className="px-4 py-2.5 rounded-xl bg-white/[0.06] text-zinc-400 text-sm hover:bg-white/[0.1] transition-colors">
                    나가기
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     MODE: DICTATION
  ═══════════════════════════════════════════════════════════ */
  if (mode === 'dictation') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => { stopTTS(); goBack(); }} className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors text-sm">
            <ChevronLeft size={18} /> 나가기
          </button>
          <span className="text-sm text-zinc-400">받아쓰기 · {dictScore}/{dictTotal}</span>
        </div>

        {!dictSent ? (
          <p className="text-center text-zinc-400 py-16">문장이 없어요.</p>
        ) : (
          <>
            <div className="rounded-2xl bg-gradient-to-br from-fuchsia-500/10 to-pink-500/10 border border-fuchsia-500/20 p-8 flex flex-col items-center gap-5">
              <Mic className="text-fuchsia-400 opacity-60" size={32} />
              <p className="text-sm text-zinc-400 text-center">문장을 듣고 그대로 받아쓰세요</p>
              <button
                onClick={handleDictPlay}
                disabled={isSpeaking}
                className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-fuchsia-500 hover:bg-fuchsia-400 text-white font-bold text-base shadow-lg shadow-fuchsia-500/25 transition-all disabled:opacity-60"
              >
                {isSpeaking ? <Pause size={20} /> : <Play size={20} />}
                {!dictPlayed ? '▶ 듣기' : isSpeaking ? '재생 중...' : '다시 듣기'}
              </button>
              {dictPlayed && <p className="text-xs text-zinc-600">버튼을 다시 누르면 느리게 들을 수 있어요</p>}
            </div>

            {dictResult === null ? (
              <div className="space-y-3">
                <input
                  ref={dictInputRef}
                  type="text"
                  value={dictInput}
                  onChange={(e) => setDictInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && dictInput.trim() && handleDictSubmit()}
                  placeholder="들은 영어 문장을 입력하세요..."
                  disabled={!dictPlayed}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-zinc-100 outline-none focus:border-fuchsia-500/50 transition-colors disabled:opacity-40 placeholder:text-zinc-600"
                />
                <button
                  onClick={handleDictSubmit}
                  disabled={!dictInput.trim() || !dictPlayed}
                  className="w-full py-3 rounded-xl bg-fuchsia-500 text-white font-bold hover:bg-fuchsia-400 disabled:opacity-40 transition-colors"
                >
                  확인
                </button>
              </div>
            ) : (
              <div className={`rounded-xl border px-5 py-4 space-y-3 ${
                dictResult === 'correct'
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : 'bg-red-500/10 border-red-500/20'
              }`}>
                <p className={`font-bold flex items-center gap-2 ${dictResult === 'correct' ? 'text-emerald-300' : 'text-red-300'}`}>
                  {dictResult === 'correct' ? <><CheckCircle2 size={15} /> 정답! +5 XP</> : <><X size={15} /> 아쉬워요</>}
                </p>
                <p className="text-sm text-zinc-300 font-mono">&quot;{dictSent.text}&quot;</p>
                {dictSent.translation && (
                  <p className="text-xs text-zinc-500 italic">{dictSent.translation}</p>
                )}
                <div className="flex gap-2 pt-1">
                  <button onClick={nextDictation} className="flex-1 py-2.5 rounded-xl bg-fuchsia-500 text-white text-sm font-bold hover:bg-fuchsia-400 transition-colors">
                    다음 →
                  </button>
                  <button onClick={() => { stopTTS(); goBack(); }} className="px-4 py-2.5 rounded-xl bg-white/[0.06] text-zinc-400 text-sm hover:bg-white/[0.1] transition-colors">
                    나가기
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     MODE: SPEED ROUND
  ═══════════════════════════════════════════════════════════ */
  if (mode === 'speed') {
    if (speedSetup) {
      return (
        <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={goBack} className="p-2 rounded-xl bg-white/[0.05] text-zinc-400 hover:text-zinc-200 transition-colors">
              <ChevronLeft size={18} />
            </button>
            <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
              <Zap className="text-amber-400" size={20} /> 스피드 라운드
            </h3>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-6 space-y-5">
            <p className="text-sm text-zinc-300">제한 시간 안에 최대한 많은 문제를 맞히세요!</p>
            <div className="space-y-3">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">제한 시간 선택</p>
              <div className="flex gap-2">
                {[30, 60, 120].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSpeedSecs(s)}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${
                      speedSecs === s
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-white/[0.04] border-white/[0.08] text-zinc-400 hover:border-white/[0.15]'
                    }`}
                  >
                    {s}초
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={startSpeed}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-lg hover:opacity-90 transition-opacity shadow-lg shadow-amber-500/25"
            >
              🚀 시작!
            </button>
          </div>
        </div>
      );
    }

    if (speedDone) {
      const pct = speedTotal > 0 ? Math.round((speedScore / speedTotal) * 100) : 0;
      return (
        <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-5">
          <div className="w-20 h-20 rounded-full bg-amber-500/15 flex items-center justify-center mx-auto">
            <Trophy className="text-amber-400" size={40} />
          </div>
          <h3 className="text-2xl font-bold text-zinc-100">시간 종료!</h3>
          <p className="text-5xl font-black text-amber-400">{speedScore}</p>
          <p className="text-sm text-zinc-400">총 {speedTotal}문제 · 정확도 {pct}%</p>
          <div className="flex gap-3 justify-center pt-4">
            <button onClick={() => setSpeedSetup(true)} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-white font-semibold hover:bg-amber-400 transition-colors">
              <RotateCcw size={15} /> 다시
            </button>
            <button onClick={goBack} className="px-5 py-3 rounded-xl bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1] transition-colors">모드 선택</button>
          </div>
        </div>
      );
    }

    const sq = speedQs[speedIdx];
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-zinc-300">⚡ {speedScore} 정답</span>
          <span className={`text-2xl font-black tabular-nums ${speedTimeLeft <= 10 ? 'text-red-400 animate-pulse' : 'text-amber-400'}`}>
            {speedTimeLeft}s
          </span>
          <span className="text-sm text-zinc-500">{speedTotal}문제</span>
        </div>
        <div className="h-2 bg-white/[0.05] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-1000"
            style={{ width: `${(speedTimeLeft / speedSecs) * 100}%` }}
          />
        </div>
        {sq && (
          <>
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5">
              <p className={`font-bold text-zinc-100 leading-relaxed ${sq.sourceType === 'sentence' ? 'text-base' : 'text-2xl'}`}>
                {sq.question}
              </p>
              {sq.hint && <p className="text-xs text-indigo-300/70 font-mono mt-1">{sq.hint}</p>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {sq.options.map((opt) => {
                let cls = 'bg-white/[0.04] border-white/[0.08] text-zinc-300 hover:bg-white/[0.09]';
                if (speedSelected !== null) {
                  if (opt === sq.correct) cls = 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200';
                  else if (opt === speedSelected) cls = 'bg-red-500/20 border-red-500/40 text-red-200';
                }
                return (
                  <button
                    key={opt}
                    onClick={() => handleSpeedAnswer(opt)}
                    disabled={speedSelected !== null}
                    className={`text-left rounded-xl border px-3 py-3.5 text-sm font-medium transition-all ${cls}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     MODE: MATCHING GAME
  ═══════════════════════════════════════════════════════════ */
  if (mode === 'matching') {
    if (matchCards.length === 0) {
      return (
        <div className="max-w-lg mx-auto py-16 text-center space-y-4">
          <p className="text-zinc-400">뜻이 있는 단어가 3개 이상 필요해요.</p>
          <button onClick={goBack} className="px-5 py-3 rounded-xl bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1] transition-colors">돌아가기</button>
        </div>
      );
    }
    if (matchDone) {
      return (
        <div className="max-w-lg mx-auto py-16 px-4 text-center space-y-5">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
            <Trophy className="text-emerald-400" size={40} />
          </div>
          <h3 className="text-2xl font-bold text-zinc-100">완벽 매칭!</h3>
          <p className="text-sm text-zinc-400">모든 쌍을 맞혔어요 🎉 +20 XP</p>
          <div className="flex gap-3 justify-center pt-4">
            <button onClick={startMatching} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-400 transition-colors">
              <RotateCcw size={15} /> 다시
            </button>
            <button onClick={goBack} className="px-5 py-3 rounded-xl bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1] transition-colors">나가기</button>
          </div>
        </div>
      );
    }
    const pairsTotal   = matchCards.length / 2;
    const pairsMatched = matchCards.filter((c) => c.matched).length / 2;
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={goBack} className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors text-sm">
            <ChevronLeft size={18} /> 나가기
          </button>
          <span className="text-sm font-bold text-zinc-300">{pairsMatched} / {pairsTotal} 쌍 매칭</span>
        </div>
        <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
            style={{ width: `${(pairsMatched / pairsTotal) * 100}%` }}
          />
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {matchCards.map((card) => {
            const isSel   = matchSel === card.id;
            const isWrong = matchWrong.includes(card.id);
            let cls = 'bg-white/[0.04] border-white/[0.08] text-zinc-300 hover:bg-white/[0.09] hover:border-white/[0.15] cursor-pointer';
            if (card.matched) cls = 'bg-emerald-500/15 border-emerald-500/25 text-emerald-300 cursor-default';
            else if (isWrong) cls = 'bg-red-500/20 border-red-500/40 text-red-300';
            else if (isSel)   cls = 'bg-indigo-500/20 border-indigo-500/40 text-indigo-200 ring-1 ring-indigo-500/50';
            return (
              <button
                key={card.id}
                onClick={() => handleMatchClick(card.id)}
                disabled={card.matched}
                className={`rounded-xl border px-2 py-4 text-xs font-semibold text-center transition-all ${cls}`}
              >
                <span className={`text-[9px] block mb-1 font-mono ${card.matched ? 'text-emerald-600' : 'text-zinc-600'}`}>
                  {card.type === 'en' ? 'EN' : 'KO'}
                </span>
                {card.content}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-zinc-600 text-center">
          영어 카드와 한국어 카드를 순서대로 클릭해서 쌍을 맞추세요
        </p>
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     MODE: SENTENCE BUILDER
  ═══════════════════════════════════════════════════════════ */
  if (mode === 'builder') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={goBack} className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors text-sm">
            <ChevronLeft size={18} /> 나가기
          </button>
          <span className="text-sm text-zinc-400">문장 조합 · {builderScore}/{builderTotal}</span>
        </div>

        {!builderData ? (
          <div className="py-16 text-center space-y-4">
            <p className="text-zinc-400">4~14단어의 번역된 문장이 필요해요.</p>
            <button onClick={goBack} className="px-5 py-3 rounded-xl bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1] transition-colors">돌아가기</button>
          </div>
        ) : (
          <>
            {/* Korean hint */}
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">한국어 번역</p>
              <p className="text-lg font-semibold text-emerald-300">{builderData.sentence.translation || '(번역 없음)'}</p>
            </div>

            {/* Answer area */}
            <div className="rounded-2xl border-2 border-dashed border-white/[0.1] p-4 min-h-[72px] bg-white/[0.02]">
              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-2">내 답 (클릭하면 되돌아가요)</p>
              <div className="flex flex-wrap gap-2">
                {builderAnswer.map((w) => (
                  <button
                    key={w.uid}
                    onClick={() => handleBuilderWord(w, 'answer')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                      builderResult === 'correct'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                        : builderResult === 'incorrect'
                        ? 'bg-red-500/15 text-red-300 border border-red-500/25 cursor-default'
                        : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 hover:bg-cyan-500/25'
                    }`}
                  >
                    {w.word}
                  </button>
                ))}
                {builderAnswer.length === 0 && (
                  <p className="text-xs text-zinc-700">아래 단어를 클릭해서 배치하세요</p>
                )}
              </div>
            </div>

            {/* Word pool */}
            <div className="flex flex-wrap gap-2">
              {builderData.pool.map((w) => (
                <button
                  key={w.uid}
                  onClick={() => handleBuilderWord(w, 'pool')}
                  disabled={builderResult !== null}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium bg-white/[0.06] border border-white/[0.09] text-zinc-300 hover:bg-white/[0.12] hover:text-zinc-100 transition-all disabled:opacity-40"
                >
                  {w.word}
                </button>
              ))}
            </div>

            {/* Submit / Result */}
            {builderResult === null ? (
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!builderData) return;
                    const allWords = [...builderData.pool, ...builderAnswer];
                    setBuilderAnswer([]);
                    setBuilderData((d) => d ? { ...d, pool: shuffle(allWords) } : null);
                  }}
                  className="px-4 py-3 rounded-xl bg-white/[0.06] text-zinc-400 hover:bg-white/[0.1] transition-colors text-sm"
                >
                  초기화
                </button>
                <button
                  onClick={handleBuilderSubmit}
                  disabled={builderAnswer.length === 0}
                  className="flex-1 py-3 rounded-xl bg-cyan-500 text-white font-bold hover:bg-cyan-400 disabled:opacity-40 transition-colors"
                >
                  제출하기
                </button>
              </div>
            ) : (
              <div className={`rounded-xl border px-5 py-4 space-y-3 ${
                builderResult === 'correct'
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : 'bg-red-500/10 border-red-500/20'
              }`}>
                <p className={`font-bold flex items-center gap-2 ${builderResult === 'correct' ? 'text-emerald-300' : 'text-red-300'}`}>
                  {builderResult === 'correct' ? <><CheckCircle2 size={15} /> 정답! +8 XP</> : <><X size={15} /> 아쉬워요</>}
                </p>
                {builderResult === 'incorrect' && (
                  <p className="text-sm text-zinc-400">
                    정답: <span className="text-zinc-200 font-mono">{builderData.sentence.text}</span>
                  </p>
                )}
                <button
                  onClick={nextBuilder}
                  className="w-full py-2.5 rounded-xl bg-cyan-500 text-white text-sm font-bold hover:bg-cyan-400 transition-colors"
                >
                  다음 문장 →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  /* ════════════════════════════════════════════════════════════
     MODE: MISTAKES REVIEW
  ═══════════════════════════════════════════════════════════ */
  if (mode === 'mistakes-review') {
    const modeLabels: Record<string, string> = {
      'multiple-choice': '객관식',
      'fill-blank':      '빈칸',
      'dictation':       '받아쓰기',
      'sentence-builder': '문장조합',
      'speed':           '스피드',
    };
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors text-sm">
            <ChevronLeft size={18} /> 나가기
          </button>
          <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2 flex-1">
            <ListChecks size={16} className="text-red-400" /> 오답 노트 ({mistakes.length})
          </h3>
          {mistakes.length > 0 && (
            <button
              onClick={clearMistakes}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
            >
              <Trash2 size={12} /> 모두 삭제
            </button>
          )}
        </div>

        {mistakes.length === 0 ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="text-emerald-400" size={30} />
            </div>
            <p className="text-zinc-400 font-medium">오답이 없어요! 👏</p>
            <p className="text-xs text-zinc-600">학습을 시작하면 틀린 문제가 여기에 기록돼요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {mistakes.slice(0, 60).map((m) => (
              <div key={m.id} className="bg-white/[0.03] border border-red-500/15 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-300">
                      {modeLabels[m.mode] || m.mode}
                    </span>
                    <span className="text-[10px] text-zinc-600">
                      {new Date(m.timestamp).toLocaleDateString('ko-KR', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <button
                    onClick={() => removeMistake(m.id)}
                    className="text-zinc-600 hover:text-red-400 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
                <p className="text-xs text-zinc-500 line-clamp-1">질문: <span className="text-zinc-300">{m.question}</span></p>
                <div className="flex gap-4 text-xs flex-wrap">
                  <span className="text-red-400/80">내 답: <span className="text-zinc-300">{m.userAnswer}</span></span>
                  <span className="text-emerald-400/80">정답: <span className="text-zinc-300">{m.correctAnswer}</span></span>
                </div>
                <button
                  onClick={() => { speak(m.correctAnswer); }}
                  className="flex items-center gap-1 text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  <Volume2 size={11} /> 정답 듣기
                </button>
              </div>
            ))}
            {mistakes.length > 60 && (
              <p className="text-center text-xs text-zinc-600">최근 60개만 표시 (전체 {mistakes.length}개)</p>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
}
