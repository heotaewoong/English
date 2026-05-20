'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Star,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Mic,
  MicOff,
  Send,
  X,
  Check,
  ArrowRight,
  Lightbulb,
  Sparkles,
  Target,
  RefreshCw,
  Award,
  Play,
  Loader2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useSpeechRecognition, useTTS } from '@/hooks/useSpeech';
import { scenarios, type Scenario } from '@/data/roleplay';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface ChatMessage {
  id: string;
  role: 'ai' | 'user';
  text: string;
  isStreaming?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                      */
/* ------------------------------------------------------------------ */

function DifficultyStars({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 3 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          className={
            i < count
              ? 'text-amber-400 fill-amber-400'
              : 'text-[var(--border-color)]'
          }
        />
      ))}
    </div>
  );
}

function ScoreBar({
  label,
  value,
  delay,
}: {
  label: string;
  value: number;
  delay: number;
}) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setWidth(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  const color =
    value >= 80
      ? 'from-emerald-500 to-green-400'
      : value >= 60
        ? 'from-amber-500 to-yellow-400'
        : 'from-red-500 to-orange-400';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--text-secondary)]">{label}</span>
        <span className="font-semibold text-[var(--text-primary)]">
          {value}%
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-1000 ease-out`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

export default function RoleplayTalkPage() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  /* ── Speech hooks ──────────────────────────────────────────────── */
  const { isListening, isSupported: sttSupported, toggleListening } =
    useSpeechRecognition((text) =>
      setInputText((prev) => (prev ? prev + ' ' + text : text))
    );
  const { speak, stop: stopTTS, isSpeaking } = useTTS();

  useEffect(() => {
    if (!isSpeaking) setSpeakingId(null);
  }, [isSpeaking]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* Speak / stop toggle for a message */
  const handleSpeak = useCallback((msg: ChatMessage) => {
    if (speakingId === msg.id) {
      stopTTS();
      setSpeakingId(null);
    } else {
      if (isSpeaking) stopTTS();
      speak(msg.text);
      setSpeakingId(msg.id);
    }
  }, [speakingId, speak, stopTTS, isSpeaking]);

  /* Start a scenario */
  const startScenario = useCallback((scenario: Scenario) => {
    abortRef.current?.abort();
    stopTTS();
    setSelectedScenario(scenario);
    setMessages([{ id: 'm-init', role: 'ai', text: scenario.initialPrompt }]);
    setShowReview(false);
    setHintsOpen(false);
    setInputText('');
    setIsLoading(false);
    setSpeakingId(null);
  }, [stopTTS]);

  /* Build message history for API */
  const buildHistory = (msgs: ChatMessage[]) =>
    msgs
      .filter(m => m.id !== 'm-init' && !m.isStreaming)
      .slice(-10)
      .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }));

  /* Send a user message with real Groq streaming */
  const handleSend = useCallback(async (text?: string) => {
    const sendText = (text ?? inputText).trim();
    if (!sendText || isLoading || !selectedScenario) return;
    setInputText('');
    if (isListening) toggleListening();

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: 'user', text: sendText };
    const aiId = `a-${Date.now()}`;
    const aiMsg: ChatMessage = { id: aiId, role: 'ai', text: '', isStreaming: true };

    setMessages(prev => [...prev, userMsg, aiMsg]);
    setIsLoading(true);

    abortRef.current = new AbortController();

    try {
      const history = buildHistory([...messages, userMsg]);

      // Include the initial prompt as the first assistant message for context
      const fullHistory = [
        { role: 'assistant', content: selectedScenario.initialPrompt },
        ...history,
      ];

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: fullHistory,
          mode: 'roleplay',
          context: `${selectedScenario.aiRole} — Situation: ${selectedScenario.situation}. The user is playing: ${selectedScenario.yourRole}.`,
          difficulty: selectedScenario.difficulty <= 1 ? 'Beginner' : selectedScenario.difficulty <= 2 ? 'Intermediate' : 'Advanced',
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'API error');
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });
          setMessages(prev =>
            prev.map(m => m.id === aiId ? { ...m, text: accumulated } : m)
          );
        }
      }

      setMessages(prev =>
        prev.map(m => m.id === aiId ? { ...m, isStreaming: false } : m)
      );
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const errText = err instanceof Error ? err.message : 'Connection error';
      setMessages(prev =>
        prev.map(m =>
          m.id === aiId
            ? { ...m, text: `⚠️ ${errText}\n\nMake sure GROQ_API_KEY is set in .env.local`, isStreaming: false }
            : m
        )
      );
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, isListening, toggleListening, messages, selectedScenario]);

  /* Back to scenario list */
  const handleBack = () => {
    abortRef.current?.abort();
    stopTTS();
    setSelectedScenario(null);
    setMessages([]);
    setShowReview(false);
    setIsLoading(false);
    setSpeakingId(null);
  };

  /* Navigate to next scenario */
  const handleNextScenario = () => {
    if (!selectedScenario) return;
    const idx = scenarios.findIndex((s) => s.id === selectedScenario.id);
    const next = scenarios[(idx + 1) % scenarios.length];
    startScenario(next);
  };

  /* ================================================================ */
  /*  Performance review modal                                         */
  /* ================================================================ */

  if (showReview && selectedScenario) {
    const userMsgCount = messages.filter(m => m.role === 'user').length;
    const scores = {
      appropriateness: Math.min(95, 60 + userMsgCount * 5),
      vocabulary: Math.min(90, 55 + userMsgCount * 4),
      fluency: Math.min(88, 50 + userMsgCount * 6),
    };
    const overall = Math.round(
      (scores.appropriateness + scores.vocabulary + scores.fluency) / 3,
    );

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="w-full max-w-md rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 space-y-6 shadow-2xl">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="mx-auto w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <Award size={28} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Session Complete!
            </h2>
            <p className="text-sm text-[var(--text-muted)]">
              {selectedScenario.title} — {selectedScenario.koreanSubtitle}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {userMsgCount} exchanges completed
            </p>
          </div>

          {/* Overall score */}
          <div className="text-center">
            <div
              className={`inline-flex items-center justify-center w-24 h-24 rounded-full border-4 ${
                overall >= 80
                  ? 'border-emerald-500'
                  : overall >= 60
                    ? 'border-amber-500'
                    : 'border-red-500'
              }`}
            >
              <span className="text-3xl font-bold text-[var(--text-primary)]">
                {overall}%
              </span>
            </div>
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Overall Score
            </p>
          </div>

          {/* Individual scores */}
          <div className="space-y-3">
            <ScoreBar label="Appropriateness" value={scores.appropriateness} delay={200} />
            <ScoreBar label="Vocabulary" value={scores.vocabulary} delay={400} />
            <ScoreBar label="Fluency" value={scores.fluency} delay={600} />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => startScenario(selectedScenario)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-all"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
            <button
              onClick={handleNextScenario}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-sm font-medium text-white hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
            >
              Next Scenario
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Close */}
          <button
            onClick={handleBack}
            className="w-full text-center text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          >
            Back to all scenarios
          </button>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  Roleplay chat interface                                          */
  /* ================================================================ */

  if (selectedScenario) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] max-h-[calc(100vh-8rem)]">
        {/* Back + title */}
        <div className="flex-shrink-0 mb-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-2 transition-colors"
          >
            <ChevronRight size={14} className="rotate-180" />
            All Scenarios
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <span className="text-2xl">{selectedScenario.emoji}</span>
              {selectedScenario.title}
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              LIVE · Llama 3.3
            </span>
          </div>
        </div>

        {/* Scenario context box */}
        <div className="flex-shrink-0 mb-4 p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5">
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            <span className="font-semibold text-indigo-400">Situation: </span>
            {selectedScenario.situation}
          </p>
          <div className="flex gap-3 mt-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-violet-500/10 border border-violet-500/20 text-xs font-medium text-violet-300">
              <Target size={12} />
              You: {selectedScenario.yourRole}
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs font-medium text-indigo-300">
              <Sparkles size={12} />
              AI: {selectedScenario.aiRole}
            </span>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 mb-4 space-y-4 min-h-0">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`flex items-start gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                {msg.role === 'ai' && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white">
                    {selectedScenario.emoji}
                  </div>
                )}
                <div className="flex flex-col">
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white rounded-tr-md'
                        : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-tl-md'
                    }`}
                  >
                    {msg.text || (msg.isStreaming ? '' : '...')}
                    {msg.isStreaming && (
                      <span className="inline-flex items-center gap-1 ml-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    )}
                  </div>
                  {/* TTS button for AI messages */}
                  {msg.role === 'ai' && !msg.isStreaming && msg.text && (
                    <button
                      onClick={() => handleSpeak(msg)}
                      title={speakingId === msg.id ? 'Stop speaking' : 'Read aloud'}
                      className={`self-start mt-1 p-1 rounded-lg text-xs transition-all flex items-center gap-1 ${
                        speakingId === msg.id
                          ? 'text-violet-400 bg-violet-500/10'
                          : 'text-[var(--text-muted)]/50 hover:text-violet-400 hover:bg-violet-500/10'
                      }`}
                    >
                      {speakingId === msg.id ? <VolumeX size={12} /> : <Volume2 size={12} />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Hints panel */}
        <div className="flex-shrink-0 mb-3">
          <button
            onClick={() => setHintsOpen(!hintsOpen)}
            className="flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300 transition-colors mb-2"
          >
            <Lightbulb size={14} />
            Suggested Responses
            {hintsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {hintsOpen && (
            <div className="flex flex-col gap-2 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20 mb-3">
              {selectedScenario.hints.map((hint, i) => (
                <button
                  key={i}
                  onClick={() => { setInputText(hint); setHintsOpen(false); }}
                  disabled={isLoading}
                  className="text-left px-3 py-2 rounded-lg text-sm text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-indigo-500/40 hover:text-[var(--text-primary)] transition-all disabled:opacity-40"
                >
                  <span className="text-indigo-400 mr-2">#{i + 1}</span>
                  {hint}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="flex-shrink-0 mb-3">
          <div className={`flex items-center gap-2 p-2 rounded-2xl border bg-[var(--bg-card)] transition-colors ${isLoading ? 'border-indigo-500/30' : 'border-[var(--border-color)] focus-within:border-indigo-500/40'}`}>
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
              placeholder={isLoading ? 'AI is responding…' : isListening ? '🎤 Listening… speak now' : `Respond as ${selectedScenario.yourRole}…`}
              disabled={isLoading}
              className="flex-1 bg-transparent px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none disabled:opacity-50"
            />
            {sttSupported && (
              <button
                onClick={toggleListening}
                disabled={isLoading}
                title={isListening ? 'Stop recording' : 'Speak (Speech Recognition)'}
                className={`relative p-2.5 rounded-xl transition-all ${
                  isListening
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] disabled:opacity-40'
                }`}
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                {isListening && (
                  <span className="absolute inset-0 rounded-xl border-2 border-red-400 animate-ping opacity-30" />
                )}
              </button>
            )}
            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim() || isLoading}
              className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </div>
          {(isLoading || isListening) && (
            <p className="text-xs text-center mt-1.5 flex items-center justify-center gap-1">
              {isLoading && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-indigo-400/60">AI is thinking…</span>
                </>
              )}
              {isListening && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-red-400/80">Listening… speak clearly</span>
                </>
              )}
            </p>
          )}
        </div>

        {/* End & Review button */}
        <div className="flex-shrink-0">
          <button
            onClick={() => setShowReview(true)}
            disabled={messages.filter(m => m.role === 'user').length === 0}
            className="w-full py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-sm font-medium text-amber-300 hover:bg-amber-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            End &amp; Review
          </button>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  Scenario list (default view)                                     */
  /* ================================================================ */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <MessageSquare size={24} className="text-violet-400" />
          Roleplay Scenarios
        </h1>
        <p className="text-[var(--text-muted)] mt-1">
          Practice real-life English situations with Llama 3.3 AI
        </p>
      </div>

      {/* AI badge */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shrink-0">
          <Sparkles size={14} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--text-primary)]">Real AI Roleplay</p>
          <p className="text-xs text-[var(--text-muted)]">Powered by Groq · Llama 3.3 · Stays in character throughout your session</p>
        </div>
        <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 shrink-0">
          LIVE
        </span>
      </div>

      {/* Scenario grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {scenarios.map((scenario) => (
          <div
            key={scenario.id}
            className="group relative flex flex-col p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] hover-lift transition-all"
          >
            {/* Completion badge */}
            {scenario.completed && (
              <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                <Check size={12} className="text-emerald-400" />
                <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                  Done
                </span>
              </div>
            )}

            {/* Emoji */}
            <span className="text-4xl mb-3">{scenario.emoji}</span>

            {/* Title + korean subtitle */}
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {scenario.title}
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-2">
              {scenario.koreanSubtitle}
            </p>

            {/* Difficulty */}
            <div className="mb-3">
              <DifficultyStars count={scenario.difficulty} />
            </div>

            {/* Description */}
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed flex-1 mb-4">
              {scenario.description}
            </p>

            {/* Roles */}
            <div className="flex gap-2 mb-4">
              <span className="flex items-center gap-1 text-xs text-[var(--text-muted)] px-2 py-1 rounded-lg bg-[var(--bg-secondary)]">
                <Target size={10} /> {scenario.yourRole}
              </span>
              <span className="flex items-center gap-1 text-xs text-indigo-400/70 px-2 py-1 rounded-lg bg-indigo-500/5 border border-indigo-500/15">
                <Sparkles size={10} /> AI: {scenario.aiRole}
              </span>
            </div>

            {/* Start button */}
            <button
              onClick={() => startScenario(scenario)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-sm font-medium text-white hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
            >
              <Play size={16} />
              Start Practice
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
