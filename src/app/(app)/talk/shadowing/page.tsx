'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Headphones,
  Mic,
  BarChart3,
  Play,
  Pause,
  RefreshCw,
  ChevronRight,
  Check,
  Clock,
  Square,
  Volume2,
  AlertCircle,
} from 'lucide-react';
import { useTTS, useSpeechRecognition } from '@/hooks/useSpeech';
import { useRecorder } from '@/hooks/useRecorder';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface Clip {
  id: string;
  speaker: string;
  initials: string;
  avatarColor: string;
  accent: string;
  title: string;
  duration: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  sentences: string[];
}

/* ------------------------------------------------------------------ */
/*  Static data                                                         */
/* ------------------------------------------------------------------ */

const clips: Clip[] = [
  {
    id: 'c1',
    speaker: 'Sarah Mitchell',
    initials: 'SM',
    avatarColor: 'from-rose-500 to-pink-500',
    accent: 'American',
    title: 'Morning Routine',
    duration: '2:15',
    difficulty: 'Easy',
    sentences: [
      'Every morning I wake up at six thirty.',
      'The first thing I do is make a cup of coffee.',
      'Then I check my emails while eating breakfast.',
      'I usually leave the house around eight o\'clock.',
      'The commute to work takes about thirty minutes.',
      'I like to listen to podcasts during the drive.',
      'Once I get to the office I review my schedule.',
      'It helps me stay organized throughout the day.',
    ],
  },
  {
    id: 'c2',
    speaker: 'James Crawford',
    initials: 'JC',
    avatarColor: 'from-blue-500 to-cyan-500',
    accent: 'British',
    title: 'Ordering at a Restaurant',
    duration: '1:48',
    difficulty: 'Easy',
    sentences: [
      'Good evening, could I see the menu please?',
      "I'd like to start with the soup of the day.",
      "For the main course I'll have the grilled salmon.",
      'Could I get some extra vegetables on the side?',
      'Do you have any gluten-free dessert options?',
      "I'll have a sparkling water to drink, thank you.",
      'Actually, could I change my order to the pasta?',
      'The meal was absolutely delicious, thank you.',
    ],
  },
  {
    id: 'c3',
    speaker: 'Emma Thompson',
    initials: 'ET',
    avatarColor: 'from-emerald-500 to-teal-500',
    accent: 'Australian',
    title: 'Talking About Hobbies',
    duration: '2:32',
    difficulty: 'Medium',
    sentences: [
      "I've been really into photography lately.",
      'I started taking pictures during my trip to Japan.',
      "There's something magical about capturing a moment.",
      'I mostly focus on landscape and street photography.',
      'My favourite time to shoot is during golden hour.',
      'I also enjoy editing photos with different filters.',
      "Eventually I'd love to have my own exhibition.",
      "It's a hobby that constantly challenges my creativity.",
    ],
  },
  {
    id: 'c4',
    speaker: 'David Park',
    initials: 'DP',
    avatarColor: 'from-violet-500 to-purple-500',
    accent: 'American',
    title: 'Job Interview Practice',
    duration: '3:05',
    difficulty: 'Hard',
    sentences: [
      'Thank you for the opportunity to interview today.',
      'I have five years of experience in software development.',
      'In my previous role I led a team of eight engineers.',
      'We successfully delivered three major product launches.',
      "I'm particularly skilled in problem-solving and communication.",
      'I believe my background aligns well with this position.',
      "Could you tell me about the team I'd be working with?",
      "I'm very excited about the possibility of joining your company.",
    ],
  },
  {
    id: 'c5',
    speaker: 'Olivia Chen',
    initials: 'OC',
    avatarColor: 'from-amber-500 to-orange-500',
    accent: 'British',
    title: 'Describing Your City',
    duration: '2:40',
    difficulty: 'Medium',
    sentences: [
      'I live in a vibrant city with a lot of character.',
      'The public transportation system is quite reliable.',
      'There are plenty of parks and green spaces nearby.',
      'The food scene is incredibly diverse and exciting.',
      'You can find restaurants from almost every culture.',
      'The nightlife is quite lively especially on weekends.',
      'One downside is that the cost of living is rather high.',
      "Despite that I wouldn't want to live anywhere else.",
    ],
  },
  {
    id: 'c6',
    speaker: 'Liam Foster',
    initials: 'LF',
    avatarColor: 'from-indigo-500 to-blue-500',
    accent: 'Australian',
    title: 'Travel Experiences',
    duration: '2:55',
    difficulty: 'Medium',
    sentences: [
      'Travelling has completely changed my perspective on life.',
      'Last year I backpacked through Southeast Asia for three months.',
      'The most memorable part was visiting the temples in Cambodia.',
      'I also spent two weeks volunteering at a local school.',
      'Meeting people from different backgrounds was truly enriching.',
      'I learned to be more adaptable and open-minded.',
      'My next trip is going to be a road trip across New Zealand.',
      "I can't wait to explore the mountains and coastlines there.",
    ],
  },
  {
    id: 'c7',
    speaker: 'Mia Rodriguez',
    initials: 'MR',
    avatarColor: 'from-pink-500 to-rose-400',
    accent: 'American',
    title: 'Weekend Plans',
    duration: '1:55',
    difficulty: 'Easy',
    sentences: [
      'What are you planning to do this weekend?',
      'I was thinking of going for a hike in the morning.',
      'After that I might catch a movie with some friends.',
      'There is a new film that everyone has been talking about.',
      'We are trying to book tickets for the evening show.',
      'Would you like to join us if you have nothing planned?',
      'We could grab dinner at that Italian place on Fifth Street.',
      'It should be a really enjoyable evening overall.',
    ],
  },
  {
    id: 'c8',
    speaker: 'Noah Bennett',
    initials: 'NB',
    avatarColor: 'from-teal-500 to-cyan-400',
    accent: 'British',
    title: 'Asking for Directions',
    duration: '1:40',
    difficulty: 'Easy',
    sentences: [
      'Excuse me, could you help me find the nearest train station?',
      'I think I have taken a wrong turn somewhere.',
      'Walk straight ahead until you reach the traffic lights.',
      'At the lights you need to turn left and cross the bridge.',
      'The station will be on your right after about five minutes.',
      'You cannot miss it as there is a large clock tower out front.',
      'If you do get lost feel free to ask anyone in one of the shops.',
      'Thank you so much for your help, that is really kind of you.',
    ],
  },
  {
    id: 'c9',
    speaker: 'Ava Patel',
    initials: 'AP',
    avatarColor: 'from-fuchsia-500 to-purple-400',
    accent: 'American',
    title: 'Health and Wellness',
    duration: '2:20',
    difficulty: 'Medium',
    sentences: [
      'I have been trying to live a much healthier lifestyle this year.',
      'I started going to the gym three times a week in January.',
      'I also cut down significantly on sugar and processed foods.',
      'Drinking enough water throughout the day has made a big difference.',
      'Getting at least seven hours of sleep every night is really important.',
      'I try to manage stress through meditation and light yoga.',
      'It is not always easy to stay consistent with these habits.',
      'But the improvements to my energy and mood are absolutely worth it.',
    ],
  },
  {
    id: 'c10',
    speaker: 'Ethan Nguyen',
    initials: 'EN',
    avatarColor: 'from-lime-500 to-green-400',
    accent: 'American',
    title: 'Technology and Society',
    duration: '2:50',
    difficulty: 'Hard',
    sentences: [
      'Technology has fundamentally transformed the way we live and work.',
      'We now rely on smartphones for almost every aspect of our daily lives.',
      'From navigation and communication to shopping everything has gone digital.',
      'Artificial intelligence is beginning to automate tasks once done by humans.',
      'This creates both remarkable opportunities and very serious social concerns.',
      'We need to continuously develop new skills to remain relevant in the workforce.',
      'Digital literacy will become as essential as the ability to read and write.',
      'How we adapt collectively to these changes will define the future of society.',
    ],
  },
];

const speedOptions = [0.75, 1, 1.25] as const;

/* ------------------------------------------------------------------ */
/*  Compute word-overlap match score (0-100)                            */
/* ------------------------------------------------------------------ */

function calcMatchScore(original: string, transcript: string): number {
  if (!transcript.trim()) return 0;
  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z'\s]/g, '').split(/\s+/).filter(Boolean);
  const origWords = normalize(original);
  const userWords = normalize(transcript);
  if (origWords.length === 0) return 0;
  const origSet = new Set(origWords);
  const matched = userWords.filter((w) => origSet.has(w)).length;
  return Math.max(20, Math.min(100, Math.round((matched / origWords.length) * 100)));
}

/* ------------------------------------------------------------------ */
/*  Animated waveform                                                   */
/* ------------------------------------------------------------------ */

function Waveform({
  barCount = 20,
  playing = false,
  level = 0,
  className = '',
  color = 'bg-indigo-500',
}: {
  barCount?: number;
  playing?: boolean;
  level?: number;
  className?: string;
  color?: string;
}) {
  return (
    <div className={`flex items-end gap-[3px] h-12 ${className}`}>
      {Array.from({ length: barCount }).map((_, i) => {
        const baseH = 20 + Math.sin(i * 0.9) * 30 + Math.cos(i * 1.5) * 20;
        // Use real audio level when available, fall back to CSS animation
        const liveH =
          level > 0.01
            ? Math.max(8, Math.min(95, level * 160 * (0.3 + 0.7 * Math.abs(Math.sin(i * 0.9)))))
            : playing
              ? baseH
              : 15;
        return (
          <div
            key={i}
            className={`w-1.5 rounded-full ${color}`}
            style={{
              height: `${liveH}%`,
              animationName: playing && level <= 0.01 ? 'waveBar' : 'none',
              animationDuration: `${0.6 + (i % 5) * 0.12}s`,
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
              animationDirection: 'alternate',
              animationDelay: `${i * 0.05}s`,
              opacity: playing ? 1 : 0.35,
              transition: level > 0.01 ? 'height 0.07s ease' : 'height 0.3s ease',
            }}
          />
        );
      })}
      <style jsx>{`
        @keyframes waveBar {
          0% {
            height: 15%;
          }
          100% {
            height: 90%;
          }
        }
      `}</style>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Difficulty badge                                                    */
/* ------------------------------------------------------------------ */

function diffBadge(diff: Clip['difficulty']) {
  switch (diff) {
    case 'Easy':
      return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    case 'Medium':
      return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
    case 'Hard':
      return 'bg-red-500/10 border-red-500/30 text-red-400';
  }
}

/* ------------------------------------------------------------------ */
/*  Main component                                                      */
/* ------------------------------------------------------------------ */

export default function ShadowingPage() {
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [speed, setSpeed] = useState<(typeof speedOptions)[number]>(1);
  const [currentSentence, setCurrentSentence] = useState(0);
  const [userTranscript, setUserTranscript] = useState('');
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [showComparison, setShowComparison] = useState(false);
  const [matchScore, setMatchScore] = useState(0);

  /* ── Hooks ────────────────────────────────────────────────────── */
  const { speak, stop: stopTTS, isSpeaking } = useTTS();
  const recorder = useRecorder();

  // autoRestart: true → STT keeps restarting until stopListening() is called.
  // Accumulate across restarts so mid-sentence pauses don't lose text.
  const {
    isSupported: sttSupported,
    error: sttError,
    clearError: clearSttError,
    startListening,
    stopListening,
  } = useSpeechRecognition(
    (text) => setUserTranscript((prev) => (prev ? `${prev} ${text}` : text)),
    { autoRestart: true }
  );

  const isPlaying = isSpeaking;

  /* ── Playback ─────────────────────────────────────────────────── */
  const handlePlayPause = useCallback(() => {
    if (!selectedClip) return;
    if (isPlaying) {
      stopTTS();
    } else {
      speak(selectedClip.sentences[currentSentence], speed);
    }
  }, [isPlaying, selectedClip, currentSentence, speed, speak, stopTTS]);

  /* ── Recording ────────────────────────────────────────────────── */
  const startRecording = async () => {
    stopTTS();
    setUserTranscript('');
    setShowComparison(false);
    recorder.reset();
    if (sttSupported) startListening();
    await recorder.start();
  };

  const stopRecording = () => {
    stopListening();
    recorder.stop(); // generates recorder.audioURL asynchronously
    setCompleted((prev) => new Set([...prev, currentSentence]));
    setShowComparison(true);
  };

  /* ── Match score ──────────────────────────────────────────────── */
  useEffect(() => {
    if (showComparison && selectedClip) {
      setMatchScore(calcMatchScore(selectedClip.sentences[currentSentence], userTranscript));
    }
  }, [showComparison, userTranscript, selectedClip, currentSentence]);

  /* ── Navigation ───────────────────────────────────────────────── */
  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  const goToSentence = (idx: number) => {
    stopTTS();
    stopListening();
    recorder.stop();
    recorder.reset();
    setCurrentSentence(idx);
    setShowComparison(false);
    setUserTranscript('');
  };

  const handleBack = () => {
    stopTTS();
    stopListening();
    recorder.stop();
    recorder.reset();
    setSelectedClip(null);
    setCurrentSentence(0);
    setCompleted(new Set());
    setShowComparison(false);
    setUserTranscript('');
  };

  /* ================================================================ */
  /*  Practice view                                                    */
  /* ================================================================ */

  if (selectedClip) {
    const sentence = selectedClip.sentences[currentSentence];
    const words = sentence.split(' ');
    const highlightIdx = Math.floor(words.length / 2);
    const errorMsg = recorder.error || sttError;

    return (
      <div className="flex flex-col lg:flex-row gap-6 min-h-[calc(100vh-8rem)]">
        {/* ── Main column ── */}
        <div className="flex-1 space-y-5">

          {/* Back + title */}
          <div>
            <button
              onClick={handleBack}
              className="flex items-center gap-1 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] mb-2 transition-colors"
            >
              <ChevronRight size={14} className="rotate-180" />
              All Clips
            </button>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">
              {selectedClip.title}
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              {selectedClip.speaker} &middot; {selectedClip.accent} accent
            </p>
          </div>

          {/* Sentence card */}
          <div className="p-8 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] text-center">
            <p className="text-xl md:text-2xl leading-relaxed text-[var(--text-primary)] font-medium">
              {words.map((word, i) => (
                <span
                  key={i}
                  className={i === highlightIdx ? 'font-bold text-indigo-400' : ''}
                >
                  {word}{' '}
                </span>
              ))}
            </p>
            <p className="mt-4 text-sm text-[var(--text-muted)]">
              Sentence {currentSentence + 1} of {selectedClip.sentences.length}
            </p>
          </div>

          {/* ─── Step 1: Listen ─────────────────────────────────── */}
          <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary)] space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
              Step 1 — Listen
            </p>

            <Waveform playing={isPlaying} barCount={22} color="bg-indigo-500" />

            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handlePlayPause}
                className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white hover:shadow-lg hover:shadow-indigo-500/25 transition-all flex items-center gap-2"
              >
                {isPlaying ? <Pause size={22} /> : <><Volume2 size={18} /><Play size={18} /></>}
              </button>

              {/* Speed selector */}
              <div className="flex rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] p-1">
                {speedOptions.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setSpeed(s);
                      if (isPlaying) { stopTTS(); speak(sentence, s); }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      speed === s
                        ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {!isPlaying && (
              <p className="text-center text-xs text-[var(--text-muted)]">
                Press <span className="text-indigo-400 font-medium">▶ Play</span> to hear the sentence, then record yourself below
              </p>
            )}
          </div>

          {/* ─── Step 2: Record ─────────────────────────────────── */}
          <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-violet-400">
              Step 2 — Record
            </p>

            {/* Error banner */}
            {errorMsg && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span className="flex-1">{errorMsg}</span>
                <button
                  onClick={() => { clearSttError(); }}
                  className="shrink-0 underline text-xs"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Live waveform (real audio level) */}
            {recorder.isRecording && (
              <Waveform
                playing={true}
                level={recorder.level}
                barCount={22}
                color="bg-violet-500"
              />
            )}

            {/* Live transcript preview */}
            {recorder.isRecording && (
              <div className="min-h-[2rem] text-center">
                {userTranscript ? (
                  <p className="text-sm text-[var(--text-secondary)] italic">
                    &ldquo;{userTranscript}&rdquo;
                  </p>
                ) : (
                  <p className="text-sm text-[var(--text-muted)] animate-pulse">
                    Listening...
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col items-center gap-4">
              {/* Record / stop button */}
              <button
                onClick={recorder.isRecording ? stopRecording : startRecording}
                className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  recorder.isRecording
                    ? 'bg-red-500/20 text-red-400 border-2 border-red-500'
                    : 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white hover:shadow-lg hover:shadow-indigo-500/25'
                }`}
              >
                {recorder.isRecording ? <Square size={28} /> : <Mic size={28} />}
                {recorder.isRecording && (
                  <span className="absolute inset-0 rounded-full border-2 border-red-400 animate-ping opacity-25" />
                )}
              </button>

              {/* Timer */}
              {recorder.isRecording && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="font-mono text-[var(--text-primary)]">
                    {formatTime(recorder.duration)}
                  </span>
                </div>
              )}

              {!recorder.isRecording && !showComparison && (
                <p className="text-sm text-[var(--text-muted)]">
                  Tap to record your attempt
                </p>
              )}

              {/* Not supported fallback */}
              {!sttSupported && (
                <p className="text-xs text-amber-400 text-center">
                  ⚠ Speech recognition not supported in this browser. Try Chrome for best results.
                </p>
              )}
            </div>
          </div>

          {/* ─── Step 3: Comparison ─────────────────────────────── */}
          {showComparison && (
            <div className="p-6 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] space-y-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
                Step 3 — Compare
              </p>

              {/* Original sentence */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-[var(--text-muted)]">Original</p>
                <div className="p-4 rounded-xl bg-[var(--bg-secondary)] flex items-center gap-3">
                  <p className="text-sm text-[var(--text-secondary)] italic flex-1">
                    &ldquo;{sentence}&rdquo;
                  </p>
                  <button
                    onClick={() => speak(sentence, speed)}
                    className="shrink-0 p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all"
                    title="Play original again"
                  >
                    <Volume2 size={15} />
                  </button>
                </div>
              </div>

              {/* Your recording */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-[var(--text-muted)]">Your Recording</p>
                {recorder.audioURL ? (
                  <audio
                    src={recorder.audioURL}
                    controls
                    className="w-full rounded-xl"
                    style={{ height: '42px' }}
                  />
                ) : (
                  <div className="p-3 rounded-xl bg-[var(--bg-secondary)] text-xs text-[var(--text-muted)] text-center">
                    No audio captured — make sure mic permission is granted
                  </div>
                )}
                {userTranscript ? (
                  <p className="text-xs text-[var(--text-secondary)] italic px-1">
                    Heard: &ldquo;{userTranscript}&rdquo;
                  </p>
                ) : (
                  <p className="text-xs text-[var(--text-muted)] px-1">
                    No transcript — speak more clearly or allow mic access
                  </p>
                )}
              </div>

              {/* Match score */}
              <div className="text-center pt-2">
                <p className="text-sm text-[var(--text-muted)] mb-2">Match Score</p>
                <span
                  className={`text-5xl font-bold ${
                    matchScore >= 85
                      ? 'text-emerald-400'
                      : matchScore >= 70
                        ? 'text-amber-400'
                        : 'text-red-400'
                  }`}
                >
                  {matchScore}%
                </span>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {matchScore >= 85
                    ? '🎉 Excellent!'
                    : matchScore >= 70
                      ? '👍 Good job!'
                      : '💪 Keep practicing!'}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowComparison(false);
                    setUserTranscript('');
                    recorder.reset();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-all"
                >
                  <RefreshCw size={14} /> Try Again
                </button>
                {currentSentence < selectedClip.sentences.length - 1 && (
                  <button
                    onClick={() => goToSentence(currentSentence + 1)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-sm font-medium text-white hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
                  >
                    Next Sentence <ChevronRight size={16} />
                  </button>
                )}
                {currentSentence === selectedClip.sentences.length - 1 && completed.size === selectedClip.sentences.length && (
                  <button
                    onClick={handleBack}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-sm font-medium text-white hover:shadow-lg hover:shadow-emerald-500/25 transition-all"
                  >
                    🎉 All Done! <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar: sentence list ── */}
        <div className="lg:w-72 flex-shrink-0">
          <div className="sticky top-4 p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Sentences</h3>
              <span className="text-xs text-[var(--text-muted)]">
                {completed.size} / {selectedClip.sentences.length} done
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1.5 rounded-full bg-[var(--bg-secondary)] mb-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                style={{ width: `${(completed.size / selectedClip.sentences.length) * 100}%` }}
              />
            </div>

            {selectedClip.sentences.map((s, i) => (
              <button
                key={i}
                onClick={() => goToSentence(i)}
                className={`w-full flex items-start gap-2 px-3 py-2 rounded-xl text-left text-sm transition-all ${
                  i === currentSentence
                    ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-300'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                }`}
              >
                <span className="flex-shrink-0 mt-0.5">
                  {completed.has(i) ? (
                    <Check size={14} className="text-emerald-400" />
                  ) : (
                    <span className="inline-block w-3.5 text-center text-xs text-[var(--text-muted)]">
                      {i + 1}
                    </span>
                  )}
                </span>
                <span className="line-clamp-2">{s}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  Clip list view                                                   */
  /* ================================================================ */

  const easyClips = clips.filter((c) => c.difficulty === 'Easy');
  const mediumClips = clips.filter((c) => c.difficulty === 'Medium');
  const hardClips = clips.filter((c) => c.difficulty === 'Hard');

  const ClipCard = ({ clip }: { clip: Clip }) => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-indigo-500/30 hover:shadow-md transition-all">
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br ${clip.avatarColor} flex items-center justify-center text-sm font-bold text-white`}
      >
        {clip.initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
            {clip.speaker}
          </h3>
          <span className="px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[10px] font-medium text-[var(--text-muted)]">
            {clip.accent}
          </span>
        </div>
        <p className="text-sm text-[var(--text-secondary)] truncate">{clip.title}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
            <Clock size={11} />
            {clip.duration}
          </span>
          <span className="text-xs text-[var(--text-muted)]">
            {clip.sentences.length} sentences
          </span>
          <span
            className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${diffBadge(clip.difficulty)}`}
          >
            {clip.difficulty}
          </span>
        </div>
      </div>

      {/* Practice button */}
      <button
        onClick={() => {
          setSelectedClip(clip);
          setCurrentSentence(0);
          setCompleted(new Set());
          setShowComparison(false);
          setUserTranscript('');
        }}
        className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-sm font-medium text-white hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
      >
        <Play size={14} />
        Practice
      </button>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Headphones size={24} className="text-violet-400" />
          Shadowing Practice
        </h1>
        <p className="text-[var(--text-muted)] mt-1">
          Listen, record, and compare to build fluency &amp; accent
        </p>
      </div>

      {/* How it works */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: Volume2,
            step: '1',
            label: 'Listen',
            desc: 'Hear a native speaker say the sentence at any speed',
            color: 'text-indigo-400',
            bg: 'bg-indigo-500/10 border-indigo-500/20',
          },
          {
            icon: Mic,
            step: '2',
            label: 'Record',
            desc: 'Tap the mic and shadow the sentence out loud',
            color: 'text-violet-400',
            bg: 'bg-violet-500/10 border-violet-500/20',
          },
          {
            icon: BarChart3,
            step: '3',
            label: 'Compare',
            desc: 'Play back your voice and see your match score',
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10 border-emerald-500/20',
          },
        ].map((step) => (
          <div
            key={step.label}
            className={`flex flex-col items-center text-center p-5 rounded-2xl border ${step.bg}`}
          >
            <div className={`mb-3 ${step.color}`}>
              <step.icon size={28} />
            </div>
            <h3 className={`text-sm font-semibold ${step.color} mb-1`}>
              Step {step.step}: {step.label}
            </h3>
            <p className="text-xs text-[var(--text-muted)]">{step.desc}</p>
          </div>
        ))}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Clips', value: clips.length },
          { label: 'Total Sentences', value: clips.reduce((acc, c) => acc + c.sentences.length, 0) },
          { label: 'Difficulty Levels', value: 3 },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] text-center"
          >
            <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Clip sections by difficulty */}
      {[
        { label: '🟢 Easy', clips: easyClips },
        { label: '🟡 Medium', clips: mediumClips },
        { label: '🔴 Hard', clips: hardClips },
      ].map((group) => (
        <div key={group.label} className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--text-secondary)]">{group.label}</h2>
          {group.clips.map((clip) => (
            <ClipCard key={clip.id} clip={clip} />
          ))}
        </div>
      ))}
    </div>
  );
}
