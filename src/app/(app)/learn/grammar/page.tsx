'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Wand2, Loader2, RefreshCw, Copy, CheckCheck,
  Sparkles, BookOpen, Lightbulb, ChevronDown, ChevronUp,
  FileText, Zap, ArrowRight, Volume2, VolumeX, Mic, MicOff,
  Briefcase, Mail, GraduationCap, Hash, FileCheck, Monitor, PenLine,
} from 'lucide-react';
import { useTTS, useSpeechRecognition } from '@/hooks/useSpeech';

/* ─── Writing modes ──────────────────────────────────────────────────────── */
const WRITING_MODES = [
  { id: 'general',      label: 'General',      Icon: Wand2,          desc: 'Everyday English' },
  { id: 'business',     label: 'Business',     Icon: Briefcase,      desc: 'Professional writing' },
  { id: 'email',        label: 'Email',        Icon: Mail,           desc: 'Email etiquette' },
  { id: 'diary',        label: 'Diary',        Icon: PenLine,        desc: 'Personal journaling' },
  { id: 'academic',     label: 'Academic',     Icon: GraduationCap,  desc: 'Essay & reports' },
  { id: 'social',       label: 'Social Media', Icon: Hash,           desc: 'Posts & captions' },
  { id: 'cover_letter', label: 'Cover Letter', Icon: FileCheck,      desc: 'Job applications' },
  { id: 'presentation', label: 'Speech',       Icon: Monitor,        desc: 'Talks & slides' },
] as const;

type GrammarModeId = typeof WRITING_MODES[number]['id'];

/* ─── Mode-specific examples ─────────────────────────────────────────────── */
const MODE_EXAMPLES: Record<GrammarModeId, { label: string; text: string }[]> = {
  general: [
    { label: 'Daily life',  text: 'Yesterday I have went to the grocery store and buyed some vegetables and fruits for make dinner.' },
    { label: 'Travel',      text: 'When I arrived to the airport, I realized that I forget my passport in my house.' },
    { label: 'Opinion',     text: 'I think that studying english is very important because help us to communicate with peoples around the world.' },
  ],
  business: [
    { label: 'Delay notice',  text: 'I want to let you know that the project is delayed because our team have too many works to do and we are very short in budget.' },
    { label: 'Q3 report',     text: 'The sale of last quarter has been increased by 15% compare to previous year which is very good result for company.' },
    { label: 'Meeting req.',  text: 'Please could you confirm your availability for the meeting that we discussed on last friday?' },
  ],
  email: [
    { label: 'Follow-up',  text: 'I just want to check if you have a chance to look at my proposal that I send last week.' },
    { label: 'Request',    text: 'Could you please let me know when you are available to have a meeting to discuss about this project?' },
    { label: 'Apology',    text: 'I am very sorry for the late reply. I have been very busy these days and I apologize for the inconvenient.' },
  ],
  diary: [
    { label: 'Feelings',    text: "Today was a very tiring day. I felt very boring and don't want to doing anything but I have to finished my homework." },
    { label: 'Weekend',     text: 'Last weekend I have went to my friend house and we watched movie together until midnight.' },
    { label: 'Reflection',  text: 'I am thinking a lot about my future lately. I not sure what I want to do with my life and it make me anxious.' },
  ],
  academic: [
    { label: 'Essay intro',  text: 'This paper will discussing about how social media effects on young people mental health in nowadays society.' },
    { label: 'Argument',     text: 'The government should take more stronger action to control the pollution because it become a serious problem.' },
    { label: 'Conclusion',   text: 'In conclusion, we can see that climate change is a very big issue and everyone must do their part to reduce it.' },
  ],
  social: [
    { label: 'Beach caption',  text: 'Had so much fun at the beach today!! The weather was absolutely perfect and I feel so relax 🌊☀️' },
    { label: 'Project post',   text: 'So excite to share my new project with everyone! Spend 3 month working on this and finally its done!' },
    { label: 'Café story',     text: 'Cannot believe how good this cafe is! The coffee taste amazing and the interior is very aesthetic 📸' },
  ],
  cover_letter: [
    { label: 'Opening',   text: 'I am writing to apply for the Marketing Manager position which I found on your company website last week.' },
    { label: 'Skills',    text: 'During my 3 years of work experience, I have led many project and achieved great result in sales team.' },
    { label: 'Closing',   text: 'I look forward to hear from you and hope I can have the opportunity to discuss my qualification further.' },
  ],
  presentation: [
    { label: 'Opening',      text: 'Good morning everyone. Today I will be talk about how our company can improve their customer satisfaction rate.' },
    { label: 'Main point',   text: 'As you can see from this graph, our sale have been grow significantly since we launch the new product.' },
    { label: 'Closing',      text: 'Thank you for listen to my presentation. Do you have any question about the topic that I was talking?' },
  ],
};

/* ─── Mode-specific placeholders ─────────────────────────────────────────── */
const MODE_PLACEHOLDERS: Record<GrammarModeId, string> = {
  general:      'Type or paste your English sentence here…\n\nExample: Yesterday I have went to store and buyed some apple.',
  business:     'Paste your business writing here…\n\nExample: I want to let you know that the deadline has been postponed to next week.',
  email:        'Paste your email draft here…\n\nExample: I am writing to ask if you could please review the attached document.',
  diary:        'Write your diary entry here…\n\nExample: Today was really fun. I have went to the park with my friends.',
  academic:     'Paste your essay or report here…\n\nExample: This essay will discussing about the impact of technology in modern education.',
  social:       'Paste your social media post here…\n\nExample: So excite about my new project!! Finally done after 3 month of hard work 🎉',
  cover_letter: 'Paste your cover letter excerpt here…\n\nExample: I believe my 5 years of experience make me the perfect candidate for this position.',
  presentation: 'Paste your speech or slide text here…\n\nExample: Good morning everyone. Today I will be talk about our company\'s future goals.',
};

interface HistoryItem {
  id: string;
  input: string;
  output: string;
  grammarMode: GrammarModeId;
  timestamp: string;
}

const GRAMMAR_HISTORY_KEY = 'fluentpath_grammar_history_v2';

function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(GRAMMAR_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export default function GrammarCheckerPage() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [grammarMode, setGrammarMode] = useState<GrammarModeId>('general');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [resultSpeaking, setResultSpeaking] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { setHistory(loadHistory()); }, []);

  const { speak, stop: stopTTS, isSpeaking } = useTTS();
  const { isListening, isSupported: sttSupported, toggleListening } =
    useSpeechRecognition((text) => {
      setInput((prev) => (prev ? prev + ' ' + text : text));
      setCharCount((prev) => prev + text.length + 1);
    });

  useEffect(() => { if (!isSpeaking) setResultSpeaking(false); }, [isSpeaking]);

  const handleSpeakResult = () => {
    if (resultSpeaking) { stopTTS(); setResultSpeaking(false); }
    else { speak(result); setResultSpeaking(true); }
  };

  const handleCheck = useCallback(async (text?: string) => {
    const checkText = (text ?? input).trim();
    if (!checkText || isLoading) return;

    setResult('');
    setIsLoading(true);
    setIsStreaming(true);
    abortRef.current = new AbortController();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: checkText }],
          mode: 'grammar',
          grammarMode,
          difficulty: 'Intermediate',
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
          setResult(accumulated);
        }
      }

      if (accumulated) {
        setHistory(prev => {
          const next = [{
            id: `h-${Date.now()}`,
            input: checkText,
            output: accumulated,
            grammarMode,
            timestamp: new Date().toISOString(),
          }, ...prev.slice(0, 9)];
          try { localStorage.setItem(GRAMMAR_HISTORY_KEY, JSON.stringify(next)); } catch {}
          return next;
        });
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;
      const errText = err instanceof Error ? err.message : 'Connection error';
      setResult(`⚠️ ${errText}\n\nMake sure GROQ_API_KEY is set in .env.local`);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [input, isLoading, grammarMode]);

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    abortRef.current?.abort();
    setInput(''); setResult(''); setCharCount(0);
    setIsLoading(false); setIsStreaming(false);
    textareaRef.current?.focus();
  };

  const useExample = (text: string) => {
    setInput(text); setCharCount(text.length); setResult('');
    textareaRef.current?.focus();
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setInput(item.input); setCharCount(item.input.length);
    setResult(item.output);
    setGrammarMode(item.grammarMode ?? 'general');
    setShowHistory(false);
  };

  const currentMode = WRITING_MODES.find(m => m.id === grammarMode)!;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Header ── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Wand2 size={22} className="text-violet-400" />
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Grammar Checker</h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
            AI · Llama 3.3
          </span>
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Choose a writing mode, paste your English — get instant corrections tailored to that context
        </p>
      </div>

      {/* ── Writing mode selector ── */}
      <div>
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">Writing Mode</p>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {WRITING_MODES.map(({ id, label, Icon, desc }) => {
            const active = grammarMode === id;
            return (
              <button
                key={id}
                onClick={() => { setGrammarMode(id); setResult(''); }}
                disabled={isLoading}
                className={`flex-shrink-0 flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all disabled:opacity-40 ${
                  active
                    ? 'border-violet-500/50 bg-violet-500/10 text-violet-300'
                    : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-violet-500/30 hover:text-violet-300 hover:bg-violet-500/5'
                }`}
                title={desc}
              >
                <Icon size={16} className={active ? 'text-violet-400' : ''} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-[var(--text-muted)] mt-1.5 flex items-center gap-1">
          <currentMode.Icon size={11} className="text-violet-400" />
          <span className="text-violet-400 font-medium">{currentMode.label}:</span>
          {currentMode.desc}
        </p>
      </div>

      {/* ── Quick examples ── */}
      <div>
        <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-2">Quick examples</p>
        <div className="flex flex-wrap gap-2">
          {MODE_EXAMPLES[grammarMode].map(ex => (
            <button
              key={ex.label}
              onClick={() => useExample(ex.text)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border border-[var(--border-color)] text-[var(--text-secondary)] hover:border-violet-500/40 hover:text-violet-400 transition-all disabled:opacity-40"
            >
              <FileText size={11} />
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main area ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input panel */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[var(--text-secondary)]">Your English</span>
            <span className={`text-xs ${charCount > 500 ? 'text-red-400' : 'text-[var(--text-muted)]'}`}>
              {charCount} / 500
            </span>
          </div>
          <div className={`relative flex-1 rounded-2xl border transition-colors ${isLoading ? 'border-violet-500/30' : 'border-[var(--border-color)] focus-within:border-violet-500/40'} bg-[var(--bg-card)]`}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => { setInput(e.target.value); setCharCount(e.target.value.length); }}
              onKeyDown={e => { if (e.key === 'Enter' && e.metaKey) { e.preventDefault(); handleCheck(); } }}
              placeholder={MODE_PLACEHOLDERS[grammarMode]}
              maxLength={500}
              disabled={isLoading}
              className="w-full h-48 bg-transparent px-4 py-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] resize-none outline-none disabled:opacity-50 leading-relaxed"
            />
            {input && (
              <button
                onClick={handleReset}
                className="absolute bottom-3 right-3 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all"
              >
                <RefreshCw size={13} />
              </button>
            )}
          </div>

          <div className="flex gap-2 mt-3">
            {sttSupported && (
              <button
                onClick={toggleListening}
                disabled={isLoading}
                title={isListening ? 'Stop recording' : 'Speak your sentence (STT)'}
                className={`px-3 py-2.5 rounded-xl border transition-all ${
                  isListening
                    ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
                    : 'border-[var(--border-color)] text-[var(--text-muted)] hover:border-violet-500/30 hover:text-violet-400'
                }`}
              >
                {isListening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            )}
            <button
              onClick={() => handleCheck()}
              disabled={!input.trim() || isLoading || charCount > 500}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-sm font-medium text-white disabled:opacity-40 hover:shadow-lg hover:shadow-violet-500/25 transition-all"
            >
              {isLoading
                ? <><Loader2 size={15} className="animate-spin" /> Analyzing…</>
                : <><Wand2 size={15} /> Check Grammar</>
              }
            </button>
          </div>
          <p className="text-xs text-[var(--text-muted)] text-center mt-1.5">
            {isListening ? '🎤 Listening… speak your sentence' : '⌘ + Enter to check · Mic button for voice input'}
          </p>
        </div>

        {/* Result panel */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[var(--text-secondary)]">AI Feedback</span>
            {result && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSpeakResult}
                  title={resultSpeaking ? 'Stop speaking' : 'Read aloud'}
                  className={`flex items-center gap-1 text-xs transition-colors ${resultSpeaking ? 'text-violet-400' : 'text-[var(--text-muted)] hover:text-violet-400'}`}
                >
                  {resultSpeaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
                </button>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {copied ? <><CheckCheck size={12} className="text-emerald-400" /> Copied!</> : <><Copy size={12} /> Copy</>}
                </button>
              </div>
            )}
          </div>
          <div className={`flex-1 min-h-48 rounded-2xl border bg-[var(--bg-card)] px-4 py-4 text-sm leading-relaxed transition-colors ${result ? 'border-[var(--border-color)]' : 'border-dashed border-[var(--border-color)]'}`}>
            {!result && !isLoading && (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-center py-8">
                <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <Sparkles size={20} className="text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-secondary)]">AI Grammar Coach</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    Feedback will appear here — tailored to <span className="text-violet-400">{currentMode.label}</span> style
                  </p>
                </div>
              </div>
            )}
            {isStreaming && !result && (
              <div className="flex items-center gap-2 text-violet-400">
                <Loader2 size={14} className="animate-spin" />
                <span className="text-xs">Analyzing your English…</span>
              </div>
            )}
            {result && (
              <div className="text-[var(--text-primary)] whitespace-pre-wrap">
                {result}
                {isStreaming && (
                  <span className="inline-flex items-center gap-1 ml-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Tips section ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: Zap,       color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20',   title: 'Mode-Aware AI',      desc: 'Feedback adapts to your writing context — business, diary, academic and more' },
          { icon: Lightbulb, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20', title: 'Natural Alternatives', desc: 'Learn how to phrase it the way a native writer would in that exact context' },
          { icon: BookOpen,  color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', title: 'Vocabulary Upgrade',  desc: 'Get one concrete word or phrasing upgrade suited to your writing style' },
        ].map(tip => (
          <div key={tip.title} className={`flex gap-3 p-4 rounded-xl border ${tip.bg}`}>
            <tip.icon size={18} className={`${tip.color} shrink-0 mt-0.5`} />
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{tip.title}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{tip.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── History ── */}
      {history.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <BookOpen size={15} />
            Recent checks ({history.length})
            {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showHistory && (
            <div className="mt-3 space-y-2">
              {history.map(item => {
                const m = WRITING_MODES.find(w => w.id === (item.grammarMode ?? 'general'));
                return (
                  <button
                    key={item.id}
                    onClick={() => loadHistoryItem(item)}
                    className="w-full text-left p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-violet-500/30 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {m && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded-full mb-1">
                            <m.Icon size={9} /> {m.label}
                          </span>
                        )}
                        <p className="text-xs text-[var(--text-secondary)] line-clamp-2">{item.input}</p>
                      </div>
                      <ArrowRight size={13} className="text-[var(--text-muted)] group-hover:text-violet-400 transition-colors shrink-0 mt-0.5" />
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">
                      {new Date(item.timestamp).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
