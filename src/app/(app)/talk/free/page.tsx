'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  MessageCircle, Mic, MicOff, Send, RefreshCw,
  ChevronDown, ChevronUp, Zap, Clock, BookOpen,
  Sparkles, Settings, X, Lightbulb, Loader2, Volume2, VolumeX,
  BarChart3, Award, ArrowRight, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { useSpeechRecognition, useTTS } from '@/hooks/useSpeech';

const TOPICS = [
  { emoji: '🏠', label: 'Daily Life' },
  { emoji: '✈️', label: 'Travel' },
  { emoji: '🔬', label: 'Science & Tech' },
  { emoji: '🎬', label: 'Movies' },
  { emoji: '💼', label: 'Career' },
  { emoji: '🍳', label: 'Cooking' },
  { emoji: '🎲', label: 'Random' },
];

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'] as const;
type Difficulty = (typeof DIFFICULTIES)[number];

interface Message {
  id: string;
  role: 'ai' | 'user';
  text: string;
  isStreaming?: boolean;
}

interface AnalysisData {
  summary: string;
  lexicalDiversity: number;
  grammarScore: number;
  vocabularyTips: string[];
  commonMistakes: { mistake: string; correction: string }[];
  wpmEstimate: number;
  overallLevel: string;
  nextSteps: string;
}

const WELCOME: Message = {
  id: 'welcome',
  role: 'ai',
  text: "Hi! I'm your AI English speaking partner powered by Llama 3.3 🦙\nPick a topic above or just start chatting — I'll help you practice naturally!\n\n💡 Tip: tap the mic button to speak instead of typing!",
};

export default function FreeTalkPage() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('Intermediate');
  const [grammarTips, setGrammarTips] = useState(true);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [showTips, setShowTips] = useState<Record<string, boolean>>({});
  const [showSettings, setShowSettings] = useState(false);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  /* ── Analytics State ── */
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  // tracks current input value without stale closure
  const inputValueRef = useRef('');

  /* ── Speech hooks ──────────────────────────────────────────────── */
  // STT result fills the input — user decides when to send (no auto-send)
  const handleSTTResult = useCallback((text: string) => {
    const combined = inputValueRef.current ? inputValueRef.current + ' ' + text : text;
    setInput(combined);
  }, []);

  const { isListening, isSupported: sttSupported, error: sttError, clearError: clearSttError, toggleListening, interimText } =
    useSpeechRecognition(handleSTTResult, { autoRestart: true });
  const { speak, stop: stopTTS, isSpeaking } = useTTS();

  /* Clear speakingId when TTS finishes */
  useEffect(() => {
    if (!isSpeaking) setSpeakingId(null);
  }, [isSpeaking]);

  /* Timer */
  useEffect(() => {
    timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  /* Keep inputValueRef in sync so handleSTTResult always sees latest input */
  useEffect(() => { inputValueRef.current = input; }, [input]);

  /* Auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  /* Speak / stop toggle for a message */
  const handleSpeak = useCallback((msg: Message) => {
    if (speakingId === msg.id) {
      stopTTS();
      setSpeakingId(null);
    } else {
      if (isSpeaking) stopTTS();
      speak(msg.text);
      setSpeakingId(msg.id);
    }
  }, [speakingId, speak, stopTTS, isSpeaking]);

  /* ── Build API message history ──────────────────────────────────── */
  const buildHistory = useCallback(
    (msgs: Message[]) =>
      msgs
        .filter(m => m.id !== 'welcome' && !m.isStreaming)
        .slice(-10)
        .map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text })),
    []
  );

  /* ── Send message ──────────────────────────────────────────────── */
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;
    setInput('');
    if (isListening) toggleListening(); // stop mic if active

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', text: text.trim() };
    const aiId = `a-${Date.now()}`;
    const aiMsg: Message = { id: aiId, role: 'ai', text: '', isStreaming: true };

    setMessages(prev => [...prev, userMsg, aiMsg]);
    setIsLoading(true);

    abortRef.current = new AbortController();

    try {
      const history = buildHistory([...messages, userMsg]);
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          mode: 'free',
          difficulty,
          context: activeTopic,
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

      /* Auto-speak if enabled */
      if (autoSpeak && accumulated) {
        speak(accumulated);
        setSpeakingId(aiId);
      }
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
  }, [isLoading, isListening, toggleListening, messages, difficulty, activeTopic, buildHistory, autoSpeak, speak]);

  /* use typed input, falling back to in-progress spoken text */
  const handleSubmit = useCallback(() => {
    const text = input.trim() || interimText.trim();
    if (text) sendMessage(text);
  }, [input, interimText, sendMessage]);

  const handleTopic = (label: string) => {
    setActiveTopic(label);
    sendMessage(`Let's talk about ${label}. Please start the conversation!`);
  };

  const resetConversation = () => {
    abortRef.current?.abort();
    stopTTS();
    setMessages([WELCOME]);
    setActiveTopic(null);
    setSeconds(0);
    setIsLoading(false);
    setSpeakingId(null);
  };

  const userCount = messages.filter(m => m.role === 'user').length;

  const handleEndAndAnalyze = async () => {
    if (messages.length < 3) {
      alert('분석을 위해 최소 3개 이상의 대화가 필요합니다.');
      return;
    }

    setIsAnalyzing(true);
    setShowAnalysis(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'analytics',
          messages: buildHistory(messages), // converts role/content format correctly
        }),
      });

      if (!response.ok) throw new Error('Failed to analyze conversation');

      const { result } = await response.json();
      const data = JSON.parse(result) as AnalysisData;
      setAnalysis(data);
    } catch (err) {
      console.error('Analysis error:', err);
      alert('분석 중 오류가 발생했습니다.');
      setShowAnalysis(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const AnalysisModal = () => {
    if (!showAnalysis) return null;

    return (
      <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-[#121214] border border-white/[0.08] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
          <div className="relative p-6 sm:p-8">
            <button
              onClick={() => setShowAnalysis(false)}
              className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 transition-colors"
            >
              <X size={20} />
            </button>

            {isAnalyzing ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                  <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400 animate-pulse" size={24} />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-2">대화 분석 중...</h3>
                  <p className="text-zinc-500 text-sm">AI가 어휘, 문법, 유창성을 정밀하게 분석하고 있습니다.</p>
                </div>
              </div>
            ) : analysis ? (
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <BarChart3 className="text-white" size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">대화 리포트</h2>
                    <p className="text-zinc-500 text-sm">{activeTopic || 'Free Talk'} · {fmt(seconds)}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Overall Level</div>
                    <div className="text-xl font-black text-white px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                      {analysis.overallLevel}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-zinc-400">Lexical Diversity</span>
                      <span className="text-lg font-bold text-indigo-400">{analysis.lexicalDiversity}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-1000"
                        style={{ width: `${analysis.lexicalDiversity}%` }}
                      />
                    </div>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-medium text-zinc-400">Grammar Accuracy</span>
                      <span className="text-lg font-bold text-emerald-400">{analysis.grammarScore}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-1000"
                        style={{ width: `${analysis.grammarScore}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                  <h3 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Award size={14} /> AI Summary
                  </h3>
                  <p className="text-zinc-300 leading-relaxed text-sm">{analysis.summary}</p>
                </div>

                {analysis.commonMistakes.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-4">Common Mistakes</h3>
                    <div className="space-y-3">
                      {analysis.commonMistakes.map((m, i) => (
                        <div key={i} className="flex gap-4 p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                          <div className="flex-1">
                            <div className="text-[10px] font-bold text-red-400/60 uppercase mb-1">Mistake</div>
                            <div className="text-zinc-400 line-through text-xs">{m.mistake}</div>
                          </div>
                          <div className="flex items-center text-zinc-600">
                            <ArrowRight size={14} />
                          </div>
                          <div className="flex-1">
                            <div className="text-[10px] font-bold text-emerald-400/60 uppercase mb-1">Correction</div>
                            <div className="text-emerald-400 font-medium text-xs">{m.correction}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="p-6 rounded-2xl bg-violet-500/5 border border-violet-500/10">
                  <h3 className="text-sm font-bold text-violet-400 uppercase tracking-widest mb-2">Next Steps</h3>
                  <p className="text-zinc-400 text-xs leading-relaxed">{analysis.nextSteps}</p>
                </div>

                <button
                  onClick={() => setShowAnalysis(false)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold hover:opacity-90 transition-all shadow-xl shadow-indigo-500/20"
                >
                  Keep Practicing
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-h-[900px] relative">
      <AnalysisModal />
      {/* Header */}
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <MessageCircle size={22} className="text-indigo-400" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">AI Free Talk</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
              LIVE · Llama 3.3
            </span>
          </div>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Practice English with real AI — powered by Groq</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={resetConversation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all"
          >
            <RefreshCw size={13} /> New Chat
          </button>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-all ${showSettings ? 'bg-indigo-500/20 text-indigo-400' : 'text-[var(--text-muted)] hover:bg-white/5'}`}
          >
            <Settings size={16} />
          </button>
          <button
            onClick={handleEndAndAnalyze}
            className="px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20 hover:bg-indigo-500/20 transition-all flex items-center gap-1.5"
          >
            <BarChart3 size={14} />
            End & Analyze
          </button>
        </div>
      </div>

      {/* Settings */}
      {showSettings && (
        <div className="mb-3 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-[var(--text-primary)]">Settings</span>
            <button onClick={() => setShowSettings(false)}><X size={14} className="text-[var(--text-muted)]" /></button>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-2">AI Difficulty</p>
              <div className="flex gap-1">
                {DIFFICULTIES.map(d => (
                  <button key={d} onClick={() => setDifficulty(d)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${difficulty === d ? 'bg-indigo-500 text-white' : 'bg-white/5 text-[var(--text-muted)] hover:bg-white/10'}`}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-2">Grammar Tips</p>
              <button onClick={() => setGrammarTips(!grammarTips)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${grammarTips ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-[var(--text-muted)]'}`}>
                <Lightbulb size={11} /> {grammarTips ? 'ON' : 'OFF'}
              </button>
            </div>
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-2">Auto-play AI voice</p>
              <button onClick={() => setAutoSpeak(!autoSpeak)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${autoSpeak ? 'bg-violet-500/20 text-violet-400' : 'bg-white/5 text-[var(--text-muted)]'}`}>
                <Volume2 size={11} /> {autoSpeak ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Topic chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-3 shrink-0">
        {TOPICS.map(t => (
          <button key={t.label} onClick={() => !isLoading && handleTopic(t.label)}
            disabled={isLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all shrink-0 border disabled:opacity-40 ${activeTopic === t.label
              ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
              : 'bg-white/[0.03] border-white/[0.06] text-[var(--text-muted)] hover:border-indigo-500/20 hover:text-[var(--text-primary)]'}`}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
        {messages.map(msg => (
          <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-bold ${msg.role === 'ai' ? 'bg-gradient-to-br from-indigo-500 to-violet-600' : 'bg-gradient-to-br from-zinc-600 to-zinc-700'}`}>
              {msg.role === 'ai' ? <Sparkles size={13} className="text-white" /> : <span className="text-[10px] text-white">ME</span>}
            </div>

            <div className={`flex flex-col max-w-[78%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              {/* Bubble */}
              <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'ai'
                ? 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-tl-sm'
                : 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-tr-sm'}`}>
                {msg.text || (msg.isStreaming ? '' : '...')}
                {msg.isStreaming && (
                  <span className="inline-flex items-center gap-1 ml-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                )}
              </div>

              {/* Actions row for AI messages */}
              {msg.role === 'ai' && !msg.isStreaming && msg.text && (
                <div className="flex items-center gap-1 mt-1">
                  {/* TTS speaker button */}
                  <button
                    onClick={() => handleSpeak(msg)}
                    title={speakingId === msg.id ? 'Stop speaking' : 'Read aloud'}
                    className={`p-1 rounded-lg transition-all ${speakingId === msg.id ? 'text-violet-400 bg-violet-500/10' : 'text-[var(--text-muted)]/50 hover:text-violet-400 hover:bg-violet-500/10'}`}
                  >
                    {speakingId === msg.id ? <VolumeX size={13} /> : <Volume2 size={13} />}
                  </button>

                  {/* Grammar tip toggle */}
                  {grammarTips && msg.id !== 'welcome' && (
                    <button
                      onClick={() => setShowTips(p => ({ ...p, [msg.id]: !p[msg.id] }))}
                      className="flex items-center gap-1 text-xs text-indigo-400/60 hover:text-indigo-400 transition-colors px-1"
                    >
                      <BookOpen size={10} />
                      {showTips[msg.id] ? 'Hide tips' : 'Learning tips'}
                      {showTips[msg.id] ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                    </button>
                  )}
                </div>
              )}

              {showTips[msg.id] && (
                <div className="mt-1.5 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/15 text-xs text-[var(--text-secondary)] leading-relaxed max-w-full">
                  💡 <span className="text-indigo-400 font-medium">Tip:</span> Read this response aloud 2-3 times. Notice how phrases connect naturally. Try shadowing the AI&apos;s response!
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Mic error banner */}
      {sttError && (
        <div className="mt-2 shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
          <AlertTriangle size={13} className="shrink-0" />
          <span className="flex-1">{sttError}</span>
          <button onClick={clearSttError} className="shrink-0 hover:text-red-300 transition-colors">
            <X size={13} />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="mt-3 shrink-0">
        <div className={`flex items-end gap-2 p-2 rounded-2xl bg-[var(--bg-card)] border transition-colors ${isLoading ? 'border-indigo-500/30' : 'border-[var(--border-color)] focus-within:border-indigo-500/40'}`}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            placeholder={isListening ? '🎤 Listening… speak now' : 'Type in English… (Enter to send, Shift+Enter for new line)'}
            rows={1}
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-none outline-none px-2 py-1.5 max-h-24 disabled:opacity-50"
          />
          <div className="flex items-center gap-1 shrink-0 pb-0.5">
            {sttSupported && (
              <button
                onClick={toggleListening}
                disabled={isLoading}
                title={isListening ? 'Stop recording' : 'Speak (Speech Recognition)'}
                className={`p-2 rounded-xl transition-all ${
                  isListening
                    ? 'bg-red-500/20 text-red-400 animate-pulse'
                    : 'text-[var(--text-muted)] hover:bg-white/5 hover:text-[var(--text-primary)]'
                }`}
              >
                {isListening ? <MicOff size={17} /> : <Mic size={17} />}
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={!input.trim() && !interimText.trim() || isLoading}
              className="p-2 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white disabled:opacity-30 hover:from-indigo-500 hover:to-violet-500 transition-all"
            >
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>

        {/* Real-time transcript */}
        {isListening && (
          <div className="mt-2 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-red-500/20 min-h-[40px]">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
            <span className={`text-sm leading-relaxed flex-1 ${interimText ? 'text-zinc-200' : 'text-zinc-600 italic'}`}>
              {interimText || '말해보세요…'}
            </span>
            {interimText && (
              <span className="inline-block w-0.5 h-4 bg-indigo-400 animate-pulse shrink-0" />
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-center gap-6 mt-2 text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1"><Clock size={11} /> {fmt(seconds)}</span>
          <span className="w-px h-3 bg-[var(--border-color)]" />
          <span className="flex items-center gap-1"><MessageCircle size={11} /> {userCount} messages</span>
          <span className="w-px h-3 bg-[var(--border-color)]" />
          <span className="flex items-center gap-1 text-indigo-400"><Zap size={11} /> {difficulty}</span>
          {isListening && (
            <>
              <span className="w-px h-3 bg-[var(--border-color)]" />
              <span className="flex items-center gap-1 text-red-400">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" /> Listening…
              </span>
            </>
          )}
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
