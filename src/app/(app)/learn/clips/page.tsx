'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play, Pause, Headphones, Mic, Check, Bookmark, Sparkles, Eye, EyeOff,
  ChevronRight, Clock, Zap, Filter, X, RotateCcw, Volume2, Star,
  ExternalLink, CheckCircle2, Square, RefreshCw, BarChart3, ArrowLeft,
  ChevronLeft, ChevronDown, Plus, Layers, Link2,
} from 'lucide-react';
import { useTTS, useSpeechRecognition } from '@/hooks/useSpeech';
import { useAppStore } from '@/lib/store';


/* ─── Domain types ─── */
type Step = 'watch' | 'listen' | 'speak';

interface CaptionSeg { text: string; startMs: number; endMs: number; }

interface Clip {
  id: string; title: string; channel: string; channelColor: string;
  duration: string; level: number; category: string;
  expressions: string[]; thumbnail: string; stepsCompleted: Step[];
  views?: string; rating?: number;
  youtubeUrl: string; youtubeId?: string; sentences: string[];
}

/* ─── Constants ─── */
const LEVEL_COLORS: Record<number, string> = {
  1: '#10b981', 2: '#3b82f6', 3: '#f59e0b', 4: '#f97316', 5: '#ef4444',
};
const LEVEL_LABELS: Record<number, string> = {
  1: 'Beginner', 2: 'Elementary', 3: 'Intermediate', 4: 'Upper-Int', 5: 'Advanced',
};
const CAT_COLORS: Record<string, string> = {
  'Daily Life': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  'Tech & AI': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  'Business': 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  'Science': 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  'Entertainment': 'bg-pink-500/15 text-pink-400 border-pink-500/20',
  'Finance': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  'Travel': 'bg-teal-500/15 text-teal-400 border-teal-500/20',
  'Health': 'bg-rose-500/15 text-rose-400 border-rose-500/20',
};

function ytSearch(t: string, ch: string) {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${t} ${ch}`)}`;
}

/* ─── Clip data ─── */
const FEATURED: Clip = {
  id: 'featured', title: "How to Sound More Natural in Everyday English",
  channel: "Rachel's English", channelColor: '#ec4899', duration: '4:32',
  level: 2, category: 'Daily Life', thumbnail: '#6366f1',
  stepsCompleted: [], views: '2.1M', rating: 4.8,
  youtubeUrl: ytSearch("How to Sound More Natural in Everyday English", "Rachel's English"),
  expressions: [
    '"You know what I mean?" — seeking agreement & validation',
    '"I\'m gonna / I\'m going to" — casual future tense in real speech',
    '"Kind of / Sort of" — hedging & softening statements',
  ],
  sentences: [
    "You know what I mean? That's a really common phrase in English.",
    "I'm gonna grab some coffee before the meeting starts.",
    "It's kind of hard to explain, but I'll do my best.",
    "She's sort of the expert on this topic, to be honest.",
    "You know what? I actually changed my mind about that.",
  ],
};

const CLIPS: Clip[] = [
  { id: 'c1', title: 'Why We Sleep Badly on the First Night Away', channel: 'TED', channelColor: '#ef4444', duration: '3:45', level: 3, category: 'Science', expressions: ['"be attuned to"', '"settle in"', '"vigilant"', '"novel environment"'], thumbnail: '#6366f1', stepsCompleted: ['watch', 'listen', 'speak'], views: '1.4M', rating: 4.7, youtubeUrl: ytSearch('Why We Sleep Badly on the First Night Away', 'TED'), sentences: ["When you sleep somewhere unfamiliar, your brain stays alert.", "Half of your brain remains awake to monitor for danger.", "This is known as the first-night effect.", "Your sleep quality is significantly reduced on the first night.", "The brain gradually adapts over the following nights."] },
  { id: 'c2', title: 'The Science of Making Decisions', channel: 'Kurzgesagt', channelColor: '#06b6d4', duration: '5:12', level: 3, category: 'Science', expressions: ['"cognitive load"', '"overwhelmed by options"', '"decision fatigue"'], thumbnail: '#0ea5e9', stepsCompleted: ['watch', 'listen'], views: '3.2M', rating: 4.9, youtubeUrl: ytSearch('The Science of Making Decisions', 'Kurzgesagt'), sentences: ["We make thousands of decisions every single day.", "Having too many options can actually make us less happy.", "This is called decision fatigue.", "Our willpower decreases throughout the day.", "Limiting your choices can lead to better decisions."] },
  { id: 'c3', title: 'How to Introduce Yourself Confidently', channel: 'BBC Learning English', channelColor: '#3b82f6', duration: '2:58', level: 1, category: 'Daily Life', expressions: ['"Nice to meet you"', '"I\'ve heard a lot about you"', '"Pleasure to be here"'], thumbnail: '#3b82f6', stepsCompleted: ['watch'], views: '890K', rating: 4.6, youtubeUrl: ytSearch('How to Introduce Yourself Confidently', 'BBC Learning English'), sentences: ["Nice to meet you, I've heard a lot about you.", "It's a pleasure to be here today, thank you for having me.", "I'm really looking forward to working with you.", "Let me tell you a little bit about myself.", "I've been working in this field for about five years."] },
  { id: 'c4', title: 'iPhone 16 Pro: The Biggest Upgrade Yet', channel: 'Marques Brownlee', channelColor: '#ef4444', duration: '6:20', level: 2, category: 'Tech & AI', expressions: ['"game changer"', '"in terms of"', '"under the hood"'], thumbnail: '#ef4444', stepsCompleted: [], views: '5.6M', rating: 4.8, youtubeUrl: ytSearch('iPhone 16 Pro review', 'Marques Brownlee MKBHD'), sentences: ["This is definitely a game changer for the smartphone industry.", "Under the hood, there are some really major improvements.", "In terms of camera quality, this is the best we've seen yet.", "The battery life has improved significantly this year.", "Overall, I think this is absolutely worth the upgrade."] },
  { id: 'c5', title: 'What Makes a Great Leader?', channel: 'TED', channelColor: '#ef4444', duration: '4:15', level: 4, category: 'Business', expressions: ['"lead by example"', '"foster trust"', '"empower your team"'], thumbnail: '#8b5cf6', stepsCompleted: [], views: '2.3M', rating: 4.9, youtubeUrl: ytSearch('What Makes a Great Leader', 'TED'), sentences: ["Great leaders always lead by example.", "They foster trust within their teams.", "A good leader knows how to empower others.", "Setting the right tone is essential from the very start.", "Leadership is about inspiring people, not just managing them."] },
  { id: 'c6', title: 'My Morning Routine for Max Productivity', channel: "Matt D'Avella", channelColor: '#8b5cf6', duration: '3:30', level: 2, category: 'Daily Life', expressions: ['"get into the zone"', '"kick-start my day"', '"non-negotiable"'], thumbnail: '#a855f7', stepsCompleted: ['watch', 'listen', 'speak'], views: '1.8M', rating: 4.7, youtubeUrl: ytSearch('Morning Routine for Productivity', "Matt D'Avella"), sentences: ["My morning routine is completely non-negotiable.", "I wake up at six and immediately get into the zone.", "Exercise is the first thing I do to kick-start my day.", "A productive morning sets the tone for everything else.", "Consistency is the key to building any good habit."] },
  { id: 'c7', title: 'How the Stock Market Actually Works', channel: 'Graham Stephan', channelColor: '#22c55e', duration: '5:45', level: 3, category: 'Finance', expressions: ['"bear market"', '"diversify your portfolio"', '"compound interest"'], thumbnail: '#10b981', stepsCompleted: [], views: '4.1M', rating: 4.6, youtubeUrl: ytSearch('How the Stock Market Works', 'Graham Stephan'), sentences: ["Diversifying your portfolio reduces your overall risk.", "Compound interest is the most powerful force in investing.", "Don't try to time the market, just play the long game.", "During a bear market, opportunities are actually everywhere.", "Always invest in what you truly understand."] },
  { id: 'c8', title: 'Common English Mistakes Koreans Make', channel: "Rachel's English", channelColor: '#ec4899', duration: '4:00', level: 2, category: 'Daily Life', expressions: ['"How about you?" vs "What about you?"', '"I\'m home" vs "I\'m at home"'], thumbnail: '#ec4899', stepsCompleted: [], views: '760K', rating: 4.8, youtubeUrl: ytSearch('Common English Mistakes Korean Speakers Make', "Rachel's English"), sentences: ["How about you? What do you think about this?", "I'm home! I just got back from work.", "Do you mind if I open the window?", "Could you do me a favor?", "I was wondering if you could help me out."] },
  { id: 'c9', title: 'Exploring Tokyo Street Food', channel: 'Yes Theory', channelColor: '#0ea5e9', duration: '7:10', level: 2, category: 'Travel', expressions: ['"I cannot recommend this enough"', '"blown away"', '"you gotta try this"'], thumbnail: '#0ea5e9', stepsCompleted: ['watch', 'listen', 'speak'], views: '2.7M', rating: 4.9, youtubeUrl: ytSearch('Tokyo Street Food Travel Vlog', 'Yes Theory'), sentences: ["I cannot recommend this place enough.", "I was completely blown away by the food here.", "You've absolutely gotta try this ramen.", "This has been one of the best experiences of my life.", "Tokyo is unlike any city I've ever been to."] },
  { id: 'c10', title: 'The Future of AI Explained Simply', channel: 'Vox', channelColor: '#eab308', duration: '5:55', level: 3, category: 'Tech & AI', expressions: ['"paradigm shift"', '"disrupting the status quo"', '"at the forefront of"'], thumbnail: '#f59e0b', stepsCompleted: [], views: '6.2M', rating: 4.7, youtubeUrl: ytSearch('The Future of Artificial Intelligence Explained', 'Vox'), sentences: ["Artificial intelligence represents a true paradigm shift.", "AI is disrupting the status quo across every single industry.", "We are at the forefront of an unprecedented technological change.", "The implications of this technology are truly far-reaching.", "How we adapt to AI will define the next decade."] },
  { id: 'c11', title: 'How I Learned to Stop Procrastinating', channel: 'Ali Abdaal', channelColor: '#6366f1', duration: '6:45', level: 3, category: 'Daily Life', expressions: ['"bite the bullet"', '"just start"', '"immediate short-term reward"'], thumbnail: '#6366f1', stepsCompleted: ['watch'], views: '3.4M', rating: 4.8, youtubeUrl: ytSearch('How to Stop Procrastinating', 'Ali Abdaal'), sentences: ["The key to beating procrastination is to just start.", "Bite the bullet and begin, no matter how small the step.", "Our brains are wired to seek immediate short-term rewards.", "Breaking tasks into smaller pieces makes them far more manageable.", "Done is always better than perfect."] },
  { id: 'c12', title: 'How to Negotiate Your Salary', channel: 'CNBC', channelColor: '#0891b2', duration: '4:30', level: 4, category: 'Business', expressions: ['"come to the table with"', '"counter-offer"', '"market rate"'], thumbnail: '#0891b2', stepsCompleted: [], views: '1.1M', rating: 4.6, youtubeUrl: ytSearch('How to Negotiate Your Salary', 'CNBC'), sentences: ["Always come to the table with a clear sense of your own value.", "Research the market rate before any salary negotiation.", "Know your walk-away point before the conversation starts.", "A counter-offer is a completely normal part of the process.", "Negotiating your salary is one of the most important life skills."] },
  { id: 'c13', title: 'Simple Habits for Better Mental Health', channel: 'Psych2Go', channelColor: '#10b981', duration: '3:20', level: 2, category: 'Health', expressions: ['"take a toll on"', '"be gentle with yourself"', '"check in with yourself"'], thumbnail: '#10b981', stepsCompleted: [], views: '2.0M', rating: 4.7, youtubeUrl: ytSearch('Simple Habits for Better Mental Health', 'Psych2Go'), sentences: ["Stress and anxiety can really take a toll on your health.", "It's so important to be gentle with yourself.", "Check in with yourself regularly throughout the day.", "Small habits can make a huge difference over time.", "Your mental health is just as important as your physical health."] },
  { id: 'c14', title: "A Beginner's Guide to Investing in 2025", channel: 'Andrei Jikh', channelColor: '#f59e0b', duration: '8:15', level: 3, category: 'Finance', expressions: ['"index fund"', '"time in the market"', '"dollar-cost averaging"'], thumbnail: '#f59e0b', stepsCompleted: [], views: '4.8M', rating: 4.9, youtubeUrl: ytSearch("Beginner's Guide to Investing 2025", 'Andrei Jikh'), sentences: ["Index funds are one of the best ways to start investing.", "Time in the market beats timing the market every time.", "Dollar-cost averaging significantly reduces your risk over time.", "Start investing early to fully benefit from compound interest.", "Even small amounts invested consistently can grow dramatically."] },
];

const ALL_CATEGORIES = ['All', ...Array.from(new Set(CLIPS.map(c => c.category)))];

/* ─── Helpers ─── */
function calcScore(orig: string, heard: string): number {
  if (!heard.trim()) return 0;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z'\s]/g, '').split(/\s+/).filter(Boolean);
  const origW = norm(orig); const heardW = norm(heard);
  if (!origW.length) return 0;
  const set = new Set(origW);
  const matched = heardW.filter(w => set.has(w)).length;
  return Math.max(20, Math.min(100, Math.round((matched / origW.length) * 100)));
}

function extractYtId(input: string): string | null {
  const pats = [/youtu\.be\/([a-zA-Z0-9_-]{11})/, /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/, /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/, /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/, /^([a-zA-Z0-9_-]{11})$/];
  for (const p of pats) { const m = input.match(p); if (m) return m[1]; }
  return null;
}

function fmtTime(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/* ─── Waveform ─── */
function Waveform({ active = false }: { active?: boolean }) {
  return (
    <div className="flex items-end gap-[2px] h-5">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="w-[3px] rounded-full bg-violet-400 transition-all"
          style={{
            height: active ? `${30 + Math.sin(i * 1.2) * 50 + Math.cos(i * 0.8) * 20}%` : '20%',
            animationName: active ? 'waveBar' : 'none',
            animationDuration: `${0.5 + (i % 4) * 0.1}s`,
            animationTimingFunction: 'ease-in-out',
            animationIterationCount: 'infinite',
            animationDirection: 'alternate',
            animationDelay: `${i * 0.04}s`,
            opacity: active ? 1 : 0.3,
          }} />
      ))}
      <style jsx>{`@keyframes waveBar { to { height: 90%; } }`}</style>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ClipPlayer — full redesign
   Shadow mode = overlay directly on the video
   Sentence list = click any sentence to practice it
   ══════════════════════════════════════════════════════ */
function ClipPlayer({ clip, linkedVideoId, onBack, onStepComplete, onLinkVideo }: {
  clip: Clip; linkedVideoId?: string;
  onBack(): void; onStepComplete(id: string, s: Step): void;
  onLinkVideo(clipId: string, videoId: string): void;
}) {
  const videoId = linkedVideoId ?? clip.youtubeId;

  /* ── YT ── */
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const mountedRef = useRef(true);
  const [ytReady, setYtReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  /* ── Captions ── */
  const [caps, setCaps] = useState<CaptionSeg[]>([]);
  const [capIdx, setCapIdx] = useState(-1);       // current playing caption
  const [loading, setLoading] = useState(false);
  const [capError, setCapError] = useState<string | null>(null);
  const capIdxRef = useRef(-1);
  const capsRef = useRef<CaptionSeg[]>([]);
  const sentListRef = useRef<HTMLDivElement>(null);

  /* ── Lesson / shadow state ── */
  const [lessonMode, setLessonMode] = useState(false);  // auto-pause per sentence
  const lessonModeRef = useRef(false);
  const sentEndRef = useRef<number | null>(null);        // auto-pause target (ms)
  const suppressShadowRef = useRef(false);               // prevent double-trigger

  const [shadowMode, setShadowMode] = useState(false);
  const shadowModeRef = useRef(false);
  const [shadowIdx, setShadowIdx] = useState(0);         // which sentence is being shadowed

  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [scoreResult, setScoreResult] = useState<number | null>(null);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  /* ── Link input ── */
  const [showLink, setShowLink] = useState(!videoId);
  const [linkVal, setLinkVal] = useState('');
  const [linkErr, setLinkErr] = useState(false);

  const { speak, stop: stopTts, isSpeaking } = useTTS();
  const { isSupported: sttOk, startListening, stopListening } =
    useSpeechRecognition(t => setTranscript(t));
  const addSentence = useAppStore(s => s.addSentence);

  const hasCaps = caps.length > 0;
  const total = hasCaps ? caps.length : clip.sentences.length;
  const shadowText = hasCaps && shadowIdx < caps.length
    ? caps[shadowIdx].text
    : clip.sentences[Math.min(shadowIdx, clip.sentences.length - 1)] ?? '';

  /* ── Ref sync ── */
  useEffect(() => { shadowModeRef.current = shadowMode; }, [shadowMode]);
  useEffect(() => { capsRef.current = caps; }, [caps]);
  useEffect(() => { lessonModeRef.current = lessonMode; }, [lessonMode]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };

  /* ── Fetch captions on video link ── */
  useEffect(() => {
    if (!videoId) { setCaps([]); setCapError(null); return; }
    setLoading(true); setCapError(null); setCaps([]); setCapIdx(-1); capIdxRef.current = -1;
    const ctrl = new AbortController();
    fetch(`/api/youtube-captions?videoId=${videoId}`, { signal: ctrl.signal })
      .then(r => r.json())
      .then(d => {
        if (!mountedRef.current) return;
        if (d.segments?.length) setCaps(d.segments);
        else setCapError(d.error ?? '자막 없음 — TTS 모드로 연습');
      })
      .catch(e => { if (e.name !== 'AbortError' && mountedRef.current) setCapError('자막 로딩 실패 — TTS 모드로 연습'); })
      .finally(() => { if (mountedRef.current) setLoading(false); });
    return () => ctrl.abort();
  }, [videoId]);

  /* ── YT IFrame API ── */
  useEffect(() => {
    mountedRef.current = true;
    if (!videoId || !containerRef.current) return;
    const init = () => {
      if (!mountedRef.current || !containerRef.current) return;
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: { enablejsapi: 1, origin: window.location.origin, rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: () => { if (mountedRef.current) setYtReady(true); },
          onStateChange: ({ data }) => {
            if (!mountedRef.current) return;
            if (data === 1) setPlaying(true);
            if (data === 2) {
              setPlaying(false);
              // Enter shadow mode only on genuine user-initiated pause
              if (!suppressShadowRef.current && !shadowModeRef.current) {
                const segs = capsRef.current;
                if (segs.length > 0) {
                  const idx = capIdxRef.current;
                  if (idx >= 0) {
                    setShadowIdx(idx);
                  } else {
                    // Paused in a gap — find the closest previous caption
                    const timeMs = (playerRef.current?.getCurrentTime() ?? 0) * 1000;
                    let best = -1;
                    for (let i = segs.length - 1; i >= 0; i--) {
                      if (segs[i].startMs <= timeMs) { best = i; break; }
                    }
                    if (best >= 0) setShadowIdx(best);
                  }
                }
                setShadowMode(true);
                setScoreResult(null);
                setTranscript('');
                setRecording(false);
              }
              suppressShadowRef.current = false;
            }
          },
        },
      });
    };
    if (window.YT?.Player) { init(); }
    else {
      if (!document.getElementById('yt-api')) {
        const s = document.createElement('script');
        s.id = 'yt-api'; s.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(s);
      }
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); init(); };
    }
    return () => { mountedRef.current = false; playerRef.current?.destroy(); playerRef.current = null; };
  }, [videoId]);

  /* ── Polling: sync current caption + auto-pause ── */
  useEffect(() => {
    if (!ytReady) return;
    const id = setInterval(() => { // 80 ms — tight enough for sub-100 ms caption drift
      const timeMs = (playerRef.current?.getCurrentTime() ?? 0) * 1000;

      // Auto-pause at sentence boundary
      if (sentEndRef.current !== null && timeMs >= sentEndRef.current) {
        sentEndRef.current = null;
        suppressShadowRef.current = true;
        playerRef.current?.pauseVideo();
        setShadowMode(true);
        setScoreResult(null);
        setTranscript('');
        setRecording(false);
        return;
      }

      if (caps.length === 0) return;

      // Find current caption
      let found = -1;
      for (let i = 0; i < caps.length; i++) {
        if (timeMs >= caps[i].startMs && timeMs < caps[i].endMs) { found = i; break; }
      }
      if (found !== capIdxRef.current) {
        capIdxRef.current = found;
        setCapIdx(found);
        if (found >= 0 && !shadowModeRef.current) {
          setShadowIdx(found);
          // Auto-scroll sentence list
          sentListRef.current?.querySelector(`[data-idx="${found}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          // Lesson mode: set next auto-pause
          if (lessonModeRef.current && sentEndRef.current === null) {
            sentEndRef.current = caps[found].endMs;
          }
        }
      }
    }, 80);
    return () => clearInterval(id);
  }, [ytReady, caps]);

  /* ── Handlers ── */
  const setRate = (r: number) => { setSpeed(r); if (ytReady) playerRef.current?.setPlaybackRate(r); };

  /** Play a specific sentence and auto-pause at its end */
  const practiceSentence = (idx: number) => {
    if (idx < 0 || idx >= total) return;
    setShadowIdx(idx);
    setShadowMode(false);
    setScoreResult(null);
    setTranscript('');
    setRecording(false);
    stopTts();
    const seg = caps[idx];
    if (seg && ytReady) {
      sentEndRef.current = seg.endMs;
      // Seek 200 ms before the sentence starts so we never clip the first word
      playerRef.current?.seekTo(Math.max(0, (seg.startMs - 200) / 1000), true);
      playerRef.current?.playVideo();
      playerRef.current?.setPlaybackRate(speed);
    }
  };

  /** In shadow mode: replay the video segment (or TTS) */
  const listenAgain = () => {
    const seg = hasCaps && shadowIdx < caps.length ? caps[shadowIdx] : null;
    if (seg && ytReady) {
      suppressShadowRef.current = true;
      // Same 200 ms pre-roll so the listener hears the full sentence
      const seekMs = Math.max(0, seg.startMs - 200);
      playerRef.current?.seekTo(seekMs / 1000, true);
      playerRef.current?.playVideo();
      playerRef.current?.setPlaybackRate(speed);
      // Duration = (sentence length + 200 ms pre-roll) / speed + 400 ms buffer
      const dur = ((seg.endMs - seekMs) / speed) + 400;
      setTimeout(() => {
        suppressShadowRef.current = true;
        playerRef.current?.pauseVideo();
      }, dur);
    } else {
      isSpeaking ? stopTts() : speak(shadowText, 1);
    }
  };

  /** Continue video after shadowing */
  const continueVideo = (markDone = true) => {
    const idx = shadowIdx;
    if (markDone) setCompleted(prev => new Set([...prev, idx]));
    setShadowMode(false);
    setScoreResult(null);
    setTranscript('');
    setRecording(false);
    stopTts();
    onStepComplete(clip.id, 'speak');

    if (!ytReady) return;
    suppressShadowRef.current = true;

    if (lessonMode && hasCaps) {
      const next = idx + 1;
      if (next < caps.length) {
        setShadowIdx(next);
        sentEndRef.current = caps[next].endMs;
        playerRef.current?.seekTo(caps[next].startMs / 1000, true);
        playerRef.current?.playVideo();
        playerRef.current?.setPlaybackRate(speed);
      } else {
        showToast('🎉 모든 문장 완료!');
        const last = caps[caps.length - 1];
        playerRef.current?.seekTo(last.endMs / 1000, true);
        playerRef.current?.playVideo();
      }
    } else {
      const seg = hasCaps && idx < caps.length ? caps[idx] : null;
      if (seg) { playerRef.current?.seekTo(seg.endMs / 1000, true); }
      playerRef.current?.playVideo();
    }
  };

  const startRec = () => { stopTts(); setRecording(true); setScoreResult(null); setTranscript(''); if (sttOk) startListening(); };
  const stopRec = () => {
    setRecording(false);
    if (sttOk) stopListening();
    setScoreResult(calcScore(shadowText, transcript));
  };

  const saveSentence = (idx: number, text: string, src: string) => {
    if (saved.has(idx)) return;
    addSentence({ text, translation: '', status: 'new', repeatCount: 3, source: src });
    setSaved(prev => new Set([...prev, idx]));
    showToast('문장 저장됨!');
  };

  const handleLink = () => {
    const id = extractYtId(linkVal.trim());
    if (!id) { setLinkErr(true); setTimeout(() => setLinkErr(false), 2000); return; }
    onLinkVideo(clip.id, id);
    setLinkVal('');
    setShowLink(false);
    showToast('영상 연결됨 — 자막 로딩 중...');
  };

  const togglePlayPause = () => {
    if (!ytReady) return;
    if (playing) { playerRef.current?.pauseVideo(); }
    else { setShadowMode(false); suppressShadowRef.current = true; playerRef.current?.playVideo(); }
  };

  const progress = Math.round((completed.size / total) * 100);

  /* ══════ RENDER ══════ */
  return (
    <div className="animate-fade-in space-y-4 max-w-6xl mx-auto">

      {/* Toast */}
      {toast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[60] px-5 py-2.5 rounded-2xl bg-zinc-800 border border-white/10 text-sm font-semibold text-zinc-200 shadow-2xl">
          {toast}
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-zinc-400 hover:text-zinc-200 transition-colors shrink-0">
          <ArrowLeft size={14} /> 목록
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-zinc-200 truncate">{clip.title}</h2>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-zinc-500">{clip.channel}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ color: LEVEL_COLORS[clip.level], backgroundColor: `${LEVEL_COLORS[clip.level]}18` }}>
              Lv.{clip.level}
            </span>
            {hasCaps && (
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> 자막 동기화
              </span>
            )}
            {loading && <span className="text-[10px] text-zinc-500">자막 로딩 중...</span>}
          </div>
        </div>
        {/* Link toggle */}
        <button onClick={() => setShowLink(v => !v)} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-zinc-400 hover:text-zinc-200 transition-colors">
          <Link2 size={12} /> {videoId ? '영상 변경' : '영상 연결'}
        </button>
      </div>

      {/* ── Link input (collapsible) ── */}
      {showLink && (
        <div className="flex gap-2 items-center px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] animate-fade-in">
          <Link2 size={13} className="text-zinc-500 shrink-0" />
          <input
            type="text" value={linkVal} onChange={e => setLinkVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLink()}
            placeholder="YouTube URL 또는 Video ID 붙여넣기"
            className={`flex-1 bg-transparent text-sm text-zinc-300 placeholder-zinc-600 outline-none ${linkErr ? 'text-red-400' : ''}`}
            autoFocus
          />
          {linkErr && <span className="text-xs text-red-400 shrink-0">유효하지 않은 URL</span>}
          <button onClick={handleLink} className="shrink-0 px-3 py-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 text-xs font-semibold border border-indigo-500/20 hover:bg-indigo-500/25 transition-colors">
            연결
          </button>
        </div>
      )}

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">

        {/* ════ LEFT: Video + Controls ════ */}
        <div className="xl:col-span-3">

          {/* ─ Video ─ */}
          {videoId ? (
            <div className="relative rounded-t-2xl overflow-hidden bg-black shadow-2xl shadow-black/60" style={{ aspectRatio: '16/9' }}>
              <div ref={containerRef} className="w-full h-full" />

              {/* Loading spinner */}
              {!ytReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                </div>
              )}

              {/* ── Subtitle overlay (playing mode) ── */}
              {ytReady && !shadowMode && capIdx >= 0 && caps.length > 0 && (
                <div className="absolute bottom-3 left-3 right-3 flex justify-center pointer-events-none">
                  <div className="px-4 py-2 bg-black/85 rounded-xl text-white text-sm font-medium text-center max-w-lg leading-snug shadow-lg">
                    {caps[capIdx].text}
                  </div>
                </div>
              )}

              {/* ════ SHADOW MODE OVERLAY ════ */}
              {shadowMode && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-4 p-5">

                  {/* Sentence card */}
                  <div className="w-full max-w-lg">
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl px-6 py-5 border border-white/20 text-center shadow-2xl">
                      {hasCaps && shadowIdx < caps.length && (
                        <div className="text-[10px] font-mono text-white/40 mb-2">{fmtTime(caps[shadowIdx].startMs)}</div>
                      )}
                      <p className="text-white text-lg font-semibold leading-relaxed">
                        {shadowText}
                      </p>
                      {/* Score */}
                      {scoreResult !== null && (
                        <div className="mt-3 animate-fade-in">
                          <span className={`text-3xl font-black ${scoreResult >= 85 ? 'text-emerald-400' : scoreResult >= 65 ? 'text-amber-400' : 'text-rose-400'}`}>
                            {scoreResult}%
                          </span>
                          <p className="text-xs text-white/60 mt-1">
                            {scoreResult >= 85 ? '완벽해요! 🎉' : scoreResult >= 65 ? '잘했어요! 👍' : '한 번 더! 💪'}
                          </p>
                          {transcript && <p className="text-xs text-white/40 mt-1 italic">"{transcript}"</p>}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2.5">

                    {/* Listen */}
                    <button onClick={listenAgain}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-semibold border border-white/20 backdrop-blur-sm transition-all active:scale-95">
                      <Volume2 size={15} /> 듣기
                    </button>

                    {/* Record — main CTA */}
                    <button onClick={recording ? stopRec : startRec}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-bold transition-all active:scale-95 shadow-lg ${
                        recording
                          ? 'bg-red-500/90 border border-red-400 shadow-red-500/30'
                          : 'bg-violet-500 hover:bg-violet-400 border border-violet-400/60 shadow-violet-500/40'
                      }`}>
                      {recording
                        ? <><Square size={15} /> 중지</>
                        : <><Mic size={15} /> 따라하기</>}
                      {recording && <Waveform active />}
                    </button>

                    {/* Continue / Next */}
                    <button onClick={() => continueVideo()}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-semibold border border-white/20 backdrop-blur-sm transition-all active:scale-95">
                      {lessonMode ? <>다음 문장 <ChevronRight size={15} /></> : <>계속 <Play size={15} /></>}
                    </button>
                  </div>

                  {/* Retry / skip row */}
                  {scoreResult !== null && (
                    <div className="flex items-center gap-3 text-xs animate-fade-in">
                      <button onClick={() => { setScoreResult(null); setTranscript(''); }}
                        className="flex items-center gap-1 text-white/50 hover:text-white/80 transition-colors">
                        <RefreshCw size={11} /> 다시
                      </button>
                      <span className="text-white/20">·</span>
                      <button onClick={() => saveSentence(shadowIdx, shadowText, hasCaps ? `${clip.title} (${fmtTime(caps[shadowIdx]?.startMs ?? 0)})` : clip.title)}
                        disabled={saved.has(shadowIdx)}
                        className={`flex items-center gap-1 transition-colors ${saved.has(shadowIdx) ? 'text-emerald-400' : 'text-white/50 hover:text-white/80'}`}>
                        {saved.has(shadowIdx) ? <><Check size={11} /> 저장됨</> : <><Plus size={11} /> 덱에 저장</>}
                      </button>
                    </div>
                  )}

                  {/* Dismiss */}
                  <button onClick={() => continueVideo(false)} className="absolute top-3 right-3 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition-colors">
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* No video — audio placeholder */
            <div className="relative rounded-t-2xl overflow-hidden bg-gradient-to-br from-indigo-950/70 to-violet-950/70 border border-indigo-500/20 flex flex-col items-center justify-center gap-4" style={{ aspectRatio: '16/9' }}>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-2xl shadow-indigo-500/30">
                <Headphones size={40} className="text-white" />
              </div>
              <div className="text-center px-8">
                <p className="text-zinc-200 font-bold text-lg">YouTube 영상을 연결하세요</p>
                <p className="text-sm text-zinc-500 mt-1">상단 "영상 연결" 버튼 → URL 붙여넣기</p>
                <p className="text-xs text-zinc-600 mt-2">영상 없이 TTS로 쉐도잉도 가능해요</p>
              </div>
              <button
                onClick={() => { setShadowMode(true); setShadowIdx(0); setScoreResult(null); setTranscript(''); }}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/30 text-sm font-semibold hover:bg-violet-500/30 transition-colors">
                <Mic size={14} /> TTS로 쉐도잉 시작
              </button>
            </div>
          )}

          {/* ── Control bar (below video) ── */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-zinc-900/70 border border-t-0 border-white/[0.07] rounded-b-2xl">

            {/* Sentence nav */}
            <button onClick={() => practiceSentence(shadowIdx - 1)} disabled={shadowIdx <= 0}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] disabled:opacity-25 transition-all">
              <ChevronLeft size={15} />
            </button>
            <span className="text-[11px] font-mono text-zinc-500 tabular-nums min-w-[3rem] text-center">
              {shadowIdx + 1} / {total}
            </span>
            <button onClick={() => practiceSentence(shadowIdx + 1)} disabled={shadowIdx >= total - 1}
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] disabled:opacity-25 transition-all">
              <ChevronRight size={15} />
            </button>

            <div className="w-px h-4 bg-white/10 mx-1" />

            {/* Speed */}
            {[0.75, 1, 1.25].map(r => (
              <button key={r} onClick={() => setRate(r)}
                className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all ${speed === r ? 'bg-indigo-500 text-white' : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/[0.05]'}`}>
                {r}x
              </button>
            ))}

            <div className="w-px h-4 bg-white/10 mx-1" />

            {/* Lesson mode toggle */}
            <button onClick={() => setLessonMode(v => !v)}
              title={lessonMode ? '문장별 자동정지 켜짐' : '문장별 자동정지 꺼짐'}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold transition-all ${lessonMode ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' : 'text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.04]'}`}>
              <RotateCcw size={11} className={lessonMode ? 'animate-pulse' : ''} />
              {lessonMode ? '문장별 ON' : '문장별'}
            </button>

            {/* Play/Pause */}
            {ytReady && (
              <button onClick={togglePlayPause}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border border-white/[0.06] hover:bg-white/[0.06]">
                {playing
                  ? <><Pause size={12} className="text-zinc-400" /> <span className="text-zinc-500">정지</span></>
                  : <><Play size={12} className="text-emerald-400" /> <span className="text-zinc-400">재생</span></>}
              </button>
            )}
          </div>

          {/* ── Caption error notice ── */}
          {capError && (
            <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/[0.06] border border-amber-500/15">
              <span className="text-[11px] text-amber-400">{capError}</span>
            </div>
          )}

          {/* ── Key expressions ── */}
          <div className="mt-4 rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
            <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles size={10} className="text-yellow-400" /> Key Expressions
            </h4>
            <div className="space-y-2">
              {clip.expressions.map((expr, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 text-[9px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                  <span className="text-sm text-zinc-300 leading-relaxed">{expr}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ════ RIGHT: Sentence list ════ */}
        <div className="xl:col-span-2">
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden xl:sticky xl:top-4 flex flex-col" style={{ maxHeight: 'calc(100vh - 8rem)' }}>

            {/* Panel header */}
            <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2 shrink-0">
              <Layers size={13} className="text-indigo-400" />
              <h3 className="text-sm font-bold text-zinc-300 flex-1">
                {hasCaps ? 'Captions' : 'Sentences'}
                <span className="ml-1.5 text-zinc-600 font-normal text-xs">({total})</span>
              </h3>
              {/* Progress */}
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-1 rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-violet-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-[10px] text-zinc-600">{progress}%</span>
              </div>
            </div>

            {/* Hint */}
            <div className="px-4 py-2 bg-indigo-500/[0.05] border-b border-indigo-500/10 shrink-0">
              <p className="text-[11px] text-indigo-400/70">
                {hasCaps ? '클릭하면 해당 문장 재생 후 쉐도잉 시작' : 'Shadow 버튼으로 TTS 쉐도잉'}
              </p>
            </div>

            {/* Sentence list */}
            <div ref={sentListRef} className="overflow-y-auto flex-1 divide-y divide-white/[0.04]">
              {hasCaps ? (
                caps.map((seg, i) => (
                  <div key={i} data-idx={i}
                    onClick={() => practiceSentence(i)}
                    className={`group px-4 py-3 cursor-pointer transition-all border-l-[3px] ${
                      i === shadowIdx
                        ? shadowMode
                          ? 'bg-violet-500/10 border-l-violet-500'
                          : 'bg-indigo-500/[0.08] border-l-indigo-500'
                        : 'border-l-transparent hover:bg-white/[0.03] hover:border-l-white/20'
                    }`}>
                    <div className="flex items-start gap-2.5">
                      {/* Status icon */}
                      <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5 transition-all ${
                        completed.has(i) ? 'bg-emerald-500/20 text-emerald-400' :
                        i === shadowIdx ? 'bg-violet-500/30 text-violet-300' :
                        'bg-white/[0.05] text-zinc-600'
                      }`}>
                        {completed.has(i) ? <Check size={9} /> : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-relaxed transition-colors ${
                          i === shadowIdx ? 'text-zinc-100 font-medium' : 'text-zinc-400 group-hover:text-zinc-300'
                        }`}>{seg.text}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-[10px] font-mono text-zinc-700">{fmtTime(seg.startMs)}</span>
                          <button onClick={e => { e.stopPropagation(); saveSentence(i, seg.text, `${clip.title} (${fmtTime(seg.startMs)})`); }}
                            disabled={saved.has(i)}
                            className={`text-[10px] transition-colors ${saved.has(i) ? 'text-emerald-400' : 'text-zinc-700 hover:text-zinc-400'}`}>
                            {saved.has(i) ? '✓ 저장됨' : '+ 저장'}
                          </button>
                        </div>
                      </div>
                      {/* Play indicator */}
                      {i === capIdx && !shadowMode && (
                        <div className="shrink-0 flex items-end gap-[2px] h-4 mt-1">
                          {[0, 1, 2].map(j => (
                            <div key={j} className="w-[3px] rounded-full bg-indigo-400"
                              style={{ height: '100%', animation: `waveBar ${0.4 + j * 0.1}s ease-in-out infinite alternate`, animationDelay: `${j * 0.12}s` }} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                /* Fallback sentences */
                clip.sentences.map((s, i) => (
                  <div key={i} data-idx={i}
                    className={`group px-4 py-3 border-l-[3px] transition-all ${
                      i === shadowIdx ? 'bg-violet-500/10 border-l-violet-500' : 'border-l-transparent hover:bg-white/[0.03]'
                    }`}>
                    <div className="flex items-start gap-2.5">
                      <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5 ${
                        completed.has(i) ? 'bg-emerald-500/20 text-emerald-400' :
                        i === shadowIdx ? 'bg-violet-500/30 text-violet-300' :
                        'bg-white/[0.05] text-zinc-600'
                      }`}>
                        {completed.has(i) ? <Check size={9} /> : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm leading-relaxed ${i === shadowIdx ? 'text-zinc-100 font-medium' : 'text-zinc-400'}`}>{s}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <button onClick={() => { setShadowIdx(i); speak(s, 1); }}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors">
                            🔊 듣기
                          </button>
                          <button onClick={() => { setShadowIdx(i); setShadowMode(true); setScoreResult(null); setTranscript(''); setRecording(false); }}
                            className="text-[10px] text-violet-400 hover:text-violet-300 transition-colors">
                            🎤 Shadow
                          </button>
                          <button onClick={() => saveSentence(i, s, clip.title)} disabled={saved.has(i)}
                            className={`text-[10px] transition-colors ${saved.has(i) ? 'text-emerald-400' : 'text-zinc-700 hover:text-zinc-400'}`}>
                            {saved.has(i) ? '✓ 저장됨' : '+ 저장'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── ClipCard ─── */
function ClipCard({ clip, onToggleStep, bookmarked, onToggleBookmark, expanded, onToggleExpand, onOpenPlayer }: {
  clip: Clip; onToggleStep(id: string, step: Step): void; bookmarked: boolean;
  onToggleBookmark(id: string): void; expanded: boolean; onToggleExpand(id: string): void;
  onOpenPlayer(clip: Clip): void;
}) {
  const done = clip.stepsCompleted.length === 3;
  const stepClick = (step: Step) => {
    if (step === 'watch' || step === 'speak') { onOpenPlayer(clip); if (!clip.stepsCompleted.includes(step)) onToggleStep(clip.id, step); }
    else onToggleStep(clip.id, step);
  };
  return (
    <div className={`rounded-2xl border transition-all ${done ? 'bg-emerald-500/[0.04] border-emerald-500/15' : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]'}`}>
      <div className="flex gap-4 p-4">
        <button onClick={() => { onOpenPlayer(clip); if (!clip.stepsCompleted.includes('watch')) onToggleStep(clip.id, 'watch'); }}
          className="flex-shrink-0 w-32 sm:w-40 h-[88px] rounded-xl relative overflow-hidden flex items-center justify-center cursor-pointer group"
          style={{ backgroundColor: clip.thumbnail }}>
          <div className="absolute inset-0 bg-black/25 group-hover:bg-black/40 transition-colors" />
          {done
            ? <div className="relative w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg"><Check size={20} className="text-white" /></div>
            : <div className="relative w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform"><Play size={16} className="text-white ml-0.5" /></div>}
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono">{clip.duration}</span>
        </button>
        <div className="flex-1 min-w-0 py-0.5">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold text-sm leading-snug ${done ? 'text-zinc-500' : 'text-zinc-200'}`}>{clip.title}</h3>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span className="flex-shrink-0 w-4 h-4 rounded text-white text-[8px] font-bold flex items-center justify-center" style={{ backgroundColor: clip.channelColor }}>{clip.channel[0]}</span>
                <span className="text-xs text-zinc-500">{clip.channel}</span>
                {clip.views && <span className="text-xs text-zinc-600">· {clip.views}</span>}
                {clip.rating && <span className="flex items-center gap-0.5 text-xs text-yellow-500"><Star size={9} className="fill-yellow-500" /> {clip.rating}</span>}
              </div>
            </div>
            <button onClick={() => onToggleBookmark(clip.id)} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors">
              <Bookmark size={14} className={bookmarked ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-600'} />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: LEVEL_COLORS[clip.level], backgroundColor: `${LEVEL_COLORS[clip.level]}15` }}>Lv.{clip.level} {LEVEL_LABELS[clip.level]}</span>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${CAT_COLORS[clip.category] ?? 'bg-white/[0.06] text-zinc-400'}`}>{clip.category}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-3">
            {(['watch', 'listen', 'speak'] as Step[]).map(step => {
              const d = clip.stepsCompleted.includes(step);
              const labels: Record<Step, string> = { watch: 'Watch', listen: 'Listen', speak: 'Shadow' };
              const cols: Record<Step, string> = { watch: d ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20', listen: d ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-white/[0.04] text-zinc-600 border-white/[0.04] hover:bg-white/[0.08] hover:text-zinc-400', speak: d ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' : 'bg-violet-500/10 text-violet-400 border-violet-500/20 hover:bg-violet-500/20' };
              return (
                <button key={step} onClick={() => stepClick(step)} className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all border ${cols[step]}`}>
                  {d && <Check size={9} />} {labels[step]}
                </button>
              );
            })}
            <button onClick={() => onToggleExpand(clip.id)} className="ml-auto flex items-center gap-1 text-[10px] text-zinc-600 hover:text-zinc-400 transition-colors">
              표현 <ChevronDown size={10} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>
      {expanded && (
        <div className="px-4 pb-4">
          <div className="rounded-xl bg-indigo-500/[0.06] border border-indigo-500/15 p-4 space-y-2">
            <h4 className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-3">Key Expressions</h4>
            {clip.expressions.map((expr, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                <span className="text-sm text-zinc-300">{expr}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main page ─── */
export default function ClipsPage() {
  const [clips, setClips] = useState<Clip[]>(CLIPS);
  const [filterLevel, setFilterLevel] = useState<number | null>(null);
  const [filterCat, setFilterCat] = useState('All');
  const [hideDone, setHideDone] = useState(false);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [playerClip, setPlayerClip] = useState<Clip | null>(null);
  const [linkedVideos, setLinkedVideos] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem('neuroeng_clip_videos') || '{}'); } catch { return {}; }
  });

  const linkVideo = (clipId: string, videoId: string) => {
    const next = { ...linkedVideos, [clipId]: videoId };
    setLinkedVideos(next);
    localStorage.setItem('neuroeng_clip_videos', JSON.stringify(next));
  };
  const toggleStep = (id: string, step: Step) => {
    setClips(prev => prev.map(c => { if (c.id !== id) return c; const has = c.stepsCompleted.includes(step); return { ...c, stepsCompleted: has ? c.stepsCompleted.filter(s => s !== step) : [...c.stepsCompleted, step] }; }));
  };
  const toggleBookmark = (id: string) => setBookmarks(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleExpand = (id: string) => setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const filtered = useMemo(() => clips.filter(c => {
    if (filterLevel !== null && c.level !== filterLevel) return false;
    if (filterCat !== 'All' && c.category !== filterCat) return false;
    if (hideDone && c.stepsCompleted.length === 3) return false;
    return true;
  }), [clips, filterLevel, filterCat, hideDone]);

  const totalDone = clips.filter(c => c.stepsCompleted.length === 3).length;
  const totalXP = clips.reduce((s, c) => s + c.stepsCompleted.length * 10, 0);
  const activeFilters = (filterLevel !== null ? 1 : 0) + (filterCat !== 'All' ? 1 : 0) + (hideDone ? 1 : 0);

  if (playerClip) {
    return <ClipPlayer clip={playerClip} linkedVideoId={linkedVideos[playerClip.id]} onBack={() => setPlayerClip(null)} onStepComplete={toggleStep} onLinkVideo={linkVideo} />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 tracking-tight flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg shadow-rose-500/20"><Play size={22} className="text-white" /></div>
            Daily Clips
          </h1>
          <p className="mt-1.5 text-zinc-500 text-sm">영상 클릭 → 문장 클릭 → 쉐도잉. 자막 실시간 동기화.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-sm text-zinc-400"><span className="text-emerald-400 font-semibold">{totalDone}</span><span className="text-zinc-600">/</span><span className="text-zinc-300 font-semibold">{clips.length}</span><span className="text-zinc-600 ml-1">완료</span></span>
          </div>
          <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-yellow-500/[0.06] border border-yellow-500/15">
            <Zap size={14} className="text-yellow-400" /><span className="text-sm font-semibold text-yellow-400">{totalXP} XP</span>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { step: '1', icon: Eye, label: '영상 열기', desc: '클립 선택 → YouTube 연결', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { step: '2', icon: Layers, label: '문장 클릭', desc: '오른쪽 자막 클릭 → 그 구간 재생', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
          { step: '3', icon: Mic, label: '즉시 쉐도잉', desc: '영상 위 오버레이로 바로 따라하기', color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
        ].map(s => (
          <div key={s.step} className={`flex flex-col items-center text-center p-4 rounded-xl border ${s.bg}`}>
            <s.icon size={22} className={`${s.color} mb-2`} />
            <p className={`text-xs font-bold ${s.color}`}>Step {s.step}</p>
            <p className={`text-sm font-semibold ${s.color}`}>{s.label}</p>
            <p className="text-[10px] text-zinc-500 mt-0.5 leading-tight">{s.desc}</p>
          </div>
        ))}
      </div>

      {/* Featured */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-600/20 to-violet-600/20 border border-indigo-500/20">
        <div className="flex flex-col lg:flex-row">
          <button onClick={() => setPlayerClip(FEATURED)}
            className="lg:w-[45%] aspect-video lg:aspect-auto relative bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center min-h-[200px] group cursor-pointer">
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors" />
            <div className="relative flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 group-hover:scale-110 transition-all shadow-2xl"><Play size={26} className="text-white ml-1" /></div>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-sm text-white text-xs font-semibold border border-white/10"><Mic size={11} /> 쉐도잉 시작</span>
            </div>
            <div className="absolute top-3 left-3"><span className="px-2.5 py-1 rounded-lg bg-yellow-500/20 text-yellow-400 text-xs font-bold flex items-center gap-1"><Sparkles size={11} /> Featured</span></div>
          </button>
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: FEATURED.channelColor }}>{FEATURED.channel[0]}</span>
                <span className="text-sm text-zinc-400">{FEATURED.channel}</span>
                <span className="ml-auto flex items-center gap-1 text-xs text-zinc-500"><Clock size={11} /> {FEATURED.duration}</span>
              </div>
              <h2 className="text-xl font-bold text-zinc-100 leading-snug">{FEATURED.title}</h2>
              <div className="mt-4 space-y-2">
                {FEATURED.expressions.map((expr, i) => (
                  <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.04]">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                    <span className="text-sm text-zinc-300">{expr}</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setPlayerClip(FEATURED)}
              className="mt-5 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold border bg-violet-500/10 text-violet-400 border-violet-500/20 hover:bg-violet-500/20 transition-all">
              <Mic size={15} /> 쉐도잉 연습 시작
            </button>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 flex-wrap">
            {ALL_CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setFilterCat(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${filterCat === cat ? cat === 'All' ? 'bg-white/[0.1] text-zinc-200 border-white/[0.12]' : `${CAT_COLORS[cat] ?? ''} border-transparent` : 'border-white/[0.04] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'}`}>
                {cat}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={() => setShowFilters(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${activeFilters > 0 ? 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25' : 'border-white/[0.06] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'}`}>
              <Filter size={12} /> Filter {activeFilters > 0 && <span className="w-4 h-4 rounded-full bg-indigo-500 text-white text-[9px] font-bold flex items-center justify-center">{activeFilters}</span>}
            </button>
            <button onClick={() => setHideDone(v => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${hideDone ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'border-white/[0.04] text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'}`}>
              {hideDone ? <Eye size={12} /> : <EyeOff size={12} />} {hideDone ? 'Show all' : 'Hide done'}
            </button>
          </div>
        </div>
        {showFilters && (
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Level</span>
            <button onClick={() => setFilterLevel(null)} className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${filterLevel === null ? 'bg-white/[0.1] text-zinc-200 border-white/[0.1]' : 'border-white/[0.04] text-zinc-500 hover:text-zinc-300'}`}>All</button>
            {[1, 2, 3, 4, 5].map(l => (
              <button key={l} onClick={() => setFilterLevel(l === filterLevel ? null : l)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${filterLevel === l ? 'text-white border-transparent' : 'border-white/[0.04] text-zinc-500 hover:text-zinc-300'}`}
                style={filterLevel === l ? { backgroundColor: LEVEL_COLORS[l] } : undefined}>
                Lv.{l}
              </button>
            ))}
            {activeFilters > 0 && <button onClick={() => { setFilterLevel(null); setFilterCat('All'); setHideDone(false); }} className="ml-auto flex items-center gap-1 text-xs text-zinc-500 hover:text-red-400 transition-colors"><RotateCcw size={11} /> Reset</button>}
          </div>
        )}
        <p className="text-xs text-zinc-600">{filtered.length} clips{activeFilters > 0 && <button onClick={() => { setFilterLevel(null); setFilterCat('All'); setHideDone(false); }} className="ml-2 text-indigo-400 hover:text-indigo-300"><X size={10} className="inline" /> 필터 해제</button>}</p>
      </div>

      {/* Clip feed */}
      <div className="space-y-3">
        {filtered.map(clip => (
          <ClipCard key={clip.id} clip={clip} onToggleStep={toggleStep} bookmarked={bookmarks.has(clip.id)} onToggleBookmark={toggleBookmark} expanded={expanded.has(clip.id)} onToggleExpand={toggleExpand} onOpenPlayer={setPlayerClip} />
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-20 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-auto"><Volume2 size={24} className="text-zinc-600" /></div>
            <p className="text-zinc-400 font-medium">No clips match your filters.</p>
            <button onClick={() => { setFilterLevel(null); setFilterCat('All'); setHideDone(false); }} className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mx-auto"><RotateCcw size={13} /> 초기화</button>
          </div>
        )}
      </div>
    </div>
  );
}
