'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, Trash2, RefreshCw, ArrowLeft, Play, Pause, Mic, Square,
  Volume2, CheckCircle2, ChevronRight, BarChart3,
  Sparkles, Loader2, X, Check, Eye,
  Rss, Clock, ExternalLink, Globe, Star, BookOpen,
  Subtitles, PenLine, Upload, AlertCircle, FileText,
  Tag, Settings2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useTTS, useSpeechRecognition } from '@/hooks/useSpeech';
import { useAppStore } from '@/lib/store';

/* ─────────────────────── Notion Static Data ─────────────────────── */

interface NotionChannel {
  name: string;
  url: string;
  handle: string;
  subscribers: string | null;
  level: number | null;
  categories: string[];
  description: string;
}

const NOTION_CHANNELS: NotionChannel[] = [
  { name: "English Speeches", handle: "EnglishSpeeches", url: "https://www.youtube.com/@EnglishSpeeches/videos", subscribers: "5.9M", level: 1, categories: ["Self-Development", "Motivation", "Education"], description: "스티브잡스, 제프 베조스, 엠마왓슨 등 전세계 유명인들의 스피치를 모아서 편집해 업로드하는 채널." },
  { name: "조니아 Nia Cho", handle: "_niacho", url: "https://www.youtube.com/@_niacho", subscribers: null, level: 1, categories: ["V-log", "Travel"], description: "한국 유튜버. 영어+한국 자막 동시 제공. 브이로그 형식으로 만든다." },
  { name: "허브레인 영어 연구소", handle: "%ED%97%88%EB%B8%8C%EB%A0%88%EC%9D%B8_%EC%98%81%EC%96%B4_%EC%97%B0%EA%B5%AC%EC%86%8C", url: "https://www.youtube.com/@%ED%97%88%EB%B8%8C%EB%A0%88%EC%9D%B8_%EC%98%81%EC%96%B4_%EC%97%B0%EA%B5%AC%EC%86%8C/shorts", subscribers: null, level: 1, categories: ["Youtube", "Business"], description: "유튜버를 위한 콘텐츠." },
  { name: "Einzelgänger", handle: "Einzelgänger", url: "https://www.youtube.com/@Einzelg%C3%A4nger", subscribers: null, level: 2, categories: ["Self-Development", "Motivation", "Education"], description: "인생을 살아가는데 도움이 되는 철학과 지혜들을 모아놓은 채널. 자기계발을 좋아한다면 반드시." },
  { name: "TED-Ed", handle: "TEDEd", url: "https://www.youtube.com/@TEDEd/videos", subscribers: "21M", level: 2, categories: ["Self-Development", "Motivation", "Education"], description: "TED에서 만든 서브 채널. 누구나 관심있을 법한 대중적인 주제로 영상을 만듦." },
  { name: "Anna Engelschall", handle: "annaengelschall", url: "https://www.youtube.com/@annaengelschall/videos", subscribers: "127K", level: 2, categories: ["Self-Development", "Motivation"], description: "자기계발과 동기부여에 관한 영상. 천천히 또박또박 말해서 듣기 연습하기 좋음." },
  { name: "Maggie McCormack", handle: "Maggieloveslife", url: "https://www.youtube.com/@Maggieloveslife", subscribers: "133K", level: 2, categories: ["Motivation", "Self-Development"], description: "인생 조언 및 본인이 살아가면서 느낀 점을 담백하게 담아내는 유튜버." },
  { name: "Lana Blakely", handle: "LanaBlakely", url: "https://www.youtube.com/@LanaBlakely", subscribers: null, level: 2.5, categories: ["Self-Development", "Motivation"], description: "여성 자기계발 유튜버. 영상 자체가 굉장히 차분하고 담백하다. 인생 조언 영상 위주." },
  { name: "EO", handle: "entreprenuership_opportunities", url: "https://www.youtube.com/@entreprenuership_opportunities", subscribers: "390K", level: 2.5, categories: ["Interview", "Business"], description: "전세계의 스타트업 창업가, 기업가, 빅테크에서 일하는 사람들을 인터뷰하는 영상." },
  { name: "SmarterEveryDay", handle: "smartereveryday", url: "https://www.youtube.com/@smartereveryday", subscribers: "11M", level: 2.5, categories: ["Education", "Technology", "Science"], description: "물리/화학/생명과학/지구과학 가릴 것 없이 모든 과학을 재미있게 설명해준다." },
  { name: "Keiani", handle: "keianimabe", url: "https://www.youtube.com/@keianimabe", subscribers: null, level: 2.5, categories: ["V-log"], description: "담백한 분위기의 브이로그를 주로 찍는 여성 유튜버." },
  { name: "Colt Kirwan", handle: "ColtKirwan", url: "https://www.youtube.com/@ColtKirwan", subscribers: "135K", level: 2.5, categories: ["Filmmaking", "V-log", "Self-Development"], description: "뉴욕에 살고 있는 Filmmaking을 꿈꾸는 청년. 구독자 수에 비해 매우 훌륭한 영상." },
  { name: "Brian Wiles", handle: "BrianWilesQuizzes", url: "https://www.youtube.com/@BrianWilesQuizzes", subscribers: "2.5M", level: 2.5, categories: ["Language-Learning"], description: "4개 이상의 언어를 구사하는 유튜버. 전반적인 언어 학습 팁과 공부법을 제공한다." },
  { name: "Ruhi Çenet", handle: "ruhicenetvideos", url: "https://www.youtube.com/@ruhicenetvideos", subscribers: "12.2M", level: 2.5, categories: ["Education"], description: "튀르키예 출신 독립 다큐멘터리 감독. 다양한 주제의 다큐멘터리를 방송국급 퀄리티로 제작." },
  { name: "Mark Manson", handle: "IAmMarkManson", url: "https://www.youtube.com/@IAmMarkManson", subscribers: "2.6M", level: 3, categories: ["Self-Development", "Motivation"], description: "'신경끄기의 기술' 저자. 자기계발과 관련된 영상을 많이 제작함." },
  { name: "ThinkMedia", handle: "ThinkMediaTV", url: "https://www.youtube.com/@ThinkMediaPodcast/videos", subscribers: "3.2M", level: 3, categories: ["Filmmaking", "Youtube"], description: "유튜브 알고리즘, 영상 제작법 등 유튜버를 위한 영상을 만드는 유튜버." },
  { name: "Elizabeth Filips", handle: "elizabethfilips", url: "https://www.youtube.com/@elizabethfilips", subscribers: null, level: 3, categories: ["Self-Development", "Motivation", "Youtube"], description: "Ali Abdaal의 직원 유튜버. 자기계발, 시간 관리 등에 대한 영상을 만든다." },
  { name: "Life Of Riza", handle: "LifeOfRiza", url: "https://www.youtube.com/@LifeOfRiza/videos", subscribers: "852K", level: 3, categories: ["V-log", "Self-Development", "Motivation", "Filmmaking"], description: "색보정, 스토리텔링 등 종합적으로 영상미가 미쳤음. 웬만한 다큐멘터리보다 영상 퀄리티가 좋다." },
  { name: "James Edward", handle: "James____Edward", url: "https://www.youtube.com/@James____Edward", subscribers: null, level: 3, categories: ["Entertainment"], description: "모델 일을 하고 있는 20대 청년. 매력적인 일상을 담은 브이로그." },
  { name: "Erik Van Conover", handle: "erikvanconover", url: "https://www.youtube.com/@erikvanconover", subscribers: null, level: 3, categories: ["Entertainment"], description: "엄청나게 비싼 건물을 소개하는 유튜버. 뉴욕 초고층 빌딩 펜트하우스 투어 등." },
  { name: "emma chamberlain", handle: "emmachamberlain", url: "https://www.youtube.com/@emmachamberlain", subscribers: "12M", level: 3.5, categories: ["V-log"], description: "전세계 탑클래스 브이로거. 영상 스토리텔링도 훌륭하고, 친근한 느낌의 브이로그를 제작." },
  { name: "Architectural Digest", handle: "Archdigest", url: "https://www.youtube.com/@Archdigest", subscribers: "7.2M", level: 4, categories: ["Entertainment", "Celebrities"], description: "각종 셀럽들이 자신의 집을 소개하는 채널. 좋아하는 연예인 집 투어를 찾아보자." },
  { name: "비즈까페 (BZCF)", handle: "B_ZCF", url: "https://www.youtube.com/@B_ZCF", subscribers: null, level: null, categories: ["Business", "Technology", "Science"], description: "유명 기술 관련 CEO 인터뷰 영상." },
  { name: "Mr.Beast", handle: "MrBeast", url: "https://www.youtube.com/@MrBeast", subscribers: "365M", level: 4.5, categories: ["Entertainment"], description: "전세계 구독자 1위 유튜버. 엄청난 스케일의 컨텐츠. 말하는 속도가 매우 빨라서 초보자에게는 비추." },
  { name: "The Tonight Show (Jimmy Fallon)", handle: "fallontonight", url: "https://www.youtube.com/@fallontonight", subscribers: "32M", level: 5, categories: ["Entertainment", "Celebrities"], description: "미국의 대표적인 토크쇼. 원어민 수준의 빠른 말하기와 슬랭이 많다." },
];

interface NotionResource {
  name: string;
  url: string;
  level: number | null;
  categories: string[];
  description: string;
}

const NOTION_RESOURCES: NotionResource[] = [
  { name: "BBC Learning English", url: "https://www.bbc.co.uk/learningenglish/english/", level: 2.5, categories: ["Language-Learning"], description: "BBC 공식 영어 학습 사이트. 6 Minute English 등 다양한 오디오/비디오 콘텐츠 제공." },
];

/* ─────────────────────── Level helpers ─────────────────────── */

function getLevelColor(level: number | null): string {
  if (level === null) return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
  if (level <= 1) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  if (level <= 2) return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
  if (level <= 2.5) return 'text-sky-400 bg-sky-500/10 border-sky-500/20';
  if (level <= 3) return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
  if (level <= 3.5) return 'text-violet-400 bg-violet-500/10 border-violet-500/20';
  if (level <= 4) return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
  if (level <= 4.5) return 'text-pink-400 bg-pink-500/10 border-pink-500/20';
  return 'text-red-400 bg-red-500/10 border-red-500/20';
}

function getLevelLabel(level: number | null): string {
  if (level === null) return '미분류';
  if (level <= 1) return 'Lv.1 초급';
  if (level <= 2) return 'Lv.2 쉬움';
  if (level <= 2.5) return 'Lv.2.5 중하';
  if (level <= 3) return 'Lv.3 중급';
  if (level <= 3.5) return 'Lv.3.5 중상';
  if (level <= 4) return 'Lv.4 어려움';
  if (level <= 4.5) return 'Lv.4.5 고급';
  return 'Lv.5 원어민';
}

const ALL_CATEGORIES = [
  'Self-Development', 'Motivation', 'V-log', 'Education', 'Entertainment',
  'Filmmaking', 'Youtube', 'Business', 'Technology', 'Science',
  'Language-Learning', 'Celebrities', 'Interview', 'Travel',
];


/* ─────────────────────── Types ─────────────────────── */

interface ChannelInfo {
  channelId: string;
  channelName: string;
  color: string;
  addedAt: string;
  level?: number | null;
  tags?: string[];
}

interface VideoEntry {
  videoId: string;
  title: string;
  thumbnail: string;
  description: string;
  publishedAt: string;
  views: string;
  channelId: string;
  channelName: string;
}

type View = 'channels' | 'videos' | 'player';
type MainTab = 'discover' | 'resources' | 'myChannels';

/* ─────────────────────── Constants ─────────────────────── */

const PALETTE = ['#ef4444','#f97316','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ec4899','#06b6d4'];
const LS_KEY = 'fluentpath_channels_v1';
const LS_RESOURCES_KEY = 'fluentpath_resources_v1';

interface UserResource {
  id: string;
  name: string;
  url: string;
  description: string;
  addedAt: string;
}

function getColor(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return '오늘';
  if (d === 1) return '어제';
  if (d < 7) return `${d}일 전`;
  if (d < 30) return `${Math.floor(d / 7)}주 전`;
  if (d < 365) return `${Math.floor(d / 30)}개월 전`;
  return `${Math.floor(d / 365)}년 전`;
}

function calcMatchScore(original: string, transcript: string): number {
  if (!transcript.trim()) return 0;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z'\s]/g, '').split(/\s+/).filter(Boolean);
  const orig = norm(original);
  const user = norm(transcript);
  if (!orig.length) return 0;
  const set = new Set(orig);
  return Math.max(20, Math.min(100, Math.round((user.filter(w => set.has(w)).length / orig.length) * 100)));
}

/* ─────────────────────── Waveform ─────────────────────── */

function Waveform({ playing, barCount = 16, color = 'bg-indigo-500' }: {
  playing?: boolean; barCount?: number; color?: string;
}) {
  return (
    <div className="flex items-end gap-[3px] h-7 flex-1">
      {Array.from({ length: barCount }).map((_, i) => {
        const base = 20 + Math.sin(i * 0.9) * 30 + Math.cos(i * 1.5) * 20;
        return (
          <div key={i} className={`flex-1 rounded-full ${color} transition-all`}
            style={{
              height: playing ? `${base}%` : '15%',
              animationName: playing ? 'waveBar' : 'none',
              animationDuration: `${0.6 + (i % 5) * 0.12}s`,
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
              animationDirection: 'alternate',
              animationDelay: `${i * 0.05}s`,
              opacity: playing ? 1 : 0.35,
            }} />
        );
      })}
      <style jsx>{`@keyframes waveBar { 0%{height:15%} 100%{height:90%} }`}</style>
    </div>
  );
}

/* ─────────────────────── VideoPlayer ─────────────────────── */

function VideoPlayer({ video, onBack }: { video: VideoEntry; onBack: () => void }) {
  const ytRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const mountedRef = useRef(true);

  const [ytReady, setYtReady] = useState(false);
  const [ytPaused, setYtPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [shadowMode, setShadowMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [showScore, setShowScore] = useState(false);
  const [score, setScore] = useState(0);
  const [sentences, setSentences] = useState<string[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [completedSentences, setCompletedSentences] = useState<Set<number>>(new Set());
  const [loadingSentences, setLoadingSentences] = useState(false);
  const [savedSentences, setSavedSentences] = useState<Set<number>>(new Set());
  const [toast, setToast] = useState<string | null>(null);

  // Script source state
  const [scriptTab, setScriptTab] = useState<'yt' | 'manual' | 'file'>('yt');
  const [rawScript, setRawScript] = useState('');
  const [captionLoading, setCaptionLoading] = useState(false);
  const [captionError, setCaptionError] = useState<string | null>(null);
  const [captionFetched, setCaptionFetched] = useState(false);
  const [fileLoading, setFileLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { speak, stop: stopTTS, isSpeaking } = useTTS();
  const { isSupported: sttOk, startListening, stopListening } = useSpeechRecognition((t) => setTranscript(t));
  const addSentence = useAppStore((s) => s.addSentence);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2000); };

  useEffect(() => {
    mountedRef.current = true;
    if (!ytRef.current) return;
    const init = () => {
      if (!mountedRef.current || !ytRef.current) return;
      playerRef.current = new window.YT.Player(ytRef.current, {
        videoId: video.videoId,
        playerVars: { enablejsapi: 1, rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: () => { if (mountedRef.current) setYtReady(true); },
          onStateChange: (e: { data: number }) => {
            if (!mountedRef.current) return;
            if (e.data === 1) setYtPaused(false);
            if (e.data === 2) setYtPaused(true);
          },
        },
      });
    };
    if (window.YT?.Player) { init(); } else {
      if (!document.getElementById('yt-iframe-api')) {
        const s = document.createElement('script');
        s.id = 'yt-iframe-api';
        s.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(s);
      }
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => { prev?.(); init(); };
    }
    return () => { mountedRef.current = false; playerRef.current?.destroy(); playerRef.current = null; };
  }, [video.videoId]);

  useEffect(() => { if (ytPaused && ytReady) setShadowMode(true); }, [ytPaused, ytReady]);

  // Auto-fetch captions when Shadow Mode first opens
  useEffect(() => {
    if (shadowMode && !captionFetched && sentences.length === 0) {
      setCaptionFetched(true);
      fetchYTCaptions();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shadowMode]);

  const resumeVideo = () => { setShadowMode(false); playerRef.current?.playVideo(); };

  const applySentences = (text: string) => {
    const lines = text
      .replace(/\r\n/g, '\n')
      .split(/(?<=[.!?])\s+(?=[A-Z"'(\[])|(?:\n{2,})/)
      .map((s) => s.replace(/\n/g, ' ').trim())
      .filter((s) => s.length > 8 && /[a-zA-Z]/.test(s));
    if (lines.length === 0) { showToast('문장을 인식하지 못했어요. 내용을 확인해주세요.'); return; }
    setSentences(lines);
    setActiveIdx(0);
    setCompletedSentences(new Set());
    setShowScore(false);
    setTranscript('');
  };

  const fetchYTCaptions = async () => {
    setCaptionLoading(true); setCaptionError(null); setRawScript('');
    try {
      const res = await fetch(`/api/youtube-captions?videoId=${video.videoId}`);
      const data = await res.json();
      if (!res.ok) {
        setCaptionError(data.error ?? '자막을 가져올 수 없어요.');
        setScriptTab('manual');
      } else {
        setRawScript(data.rawText ?? '');
        if (data.sentences?.length) applySentences(data.rawText ?? '');
      }
    } catch {
      setCaptionError('네트워크 오류로 자막을 가져오지 못했어요.');
      setScriptTab('manual');
    } finally { setCaptionLoading(false); }
  };

  const handleFileUpload = async (file: File) => {
    setFileLoading(true); setRawScript('');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/parse-script', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? '파일을 파싱할 수 없어요.'); return; }
      setRawScript(data.rawText ?? '');
      if (data.sentences?.length) applySentences(data.rawText ?? '');
    } catch { showToast('파일 업로드에 실패했어요.'); }
    finally { setFileLoading(false); }
  };

  const generateSentences = async () => {
    setLoadingSentences(true); setSentences([]);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'sentence_gen', context: `Title: "${video.title}", Channel: ${video.channelName}${video.description ? `, Description: ${video.description.slice(0, 150)}` : ''}`, messages: [{ role: 'user', content: 'Generate sentences.' }] }),
      });
      const data = await res.json();
      const raw = data.result ?? '';
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) setSentences(parsed.filter((s: unknown) => typeof s === 'string'));
      }
    } catch { showToast('AI 문장 생성 실패. 다시 시도하세요.'); }
    finally { setLoadingSentences(false); }
  };

  const currentSentence = sentences[activeIdx] ?? '';

  const startRec = () => { stopTTS(); setIsRecording(true); setShowScore(false); setTranscript(''); if (sttOk) startListening(); };
  const stopRec = () => {
    setIsRecording(false); if (sttOk) stopListening();
    if (currentSentence) { setScore(calcMatchScore(currentSentence, transcript)); setShowScore(true); setCompletedSentences((p) => new Set([...p, activeIdx])); }
  };
  const nextSentence = () => {
    if (activeIdx < sentences.length - 1) { setActiveIdx((i) => i + 1); setShowScore(false); setTranscript(''); }
    else { setShadowMode(false); showToast('모든 문장 완료! 🎉'); }
  };
  const saveSentenceToDecks = (idx: number) => {
    if (savedSentences.has(idx) || !sentences[idx]) return;
    addSentence({ text: sentences[idx], translation: '', status: 'new', repeatCount: 3, source: `${video.channelName}: ${video.title}` });
    setSavedSentences((p) => new Set([...p, idx])); showToast('문장 덱에 저장됐어요!');
  };

  return (
    <div className="animate-fade-in space-y-4">
      {toast && <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-zinc-800 border border-white/10 text-sm font-semibold text-zinc-200 shadow-2xl">{toast}</div>}
      <div className="flex items-start gap-3">
        <button onClick={onBack} className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-zinc-400 hover:text-zinc-200 transition-colors"><ArrowLeft size={15} /> 영상 목록</button>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-zinc-200 leading-snug line-clamp-2">{video.title}</h2>
          <p className="text-xs text-zinc-500 mt-0.5">{video.channelName} · {timeAgo(video.publishedAt)}{video.views ? ` · 조회 ${Number(video.views).toLocaleString()}회` : ''}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
        <div className="xl:col-span-3 space-y-4">
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl shadow-black/50">
            <div ref={ytRef} className="w-full h-full" />
            {!ytReady && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950"><div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" /><p className="text-xs text-zinc-500">YouTube 로딩 중...</p></div>}
            {ytPaused && ytReady && !shadowMode && (
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
                <div className="flex items-center justify-between gap-3">
                  <div><p className="text-sm font-semibold text-white">⏸ 영상이 멈췄어요</p><p className="text-xs text-zinc-400 mt-0.5">방금 들은 내용을 따라 말해볼까요?</p></div>
                  <button onClick={() => setShadowMode(true)} className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-bold hover:bg-violet-400 transition-all shadow-lg shadow-violet-500/40"><Mic size={14} /> Shadow Now</button>
                </div>
              </div>
            )}
            {shadowMode && ytReady && <div className="absolute top-3 right-3"><span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/90 text-white text-xs font-bold backdrop-blur-sm"><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Shadow Mode</span></div>}
          </div>
          {ytReady && (
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">속도</span>
              <div className="flex items-center gap-1">
                {[0.5, 0.75, 1, 1.25, 1.5].map((r) => (
                  <button key={r} onClick={() => { setSpeed(r); playerRef.current?.setPlaybackRate(r); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${speed === r ? 'bg-indigo-500 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06]'}`}>{r}x</button>
                ))}
              </div>
              <div className="ml-auto">
                {ytPaused
                  ? <button onClick={resumeVideo} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"><Play size={11} /> 재생</button>
                  : <button onClick={() => playerRef.current?.pauseVideo()} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-zinc-500 hover:text-zinc-300 text-xs border border-white/[0.04] hover:bg-white/[0.04] transition-colors"><Pause size={11} /> 일시정지</button>
                }
              </div>
            </div>
          )}
          {shadowMode && (
            <div className="rounded-2xl border border-violet-500/25 bg-gradient-to-br from-violet-950/40 to-indigo-950/40 overflow-hidden animate-fade-in">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-violet-500/15">
                <h3 className="font-bold text-violet-300 flex items-center gap-2 text-sm"><span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" /> Shadow Mode</h3>
                <div className="flex items-center gap-3">
                  {sentences.length > 0 && (
                    <button onClick={() => { setSentences([]); setRawScript(''); setCaptionFetched(false); setCaptionError(null); setActiveIdx(0); setCompletedSentences(new Set()); setShowScore(false); }}
                      className="flex items-center gap-1 text-xs text-zinc-500 hover:text-amber-400 transition-colors"><RefreshCw size={10} /> 스크립트 변경</button>
                  )}
                  {ytReady && <button onClick={resumeVideo} className="flex items-center gap-1 text-xs text-zinc-500 hover:text-emerald-400 transition-colors"><Play size={10} /> 영상 재개</button>}
                  <button onClick={() => setShadowMode(false)} className="text-zinc-600 hover:text-zinc-400"><X size={14} /></button>
                </div>
              </div>

              <div className="p-5 space-y-4">
                {/* ── Script source selection (when no sentences loaded) ── */}
                {sentences.length === 0 && (
                  <div className="space-y-4">
                    {/* Source tab bar */}
                    <div className="flex gap-1 p-1 rounded-xl bg-black/25 border border-white/[0.05]">
                      {([
                        { id: 'yt' as const, label: 'YouTube 자막', icon: <Subtitles size={12} /> },
                        { id: 'manual' as const, label: '직접 입력', icon: <PenLine size={12} /> },
                        { id: 'file' as const, label: '파일 업로드', icon: <Upload size={12} /> },
                      ]).map(tab => (
                        <button key={tab.id} onClick={() => { setScriptTab(tab.id); setRawScript(''); }}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${scriptTab === tab.id ? 'bg-violet-500/30 text-violet-200 shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>
                          {tab.icon} {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* ── YouTube 자막 tab ── */}
                    {scriptTab === 'yt' && (
                      <div className="space-y-3">
                        {captionLoading && (
                          <div className="flex items-center gap-2 py-4 justify-center text-sm text-zinc-400">
                            <Loader2 size={16} className="animate-spin text-violet-400" /> YouTube 자막 불러오는 중...
                          </div>
                        )}
                        {captionError && !captionLoading && (
                          <div className="flex items-start gap-2 px-3 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                            <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
                            <div className="space-y-2 flex-1">
                              <p className="text-xs text-amber-300">{captionError}</p>
                              <button onClick={fetchYTCaptions} className="text-xs text-violet-400 hover:text-violet-300 underline">다시 시도</button>
                            </div>
                          </div>
                        )}
                        {!captionLoading && rawScript && (
                          <>
                            <p className="text-[11px] text-emerald-400 flex items-center gap-1"><Check size={11} /> 자막을 성공적으로 가져왔어요. 필요하면 수정하세요.</p>
                            <textarea value={rawScript} onChange={(e) => setRawScript(e.target.value)} rows={7}
                              className="w-full bg-black/30 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-zinc-300 outline-none focus:border-violet-500/50 transition-colors resize-none font-mono leading-relaxed" />
                            <button onClick={() => applySentences(rawScript)}
                              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/20">
                              <Check size={14} /> 이 스크립트로 쉐도잉 시작
                            </button>
                          </>
                        )}
                        {!captionLoading && !rawScript && !captionError && (
                          <button onClick={fetchYTCaptions}
                            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-violet-500/30 text-violet-400 text-sm font-semibold hover:bg-violet-500/10 transition-colors">
                            <Subtitles size={14} /> 자막 불러오기
                          </button>
                        )}
                      </div>
                    )}

                    {/* ── 직접 입력 tab ── */}
                    {scriptTab === 'manual' && (
                      <div className="space-y-3">
                        <p className="text-xs text-zinc-500">연습할 스크립트를 붙여넣거나 직접 입력하세요.</p>
                        <textarea value={rawScript} onChange={(e) => setRawScript(e.target.value)}
                          placeholder={"예:\nYou know what I mean? That's a really common phrase in English.\nLet me show you how native speakers actually use this."}
                          rows={8}
                          className="w-full bg-black/30 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-zinc-300 outline-none focus:border-violet-500/50 transition-colors resize-none leading-relaxed" />
                        <button onClick={() => applySentences(rawScript)} disabled={!rawScript.trim()}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40">
                          <Check size={14} /> 쉐도잉 시작
                        </button>
                      </div>
                    )}

                    {/* ── 파일 업로드 tab ── */}
                    {scriptTab === 'file' && (
                      <div className="space-y-3">
                        <input ref={fileInputRef} type="file"
                          accept=".pdf,.docx,.doc,.txt,.md,.xlsx,.xls,.csv,.srt,.vtt"
                          className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }} />
                        {!rawScript && !fileLoading && (
                          <div
                            className="border-2 border-dashed border-violet-500/25 rounded-xl p-8 text-center cursor-pointer hover:border-violet-500/50 hover:bg-violet-500/5 transition-all"
                            onClick={() => fileInputRef.current?.click()}
                            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f); }}
                            onDragOver={(e) => e.preventDefault()}>
                            <FileText size={32} className="text-violet-400/60 mx-auto mb-3" />
                            <p className="text-sm font-semibold text-zinc-300">파일을 드래그하거나 클릭해서 업로드</p>
                            <p className="text-xs text-zinc-600 mt-1">PDF · DOCX · TXT · MD · XLSX · CSV · SRT · VTT</p>
                          </div>
                        )}
                        {fileLoading && (
                          <div className="flex items-center gap-2 py-6 justify-center text-sm text-zinc-400">
                            <Loader2 size={16} className="animate-spin text-violet-400" /> 파일 분석 중...
                          </div>
                        )}
                        {rawScript && !fileLoading && (
                          <>
                            <div className="flex items-center justify-between">
                              <p className="text-[11px] text-emerald-400 flex items-center gap-1"><Check size={11} /> 파일 파싱 완료. 수정 후 시작하세요.</p>
                              <button onClick={() => { setRawScript(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                                className="text-[11px] text-zinc-600 hover:text-zinc-400 underline">초기화</button>
                            </div>
                            <textarea value={rawScript} onChange={(e) => setRawScript(e.target.value)} rows={7}
                              className="w-full bg-black/30 border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-zinc-300 outline-none focus:border-violet-500/50 transition-colors resize-none font-mono leading-relaxed" />
                            <button onClick={() => applySentences(rawScript)}
                              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/20">
                              <Check size={14} /> 쉐도잉 시작
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    {/* AI fallback divider */}
                    <div className="flex items-center gap-3 pt-1">
                      <div className="flex-1 h-px bg-white/[0.06]" />
                      <span className="text-[11px] text-zinc-600">또는</span>
                      <div className="flex-1 h-px bg-white/[0.06]" />
                    </div>
                    <button onClick={generateSentences} disabled={loadingSentences}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-zinc-400 text-xs font-semibold hover:bg-white/[0.07] hover:text-zinc-300 transition-all disabled:opacity-50">
                      {loadingSentences ? <><Loader2 size={13} className="animate-spin" /> AI 생성 중...</> : <><Sparkles size={13} className="text-violet-400" /> AI 문장 자동 생성 (영상 제목 기반)</>}
                    </button>
                  </div>
                )}

                {/* ── Sentence practice (when sentences loaded) ── */}
                {sentences.length > 0 && (
                  <>
                    <div className="rounded-xl bg-indigo-500/[0.08] border border-indigo-500/20 px-5 py-4 text-center">
                      <p className="text-base font-semibold text-zinc-100 leading-relaxed">&ldquo;{currentSentence}&rdquo;</p>
                      <p className="text-xs text-zinc-600 mt-2">{activeIdx + 1} / {sentences.length}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button onClick={() => isSpeaking ? stopTTS() : speak(currentSentence, 1)}
                        className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 text-sm font-semibold border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors">
                        {isSpeaking ? <><Pause size={13} /> Stop</> : <><Volume2 size={13} /> Listen</>}
                      </button>
                      <Waveform playing={isSpeaking} barCount={18} color="bg-indigo-500" />
                    </div>
                    <div className="flex justify-center gap-1.5">
                      {sentences.map((_, i) => (
                        <button key={i} onClick={() => { setActiveIdx(i); setShowScore(false); setTranscript(''); }}
                          className={`rounded-full transition-all ${i === activeIdx ? 'w-5 h-2.5 bg-violet-500' : completedSentences.has(i) ? 'w-2.5 h-2.5 bg-emerald-500' : 'w-2.5 h-2.5 bg-white/20 hover:bg-white/35'}`} />
                      ))}
                    </div>
                    <div className="flex flex-col items-center gap-3">
                      <button onClick={isRecording ? stopRec : startRec}
                        className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500/20 text-red-400 border-2 border-red-500' : 'bg-gradient-to-br from-violet-500 to-indigo-500 text-white shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 active:scale-95'}`}>
                        {isRecording ? <Square size={20} /> : <Mic size={20} />}
                        {isRecording && <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-25" />}
                      </button>
                      <p className="text-xs text-zinc-500">{isRecording ? '🔴 녹음 중... 탭하여 중지' : !sttOk ? 'Chrome에서 음성인식 지원' : '마이크를 눌러 따라 말하세요'}</p>
                    </div>
                    {showScore && (
                      <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4 space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5"><BarChart3 size={12} className="text-indigo-400" /> 결과</span>
                          <span className={`text-2xl font-black ${score >= 85 ? 'text-emerald-400' : score >= 65 ? 'text-amber-400' : 'text-red-400'}`}>{score}%</span>
                        </div>
                        {transcript && <p className="text-xs text-zinc-500 italic">&ldquo;{transcript}&rdquo;</p>}
                        <p className="text-sm text-zinc-400">{score >= 85 ? '🎉 훌륭해요!' : score >= 65 ? '👍 잘했어요!' : '💪 다시 해봐요!'}</p>
                        <div className="flex gap-2">
                          <button onClick={() => { setShowScore(false); setTranscript(''); }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-white/[0.08] text-xs font-semibold text-zinc-400 hover:bg-white/[0.04] transition-colors">
                            <RefreshCw size={11} /> 다시
                          </button>
                          <button onClick={nextSentence}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-xs font-bold text-white hover:opacity-90 transition-opacity">
                            {activeIdx < sentences.length - 1 ? <>다음 <ChevronRight size={11} /></> : <><CheckCircle2 size={11} /> 완료!</>}
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
          {video.description && (
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
              <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">영상 설명</h4>
              <p className="text-sm text-zinc-400 leading-relaxed line-clamp-4">{video.description}</p>
            </div>
          )}
        </div>
        <div className="xl:col-span-2">
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden xl:sticky xl:top-4">
            <div className="px-4 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                <Mic size={14} className="text-violet-400" /> 쉐도잉 문장
                {sentences.length > 0 && <span className="px-2 py-0.5 rounded-full bg-white/[0.06] text-zinc-500 text-[10px] font-semibold">{completedSentences.size}/{sentences.length}</span>}
              </h3>
              {sentences.length > 0 && (
                <button onClick={() => { setSentences([]); setRawScript(''); setCaptionFetched(false); setCaptionError(null); setActiveIdx(0); setCompletedSentences(new Set()); setShowScore(false); setShadowMode(true); }}
                  className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white/[0.04] text-zinc-500 border border-white/[0.06] hover:text-zinc-300 hover:bg-white/[0.07] transition-colors">
                  <RefreshCw size={11} /> 변경
                </button>
              )}
            </div>
            {sentences.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-4">
                {(captionLoading || loadingSentences) ? (
                  <><Loader2 size={28} className="text-violet-400 animate-spin" /><p className="text-sm text-zinc-400">{captionLoading ? 'YouTube 자막 불러오는 중...' : 'AI 문장 생성 중...'}</p></>
                ) : (
                  <>
                    <div className="p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20"><Subtitles size={28} className="text-violet-400" /></div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-300">스크립트 쉐도잉</p>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">영상을 일시정지하면 Shadow Mode가 열려요.<br />YouTube 자막 · 직접 입력 · 파일 업로드 지원</p>
                    </div>
                    <button onClick={() => { setShadowMode(true); if (ytReady) playerRef.current?.pauseVideo(); }}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/25">
                      <Mic size={14} /> Shadow Mode 열기
                    </button>
                  </>
                )}
              </div>
            ) : (
              <>
                <div className="divide-y divide-white/[0.04]">
                  {sentences.map((s, i) => (
                    <div key={i} className={`px-4 py-3.5 transition-colors ${i === activeIdx && shadowMode ? 'bg-violet-500/[0.07] border-l-2 border-l-violet-500' : 'hover:bg-white/[0.02] border-l-2 border-l-transparent'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 ${i === activeIdx && shadowMode ? 'bg-violet-500/30 text-violet-300' : completedSentences.has(i) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/[0.06] text-zinc-500'}`}>
                          {completedSentences.has(i) ? <Check size={10} /> : i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-zinc-300 leading-relaxed">{s}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <button onClick={() => { setActiveIdx(i); speak(s, 1); }} className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"><Volume2 size={10} /> 듣기</button>
                            <button onClick={() => { setActiveIdx(i); setShadowMode(true); setShowScore(false); setTranscript(''); stopTTS(); if (ytReady) playerRef.current?.pauseVideo(); }}
                              className={`flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md transition-colors ${i === activeIdx && shadowMode ? 'text-violet-300 bg-violet-500/20' : 'text-violet-400 hover:bg-violet-500/10'}`}>
                              <Mic size={10} /> Shadow
                            </button>
                            <button onClick={() => saveSentenceToDecks(i)} disabled={savedSentences.has(i)}
                              className={`flex items-center gap-1 text-[11px] transition-colors ${savedSentences.has(i) ? 'text-emerald-400' : 'text-zinc-600 hover:text-zinc-400'}`}>
                              {savedSentences.has(i) ? <><Check size={9} /> 저장됨</> : <><Plus size={9} /> 저장</>}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3.5 border-t border-white/[0.06] bg-white/[0.01]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-zinc-500">Progress</span>
                    <span className="text-[11px] font-bold text-zinc-400">{Math.round((completedSentences.size / sentences.length) * 100)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all duration-700" style={{ width: `${(completedSentences.size / sentences.length) * 100}%` }} />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── LevelSelector ─────────────────────── */

const LEVEL_OPTIONS = [1, 2, 2.5, 3, 3.5, 4, 4.5, 5];

function LevelSelector({ value, onChange, compact = false }: {
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  compact?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        onClick={() => onChange(null)}
        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
          (value ?? null) === null
            ? 'bg-zinc-500/20 text-zinc-300 border-zinc-500/30'
            : 'text-zinc-600 border-white/[0.06] hover:text-zinc-400'
        }`}
      >{compact ? '—' : '미설정'}</button>
      {LEVEL_OPTIONS.map(lv => (
        <button
          key={lv}
          onClick={() => onChange(value === lv ? null : lv)}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
            value === lv
              ? `${getLevelColor(lv)} border-current`
              : 'text-zinc-600 border-white/[0.06] hover:text-zinc-400'
          }`}
        >Lv.{lv}</button>
      ))}
    </div>
  );
}

/* ─────────────────────── TagSelector ─────────────────────── */

function TagSelector({ selected, onChange }: {
  selected: string[];
  onChange: (tags: string[]) => void;
}) {
  const [custom, setCustom] = useState('');

  const toggle = (tag: string) => {
    onChange(selected.includes(tag) ? selected.filter(t => t !== tag) : [...selected, tag]);
  };
  const addCustom = () => {
    const t = custom.trim();
    if (t && !selected.includes(t)) onChange([...selected, t]);
    setCustom('');
  };
  const customOnly = selected.filter(t => !ALL_CATEGORIES.includes(t));

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-1.5">
        {ALL_CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => toggle(cat)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${
              selected.includes(cat)
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                : 'text-zinc-600 border-white/[0.06] hover:text-zinc-400 hover:border-white/[0.12]'
            }`}
          >{cat}</button>
        ))}
        {customOnly.map(t => (
          <button
            key={t}
            onClick={() => onChange(selected.filter(s => s !== t))}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-violet-500/20 text-violet-300 border-violet-500/30 transition-all hover:bg-violet-500/30"
          >{t} <X size={9} /></button>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }}
          placeholder="커스텀 태그 입력 후 Enter..."
          className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 outline-none focus:border-indigo-500/40 transition-colors"
        />
        <button
          onClick={addCustom}
          disabled={!custom.trim()}
          className="px-3 py-1.5 rounded-lg bg-white/[0.06] text-zinc-400 text-xs hover:bg-white/[0.1] disabled:opacity-40 transition-colors"
        ><Plus size={12} /></button>
      </div>
    </div>
  );
}

/* ─────────────────────── ChannelsPage ─────────────────────── */

export default function ChannelsPage() {
  const [mainTab, setMainTab] = useState<MainTab>('discover');
  const [view, setView] = useState<View>('channels');
  const [channels, setChannels] = useState<ChannelInfo[]>([]);

  useEffect(() => {
    try {
      const stored: ChannelInfo[] = JSON.parse(localStorage.getItem(LS_KEY) ?? '[]');
      setChannels(stored.map(ch => ({
        ...ch,
        channelId: /^UC/.test(ch.channelId) ? ch.channelId : `UC${ch.channelId}`,
        level: ch.level ?? null,
        tags: ch.tags ?? [],
      })));
    } catch { /* ignore */ }
  }, []);

  const [activeChannel, setActiveChannel] = useState<ChannelInfo | null>(null);
  const [videos, setVideos] = useState<VideoEntry[]>([]);
  const [playerVideo, setPlayerVideo] = useState<VideoEntry | null>(null);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const [addInput, setAddInput] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addingHandle, setAddingHandle] = useState<string | null>(null);

  // Add channel meta (level/tags)
  const [addLevel, setAddLevel] = useState<number | null>(null);
  const [addTags, setAddTags] = useState<string[]>([]);
  const [showAddMeta, setShowAddMeta] = useState(false);

  // Inline editing for existing channels
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
  const [editLevel, setEditLevel] = useState<number | null>(null);
  const [editTags, setEditTags] = useState<string[]>([]);

  // My Channels filters
  const [myTagFilter, setMyTagFilter] = useState<string | null>(null);
  const [myLvFilter, setMyLvFilter] = useState<number | null>(null);

  const [userResources, setUserResources] = useState<UserResource[]>([]);
  const [resName, setResName] = useState('');
  const [resUrl, setResUrl] = useState('');
  const [resDesc, setResDesc] = useState('');
  const [resError, setResError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored: UserResource[] = JSON.parse(localStorage.getItem(LS_RESOURCES_KEY) ?? '[]');
      setUserResources(stored);
    } catch { /* ignore */ }
  }, []);

  const persistResources = (list: UserResource[]) => {
    setUserResources(list);
    localStorage.setItem(LS_RESOURCES_KEY, JSON.stringify(list));
  };

  const handleAddResource = () => {
    const name = resName.trim();
    const url = resUrl.trim();
    if (!name) { setResError('사이트 이름을 입력해주세요.'); return; }
    if (!url) { setResError('URL을 입력해주세요.'); return; }
    const normalized = url.startsWith('http') ? url : `https://${url}`;
    try { new URL(normalized); } catch { setResError('올바른 URL을 입력해주세요.'); return; }
    persistResources([...userResources, {
      id: Date.now().toString(),
      name,
      url: normalized,
      description: resDesc.trim(),
      addedAt: new Date().toISOString(),
    }]);
    setResName(''); setResUrl(''); setResDesc(''); setResError(null);
    showToast(`${name} 리소스가 추가됐어요!`);
  };

  const removeResource = (id: string) => persistResources(userResources.filter(r => r.id !== id));

  const [toast, setToast] = useState<string | null>(null);

  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [lvFilter, setLvFilter] = useState<number | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const persist = (list: ChannelInfo[]) => {
    setChannels(list);
    localStorage.setItem(LS_KEY, JSON.stringify(list));
  };

  const handleAdd = async (urlOrHandle: string) => {
    const input = urlOrHandle.trim() || addInput.trim();
    if (!input) return;
    setAddLoading(true); setAddError(null);
    try {
      const res = await fetch(`/api/youtube-channel?channel=${encodeURIComponent(input)}`);
      const data = await res.json();
      if (!res.ok) { setAddError(data.error ?? '채널을 찾을 수 없어요.'); return; }
      if (channels.some((c) => c.channelId === data.channelId)) {
        setAddError('이미 추가된 채널이에요.'); return;
      }
      persist([...channels, {
        channelId: data.channelId,
        channelName: data.channelName,
        color: getColor(data.channelName),
        addedAt: new Date().toISOString(),
        level: addLevel,
        tags: addTags,
      }]);
      setAddInput('');
      setAddLevel(null);
      setAddTags([]);
      setShowAddMeta(false);
      return true;
    } catch { setAddError('네트워크 오류가 발생했어요.'); }
    finally { setAddLoading(false); }
  };

  const updateChannelMeta = (channelId: string, level: number | null, tags: string[]) => {
    persist(channels.map(ch => ch.channelId === channelId ? { ...ch, level, tags } : ch));
    setEditingChannelId(null);
    showToast('채널 정보가 업데이트됐어요!');
  };

  const handleAddFromDiscover = async (ch: NotionChannel) => {
    setAddingHandle(ch.handle);
    try {
      const res = await fetch(`/api/youtube-channel?channel=${encodeURIComponent(ch.url)}`);
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? '채널을 찾을 수 없어요.'); return; }
      if (channels.some((c) => c.channelId === data.channelId)) { showToast('이미 추가된 채널이에요.'); return; }
      persist([...channels, {
        channelId: data.channelId,
        channelName: data.channelName,
        color: getColor(data.channelName),
        addedAt: new Date().toISOString(),
        level: ch.level,
        tags: ch.categories,
      }]);
      showToast(`${data.channelName} 채널이 추가됐어요!`);
    } catch { showToast('네트워크 오류가 발생했어요.'); }
    finally { setAddingHandle(null); }
  };

  const loadVideos = useCallback(async (channel: ChannelInfo) => {
    setActiveChannel(channel); setView('videos'); setVideos([]); setVideoError(null); setLoadingVideos(true);
    const safeId = /^UC/.test(channel.channelId) ? channel.channelId : `UC${channel.channelId}`;
    try {
      const res = await fetch(`/api/youtube-channel?channel=${safeId}`);
      const data = await res.json();
      if (!res.ok) { setVideoError(data.error ?? '영상을 불러오지 못했어요.'); return; }
      setVideos(data.videos ?? []);
    } catch { setVideoError('네트워크 오류가 발생했어요.'); }
    finally { setLoadingVideos(false); }
  }, []);

  const removeChannel = (channelId: string) => persist(channels.filter((c) => c.channelId !== channelId));
  const isSubscribed = (ch: NotionChannel) => channels.some(c => c.channelName.toLowerCase().replace(/\s/g, '') === ch.name.toLowerCase().replace(/\s/g, ''));

  // My Channels filtered list
  const allMyTags = Array.from(new Set(channels.flatMap(ch => ch.tags ?? []))).sort();
  const filteredMyChannels = channels.filter(ch => {
    if (myTagFilter && !(ch.tags ?? []).includes(myTagFilter)) return false;
    if (myLvFilter !== null && ch.level !== myLvFilter) return false;
    return true;
  });

  /* ── Full-screen views ── */
  if (view === 'player' && playerVideo) {
    return <VideoPlayer video={playerVideo} onBack={() => setView('videos')} />;
  }

  if (view === 'videos' && activeChannel) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <button onClick={() => { setView('channels'); setMainTab('myChannels'); }} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-zinc-400 hover:text-zinc-200 transition-colors"><ArrowLeft size={15} /> 채널 목록</button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-base font-bold shrink-0" style={{ backgroundColor: activeChannel.color }}>{activeChannel.channelName[0]}</div>
            <div className="min-w-0"><h2 className="text-base font-bold text-zinc-200 truncate">{activeChannel.channelName}</h2><p className="text-xs text-zinc-500">{videos.length > 0 ? `최신 ${videos.length}개 영상` : '로딩 중...'}</p></div>
          </div>
          <button onClick={() => loadVideos(activeChannel)} disabled={loadingVideos} className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-xs text-zinc-400 hover:text-zinc-200 transition-colors disabled:opacity-50"><RefreshCw size={13} className={loadingVideos ? 'animate-spin' : ''} /> 새로고침</button>
        </div>
        {videoError && (
          <div className="flex items-start gap-3 px-4 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-sm text-red-400 flex-1">{videoError}</p>
            <button onClick={() => loadVideos(activeChannel)} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-semibold transition-colors"><RefreshCw size={11} /> 재시도</button>
          </div>
        )}
        {loadingVideos && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden animate-pulse">
                <div className="aspect-video bg-white/[0.06]" />
                <div className="p-3 space-y-2"><div className="h-3 bg-white/[0.06] rounded w-3/4" /><div className="h-3 bg-white/[0.06] rounded w-1/2" /></div>
              </div>
            ))}
          </div>
        )}
        {!loadingVideos && videos.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((v) => (
              <button key={v.videoId} onClick={() => { setPlayerVideo(v); setView('player'); }}
                className="group rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden hover:bg-white/[0.06] hover:border-white/[0.1] transition-all text-left">
                <div className="relative aspect-video overflow-hidden bg-zinc-900">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/35 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30"><Play size={18} className="text-white ml-0.5" /></div>
                  </div>
                </div>
                <div className="p-3">
                  <p className="text-sm font-semibold text-zinc-200 line-clamp-2 leading-snug group-hover:text-white transition-colors">{v.title}</p>
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-zinc-500"><Clock size={10} /> {timeAgo(v.publishedAt)}{v.views && <><span>·</span><Eye size={10} /> {Number(v.views).toLocaleString()}</>}</div>
                  <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-violet-400 font-semibold"><Mic size={10} /> Watch & Shadow</div>
                </div>
              </button>
            ))}
          </div>
        )}
        {!loadingVideos && !videoError && videos.length === 0 && <div className="text-center py-16 text-zinc-500">영상을 찾을 수 없어요.</div>}
      </div>
    );
  }

  /* ── Filtered channels for Discover ── */
  const filteredChannels = NOTION_CHANNELS.filter(ch => {
    if (catFilter && !ch.categories.includes(catFilter)) return false;
    if (lvFilter !== null && ch.level !== lvFilter) return false;
    return true;
  });

  const levelOptions = [1, 2, 2.5, 3, 3.5, 4, 4.5, 5];

  /* ── Main tabbed view ── */
  return (
    <div className="space-y-6 animate-fade-in">
      {toast && <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl bg-zinc-800 border border-white/10 text-sm font-semibold text-zinc-200 shadow-2xl animate-fade-in">{toast}</div>}

      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-zinc-100 tracking-tight flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20"><Globe size={22} className="text-white" /></div>
          Channels
        </h1>
        <p className="mt-1.5 text-zinc-500 text-sm">추천 채널 탐색, 구독 관리, 영상 쉐도잉까지 한곳에서</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
        {([
          { id: 'discover', label: 'Discover', icon: <Star size={14} /> },
          { id: 'resources', label: 'Resources', icon: <BookOpen size={14} /> },
          { id: 'myChannels', label: 'My Channels', icon: <Rss size={14} />, count: channels.length },
        ] as { id: MainTab; label: string; icon: React.ReactNode; count?: number }[]).map(tab => (
          <button key={tab.id} onClick={() => setMainTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${mainTab === tab.id ? 'bg-gradient-to-r from-indigo-500/20 to-violet-500/20 text-indigo-300 shadow-sm border border-indigo-500/20' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'}`}>
            {tab.icon} {tab.label}
            {tab.count != null && tab.count > 0 && <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold">{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* ── Discover Tab ── */}
      {mainTab === 'discover' && (
        <div className="space-y-5">
          {/* Category filter */}
          <div className="overflow-x-auto pb-1">
            <div className="flex gap-2 min-w-max">
              <button onClick={() => setCatFilter(null)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${catFilter === null ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'text-zinc-500 border-white/[0.06] hover:text-zinc-300 hover:border-white/[0.12]'}`}>
                전체
              </button>
              {ALL_CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCatFilter(catFilter === cat ? null : cat)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all border ${catFilter === cat ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'text-zinc-500 border-white/[0.06] hover:text-zinc-300 hover:border-white/[0.12]'}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Level filter */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setLvFilter(null)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${lvFilter === null ? 'bg-violet-500/20 text-violet-300 border-violet-500/30' : 'text-zinc-600 border-white/[0.05] hover:text-zinc-400'}`}>
              전체 레벨
            </button>
            {levelOptions.map(lv => (
              <button key={lv} onClick={() => setLvFilter(lvFilter === lv ? null : lv)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all border ${lvFilter === lv ? `${getLevelColor(lv)} border-current` : 'text-zinc-600 border-white/[0.05] hover:text-zinc-400'}`}>
                Lv.{lv}
              </button>
            ))}
          </div>

          {/* Results count */}
          <p className="text-xs text-zinc-600">{filteredChannels.length}개 채널 {catFilter || lvFilter !== null ? '(필터 적용)' : ''}</p>

          {/* Channel grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredChannels.map(ch => {
              const subscribed = isSubscribed(ch);
              const adding = addingHandle === ch.handle;
              return (
                <div key={ch.handle} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 hover:bg-white/[0.05] hover:border-white/[0.1] transition-all flex flex-col gap-3">
                  {/* Header row */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-bold shrink-0 shadow-lg" style={{ backgroundColor: getColor(ch.name) }}>
                      {ch.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-zinc-200 text-sm leading-tight truncate">{ch.name}</p>
                      {ch.subscribers && <p className="text-[11px] text-zinc-500 mt-0.5">{ch.subscribers} subscribers</p>}
                    </div>
                    <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-lg border ${getLevelColor(ch.level)}`}>
                      {getLevelLabel(ch.level)}
                    </span>
                  </div>

                  {/* Description */}
                  {ch.description && <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">{ch.description}</p>}

                  {/* Category tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {ch.categories.map(cat => (
                      <span key={cat} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.05] text-zinc-500 border border-white/[0.05]">{cat}</span>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => !subscribed && !adding && handleAddFromDiscover(ch)}
                      disabled={subscribed || adding}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all border ${
                        subscribed
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 cursor-default'
                          : adding
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 cursor-default'
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20'
                      }`}>
                      {subscribed ? <><Check size={11} /> 구독중</> : adding ? <><Loader2 size={11} className="animate-spin" /> 추가 중...</> : <><Plus size={11} /> 내 채널 추가</>}
                    </button>
                    <a href={ch.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/[0.04] text-zinc-500 border border-white/[0.06] hover:text-zinc-300 hover:bg-white/[0.07] transition-all">
                      <ExternalLink size={11} /> YouTube
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredChannels.length === 0 && (
            <div className="text-center py-16 text-zinc-500">
              <p className="font-semibold">필터에 맞는 채널이 없어요</p>
              <p className="text-xs mt-1">필터를 변경해보세요</p>
            </div>
          )}
        </div>
      )}

      {/* ── Resources Tab ── */}
      {mainTab === 'resources' && (
        <div className="space-y-6">
          {/* Add custom resource */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5">
            <h3 className="text-sm font-bold text-zinc-300 mb-3 flex items-center gap-2"><Plus size={15} className="text-emerald-400" /> 리소스 추가</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text" value={resName}
                  onChange={(e) => { setResName(e.target.value); setResError(null); }}
                  placeholder="사이트 이름  (예: Rachel's English)"
                  className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-zinc-300 placeholder-zinc-600 outline-none focus:border-emerald-500/50 transition-colors"
                />
                <input
                  type="text" value={resUrl}
                  onChange={(e) => { setResUrl(e.target.value); setResError(null); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddResource()}
                  placeholder="URL  (예: https://rachelsenglish.com)"
                  className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-zinc-300 placeholder-zinc-600 outline-none focus:border-emerald-500/50 transition-colors"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text" value={resDesc}
                  onChange={(e) => setResDesc(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddResource()}
                  placeholder="설명 (선택)"
                  className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-zinc-300 placeholder-zinc-600 outline-none focus:border-emerald-500/50 transition-colors"
                />
                <button onClick={handleAddResource} disabled={!resName.trim() || !resUrl.trim()}
                  className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 shadow-lg shadow-emerald-500/20">
                  <Plus size={15} /> 추가
                </button>
              </div>
            </div>
            {resError && <p className="mt-2 text-xs text-red-400">{resError}</p>}
          </div>

          {/* User-added resources */}
          {userResources.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">내 리소스 ({userResources.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {userResources.map(res => (
                  <div key={res.id} className="group rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 hover:bg-white/[0.05] hover:border-white/[0.1] transition-all flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-bold shrink-0 shadow-lg" style={{ backgroundColor: getColor(res.name) }}>{res.name[0]}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-zinc-200 text-sm truncate">{res.name}</p>
                        <p className="text-[10px] text-zinc-600 mt-0.5 truncate">{res.url}</p>
                      </div>
                      <button onClick={() => removeResource(res.id)} className="shrink-0 p-1.5 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={13} /></button>
                    </div>
                    {res.description && <p className="text-xs text-zinc-500 leading-relaxed">{res.description}</p>}
                    <a href={res.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all mt-auto">
                      <ExternalLink size={12} /> 바로 가기
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Curated resources */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">추천 리소스</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {NOTION_RESOURCES.map(res => (
                <div key={res.name} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 hover:bg-white/[0.05] hover:border-white/[0.1] transition-all flex flex-col gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base font-bold shrink-0 shadow-lg" style={{ backgroundColor: getColor(res.name) }}>{res.name[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-zinc-200 text-sm">{res.name}</p>
                      {res.level !== null && <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-lg border mt-1 ${getLevelColor(res.level)}`}>{getLevelLabel(res.level)}</span>}
                    </div>
                  </div>
                  {res.description && <p className="text-xs text-zinc-500 leading-relaxed">{res.description}</p>}
                  <div className="flex flex-wrap gap-1.5">
                    {res.categories.map(cat => <span key={cat} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.05] text-zinc-500 border border-white/[0.05]">{cat}</span>)}
                  </div>
                  <a href={res.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all mt-auto">
                    <ExternalLink size={12} /> 바로 가기
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── My Channels Tab ── */}
      {mainTab === 'myChannels' && (
        <div className="space-y-6">
          {/* Add channel */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 space-y-3">
            <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2"><Plus size={15} className="text-indigo-400" /> 채널 추가</h3>
            <div className="flex gap-2">
              <input
                type="text" value={addInput}
                onChange={(e) => { setAddInput(e.target.value); setAddError(null); }}
                onKeyDown={(e) => e.key === 'Enter' && handleAdd(addInput)}
                placeholder="YouTube 채널 URL 또는 @핸들  (예: https://www.youtube.com/@rachelsenglish)"
                className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-zinc-300 placeholder-zinc-600 outline-none focus:border-indigo-500/50 transition-colors"
              />
              <button onClick={() => handleAdd(addInput)} disabled={addLoading || !addInput.trim()}
                className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 shadow-lg shadow-indigo-500/20">
                {addLoading ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} 추가
              </button>
            </div>
            {/* Toggle level/tag options */}
            <button
              onClick={() => setShowAddMeta(v => !v)}
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <Settings2 size={12} />
              레벨·태그 설정 (선택)
              {showAddMeta ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
            {showAddMeta && (
              <div className="space-y-3 pt-1 border-t border-white/[0.05]">
                <div>
                  <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">레벨</p>
                  <LevelSelector value={addLevel} onChange={setAddLevel} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">태그</p>
                  <TagSelector selected={addTags} onChange={setAddTags} />
                </div>
                {(addLevel !== null || addTags.length > 0) && (
                  <button onClick={() => { setAddLevel(null); setAddTags([]); }} className="text-[11px] text-zinc-600 hover:text-zinc-400 underline">초기화</button>
                )}
              </div>
            )}
            {addError && <p className="text-xs text-red-400">{addError}</p>}
          </div>

          {/* Subscribed channels */}
          {channels.length > 0 && (
            <div className="space-y-4">
              {/* Filter bar */}
              {(allMyTags.length > 0 || channels.some(ch => ch.level != null)) && (
                <div className="space-y-2">
                  {/* Level filter */}
                  {channels.some(ch => ch.level != null) && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider mr-1">레벨</span>
                      <button
                        onClick={() => setMyLvFilter(null)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${myLvFilter === null ? 'bg-white/10 text-zinc-200 border-white/20' : 'text-zinc-600 border-white/[0.05] hover:text-zinc-400'}`}
                      >전체</button>
                      {Array.from(new Set(channels.filter(ch => ch.level != null).map(ch => ch.level as number))).sort((a, b) => a - b).map(lv => (
                        <button key={lv} onClick={() => setMyLvFilter(myLvFilter === lv ? null : lv)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${myLvFilter === lv ? `${getLevelColor(lv)} border-current` : 'text-zinc-600 border-white/[0.05] hover:text-zinc-400'}`}>
                          Lv.{lv}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Tag filter */}
                  {allMyTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider mr-1"><Tag size={10} className="inline mr-0.5" />태그</span>
                      <button
                        onClick={() => setMyTagFilter(null)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${myTagFilter === null ? 'bg-white/10 text-zinc-200 border-white/20' : 'text-zinc-600 border-white/[0.05] hover:text-zinc-400'}`}
                      >전체</button>
                      {allMyTags.map(t => (
                        <button key={t} onClick={() => setMyTagFilter(myTagFilter === t ? null : t)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${myTagFilter === t ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' : 'text-zinc-600 border-white/[0.05] hover:text-zinc-400'}`}>
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">
                구독 중 ({filteredMyChannels.length}{filteredMyChannels.length !== channels.length ? `/${channels.length}` : ''})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredMyChannels.map((ch) => {
                  const isEditing = editingChannelId === ch.channelId;
                  const chTags = ch.tags ?? [];
                  const chLevel = ch.level ?? null;
                  return (
                    <div key={ch.channelId} className={`group rounded-2xl border p-4 transition-all ${isEditing ? 'bg-white/[0.06] border-indigo-500/30' : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.1]'}`}>
                      {/* Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-lg" style={{ backgroundColor: ch.color }}>{ch.channelName[0]}</div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-zinc-200 text-sm truncate">{ch.channelName}</h4>
                          <p className="text-[11px] text-zinc-600 mt-0.5">추가됨 {timeAgo(ch.addedAt)}</p>
                          {/* Level badge */}
                          {chLevel !== null && (
                            <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border ${getLevelColor(chLevel)}`}>{getLevelLabel(chLevel)}</span>
                          )}
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 shrink-0 transition-opacity">
                          <button
                            onClick={() => {
                              if (isEditing) { setEditingChannelId(null); }
                              else { setEditingChannelId(ch.channelId); setEditLevel(chLevel); setEditTags([...chTags]); }
                            }}
                            className={`p-1.5 rounded-lg text-xs transition-colors ${isEditing ? 'bg-indigo-500/20 text-indigo-300' : 'bg-white/[0.05] text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.1]'}`}
                            title="레벨·태그 편집"
                          ><Settings2 size={13} /></button>
                          <button onClick={() => removeChannel(ch.channelId)} className="p-1.5 rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-colors"><Trash2 size={13} /></button>
                        </div>
                      </div>

                      {/* Tag chips */}
                      {!isEditing && chTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {chTags.map(t => (
                            <span key={t} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.05] text-zinc-500 border border-white/[0.05]">{t}</span>
                          ))}
                        </div>
                      )}

                      {/* Inline edit panel */}
                      {isEditing && (
                        <div className="space-y-3 mb-3 pt-2 border-t border-white/[0.07]">
                          <div>
                            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">레벨</p>
                            <LevelSelector value={editLevel} onChange={setEditLevel} compact />
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">태그</p>
                            <TagSelector selected={editTags} onChange={setEditTags} />
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button onClick={() => setEditingChannelId(null)} className="flex-1 py-2 rounded-xl text-xs font-semibold text-zinc-500 border border-white/[0.07] hover:bg-white/[0.04] transition-colors">취소</button>
                            <button onClick={() => updateChannelMeta(ch.channelId, editLevel, editTags)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-indigo-500 text-white hover:bg-indigo-400 transition-colors"><Check size={12} /> 저장</button>
                          </div>
                        </div>
                      )}

                      <button onClick={() => loadVideos(ch)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200 border border-white/[0.06]">
                        <Play size={13} /> 영상 보기
                      </button>
                    </div>
                  );
                })}
              </div>
              {filteredMyChannels.length === 0 && (myTagFilter || myLvFilter !== null) && (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  <p>필터에 맞는 채널이 없어요.</p>
                  <button onClick={() => { setMyTagFilter(null); setMyLvFilter(null); }} className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 underline">필터 초기화</button>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {channels.length === 0 && (
            <div className="text-center py-10 px-6 rounded-2xl bg-white/[0.02] border border-white/[0.04]">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4"><Rss size={28} className="text-indigo-400" /></div>
              <p className="text-zinc-300 font-semibold">아직 구독한 채널이 없어요</p>
              <p className="text-sm text-zinc-500 mt-1.5 leading-relaxed">Discover 탭에서 채널을 추가하거나<br />위에서 직접 YouTube URL을 입력해보세요</p>
              <button onClick={() => setMainTab('discover')} className="mt-4 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all text-sm font-semibold mx-auto">
                <Star size={14} /> Discover 탭 보기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
