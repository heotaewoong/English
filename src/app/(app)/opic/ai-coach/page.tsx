'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Brain, Send, Loader2, RefreshCw, Sparkles, Target,
  ChevronDown, ChevronUp, Award, RotateCcw, ArrowRight,
  MessageCircle, Lightbulb, BookOpen,
} from 'lucide-react';

/* ─── OPIc topic categories ─────────────────────────────────────── */
const OPIC_TOPICS = [
  { id: 'self', label: 'Self-Introduction', emoji: '👤', desc: 'Tell me about yourself, your background, daily routine' },
  { id: 'hobby', label: 'Hobbies', emoji: '🎨', desc: 'Your interests, pastimes, what you do for fun' },
  { id: 'travel', label: 'Travel', emoji: '✈️', desc: "Places you've been, travel experiences, vacation plans" },
  { id: 'work', label: 'Work & Study', emoji: '💼', desc: 'Your job, studies, career goals' },
  { id: 'tech', label: 'Technology', emoji: '💻', desc: 'Gadgets, apps, how technology affects your life' },
  { id: 'health', label: 'Health & Exercise', emoji: '🏃', desc: 'Fitness habits, health concerns, sports' },
  { id: 'music', label: 'Music', emoji: '🎵', desc: 'Favorite genres, concerts, instruments' },
  { id: 'movies', label: 'Movies & TV', emoji: '🎬', desc: 'Favorite films, TV shows, streaming habits' },
  { id: 'food', label: 'Food & Cooking', emoji: '🍳', desc: 'Favorite foods, cooking, restaurants' },
  { id: 'unexpected', label: 'Unexpected Q', emoji: '⚡', desc: 'Surprise questions that test your spontaneity' },
];

const LEVELS = [
  { id: 'IM', label: 'IM', full: 'Intermediate Mid', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  { id: 'IH', label: 'IH', full: 'Intermediate High', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
  { id: 'AL', label: 'AL', full: 'Advanced Low', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
] as const;

type Level = 'IM' | 'IH' | 'AL';

interface Message {
  id: string;
  role: 'ai' | 'user';
  text: string;
  isStreaming?: boolean;
  isFeedback?: boolean;
}

interface SessionStats {
  questionsAnswered: number;
  totalChars: number;
  startTime: Date;
}

export default function OPIcAICoachPage() {
  const [phase, setPhase] = useState<'setup' | 'session'>('setup');
  const [selectedTopics, setSelectedTopics] = useState<string[]>(['self', 'hobby']);
  const [targetLevel, setTargetLevel] = useState<Level>('IH');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMode, setFeedbackMode] = useState(false);
  const [stats, setStats] = useState<SessionStats>({ questionsAnswered: 0, totalChars: 0, startTime: new Date() });
  const [showTips, setShowTips] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleTopic = (id: string) => {
    setSelectedTopics(prev =>
      prev.includes(id)
        ? prev.filter(t => t !== id)
        : prev.length < 4 ? [...prev, id] : prev
    );
  };

  const buildHistory = (msgs: Message[]) =>
    msgs
      .filter(m => !m.isStreaming)
      .slice(-12)
      .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }));

  /* Start OPIc session */
  const startSession = useCallback(async () => {
    const topicLabels = OPIC_TOPICS
      .filter(t => selectedTopics.includes(t.id))
      .map(t => t.label)
      .join(', ');

    setPhase('session');
    const aiId = `a-${Date.now()}`;
    const openingMsg: Message = { id: aiId, role: 'ai', text: '', isStreaming: true };
    setMessages([openingMsg]);
    setIsLoading(true);
    setStats({ questionsAnswered: 0, totalChars: 0, startTime: new Date() });

    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `Start the OPIc interview. Begin with the first question about: ${topicLabels}. Ask ONE clear question to start.`,
          }],
          mode: 'opic',
          context: `OPIc interview covering: ${topicLabels}`,
          difficulty: targetLevel,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error((await res.json()).error || 'API error');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setMessages(prev => prev.map(m => m.id === aiId ? { ...m, text: accumulated } : m));
        }
      }
      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, isStreaming: false } : m));
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const errText = err instanceof Error ? err.message : 'Connection error';
      setMessages(prev => prev.map(m =>
        m.id === aiId ? { ...m, text: `⚠️ ${errText}\n\nMake sure GROQ_API_KEY is set in .env.local`, isStreaming: false } : m
      ));
    } finally {
      setIsLoading(false);
    }
  }, [selectedTopics, targetLevel]);

  /* Send answer and optionally get feedback */
  const sendAnswer = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text };
    const aiId = `a-${Date.now()}`;
    const aiMsg: Message = { id: aiId, role: 'ai', text: '', isStreaming: true };

    setMessages(prev => [...prev, userMsg, aiMsg]);
    setIsLoading(true);
    setStats(prev => ({
      ...prev,
      questionsAnswered: prev.questionsAnswered + 1,
      totalChars: prev.totalChars + text.length,
    }));

    abortRef.current = new AbortController();

    try {
      const topicLabels = OPIC_TOPICS
        .filter(t => selectedTopics.includes(t.id))
        .map(t => t.label)
        .join(', ');

      const history = buildHistory([...messages, userMsg]);

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          mode: 'opic',
          context: `OPIc interview covering: ${topicLabels}. ${feedbackMode ? 'After brief feedback on their answer, ask the next question.' : 'Give brief encouraging feedback then ask the next question.'}`,
          difficulty: targetLevel,
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) throw new Error((await res.json()).error || 'API error');

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setMessages(prev => prev.map(m => m.id === aiId ? { ...m, text: accumulated } : m));
        }
      }
      setMessages(prev => prev.map(m => m.id === aiId ? { ...m, isStreaming: false } : m));
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const errText = err instanceof Error ? err.message : 'Connection error';
      setMessages(prev => prev.map(m =>
        m.id === aiId ? { ...m, text: `⚠️ ${errText}`, isStreaming: false } : m
      ));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, selectedTopics, targetLevel, feedbackMode]);

  const resetSession = () => {
    abortRef.current?.abort();
    setPhase('setup');
    setMessages([]);
    setInput('');
    setIsLoading(false);
  };

  const sessionDuration = () => {
    if (phase !== 'session') return '0:00';
    const s = Math.floor((Date.now() - stats.startTime.getTime()) / 1000);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  };

  /* ═══ Setup screen ═══════════════════════════════════════════════ */
  if (phase === 'setup') {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain size={22} className="text-violet-400" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">AI OPIc Coach</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              LIVE · Llama 3.3
            </span>
          </div>
          <p className="text-sm text-[var(--text-muted)]">
            Practice a real OPIc interview with AI — get questions, answer freely, and receive instant feedback
          </p>
        </div>

        {/* Target Level */}
        <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
            <Target size={15} className="text-indigo-400" /> Target Grade
          </p>
          <div className="flex gap-3">
            {LEVELS.map(level => (
              <button
                key={level.id}
                onClick={() => setTargetLevel(level.id)}
                className={`flex-1 flex flex-col items-center p-3 rounded-xl border transition-all ${
                  targetLevel === level.id
                    ? `${level.bg} border-opacity-100`
                    : 'border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-indigo-500/20'
                }`}
              >
                <span className={`text-lg font-bold ${targetLevel === level.id ? level.color : 'text-[var(--text-muted)]'}`}>
                  {level.label}
                </span>
                <span className="text-xs text-[var(--text-muted)] mt-0.5">{level.full}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Topic Selection */}
        <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <BookOpen size={15} className="text-indigo-400" /> Select Topics
            </p>
            <span className="text-xs text-[var(--text-muted)]">{selectedTopics.length}/4 selected</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {OPIC_TOPICS.map(topic => {
              const selected = selectedTopics.includes(topic.id);
              return (
                <button
                  key={topic.id}
                  onClick={() => toggleTopic(topic.id)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${
                    selected
                      ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300'
                      : 'border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:border-indigo-500/20'
                  }`}
                >
                  <span className="text-base">{topic.emoji}</span>
                  <span className="text-xs font-medium">{topic.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)]">
          <div className="flex items-center gap-2">
            <Lightbulb size={15} className="text-amber-400" />
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">Detailed Feedback Mode</p>
              <p className="text-xs text-[var(--text-muted)]">AI analyzes each answer for grammar and vocabulary</p>
            </div>
          </div>
          <button
            onClick={() => setFeedbackMode(!feedbackMode)}
            className={`relative w-11 h-6 rounded-full transition-colors ${feedbackMode ? 'bg-indigo-500' : 'bg-[var(--border-color-strong)]'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${feedbackMode ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Start button */}
        <button
          onClick={startSession}
          disabled={selectedTopics.length === 0}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-base font-semibold text-white disabled:opacity-40 hover:shadow-xl hover:shadow-violet-500/25 transition-all"
        >
          <Brain size={18} />
          Start OPIc Session
          <ArrowRight size={16} />
        </button>
      </div>
    );
  }

  /* ═══ Session screen ═════════════════════════════════════════════ */
  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-h-[900px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Brain size={20} className="text-violet-400" />
          <h1 className="text-lg font-bold text-[var(--text-primary)]">AI OPIc Coach</h1>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${LEVELS.find(l => l.id === targetLevel)?.bg}`}>
            {targetLevel}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
          <span>{stats.questionsAnswered} answers</span>
          <span className="w-px h-3 bg-[var(--border-color)]" />
          <button
            onClick={resetSession}
            className="flex items-center gap-1 hover:text-[var(--text-primary)] transition-colors"
          >
            <RotateCcw size={12} /> End Session
          </button>
        </div>
      </div>

      {/* Topics bar */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-3 shrink-0">
        {OPIC_TOPICS.filter(t => selectedTopics.includes(t.id)).map(t => (
          <span key={t.id} className="flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-violet-500/10 border border-violet-500/20 text-violet-300 shrink-0 whitespace-nowrap">
            {t.emoji} {t.label}
          </span>
        ))}
        {feedbackMode && (
          <span className="flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-amber-500/10 border border-amber-500/20 text-amber-300 shrink-0">
            <Lightbulb size={10} /> Feedback ON
          </span>
        )}
      </div>

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
        {messages.map(msg => (
          <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-bold ${
              msg.role === 'ai'
                ? 'bg-gradient-to-br from-violet-500 to-indigo-600'
                : 'bg-gradient-to-br from-zinc-600 to-zinc-700'
            }`}>
              {msg.role === 'ai'
                ? <Brain size={13} className="text-white" />
                : <span className="text-[10px] text-white">ME</span>
              }
            </div>
            <div className={`flex flex-col max-w-[78%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'ai'
                  ? 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-tl-sm'
                  : 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-sm'
              }`}>
                {msg.text || (msg.isStreaming ? '' : '...')}
                {msg.isStreaming && (
                  <span className="inline-flex items-center gap-1 ml-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Tips toggle */}
      <div className="shrink-0 mt-2">
        <button
          onClick={() => setShowTips(!showTips)}
          className="flex items-center gap-1.5 text-xs text-violet-400/60 hover:text-violet-400 transition-colors px-1 mb-1"
        >
          <Lightbulb size={11} />
          OPIc tips
          {showTips ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>
        {showTips && (
          <div className="mb-2 p-3 rounded-xl bg-violet-500/5 border border-violet-500/15 text-xs text-[var(--text-secondary)] leading-relaxed">
            💡 <span className="text-violet-400 font-medium">Tips:</span> Speak in full sentences. Use specific examples ("For instance, last year I…"). Aim for 30-60 seconds per answer. Use connectors: "First of all", "In addition", "On the other hand".
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0">
        <div className={`flex items-end gap-2 p-2 rounded-2xl bg-[var(--bg-card)] border transition-colors ${isLoading ? 'border-violet-500/30' : 'border-[var(--border-color)] focus-within:border-violet-500/40'}`}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendAnswer();
              }
            }}
            placeholder="Type your answer in English… (Enter to send)"
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-none outline-none px-2 py-1.5 max-h-24 disabled:opacity-50"
          />
          <button
            onClick={sendAnswer}
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white disabled:opacity-30 hover:from-violet-500 hover:to-indigo-500 transition-all shrink-0 mb-0.5"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1"><MessageCircle size={11} /> {stats.questionsAnswered} answers</span>
          <span className="w-px h-3 bg-[var(--border-color)]" />
          <span className="flex items-center gap-1 text-violet-400"><Award size={11} /> {targetLevel} target</span>
          {isLoading && (
            <>
              <span className="w-px h-3 bg-[var(--border-color)]" />
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> AI thinking…
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
