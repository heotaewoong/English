'use client';

import { useState, useMemo, useRef, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BookOpen, Search, Sparkles, Volume2, Plus, Loader2, ChevronLeft,
  RotateCcw, CheckCircle2, Trash2, AlertCircle, Brain, Target, Flame,
  Quote, Upload, Pause, FileSpreadsheet, X, Edit2, Check,
  Eye, EyeOff, Gamepad2, BarChart2,
} from 'lucide-react';
import { useTTS } from '@/hooks/useSpeech';
import { useAppStore, VocabularyWord, Sentence, SentenceStatus } from '@/lib/store';
import StudyHub  from './_study/StudyHub';
import Dashboard from './_study/Dashboard';

/* ─── SRS config ──────────────────────────────────────────── */

const levelConfig: Record<number, { color: string; bg: string; label: string }> = {
  0: { color: 'text-zinc-400',    bg: 'bg-zinc-500/10',    label: 'New' },
  1: { color: 'text-orange-400',  bg: 'bg-orange-500/10',  label: 'Learning' },
  2: { color: 'text-blue-400',    bg: 'bg-blue-500/10',    label: 'Review' },
  3: { color: 'text-indigo-400',  bg: 'bg-indigo-500/10',  label: 'Solid' },
  4: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Mastered' },
  5: { color: 'text-yellow-400',  bg: 'bg-yellow-500/10',  label: 'Pro' },
};

const statusConfig: Record<SentenceStatus, { label: string; color: string; bg: string }> = {
  new:   { label: '신규',   color: 'text-zinc-300',    bg: 'bg-zinc-500/15' },
  known: { label: '알아요', color: 'text-emerald-300', bg: 'bg-emerald-500/15' },
  hold:  { label: '보류',   color: 'text-amber-300',   bg: 'bg-amber-500/15' },
};

const SRS_BUTTONS = [
  { rating: 1, label: 'Again', sub: '1일', cls: 'bg-red-500/15 text-red-300 border-red-500/25 hover:bg-red-500/25' },
  { rating: 2, label: 'Hard',  sub: '4일', cls: 'bg-orange-500/15 text-orange-300 border-orange-500/25 hover:bg-orange-500/25' },
  { rating: 4, label: 'Good',  sub: '7일', cls: 'bg-blue-500/15 text-blue-300 border-blue-500/25 hover:bg-blue-500/25' },
  { rating: 5, label: 'Easy',  sub: '14일', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/25' },
];

/* ─── Helpers ──────────────────────────────────────────────── */

function timeUntil(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return '지금 복습';
  const d = Math.floor(diff / 86400000);
  if (d === 0) return '오늘';
  if (d === 1) return '내일';
  if (d < 7) return `${d}일 후`;
  if (d < 30) return `${Math.floor(d / 7)}주 후`;
  return `${Math.floor(d / 30)}개월 후`;
}

function normalizeQuizAnswer(s: string) {
  return s.toLowerCase().replace(/[^a-z가-힣0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

/* ─── Inner component (uses searchParams) ─────────────────── */

function WordBankInner() {
  const searchParams = useSearchParams();
  const rawTab = searchParams.get('tab');
  const initialTab =
    rawTab === 'sentences' ? 'sentences' :
    rawTab === 'study'     ? 'study' :
    rawTab === 'dashboard' ? 'dashboard' : 'vocab';
  const [tab, setTab] = useState<'vocab' | 'sentences' | 'study' | 'dashboard'>(initialTab);

  const {
    user, addWord, updateWordSRS, deleteWord,
    addSentence, addSentencesBulk, updateSentenceStatus, updateSentenceSRS, updateSentence, deleteSentence,
  } = useAppStore();

  const vocabulary = user?.vocabulary || [];
  const sentences  = user?.sentences  || [];
  const { speak, stop: stopTTS, isSpeaking } = useTTS();

  /* ════════════════════════════════════════════════
     VOCABULARY STATE
  ═══════════════════════════════════════════════ */
  const [vocabSearch, setVocabSearch]     = useState('');
  const [filterLevel, setFilterLevel]     = useState<number | null>(null);
  const [flashcardMode, setFlashcardMode] = useState(false);
  const [flashIdx, setFlashIdx]           = useState(0);
  const [flashFlipped, setFlashFlipped]   = useState(false);
  const [isLooking, setIsLooking]         = useState(false);
  const [wordInput, setWordInput]         = useState('');
  const [vocabError, setVocabError]       = useState<string | null>(null);
  const [discovered, setDiscovered]       = useState<Partial<VocabularyWord>[]>([]);
  const [flashDir, setFlashDir]           = useState<'en-ko' | 'ko-en'>('en-ko');
  const [flashDone,    setFlashDone]      = useState(false);
  const [practiceDone, setPracticeDone]   = useState(false);
  const [practiceDir,  setPracticeDir]    = useState<'en-ko' | 'ko-en'>('en-ko');

  const vocabFiltered = useMemo(() => vocabulary.filter((w) => {
    if (filterLevel !== null && w.level !== filterLevel) return false;
    const q = vocabSearch.toLowerCase().trim();
    if (!q) return true;
    return w.word.toLowerCase().includes(q) || w.meaningKo.toLowerCase().includes(q) || (w.definitionEn || '').toLowerCase().includes(q);
  }), [vocabulary, vocabSearch, filterLevel]);

  const vocabReviewQueue = useMemo(() => vocabulary.filter(w => new Date(w.nextReview) <= new Date()), [vocabulary]);
  const flashList = vocabReviewQueue.length > 0 ? vocabReviewQueue : vocabulary;

  const vocabStats = useMemo(() => ({
    total:    vocabulary.length,
    mastered: vocabulary.filter(w => w.level >= 4).length,
    learning: vocabulary.filter(w => w.level >= 1 && w.level < 4).length,
    dueToday: vocabReviewQueue.length,
  }), [vocabulary, vocabReviewQueue.length]);

  const lookupWord = async (word: string) => {
    if (!word.trim()) return;
    setVocabError(null);
    setIsLooking(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'vocab_lookup',
          context: word,
          messages: [{ role: 'user', content: `Look up: ${word}` }],
        }),
      });
      if (!res.ok) throw new Error('AI 검색 실패. GROQ_API_KEY를 확인하세요.');
      const raw = await res.json();          // { result: "json string" }
      let data: Partial<VocabularyWord> & { word?: string };
      try {
        data = JSON.parse(raw.result ?? '{}');
      } catch {
        data = { word: word.trim(), meaningKo: '', definitionEn: String(raw.result || '').slice(0, 200) };
      }
      setDiscovered(prev => [{
        word: data.word || word.trim(),
        pronunciation: data.pronunciation || '',
        meaningKo: data.meaningKo || '',
        definitionEn: data.definitionEn || '',
        example: data.example || '',
        synonyms: (data as { synonyms?: string[] }).synonyms || [],
        source: 'AI Dictionary',
      }, ...prev]);
      setWordInput('');
    } catch (e) {
      setVocabError(e instanceof Error ? e.message : '단어 검색 중 오류');
    } finally {
      setIsLooking(false);
    }
  };

  const handleAddWord = (w: Partial<VocabularyWord>) => {
    if (!w.word) return;
    addWord({ word: w.word, meaningKo: w.meaningKo || '', definitionEn: w.definitionEn || '', pronunciation: w.pronunciation || '', example: w.example || '', source: w.source, sourceContext: '', synonyms: w.synonyms || [] });
    setDiscovered(prev => prev.filter(d => d.word !== w.word));
  };

  const handleFlashSRS = (wordId: string, perf: number) => {
    updateWordSRS(wordId, perf);
    if (flashIdx < flashList.length - 1) { setFlashIdx(flashIdx + 1); setFlashFlipped(false); }
    else { setFlashDone(true); }
  };

  /* ════════════════════════════════════════════════
     SENTENCES STATE
  ═══════════════════════════════════════════════ */
  const [sentSearch, setSentSearch]           = useState('');
  const [filterStatus, setFilterStatus]       = useState<'all' | SentenceStatus>('all');
  const [practiceMode, setPracticeMode]       = useState(false);
  const [practiceIdx, setPracticeIdx]         = useState(0);
  const [practiceFlipped, setPracticeFlipped] = useState(false);
  const [newText, setNewText]                 = useState('');
  const [newTranslation, setNewTranslation]   = useState('');
  const [newRepeat, setNewRepeat]             = useState(3);
  const [isTranslating, setIsTranslating]     = useState(false);
  const [sentError, setSentError]             = useState<string | null>(null);
  const [importMsg, setImportMsg]             = useState<string | null>(null);
  const [editingId, setEditingId]             = useState<string | null>(null);
  const [editText, setEditText]               = useState('');
  const [editTranslation, setEditTranslation] = useState('');
  const [activeSpeechId, setActiveSpeechId]   = useState<string | null>(null);
  // Inline sentence quiz
  const [quizId, setQuizId]               = useState<string | null>(null);
  const [quizInput, setQuizInput]         = useState('');
  const [quizResult, setQuizResult]       = useState<'correct' | 'incorrect' | null>(null);
  const [quizDir, setQuizDir]             = useState<'ko-en' | 'en-ko'>('ko-en');
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const ankiInputRef   = useRef<HTMLInputElement>(null);
  const quizInputRef   = useRef<HTMLInputElement>(null);
  const speechSeqRef   = useRef<{ id: string; remaining: number } | null>(null);

  const sentFiltered = useMemo(() => {
    let list = sentences;
    if (filterStatus !== 'all') list = list.filter(s => s.status === filterStatus);
    const q = sentSearch.trim().toLowerCase();
    if (q) list = list.filter(s => s.text.toLowerCase().includes(q) || s.translation.toLowerCase().includes(q));
    return list;
  }, [sentences, filterStatus, sentSearch]);

  const sentReviewQueue = useMemo(() => sentences.filter(s => s.status !== 'hold' && new Date(s.nextReview) <= new Date()), [sentences]);
  const practiceList    = sentReviewQueue.length > 0 ? sentReviewQueue : sentences.filter(s => s.status !== 'hold');
  const practiceCurrent = practiceList[practiceIdx];

  const sentStats = useMemo(() => ({
    total:    sentences.length,
    known:    sentences.filter(s => s.status === 'known').length,
    hold:     sentences.filter(s => s.status === 'hold').length,
    newCount: sentences.filter(s => s.status === 'new').length,
    dueToday: sentReviewQueue.length,
  }), [sentences, sentReviewQueue.length]);

  const fetchTranslation = async (text: string): Promise<string> => {
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'translate',
          context: text,
          messages: [{ role: 'user', content: text }],
        }),
      });
      if (!res.ok) return '';
      const data = await res.json();
      return (data.result || '').replace(/^["']|["']$/g, '').trim().slice(0, 300);
    } catch { return ''; }
  };

  const handleAddSentence = async (autoTranslate = false) => {
    setSentError(null);
    const text = newText.trim();
    if (!text) return;
    let translation = newTranslation.trim();
    if (autoTranslate && !translation) {
      setIsTranslating(true);
      translation = await fetchTranslation(text);
      setIsTranslating(false);
    }
    addSentence({ text, translation, repeatCount: newRepeat });
    setNewText(''); setNewTranslation('');
  };

  const handleImportXlsx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMsg(null); setSentError(null);
    try {
      // Dynamic import to avoid client bundle issues
      const XLSX = await import('xlsx');
      const buf  = await file.arrayBuffer();
      const wb   = XLSX.read(buf, { type: 'array' });
      const candidates: Array<{ text: string; translation: string; status: SentenceStatus; repeatCount: number; source: string }> = [];
      let totalRows = 0;
      for (const name of wb.SheetNames) {
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[name], { defval: '' });
        for (const row of rows) {
          totalRows++;
          const text = String(
            row['내가 모은 영어 문장'] ?? row['English'] ?? row['english'] ??
            row['Sentence'] ?? row['sentence'] ?? row['front'] ?? row['Front'] ?? row['text'] ?? ''
          ).trim();
          if (!text || text.length < 3 || /^https?:/i.test(text)) continue;
          const translation = String(
            row['수동 번역'] ?? row['Korean'] ?? row['korean'] ??
            row['translation'] ?? row['Translation'] ?? row['back'] ?? row['Back'] ?? ''
          ).trim();
          const rawStatus = row['알아요: 1 \n보류: 2'] ?? row['status'] ?? '';
          const status: SentenceStatus =
            (rawStatus === 1 || rawStatus === '1' || rawStatus === 'known') ? 'known' :
            (rawStatus === 2 || rawStatus === '2' || rawStatus === 'hold') ? 'hold' : 'new';
          const rr = row['텍스트 반복 횟수: n'] ?? row['repeat'] ?? 3;
          const repeatCount = typeof rr === 'number' ? rr : (parseInt(String(rr), 10) || 3);
          candidates.push({ text, translation, status, repeatCount: Math.min(Math.max(repeatCount, 1), 20), source: file.name });
        }
      }
      const added = addSentencesBulk(candidates);
      setImportMsg(`✓ ${added}개 문장 추가됨 (총 ${totalRows}행 중 ${candidates.length}개 유효)`);
    } catch (err) {
      setSentError(err instanceof Error ? err.message : 'xlsx 파일을 읽지 못했어요.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /* ── Anki text / tab-separated import ──────────────────── */
  // Anki "Notes in Plain Text" export: front\tback\ttags  (one note per line)
  // Also supports simple "english\tkorean" format
  const handleImportAnki = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMsg(null); setSentError(null);
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/);
      const candidates: Array<{ text: string; translation: string; status: SentenceStatus; repeatCount: number; source: string }> = [];
      for (const line of lines) {
        if (!line.trim() || line.startsWith('#')) continue; // skip comments / empty
        // Strip HTML tags that Anki sometimes embeds
        const clean = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
        const parts = line.split('\t');
        const front = clean(parts[0] ?? '');
        const back  = clean(parts[1] ?? '');
        if (!front || front.length < 3) continue;
        // Skip if front doesn't contain any Latin characters (likely not English)
        if (!/[a-zA-Z]/.test(front)) continue;
        candidates.push({ text: front, translation: back, status: 'new', repeatCount: 3, source: file.name });
      }
      if (candidates.length === 0) {
        setSentError('가져올 문장이 없어요. Anki에서 "노트를 텍스트로 내보내기" 형식(.txt)을 사용해주세요.');
        return;
      }
      const added = addSentencesBulk(candidates);
      setImportMsg(`✓ ${added}개 문장 추가됨 (Anki · ${lines.length}행 처리)`);
    } catch (err) {
      setSentError(err instanceof Error ? err.message : 'Anki 파일을 읽지 못했어요.');
    } finally {
      if (ankiInputRef.current) ankiInputRef.current.value = '';
    }
  };

  const speakWithRepeat = useCallback((s: Sentence) => {
    if (isSpeaking && activeSpeechId === s.id) { stopTTS(); setActiveSpeechId(null); speechSeqRef.current = null; return; }
    stopTTS();
    setActiveSpeechId(s.id);
    speechSeqRef.current = { id: s.id, remaining: s.repeatCount };
    speak(s.text);
  }, [isSpeaking, activeSpeechId, stopTTS, speak]);

  useEffect(() => {
    if (!isSpeaking && activeSpeechId && speechSeqRef.current) {
      const seq  = speechSeqRef.current;
      const sent = sentences.find(s => s.id === seq.id);
      if (sent && seq.remaining > 1) {
        seq.remaining -= 1;
        const t = setTimeout(() => { if (speechSeqRef.current?.id === sent.id) speak(sent.text); }, 400);
        return () => clearTimeout(t);
      } else { speechSeqRef.current = null; setActiveSpeechId(null); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSpeaking]);

  const handleSentSRS = (id: string, perf: number) => {
    updateSentenceSRS(id, perf);
    if (practiceIdx < practiceList.length - 1) { setPracticeIdx(practiceIdx + 1); setPracticeFlipped(false); }
    else { setPracticeDone(true); }
  };

  const openQuiz = (id: string) => {
    setQuizId(id); setQuizInput(''); setQuizResult(null);
    setTimeout(() => quizInputRef.current?.focus(), 80);
  };

  const handleCheckQuiz = useCallback((sentence: Sentence) => {
    const correct = quizDir === 'ko-en' ? sentence.text : (sentence.translation || '');
    if (!correct.trim()) { setQuizResult('incorrect'); return; }
    const nc = normalizeQuizAnswer(correct);
    const nu = normalizeQuizAnswer(quizInput);
    if (nc === nu) { setQuizResult('correct'); return; }
    // Fuzzy: 80%+ word overlap counts as correct
    const cWords = nc.split(' ').filter(Boolean);
    const uSet   = new Set(nu.split(' ').filter(Boolean));
    const ratio  = cWords.length ? cWords.filter(w => uSet.has(w)).length / cWords.length : 0;
    setQuizResult(ratio >= 0.8 ? 'correct' : 'incorrect');
  }, [quizDir, quizInput]);

  /* ════════════════════════════════════════════════
     FLASHCARD VIEW (vocab full-screen)
  ═══════════════════════════════════════════════ */
  if (flashcardMode) {
    /* ── Completion screen ── */
    if (flashDone) {
      const soonest = flashList
        .map(w => new Date(w.nextReview).getTime())
        .filter(t => t > Date.now())
        .sort((a, b) => a - b)[0];
      const nextLabel = soonest ? timeUntil(new Date(soonest).toISOString()) : '없음';
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
          <div className="w-24 h-24 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400 mb-6">
            <CheckCircle2 size={52} />
          </div>
          <h3 className="text-3xl font-black text-zinc-100 mb-2">단어 복습 완료! 🎉</h3>
          <p className="text-zinc-400 mb-6">{flashList.length}개 단어를 복습했어요</p>
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl px-8 py-5 mb-8">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">다음 복습까지</p>
            <p className="text-2xl font-bold text-indigo-300">{nextLabel}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setFlashDone(false); setFlashIdx(0); setFlashFlipped(false); }}
              className="px-6 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-zinc-300 hover:bg-white/[0.1] font-semibold transition-colors"
            >
              다시 하기
            </button>
            <button
              onClick={() => { setFlashDone(false); setFlashcardMode(false); setFlashIdx(0); setFlashFlipped(false); }}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors"
            >
              돌아가기
            </button>
          </div>
        </div>
      );
    }

    const word = flashList[flashIdx];
    if (!word) return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400 mb-5"><CheckCircle2 size={44} /></div>
        <h3 className="text-2xl font-bold text-zinc-100 mb-2">복습 완료!</h3>
        <button onClick={() => setFlashcardMode(false)} className="mt-6 px-7 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors">돌아가기</button>
      </div>
    );
    const conf = levelConfig[word.level] || levelConfig[0];
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setFlashcardMode(false)} className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200"><ChevronLeft size={20} /><span className="text-sm">나가기</span></button>
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-bold text-zinc-200">{flashIdx + 1} / {flashList.length}</p>
            {/* Direction toggle */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-white/[0.05] border border-white/[0.06]">
              <button onClick={() => { setFlashDir('en-ko'); setFlashFlipped(false); }}
                className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${flashDir === 'en-ko' ? 'bg-indigo-500 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>
                EN → KO
              </button>
              <button onClick={() => { setFlashDir('ko-en'); setFlashFlipped(false); }}
                className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${flashDir === 'ko-en' ? 'bg-violet-500 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>
                KO → EN
              </button>
            </div>
          </div>
          <div className="w-20" />
        </div>
        <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden mb-10">
          <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500" style={{ width: `${((flashIdx + 1) / flashList.length) * 100}%` }} />
        </div>
        <div onClick={() => !flashFlipped && setFlashFlipped(true)} className="relative w-full min-h-[26rem] cursor-pointer">
          <div className={`relative w-full min-h-[26rem] transition-transform duration-700 [transform-style:preserve-3d] ${flashFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
            {/* Front */}
            <div className="absolute inset-0 [backface-visibility:hidden] bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/[0.08] rounded-3xl flex flex-col p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${conf.bg} ${conf.color}`}>{conf.label}</span>
                <button onClick={(e) => { e.stopPropagation(); speak(flashDir === 'en-ko' ? word.word : word.meaningKo); }} className="p-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-zinc-300 transition-colors"><Volume2 size={18} /></button>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                {flashDir === 'en-ko' ? (
                  <>
                    <h2 className="text-5xl sm:text-6xl font-black text-white mb-4">{word.word}</h2>
                    {word.pronunciation && <p className="text-lg text-indigo-300 font-mono">{word.pronunciation}</p>}
                  </>
                ) : (
                  <>
                    <p className="text-[11px] font-bold text-violet-400 uppercase tracking-widest mb-4">한국어 → 영어</p>
                    <h2 className="text-4xl sm:text-5xl font-black text-white mb-3 leading-snug">{word.meaningKo || '(뜻 없음)'}</h2>
                    {word.definitionEn && <p className="text-xs text-zinc-500 mt-2 leading-relaxed max-w-xs">{word.definitionEn.slice(0, 70)}{word.definitionEn.length > 70 ? '…' : ''}</p>}
                  </>
                )}
              </div>
              <p className="mt-6 pt-6 border-t border-white/[0.05] text-center text-sm text-zinc-500">
                카드를 탭하면 {flashDir === 'en-ko' ? '뜻이' : '영어 단어가'} 나타나요
              </p>
            </div>
            {/* Back */}
            <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gradient-to-br from-indigo-950 to-violet-950 border border-indigo-500/30 rounded-3xl flex flex-col p-8 shadow-2xl overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <button onClick={(e) => { e.stopPropagation(); speak(word.word); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] text-zinc-300 text-xs hover:bg-white/[0.1] transition-colors"><Volume2 size={12} /> {word.word}</button>
                {word.pronunciation && <span className="text-xs text-indigo-300/80 font-mono">{word.pronunciation}</span>}
              </div>
              {flashDir === 'en-ko' ? (
                /* EN→KO back: show Korean meaning prominently */
                <>
                  {word.meaningKo && <div className="text-center mb-5"><p className="text-xs font-bold text-emerald-300/70 uppercase tracking-widest mb-2">뜻 (한국어)</p><h3 className="text-3xl sm:text-4xl font-bold text-white">{word.meaningKo}</h3></div>}
                  {word.definitionEn && <div className="mb-4 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06]"><p className="text-[10px] font-bold text-indigo-300/70 uppercase tracking-widest mb-1.5">Definition</p><p className="text-sm text-zinc-200">{word.definitionEn}</p></div>}
                </>
              ) : (
                /* KO→EN back: show English word prominently */
                <>
                  <div className="text-center mb-5">
                    <p className="text-xs font-bold text-indigo-300/70 uppercase tracking-widest mb-2">영어 단어</p>
                    <h3 className="text-4xl sm:text-5xl font-black text-white">{word.word}</h3>
                    {word.pronunciation && <p className="text-sm text-indigo-300 font-mono mt-2">{word.pronunciation}</p>}
                  </div>
                  {word.meaningKo && <div className="mb-3 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]"><p className="text-[10px] font-bold text-emerald-300/60 uppercase tracking-widest mb-1">뜻</p><p className="text-sm text-zinc-200">{word.meaningKo}</p></div>}
                  {word.definitionEn && <div className="mb-3 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]"><p className="text-[10px] font-bold text-indigo-300/70 uppercase tracking-widest mb-1">Definition</p><p className="text-sm text-zinc-300">{word.definitionEn}</p></div>}
                </>
              )}
              {word.example && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                  <div className="flex items-start justify-between mb-1.5">
                    <p className="text-[10px] font-bold text-indigo-300/70 uppercase tracking-widest">Example</p>
                    <button onClick={(e) => { e.stopPropagation(); speak(word.example); }} className="text-indigo-300 hover:text-indigo-200"><Volume2 size={13} /></button>
                  </div>
                  <p className="text-sm italic text-zinc-300">&ldquo;{word.example}&rdquo;</p>
                </div>
              )}
              <div className="mt-auto pt-4 border-t border-white/[0.08]">
                <p className="text-[11px] text-zinc-400 mb-2.5 text-center">얼마나 잘 기억나요?</p>
                <div className="grid grid-cols-4 gap-2">
                  {SRS_BUTTONS.map(({ rating, label, sub, cls }) => (
                    <button key={rating} onClick={(e) => { e.stopPropagation(); handleFlashSRS(word.id, rating); }} className={`flex flex-col items-center py-2.5 rounded-xl border transition-all ${cls}`}>
                      <span className="text-xs font-bold">{label}</span>
                      <span className="text-[9px] opacity-70 mt-0.5">{sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════
     PRACTICE VIEW (sentences full-screen)
  ═══════════════════════════════════════════════ */
  if (practiceMode) {
    /* ── Completion screen ── */
    if (practiceDone) {
      const soonest = practiceList
        .map(s => new Date(s.nextReview).getTime())
        .filter(t => t > Date.now())
        .sort((a, b) => a - b)[0];
      const nextLabel = soonest ? timeUntil(new Date(soonest).toISOString()) : '없음';
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
          <div className="w-24 h-24 rounded-full bg-violet-500/15 flex items-center justify-center text-violet-400 mb-6">
            <CheckCircle2 size={52} />
          </div>
          <h3 className="text-3xl font-black text-zinc-100 mb-2">문장 복습 완료! 🎉</h3>
          <p className="text-zinc-400 mb-6">{practiceList.length}개 문장을 복습했어요</p>
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl px-8 py-5 mb-8">
            <p className="text-xs text-zinc-500 uppercase tracking-widest mb-1">다음 복습까지</p>
            <p className="text-2xl font-bold text-violet-300">{nextLabel}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setPracticeDone(false); setPracticeIdx(0); setPracticeFlipped(false); }}
              className="px-6 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-zinc-300 hover:bg-white/[0.1] font-semibold transition-colors"
            >
              다시 하기
            </button>
            <button
              onClick={() => { stopTTS(); speechSeqRef.current = null; setActiveSpeechId(null); setPracticeDone(false); setPracticeMode(false); setPracticeIdx(0); setPracticeFlipped(false); }}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition-colors"
            >
              돌아가기
            </button>
          </div>
        </div>
      );
    }

    if (!practiceCurrent) return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400 mb-5"><CheckCircle2 size={44} /></div>
        <h3 className="text-2xl font-bold text-zinc-100 mb-2">복습 완료!</h3>
        <button onClick={() => { stopTTS(); speechSeqRef.current = null; setActiveSpeechId(null); setPracticeMode(false); setPracticeIdx(0); }} className="mt-6 px-7 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold">돌아가기</button>
      </div>
    );
    const conf = levelConfig[practiceCurrent.level] || levelConfig[0];
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <button onClick={() => { stopTTS(); speechSeqRef.current = null; setActiveSpeechId(null); setPracticeMode(false); setPracticeIdx(0); setPracticeFlipped(false); }} className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200"><ChevronLeft size={20} /><span className="text-sm">나가기</span></button>
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-bold text-zinc-200">{practiceIdx + 1} / {practiceList.length}</p>
            {/* Direction toggle */}
            <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-white/[0.05] border border-white/[0.06]">
              <button onClick={() => { setPracticeDir('en-ko'); setPracticeFlipped(false); }}
                className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${practiceDir === 'en-ko' ? 'bg-violet-500 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>
                EN → KO
              </button>
              <button onClick={() => { setPracticeDir('ko-en'); setPracticeFlipped(false); }}
                className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${practiceDir === 'ko-en' ? 'bg-fuchsia-500 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>
                KO → EN
              </button>
            </div>
          </div>
          <div className="w-20" />
        </div>
        <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden mb-10">
          <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500" style={{ width: `${((practiceIdx + 1) / practiceList.length) * 100}%` }} />
        </div>
        <div className="relative w-full min-h-[24rem]">
          <div className={`relative w-full min-h-[24rem] transition-transform duration-700 [transform-style:preserve-3d] ${practiceFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
            {/* Front */}
            <div className="absolute inset-0 [backface-visibility:hidden] bg-gradient-to-br from-zinc-900 to-zinc-950 border border-white/[0.08] rounded-3xl flex flex-col p-7 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${conf.bg} ${conf.color}`}>{conf.label}</span>
                <button onClick={() => speakWithRepeat(practiceCurrent)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/15 text-violet-300 hover:bg-violet-500/25 text-xs font-semibold">
                  {activeSpeechId === practiceCurrent.id && isSpeaking ? <Pause size={12} /> : <Volume2 size={12} />}
                  {practiceCurrent.repeatCount}회
                </button>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
                {practiceDir === 'en-ko' ? (
                  <p className="text-2xl sm:text-3xl font-bold text-zinc-50 leading-relaxed">{practiceCurrent.text}</p>
                ) : practiceCurrent.translation ? (
                  <>
                    <p className="text-[11px] font-bold text-fuchsia-400 uppercase tracking-widest mb-4">한국어 → 영어</p>
                    <p className="text-2xl sm:text-3xl font-bold text-zinc-50 leading-relaxed">{practiceCurrent.translation}</p>
                  </>
                ) : (
                  <>
                    <p className="text-xs text-zinc-500 italic mb-3">번역이 없어요 — 영어 문장을 보여드릴게요</p>
                    <p className="text-2xl sm:text-3xl font-bold text-zinc-50 leading-relaxed">{practiceCurrent.text}</p>
                  </>
                )}
              </div>
              <button onClick={() => setPracticeFlipped(true)} className="mt-5 w-full py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 text-sm font-medium transition-colors border border-white/[0.06]">
                {practiceDir === 'en-ko' ? '뜻 보기 →' : '영어 보기 →'}
              </button>
            </div>
            {/* Back */}
            <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gradient-to-br from-violet-950 to-fuchsia-950 border border-violet-500/30 rounded-3xl flex flex-col p-7 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setPracticeFlipped(false)} className="text-xs text-zinc-400 hover:text-zinc-200 underline">
                  {practiceDir === 'en-ko' ? '← 영어 보기' : '← 한국어 보기'}
                </button>
                <button onClick={() => speakWithRepeat(practiceCurrent)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1] text-xs">
                  {activeSpeechId === practiceCurrent.id && isSpeaking ? <Pause size={11} /> : <Volume2 size={11} />} 영어 듣기
                </button>
              </div>
              {practiceDir === 'en-ko' ? (
                <>
                  <p className="text-sm text-zinc-400 italic text-center mb-4">&ldquo;{practiceCurrent.text}&rdquo;</p>
                  <div className="flex-1 flex items-center justify-center text-center">
                    {practiceCurrent.translation
                      ? <p className="text-2xl sm:text-3xl font-bold text-white leading-relaxed">{practiceCurrent.translation}</p>
                      : <p className="text-base text-zinc-500 italic">번역이 없어요.</p>
                    }
                  </div>
                </>
              ) : (
                <>
                  {practiceCurrent.translation && (
                    <p className="text-sm text-zinc-400 italic text-center mb-4">&ldquo;{practiceCurrent.translation}&rdquo;</p>
                  )}
                  <div className="flex-1 flex items-center justify-center text-center">
                    <p className="text-2xl sm:text-3xl font-bold text-white leading-relaxed">{practiceCurrent.text}</p>
                  </div>
                </>
              )}
              <div className="mt-6 pt-5 border-t border-white/[0.08]">
                <p className="text-[11px] text-zinc-400 mb-2.5 text-center">얼마나 잘 알겠어요?</p>
                <div className="grid grid-cols-4 gap-2">
                  {SRS_BUTTONS.map(({ rating, label, sub, cls }) => (
                    <button key={rating} onClick={() => handleSentSRS(practiceCurrent.id, rating)} className={`flex flex-col items-center py-2.5 rounded-xl border transition-all ${cls}`}>
                      <span className="text-xs font-bold">{label}</span>
                      <span className="text-[9px] opacity-70 mt-0.5">{sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════════
     MAIN VIEW
  ═══════════════════════════════════════════════ */
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-zinc-100 tracking-tight flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
              <BookOpen size={26} className="text-white" />
            </div>
            Word Bank
          </h1>
          <p className="text-zinc-400 text-sm">단어 사전 + 문장 덱을 한 곳에서 관리해요</p>
        </div>
        {/* CTA for active tab */}
        {tab === 'vocab' ? (
          <button
            onClick={() => { setFlashDone(false); setFlashcardMode(true); setFlashIdx(0); setFlashFlipped(false); }}
            disabled={vocabulary.length === 0}
            className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold shadow-lg shadow-indigo-500/30 hover:opacity-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <RotateCcw size={20} />
            {vocabReviewQueue.length > 0 ? `오늘 복습 ${vocabReviewQueue.length}개` : '플래시카드 시작'}
          </button>
        ) : tab === 'sentences' ? (
          <button
            onClick={() => { setPracticeDone(false); setPracticeMode(true); setPracticeIdx(0); setPracticeFlipped(false); }}
            disabled={practiceList.length === 0}
            className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold shadow-lg shadow-violet-500/30 hover:opacity-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            <RotateCcw size={20} />
            {sentReviewQueue.length > 0 ? `오늘 복습 ${sentReviewQueue.length}개` : '연습 시작'}
          </button>
        ) : tab === 'study' ? (
          <button
            onClick={() => setTab('dashboard')}
            className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-bold shadow-lg shadow-indigo-500/30 hover:opacity-95 transition-all whitespace-nowrap"
          >
            <BarChart2 size={20} /> 대시보드 보기
          </button>
        ) : (
          <button
            onClick={() => setTab('study')}
            className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-bold shadow-lg shadow-violet-500/30 hover:opacity-95 transition-all whitespace-nowrap"
          >
            <Gamepad2 size={20} /> 학습 시작
          </button>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex flex-wrap gap-1 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-1 w-fit">
        {([
          { key: 'vocab'     as const, label: '단어',   icon: BookOpen,  count: vocabulary.length },
          { key: 'sentences' as const, label: '문장',   icon: Quote,     count: sentences.length },
          { key: 'study'     as const, label: '🎮 학습', icon: Gamepad2,  count: null },
          { key: 'dashboard' as const, label: '📊 대시보드', icon: BarChart2, count: null },
        ]).map(({ key, label, icon: Icon, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === key
                ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <Icon size={14} />
            {label}
            {count !== null && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${tab === key ? 'bg-white/20' : 'bg-white/[0.06]'}`}>{count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── VOCABULARY TAB ── */}
      {tab === 'vocab' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: BookOpen, label: 'Total',    value: vocabStats.total,    color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
              { icon: Flame,    label: 'Due Today', value: vocabStats.dueToday, color: 'text-orange-400', bg: 'bg-orange-500/10', hl: vocabStats.dueToday > 0 },
              { icon: Brain,    label: 'Learning',  value: vocabStats.learning, color: 'text-blue-400',   bg: 'bg-blue-500/10' },
              { icon: Target,   label: 'Mastered',  value: vocabStats.mastered, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className={`rounded-2xl p-4 border ${(s as { hl?: boolean }).hl ? 'bg-gradient-to-br from-orange-500/[0.08] to-amber-500/[0.04] border-orange-500/20' : 'bg-white/[0.03] border-white/[0.06]'}`}>
                  <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}><Icon size={18} className={s.color} /></div>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
                </div>
              );
            })}
          </div>

          {/* Add word */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-500/[0.05] to-violet-500/[0.05] border border-white/[0.06] p-5">
            <div className="flex items-center gap-2 mb-3"><Sparkles size={16} className="text-indigo-400" /><h2 className="text-sm font-bold text-zinc-200">새 단어 추가</h2></div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                  {isLooking ? <Loader2 size={18} className="animate-spin text-indigo-400" /> : <Plus size={18} />}
                </div>
                <input
                  type="text" value={wordInput}
                  onChange={(e) => setWordInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && lookupWord(wordInput)}
                  placeholder="영단어 입력 후 Enter (AI가 뜻·예문 자동 채움)"
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-3 pl-12 pr-4 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => lookupWord(wordInput)} disabled={isLooking || !wordInput.trim()} className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-500 text-white font-semibold hover:bg-indigo-400 transition-colors disabled:opacity-40 whitespace-nowrap">
                  <Sparkles size={14} /> AI 검색
                </button>
                <button onClick={() => { if (!wordInput.trim()) return; setDiscovered(p => [{ word: wordInput.trim(), meaningKo: '', definitionEn: '', example: '', source: 'Manual' }, ...p]); setWordInput(''); }} disabled={!wordInput.trim()} className="px-4 py-3 rounded-xl bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1] transition-colors disabled:opacity-40 whitespace-nowrap">
                  직접 입력
                </button>
              </div>
            </div>
            {vocabError && <div className="mt-3 flex items-start gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20"><AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" /><p className="text-xs text-red-300">{vocabError}</p></div>}
          </div>

          {/* Discovered words */}
          {discovered.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">검색 결과 ({discovered.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {discovered.map((w, i) => (
                  <div key={i} className="bg-white/[0.04] border border-indigo-500/25 rounded-2xl p-5 space-y-2.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xl font-bold text-zinc-100">{w.word}</h4>
                        {w.pronunciation && <p className="text-xs text-indigo-300 font-mono mt-0.5">{w.pronunciation}</p>}
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        {w.word && <button onClick={() => speak(w.word!)} className="p-2 rounded-lg bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1] transition-colors"><Volume2 size={14} /></button>}
                        <button onClick={() => handleAddWord(w)} className="flex items-center gap-1 px-3 py-2 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 font-semibold text-xs"><Plus size={14} /> 추가</button>
                      </div>
                    </div>
                    {w.meaningKo && <p className="text-base text-emerald-300 font-semibold">{w.meaningKo}</p>}
                    {w.definitionEn && <p className="text-xs text-zinc-400 leading-relaxed">{w.definitionEn}</p>}
                    {w.example && <p className="text-xs italic text-zinc-500 mt-2 pt-2 border-t border-white/[0.04]">&ldquo;{w.example}&rdquo;</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filter + search */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-zinc-300">나의 단어장 <span className="text-zinc-500 font-normal">({vocabFiltered.length})</span></h2>
              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input type="text" value={vocabSearch} onChange={(e) => setVocabSearch(e.target.value)} placeholder="단어, 뜻 검색..." className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl py-2 pl-9 pr-3 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/40 transition-all" />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button onClick={() => setFilterLevel(null)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${filterLevel === null ? 'bg-white/[0.1] text-zinc-100 border-white/[0.15]' : 'border-white/[0.06] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'}`}>All ({vocabulary.length})</button>
              {[0,1,2,3,4,5].map(lvl => {
                const c = levelConfig[lvl];
                const cnt = vocabulary.filter(w => w.level === lvl).length;
                return <button key={lvl} onClick={() => setFilterLevel(filterLevel === lvl ? null : lvl)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${filterLevel === lvl ? `${c.bg} ${c.color} border-current` : 'border-white/[0.06] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'}`}>{c.label} ({cnt})</button>;
              })}
            </div>
          </div>

          {/* Word list */}
          {vocabFiltered.length === 0 ? (
            <div className="py-20 text-center border-2 border-dashed border-white/[0.06] rounded-3xl">
              <BookOpen size={36} className="text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-400 font-medium">{vocabulary.length === 0 ? '아직 저장한 단어가 없어요' : '검색 결과가 없어요'}</p>
              <p className="text-xs text-zinc-600 mt-1">{vocabulary.length === 0 ? '위에서 단어를 추가해보세요' : '필터를 바꿔보세요'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {vocabFiltered.map((word) => {
                const conf = levelConfig[word.level] || levelConfig[0];
                const isDue = new Date(word.nextReview) <= new Date();
                return (
                  <div key={word.id} className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:border-indigo-500/30 hover:bg-white/[0.05] transition-all">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="text-xl font-bold text-zinc-100">{word.word}</h4>
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${conf.bg} ${conf.color}`}>{conf.label}</span>
                          {isDue && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300">DUE</span>}
                        </div>
                        {word.pronunciation && <p className="text-xs text-zinc-500 font-mono">{word.pronunciation}</p>}
                      </div>
                      <div className="flex gap-1 opacity-50 group-hover:opacity-100 shrink-0 transition-opacity">
                        <button onClick={() => speak(word.word)} className="p-2 rounded-lg bg-white/[0.05] text-zinc-300 hover:bg-white/[0.1] transition-colors"><Volume2 size={14} /></button>
                        <button onClick={() => deleteWord(word.id)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    {word.meaningKo && <p className="text-lg font-semibold text-emerald-300 mb-1.5">{word.meaningKo}</p>}
                    {word.definitionEn && <p className="text-sm text-zinc-400 leading-relaxed line-clamp-2 mb-2">{word.definitionEn}</p>}
                    {word.example && <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"><p className="text-xs italic text-zinc-500 line-clamp-2">&ldquo;{word.example}&rdquo;</p></div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── STUDY HUB TAB ── */}
      {tab === 'study' && (
        <StudyHub onClose={() => setTab('vocab')} />
      )}

      {/* ── DASHBOARD TAB ── */}
      {tab === 'dashboard' && (
        <Dashboard onGoStudy={() => setTab('study')} />
      )}

      {/* ── SENTENCES TAB ── */}
      {tab === 'sentences' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: Quote,         label: '전체 문장',  value: sentStats.total,    color: 'text-violet-400',  bg: 'bg-violet-500/10' },
              { icon: Flame,         label: '오늘 복습',  value: sentStats.dueToday, color: 'text-orange-400',  bg: 'bg-orange-500/10', hl: sentStats.dueToday > 0 },
              { icon: CheckCircle2,  label: '알아요',     value: sentStats.known,    color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { icon: Brain,         label: '학습 중',    value: sentStats.newCount, color: 'text-blue-400',    bg: 'bg-blue-500/10' },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className={`rounded-2xl p-4 border ${(s as { hl?: boolean }).hl ? 'bg-gradient-to-br from-orange-500/[0.08] to-amber-500/[0.04] border-orange-500/20' : 'bg-white/[0.03] border-white/[0.06]'}`}>
                  <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}><Icon size={18} className={s.color} /></div>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{s.label}</p>
                </div>
              );
            })}
          </div>

          {/* Add sentence */}
          <div className="rounded-2xl bg-gradient-to-br from-violet-500/[0.05] to-fuchsia-500/[0.05] border border-white/[0.06] p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2"><Sparkles size={16} className="text-violet-400" /><h2 className="text-sm font-bold text-zinc-200">새 문장 추가</h2></div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* xlsx import */}
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImportXlsx} className="hidden" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 text-xs font-semibold transition-colors border border-emerald-500/20"
                >
                  <FileSpreadsheet size={14} /> xlsx 가져오기
                </button>
                {/* Anki import (.txt tab-separated) */}
                <input ref={ankiInputRef} type="file" accept=".txt,.tsv" onChange={handleImportAnki} className="hidden" />
                <button
                  onClick={() => ankiInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 text-xs font-semibold transition-colors border border-indigo-500/20"
                  title="Anki → 내보내기 → 노트를 텍스트로 (.txt)"
                >
                  <Upload size={14} /> Anki 가져오기
                </button>
              </div>
            </div>
            <input type="text" value={newText} onChange={(e) => setNewText(e.target.value)} placeholder="영어 문장 입력 (예: Were you able to get the job done?)" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-3 px-4 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 transition-all" />
            <input type="text" value={newTranslation} onChange={(e) => setNewTranslation(e.target.value)} placeholder="한국어 번역 (비워두면 AI가 자동으로 채워줘요)" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-3 px-4 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/50 transition-all" />
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <span>반복:</span>
                {[1,2,3,5,10].map(n => (
                  <button key={n} onClick={() => setNewRepeat(n)} className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${newRepeat === n ? 'bg-violet-500 text-white' : 'bg-white/[0.06] text-zinc-400 hover:text-zinc-200'}`}>{n}x</button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleAddSentence(true)} disabled={!newText.trim() || isTranslating} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-500 text-white font-semibold hover:bg-violet-400 text-xs disabled:opacity-40 transition-colors">
                  {isTranslating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} AI 번역 후 추가
                </button>
                <button onClick={() => handleAddSentence(false)} disabled={!newText.trim()} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.08] text-zinc-200 font-semibold hover:bg-white/[0.12] text-xs disabled:opacity-40 transition-colors">
                  <Plus size={14} /> 그냥 추가
                </button>
              </div>
            </div>
            {importMsg && <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20"><CheckCircle2 size={14} className="text-emerald-400 shrink-0 mt-0.5" /><p className="text-xs text-emerald-300">{importMsg}</p><button onClick={() => setImportMsg(null)} className="ml-auto text-emerald-300/70 hover:text-emerald-200"><X size={12} /></button></div>}
            {sentError && <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20"><AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" /><p className="text-xs text-red-300">{sentError}</p></div>}
          </div>

          {/* Filter */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-zinc-300">내 문장 <span className="text-zinc-500 font-normal">({sentFiltered.length})</span></h3>
              <div className="relative w-full sm:w-72">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input type="text" value={sentSearch} onChange={(e) => setSentSearch(e.target.value)} placeholder="문장 또는 번역 검색..." className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl py-2 pl-9 pr-3 text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/40 transition-all" />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {([['all','All',sentences.length],['new','신규',sentStats.newCount],['known','알아요',sentStats.known],['hold','보류',sentStats.hold]] as const).map(([key, label, count]) => (
                <button key={key} onClick={() => setFilterStatus(key)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${filterStatus === key ? 'bg-white/[0.1] text-zinc-100 border-white/[0.15]' : 'border-white/[0.06] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'}`}>{label} ({count})</button>
              ))}
            </div>
          </div>

          {/* Sentence list */}
          {sentFiltered.length === 0 ? (
            <div className="py-16 text-center border-2 border-dashed border-white/[0.06] rounded-3xl">
              <Quote size={36} className="text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-400 font-medium">{sentences.length === 0 ? '아직 저장한 문장이 없어요' : '검색 결과가 없어요'}</p>
              <p className="text-xs text-zinc-600 mt-1">{sentences.length === 0 ? '위에서 문장을 추가하거나 xlsx 파일을 가져오세요' : '필터를 조정해보세요'}</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {sentFiltered.map((s) => {
                const conf     = levelConfig[s.level] || levelConfig[0];
                const isPlaying = activeSpeechId === s.id && isSpeaking;
                const isEditing = editingId === s.id;
                return (
                  <div key={s.id} className="group bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 sm:p-5 hover:border-violet-500/25 hover:bg-white/[0.05] transition-all">
                    {isEditing ? (
                      <div className="space-y-3">
                        <textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={2} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-2 px-3 text-sm text-zinc-100 focus:outline-none focus:border-violet-500/40 resize-none" />
                        <input value={editTranslation} onChange={(e) => setEditTranslation(e.target.value)} placeholder="한국어 번역" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl py-2 px-3 text-sm text-zinc-100 focus:outline-none focus:border-violet-500/40" />
                        <div className="flex justify-end gap-2">
                          <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-zinc-200">취소</button>
                          <button onClick={() => { updateSentence(s.id, { text: editText.trim(), translation: editTranslation.trim() }); setEditingId(null); }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-500 text-white text-xs font-semibold hover:bg-violet-400"><Check size={12} /> 저장</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start gap-3">
                          <div className="flex-1 min-w-0">
                            {/* Hide text/translation when quiz is active (to avoid giving away answer) */}
                            {quizId === s.id && quizDir === 'ko-en'
                              ? <p className="text-base font-medium text-zinc-100 leading-relaxed">{s.text}</p>
                              : quizId === s.id && quizDir === 'en-ko'
                              ? <p className="text-sm text-emerald-300 leading-relaxed">{s.translation || '(번역 없음)'}</p>
                              : <>
                                  <p className="text-base font-medium text-zinc-100 leading-relaxed">{s.text}</p>
                                  {s.translation && <p className="text-sm text-emerald-300 mt-1.5 leading-relaxed">{s.translation}</p>}
                                </>
                            }
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => speakWithRepeat(s)} className={`p-2 rounded-lg transition-colors ${isPlaying ? 'bg-violet-500 text-white' : 'bg-white/[0.05] text-zinc-300 hover:bg-white/[0.1]'}`} title={`${s.repeatCount}회 반복`}>
                              {isPlaying ? <Pause size={14} /> : <Volume2 size={14} />}
                            </button>
                            {quizId !== s.id && (
                              <>
                                <button onClick={() => { setEditingId(s.id); setEditText(s.text); setEditTranslation(s.translation); }} className="p-2 rounded-lg bg-white/[0.05] text-zinc-300 hover:bg-white/[0.1] opacity-0 group-hover:opacity-100 transition-all"><Edit2 size={14} /></button>
                                <button onClick={() => deleteSentence(s.id)} className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14} /></button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* ── Inline quiz panel ── */}
                        {quizId === s.id ? (
                          <div className="mt-3 space-y-3 pt-3 border-t border-white/[0.07]">
                            {/* Direction + close */}
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] text-zinc-500 font-semibold">방향:</span>
                              {(['ko-en', 'en-ko'] as const).map(d => (
                                <button key={d} onClick={() => { setQuizDir(d); setQuizInput(''); setQuizResult(null); }}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${quizDir === d ? (d === 'ko-en' ? 'bg-violet-500/20 text-violet-300 border-violet-500/30' : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30') : 'text-zinc-600 border-white/[0.06] hover:text-zinc-400'}`}>
                                  {d === 'ko-en' ? 'KO→EN' : 'EN→KO'}
                                </button>
                              ))}
                              <button onClick={() => { setQuizId(null); setQuizInput(''); setQuizResult(null); }} className="ml-auto text-zinc-600 hover:text-zinc-400 text-[11px] transition-colors">✕ 닫기</button>
                            </div>

                            {/* Question */}
                            <div className="px-4 py-3 rounded-xl bg-black/20 border border-white/[0.06]">
                              <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mb-1.5">
                                {quizDir === 'ko-en' ? '한국어 보고 영어로 입력' : '영어 보고 한국어로 입력'}
                              </p>
                              <p className="text-sm font-semibold text-zinc-200">
                                {quizDir === 'ko-en'
                                  ? (s.translation || '번역이 없어요. 편집해서 추가해주세요.')
                                  : s.text}
                              </p>
                            </div>

                            {/* Answer input */}
                            {quizResult === null && (
                              <div className="flex gap-2">
                                <input
                                  ref={quizInputRef}
                                  type="text"
                                  value={quizInput}
                                  onChange={(e) => setQuizInput(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && quizInput.trim() && handleCheckQuiz(s)}
                                  placeholder={quizDir === 'ko-en' ? '영어 문장을 입력하세요…' : '한국어 번역을 입력하세요…'}
                                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-zinc-200 outline-none focus:border-violet-500/50 transition-colors"
                                />
                                <button onClick={() => handleCheckQuiz(s)} disabled={!quizInput.trim()}
                                  className="px-4 py-2 rounded-xl bg-violet-500 text-white text-xs font-bold hover:bg-violet-400 disabled:opacity-40 transition-colors">
                                  확인
                                </button>
                              </div>
                            )}

                            {/* Result */}
                            {quizResult !== null && (
                              <div className={`px-4 py-3 rounded-xl border space-y-2 ${quizResult === 'correct' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                <p className={`text-sm font-bold flex items-center gap-1.5 ${quizResult === 'correct' ? 'text-emerald-300' : 'text-red-300'}`}>
                                  {quizResult === 'correct' ? <><CheckCircle2 size={14} /> 정답!</> : <><X size={14} /> 틀렸어요</>}
                                </p>
                                <div className="text-xs space-y-1">
                                  <p className="text-zinc-500">정답: <span className="text-zinc-300 font-medium">{quizDir === 'ko-en' ? s.text : s.translation}</span></p>
                                  <p className="text-zinc-600">입력: <span className="text-zinc-400">{quizInput}</span></p>
                                </div>
                                <div className="flex gap-2 pt-1">
                                  <button onClick={() => { setQuizInput(''); setQuizResult(null); setTimeout(() => quizInputRef.current?.focus(), 50); }}
                                    className="flex-1 py-2 rounded-xl border border-white/[0.08] text-xs text-zinc-400 hover:bg-white/[0.04] transition-colors">다시 도전</button>
                                  <button onClick={() => {
                                    updateSentenceSRS(s.id, quizResult === 'correct' ? 4 : 1);
                                    setQuizId(null); setQuizInput(''); setQuizResult(null);
                                  }} className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-colors ${quizResult === 'correct' ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30' : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'}`}>
                                    {quizResult === 'correct' ? '다음 (Good ↑)' : '다음 (Again ↓)'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* ── Normal bottom row ── */
                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${conf.bg} ${conf.color}`}>{conf.label}</span>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.04] text-zinc-500">{s.repeatCount}x 반복</span>
                            {/* Next review date */}
                            {new Date(s.nextReview) <= new Date()
                              ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300">복습 DUE</span>
                              : <span className="text-[10px] text-zinc-600">{timeUntil(s.nextReview)} 복습</span>
                            }
                            {/* Quiz button */}
                            <button onClick={() => openQuiz(s.id)}
                              className="flex items-center gap-1 text-[11px] font-semibold text-violet-400 hover:text-violet-300 transition-colors px-2 py-0.5 rounded-lg hover:bg-violet-500/10">
                              <Brain size={11} /> 퀴즈
                            </button>
                            <div className="flex items-center gap-1 ml-auto">
                              {(['known','hold','new'] as SentenceStatus[]).map(st => (
                                <button key={st} onClick={() => updateSentenceStatus(s.id, st)} className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors ${s.status === st ? `${statusConfig[st].bg} ${statusConfig[st].color}` : 'bg-white/[0.04] text-zinc-600 hover:text-zinc-400'}`}>{statusConfig[st].label}</button>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Page wrapper with Suspense (useSearchParams requirement) ─ */

export default function WordBankPage() {
  return (
    <Suspense fallback={<div className="max-w-6xl mx-auto px-6 py-8 text-zinc-400 text-sm">로딩 중...</div>}>
      <WordBankInner />
    </Suspense>
  );
}
