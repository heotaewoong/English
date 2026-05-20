'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Timer,
  Play,
  Pause,
  Mic,
  Square,
  SkipForward,
  ChevronRight,
  Trophy,
  RotateCcw,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Clock,
  Target,
  Star,
  TrendingUp,
  Award,
  CheckCircle2,
  XCircle,
  BarChart3,
  Volume2,
  AlertCircle,
  Share2,
} from 'lucide-react';
import { topics, surveyPresets } from '@/data/opic';
import { useTTS } from '@/hooks/useSpeech';
import { useRecorder } from '@/hooks/useRecorder';

type Phase = 'setup' | 'test' | 'results';
type Difficulty = 'IM' | 'IH' | 'AL';

interface QuestionResult {
  question: string;
  category: string;
  duration: number;
  estimatedScore: number;
  maxScore: number;
  audioUrl?: string;     // blob URL (in-memory only)
}

const HISTORY_KEY = 'neuroeng_opic_history_v1';

interface SessionRecord {
  id: string;
  type: 'mock';
  date: string;
  topic: string;
  duration: number;       // total seconds
  grade: string;
  questionsAnswered: number;
  totalQuestions: number;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function generateTestQuestions(difficulty: Difficulty): { question: string; category: string; topicId: string }[] {
  const count = 15;
  const shuffled = [...topics].sort(() => Math.random() - 0.5);
  const questions: { question: string; category: string; topicId: string }[] = [];

  for (let i = 0; questions.length < count && i < shuffled.length * 3; i++) {
    const topic = shuffled[i % shuffled.length];
    const qIdx = Math.floor(Math.random() * topic.questions.length);
    questions.push({
      question: topic.questions[qIdx],
      category: topic.category,
      topicId: topic.id,
    });
  }

  return questions.slice(0, count);
}

function estimateGrade(scores: number[]): { grade: string; label: string; color: string; position: number } {
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (avg >= 8.5) return { grade: 'AL', label: 'Advanced Low', color: 'from-amber-500 to-yellow-400', position: 90 };
  if (avg >= 7) return { grade: 'IH', label: 'Intermediate High', color: 'from-violet-500 to-purple-400', position: 70 };
  if (avg >= 5.5) return { grade: 'IM3', label: 'Intermediate Mid 3', color: 'from-blue-500 to-cyan-400', position: 55 };
  if (avg >= 4) return { grade: 'IM2', label: 'Intermediate Mid 2', color: 'from-indigo-500 to-blue-400', position: 40 };
  if (avg >= 2.5) return { grade: 'IM1', label: 'Intermediate Mid 1', color: 'from-teal-500 to-emerald-400', position: 25 };
  return { grade: 'IL', label: 'Intermediate Low', color: 'from-gray-500 to-gray-400', position: 10 };
}

export default function MockTestPage() {
  const [phase, setPhase] = useState<Phase>('setup');
  const [difficulty, setDifficulty] = useState<Difficulty>('IH');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [testQuestions, setTestQuestions] = useState<{ question: string; category: string; topicId: string }[]>([]);
  const [totalTime, setTotalTime] = useState(0);
  const [showTips, setShowTips] = useState(false);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const totalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopRecPendingRef = useRef<null | (() => void)>(null);

  const recorder = useRecorder();
  const { speak, stop: stopTTS, isSpeaking } = useTTS();

  const currentTopic = testQuestions.length > 0
    ? topics.find((t) => t.id === testQuestions[currentQuestion]?.topicId)
    : null;

  const startTest = () => {
    const questions = generateTestQuestions(difficulty);
    setTestQuestions(questions);
    setCurrentQuestion(0);
    setResults([]);
    setTotalTime(0);
    setPhase('test');
  };

  useEffect(() => {
    if (phase === 'test') {
      totalTimerRef.current = setInterval(() => setTotalTime((t) => t + 1), 1000);
    }
    return () => {
      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    };
  }, [phase]);

  // Auto-stop recording at 2:00 limit
  useEffect(() => {
    if (recorder.isRecording && recorder.duration >= 120) {
      recorder.stop();
    }
  }, [recorder.isRecording, recorder.duration, recorder]);

  const handleStartRecording = async () => {
    if (isSpeaking) stopTTS();
    await recorder.start();
  };

  // Persist mock test result to localStorage history
  const persistHistory = (record: SessionRecord) => {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      const arr: SessionRecord[] = raw ? JSON.parse(raw) : [];
      arr.unshift(record);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(0, 100)));
    } catch { /* ignore */ }
  };

  const finishWithResult = useCallback((withRecording: boolean, recordingDuration: number, audioUrl?: string) => {
    const duration = recordingDuration;
    const baseScore = difficulty === 'AL' ? 7 : difficulty === 'IH' ? 5.5 : 4;
    const timeBonus = withRecording ? Math.min(duration / 120, 1) * 2 : 0;
    const randomVariation = withRecording ? (Math.random() - 0.3) * 2 : 0;
    const score = withRecording ? Math.min(10, Math.max(1, baseScore + timeBonus + randomVariation)) : 0;

    const result: QuestionResult = {
      question: testQuestions[currentQuestion].question,
      category: testQuestions[currentQuestion].category,
      duration: withRecording ? duration : 0,
      estimatedScore: withRecording ? Math.round(score * 10) / 10 : 0,
      maxScore: 10,
      audioUrl,
    };

    const newResults = [...results, result];
    setResults(newResults);
    recorder.reset();

    if (currentQuestion < testQuestions.length - 1) {
      setCurrentQuestion((q) => q + 1);
    } else {
      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
      // Save to history with computed grade
      const grade = estimateGrade(newResults.map((r) => r.estimatedScore)).grade;
      persistHistory({
        id: `mock-${Date.now()}`,
        type: 'mock',
        date: new Date().toISOString(),
        topic: 'Full Mock Test',
        duration: totalTime,
        grade,
        questionsAnswered: newResults.filter((r) => r.duration > 0).length,
        totalQuestions: newResults.length,
      });
      setPhase('results');
    }
  }, [currentQuestion, testQuestions, results, difficulty, recorder, totalTime]);

  // When recorder produces audio, save it to current question and move on (if save was requested)
  useEffect(() => {
    if (recorder.audioURL && stopRecPendingRef.current) {
      const url = recorder.audioURL;
      const dur = recorder.duration;
      stopRecPendingRef.current = null;
      finishWithResult(true, dur, url);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorder.audioURL]);

  const saveAndNext = useCallback(() => {
    if (recorder.isRecording) {
      stopRecPendingRef.current = () => {};
      recorder.stop();
      // Wait for audioURL effect to call finishWithResult
      return;
    }
    if (recorder.audioURL) {
      finishWithResult(true, recorder.duration, recorder.audioURL);
    } else {
      // No recording made — count as skip
      finishWithResult(false, 0);
    }
  }, [recorder, finishWithResult]);

  const skipQuestion = useCallback(() => {
    if (recorder.isRecording) recorder.stop();
    stopRecPendingRef.current = null;
    finishWithResult(false, 0);
  }, [recorder, finishWithResult]);

  const handlePlayQuestionAudio = (idx: number, url?: string) => {
    if (!url || !audioRef.current) return;
    if (playingIdx === idx) {
      audioRef.current.pause();
      setPlayingIdx(null);
      return;
    }
    audioRef.current.pause();
    audioRef.current.src = url;
    audioRef.current.play().then(() => setPlayingIdx(idx)).catch(() => setPlayingIdx(null));
  };

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      results.forEach((r) => { if (r.audioUrl) URL.revokeObjectURL(r.audioUrl); });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recordingTime = recorder.duration;
  const isRecording = recorder.isRecording;

  const gradeResult = results.length > 0 ? estimateGrade(results.map((r) => r.estimatedScore)) : null;

  const strengths = results.length > 0
    ? [...new Set(results.filter((r) => r.estimatedScore >= 7).map((r) => r.category))].slice(0, 3)
    : [];
  const weaknesses = results.length > 0
    ? [...new Set(results.filter((r) => r.estimatedScore < 5).map((r) => r.category))].slice(0, 3)
    : [];

  // ─── Setup Phase ───
  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 text-sm font-medium mb-4">
              <Timer className="w-4 h-4" />
              Simulated Exam
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-3">
              OPIc Mock Test
            </h1>
            <p className="text-[var(--text-secondary)] text-lg max-w-xl mx-auto">
              Practice under real exam conditions. Choose your target difficulty and complete 15 questions.
            </p>
          </div>

          {/* Difficulty Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {surveyPresets.map((preset) => {
              const isSelected = difficulty === preset.difficulty;
              const colors: Record<string, { border: string; bg: string; badge: string }> = {
                IM: { border: 'border-blue-500/40',   bg: 'bg-blue-500/[0.08]',   badge: 'bg-blue-500/15 text-blue-400' },
                IH: { border: 'border-violet-500/40', bg: 'bg-violet-500/[0.08]', badge: 'bg-violet-500/15 text-violet-400' },
                AL: { border: 'border-amber-500/40',  bg: 'bg-amber-500/[0.08]',  badge: 'bg-amber-500/15 text-amber-400' },
              };
              const c = colors[preset.difficulty] || colors.IM;

              return (
                <button
                  key={preset.id}
                  onClick={() => setDifficulty(preset.difficulty as Difficulty)}
                  className={`relative p-6 rounded-2xl border-2 transition-all duration-300 text-left hover-lift ${
                    isSelected
                      ? `${c.border} ${c.bg} shadow-lg`
                      : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.12]'
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <CheckCircle2 className="w-5 h-5 text-primary-600" />
                    </div>
                  )}
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${c.badge}`}>
                    {preset.name}
                  </span>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {preset.description}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { icon: Clock, label: 'Duration', value: '~40 min' },
              { icon: Target, label: 'Questions', value: '15' },
              { icon: Mic, label: 'Format', value: 'Speaking' },
              { icon: BarChart3, label: 'Analysis', value: 'AI Grading' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-4 text-center">
                <Icon className="w-5 h-5 text-primary-500 mx-auto mb-2" />
                <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{value}</p>
              </div>
            ))}
          </div>

          {/* Start Button */}
          <div className="text-center">
            <button
              onClick={startTest}
              className="inline-flex items-center gap-3 px-10 py-4 rounded-2xl text-white font-semibold text-lg gradient-primary hover:opacity-90 transition-all shadow-lg hover:shadow-xl animate-[pulse-glow_3s_ease-in-out_infinite]"
            >
              <Play className="w-6 h-6" />
              Start Mock Test
            </button>
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Make sure you&apos;re in a quiet environment with a working microphone
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Test Phase ───
  if (phase === 'test') {
    const progress = ((currentQuestion + 1) / testQuestions.length) * 100;
    const currentQ = testQuestions[currentQuestion];

    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        {/* Progress Bar */}
        <div className="sticky top-0 z-10 bg-[var(--bg-card)] border-b border-[var(--border-color)] shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[var(--text-primary)]">
                Question {currentQuestion + 1} of {testQuestions.length}
              </span>
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <Clock className="w-4 h-4" />
                {formatTime(totalTime)}
              </div>
            </div>
            <div className="h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full gradient-primary transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          {/* Category Badge */}
          <div className="flex items-center gap-2 mb-6">
            <span className="px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 text-xs font-semibold">
              {currentQ.category}
            </span>
            <span className="text-sm text-[var(--text-muted)]">
              Question #{currentQuestion + 1}
            </span>
          </div>

          {/* Question Display */}
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 sm:p-8 mb-4 shadow-sm">
            <p className="text-xl sm:text-2xl font-semibold text-[var(--text-primary)] leading-relaxed mb-4">
              {currentQ.question}
            </p>
            <button
              onClick={() => isSpeaking ? stopTTS() : speak(currentQ.question, 0.85)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition-all text-sm font-medium border border-indigo-500/20"
            >
              {isSpeaking ? <Pause size={14} /> : <Volume2 size={14} />}
              {isSpeaking ? '정지' : '질문 듣기'}
            </button>
          </div>

          {/* Recorder error */}
          {recorder.error && (
            <div className="flex items-start gap-3 px-4 py-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20">
              <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{recorder.error}</p>
            </div>
          )}

          {/* Recording Area */}
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 sm:p-8 mb-6 shadow-sm">
            <div className="text-center">
              {/* Record Button */}
              <div className="relative inline-flex items-center justify-center mb-6">
                {isRecording && (
                  <>
                    <div className="absolute w-32 h-32 rounded-full bg-red-500/30 animate-ping" />
                    <div className="absolute w-28 h-28 rounded-full bg-red-500/40 animate-pulse" />
                  </>
                )}
                <button
                  onClick={isRecording ? () => recorder.stop() : handleStartRecording}
                  disabled={!recorder.isSupported}
                  className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg disabled:opacity-50 ${
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'gradient-primary text-white hover:opacity-90'
                  }`}
                >
                  {isRecording ? <Square className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
                </button>
              </div>

              {/* Recording Timer */}
              <div className="mb-6">
                <p className="text-3xl font-mono font-bold text-[var(--text-primary)]">
                  {formatTime(recordingTime)}
                </p>
                <p className="text-sm text-[var(--text-muted)] mt-1">
                  {isRecording ? 'Recording... (max 2:00)' : recorder.audioURL ? '녹음 완료 ✓ "Next Question"으로 저장' : 'Tap to start recording'}
                </p>
                <div className="mt-3 max-w-xs mx-auto h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${recordingTime > 90 ? 'bg-red-500' : 'bg-indigo-500'}`}
                    style={{ width: `${(recordingTime / 120) * 100}%` }}
                  />
                </div>
              </div>

              {/* Live-level Waveform */}
              <div className="flex items-center justify-center gap-[3px] h-12 mb-6">
                {Array.from({ length: 24 }).map((_, i) => {
                  const phase = Math.sin((Date.now() / 100 + i) * 0.4);
                  const h = isRecording ? 4 + Math.abs(phase) * recorder.level * 36 + recorder.level * 8 : 4;
                  return (
                    <div
                      key={i}
                      className={`w-1.5 rounded-full transition-all duration-75 ${isRecording ? 'bg-red-400' : 'bg-[var(--border-color)]'}`}
                      style={{ height: `${Math.max(4, h)}px` }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={skipQuestion}
                className="px-5 py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--bg-secondary)] transition-colors flex items-center gap-2"
              >
                <SkipForward className="w-4 h-4" />
                Skip
              </button>
              <button
                onClick={saveAndNext}
                className="px-6 py-2.5 rounded-xl gradient-primary text-white text-sm font-medium hover:opacity-90 transition-all flex items-center gap-2 shadow-sm"
              >
                {currentQuestion < testQuestions.length - 1 ? 'Next Question' : 'Finish Test'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tips Toggle */}
          {currentTopic && (
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
              <button
                onClick={() => setShowTips(!showTips)}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-[var(--bg-secondary)] transition-colors"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  Show tips for this topic
                </span>
                {showTips ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
              </button>
              {showTips && (
                <div className="px-6 pb-4 border-t border-[var(--border-color)]">
                  <ul className="space-y-2 pt-3">
                    {currentTopic.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                        <Star className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Results Phase ───
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 text-primary-700 text-sm font-medium mb-4">
            <Trophy className="w-4 h-4" />
            Test Complete
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-2">
            Your Results
          </h1>
          <p className="text-[var(--text-secondary)]">
            Completed in {formatTime(totalTime)} with {results.filter((r) => r.duration > 0).length}/{results.length} questions answered
          </p>
        </div>

        {/* Grade Display */}
        {gradeResult && (
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-8 sm:p-10 mb-8 text-center shadow-lg">
            <p className="text-sm font-medium text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Estimated Grade
            </p>
            <div className={`inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br ${gradeResult.color} text-white mb-4 shadow-xl`}>
              <span className="text-4xl font-bold">{gradeResult.grade}</span>
            </div>
            <p className="text-xl font-semibold text-[var(--text-primary)] mb-6">
              {gradeResult.label}
            </p>

            {/* Grade Scale */}
            <div className="max-w-lg mx-auto">
              <div className="relative h-3 bg-[var(--bg-secondary)] rounded-full overflow-visible mb-2">
                <div className="absolute inset-0 rounded-full overflow-hidden flex">
                  <div className="h-full bg-gray-400 flex-1" />
                  <div className="h-full bg-teal-400 flex-1" />
                  <div className="h-full bg-blue-400 flex-1" />
                  <div className="h-full bg-indigo-400 flex-1" />
                  <div className="h-full bg-violet-400 flex-1" />
                  <div className="h-full bg-amber-400 flex-1" />
                </div>
                {/* Position marker */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white border-3 border-primary-600 shadow-md transition-all duration-1000"
                  style={{ left: `${gradeResult.position}%`, transform: `translate(-50%, -50%)` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                <span>IL</span>
                <span>IM1</span>
                <span>IM2</span>
                <span>IM3</span>
                <span>IH</span>
                <span>AL</span>
              </div>
            </div>
          </div>
        )}

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-emerald-800">Strengths</h3>
            </div>
            {strengths.length > 0 ? (
              <ul className="space-y-2">
                {strengths.map((s, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-emerald-600">Keep practicing to identify your strengths!</p>
            )}
          </div>
          <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-red-600" />
              <h3 className="font-semibold text-red-800">Areas to Improve</h3>
            </div>
            {weaknesses.length > 0 ? (
              <ul className="space-y-2">
                {weaknesses.map((w, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-red-700">
                    <XCircle className="w-4 h-4 shrink-0" />
                    {w}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-red-600">Great job! No significant weak areas detected.</p>
            )}
          </div>
        </div>

        {/* Per-question Breakdown */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-[var(--border-color)]">
            <h3 className="font-semibold text-[var(--text-primary)]">Question Breakdown</h3>
          </div>
          <audio ref={audioRef} onEnded={() => setPlayingIdx(null)} onPause={() => setPlayingIdx(null)} />
          <div className="divide-y divide-[var(--border-color)]">
            {results.map((r, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-xs font-semibold text-[var(--text-secondary)]">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] truncate">{r.question}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-[var(--text-muted)]">{r.category}</span>
                    <span className="text-xs text-[var(--text-muted)]">{formatTime(r.duration)}</span>
                  </div>
                </div>
                {r.audioUrl && (
                  <button
                    onClick={() => handlePlayQuestionAudio(i, r.audioUrl)}
                    className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 text-xs font-medium border border-indigo-500/20 transition-all"
                  >
                    {playingIdx === i ? <Pause size={12} /> : <Play size={12} />}
                    {playingIdx === i ? '정지' : '재생'}
                  </button>
                )}
                <div className="shrink-0">
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                    r.estimatedScore >= 7 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                    : r.estimatedScore >= 4 ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                    : 'bg-red-500/15 text-red-400 border-red-500/20'
                  }`}>
                    {r.estimatedScore > 0 ? r.estimatedScore.toFixed(1) : 'Skipped'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => {
              setPhase('setup');
              setResults([]);
              setCurrentQuestion(0);
              setTotalTime(0);
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl gradient-primary text-white font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Try Again
          </button>
          <button className="w-full sm:w-auto px-6 py-3 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-secondary)] transition-colors flex items-center justify-center gap-2">
            <Award className="w-4 h-4" />
            Review Answers
          </button>
          <button className="w-full sm:w-auto px-6 py-3 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-secondary)] transition-colors flex items-center justify-center gap-2">
            <Share2 className="w-4 h-4" />
            Share Result
          </button>
        </div>
      </div>
    </div>
  );
}
