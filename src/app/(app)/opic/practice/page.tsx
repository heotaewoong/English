'use client';

import { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  Mic,
  Play,
  Pause,
  Square,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Star,
  Lightbulb,
  CheckCircle2,
  Volume2,
  Headphones,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { topics } from '@/data/opic';
import { useTTS } from '@/hooks/useSpeech';
import { useRecorder } from '@/hooks/useRecorder';

type AnswerLevel = 'IM' | 'IH' | 'AL';

const categories = ['All', ...Array.from(new Set(topics.map((t) => t.category)))];

const categoryColors: Record<string, string> = {
  'Self-Introduction':    'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20',
  Hobbies:                'bg-violet-500/15 text-violet-400 border border-violet-500/20',
  'Daily Life':           'bg-blue-500/15 text-blue-400 border border-blue-500/20',
  'Work/School':          'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  Technology:             'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20',
  Health:                 'bg-rose-500/15 text-rose-400 border border-rose-500/20',
  'Role-Play':            'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  'Unexpected Questions': 'bg-orange-500/15 text-orange-400 border border-orange-500/20',
};

function getDifficultyStars(category: string): number {
  const map: Record<string, number> = {
    'Self-Introduction': 1,
    Hobbies: 2,
    'Daily Life': 2,
    'Work/School': 3,
    Technology: 3,
    Health: 3,
    'Role-Play': 4,
    'Unexpected Questions': 5,
  };
  return map[category] || 2;
}

const STORAGE_KEY = 'neuroeng_opic_practice_v1';

interface Recording {
  url: string;        // blob URL (in-memory only — does not persist across reloads)
  duration: number;
  recordedAt: string;
}

export default function PracticePage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [expandedQuestion, setExpandedQuestion] = useState<number | null>(null);
  const [sampleLevel, setSampleLevel] = useState<AnswerLevel>('IH');
  const [recordingQuestionIdx, setRecordingQuestionIdx] = useState<number | null>(null);
  const [completedQuestions, setCompletedQuestions] = useState<Record<string, Set<number>>>({});
  const [recordings, setRecordings] = useState<Record<string, Recording>>({});  // key: `${topicId}-${qIdx}`
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { speak, stop: stopTTS, isSpeaking } = useTTS();
  const recorder = useRecorder();

  // Load completed questions from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw) as Record<string, number[]>;
        const restored: Record<string, Set<number>> = {};
        for (const [topicId, arr] of Object.entries(data)) restored[topicId] = new Set(arr);
        setCompletedQuestions(restored);
      }
    } catch { /* ignore */ }
  }, []);

  // Persist completed questions
  useEffect(() => {
    try {
      const serialized: Record<string, number[]> = {};
      for (const [k, v] of Object.entries(completedQuestions)) serialized[k] = Array.from(v);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
    } catch { /* ignore */ }
  }, [completedQuestions]);

  // When recorder produces audio, save it under the active question key
  useEffect(() => {
    if (recorder.audioURL && selectedTopicId && recordingQuestionIdx !== null) {
      const key = `${selectedTopicId}-${recordingQuestionIdx}`;
      // Clean up any old blob for this question
      setRecordings(prev => {
        const old = prev[key];
        if (old && old.url !== recorder.audioURL) URL.revokeObjectURL(old.url);
        return {
          ...prev,
          [key]: {
            url: recorder.audioURL!,
            duration: recorder.duration,
            recordedAt: new Date().toISOString(),
          },
        };
      });
      setCompletedQuestions(prev => {
        const set = new Set(prev[selectedTopicId!] || []);
        set.add(recordingQuestionIdx!);
        return { ...prev, [selectedTopicId!]: set };
      });
      setRecordingQuestionIdx(null);
      recorder.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorder.audioURL]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(recordings).forEach(r => URL.revokeObjectURL(r.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredTopics = activeCategory === 'All' ? topics : topics.filter((t) => t.category === activeCategory);
  const selectedTopic = topics.find((t) => t.id === selectedTopicId);
  const topicIdx = filteredTopics.findIndex((t) => t.id === selectedTopicId);

  const getCompletion = (topicId: string, totalQuestions: number) => {
    const completed = completedQuestions[topicId]?.size || 0;
    return { completed, total: totalQuestions, pct: totalQuestions > 0 ? (completed / totalQuestions) * 100 : 0 };
  };

  const handleStartRecording = async (qIdx: number) => {
    if (isSpeaking) stopTTS();
    if (playingKey && audioRef.current) { audioRef.current.pause(); setPlayingKey(null); }
    setRecordingQuestionIdx(qIdx);
    await recorder.start();
  };

  const handleStopRecording = () => recorder.stop();

  const handlePlayRecording = (key: string) => {
    const rec = recordings[key];
    if (!rec) return;
    if (playingKey === key && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlayingKey(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = rec.url;
      audioRef.current.play().then(() => setPlayingKey(key)).catch(() => setPlayingKey(null));
    }
  };

  const handleDeleteRecording = (key: string) => {
    setRecordings(prev => {
      const old = prev[key];
      if (old) URL.revokeObjectURL(old.url);
      const next = { ...prev };
      delete next[key];
      return next;
    });
    if (playingKey === key && audioRef.current) {
      audioRef.current.pause();
      setPlayingKey(null);
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  const navigateTopic = (dir: -1 | 1) => {
    const newIdx = topicIdx + dir;
    if (newIdx >= 0 && newIdx < filteredTopics.length) {
      setSelectedTopicId(filteredTopics[newIdx].id);
      setExpandedQuestion(null);
    }
  };

  // ─── Topic Grid (no topic selected) ───
  if (!selectedTopic) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 text-sm font-medium mb-4">
              <BookOpen className="w-4 h-4" />
              Topic Practice
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-2">Topic Practice</h1>
            <p className="text-[var(--text-secondary)] text-lg">Master one topic at a time — record, play back, compare</p>
          </div>

          <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-thin">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat
                    ? 'gradient-primary text-white shadow-sm'
                    : 'bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:border-primary-300 hover:text-primary-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTopics.map((topic) => {
              const comp = getCompletion(topic.id, topic.questions.length);
              const stars = getDifficultyStars(topic.category);
              const colorClass = categoryColors[topic.category] || 'bg-gray-100 text-gray-700';

              return (
                <div key={topic.id} className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-5 hover-lift transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colorClass}`}>{topic.category}</span>
                    <span className="px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-xs text-[var(--text-muted)]">{topic.questions.length} Q</span>
                  </div>
                  <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1 group-hover:text-primary-600 transition-colors">{topic.title}</h3>
                  <p className="text-sm text-[var(--text-muted)] mb-4">{topic.titleKo}</p>
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < stars ? 'text-amber-400 fill-amber-400' : 'text-[var(--border-color)]'}`} />
                    ))}
                    <span className="ml-1 text-xs text-[var(--text-muted)]">{stars <= 2 ? 'Easy' : stars <= 3 ? 'Medium' : 'Hard'}</span>
                  </div>
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1">
                      <span>{comp.completed}/{comp.total} completed</span>
                      <span>{Math.round(comp.pct)}%</span>
                    </div>
                    <div className="h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full gradient-primary transition-all" style={{ width: `${comp.pct}%` }} />
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelectedTopicId(topic.id); setExpandedQuestion(null); }}
                    className="w-full py-2.5 rounded-xl gradient-primary text-white text-sm font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Practice
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── Topic Detail View ───
  const comp = getCompletion(selectedTopic.id, selectedTopic.questions.length);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Hidden audio element for playback */}
      <audio ref={audioRef} onEnded={() => setPlayingKey(null)} onPause={() => setPlayingKey(null)} />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => setSelectedTopicId(null)} className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-primary-600 transition-colors mb-6">
          <ChevronLeft className="w-4 h-4" />
          Back to topics
        </button>

        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 sm:p-8 mb-6 shadow-sm">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3 ${categoryColors[selectedTopic.category] || 'bg-gray-100 text-gray-700'}`}>{selectedTopic.category}</span>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-1">{selectedTopic.title}</h1>
              <p className="text-[var(--text-muted)]">{selectedTopic.titleKo}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-[var(--text-muted)]">Progress</p>
              <p className="text-2xl font-bold gradient-text">{comp.completed} / {comp.total}</p>
            </div>
          </div>
          <div className="mt-4 h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
            <div className="h-full rounded-full gradient-primary transition-all" style={{ width: `${comp.pct}%` }} />
          </div>
        </div>

        <div className="bg-amber-500/[0.06] rounded-2xl border border-amber-500/20 p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="w-5 h-5 text-amber-400" />
            <h3 className="font-semibold text-amber-300">Tips for this topic</h3>
          </div>
          <ul className="space-y-2">
            {selectedTopic.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                <Star className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0 fill-amber-400" />
                {tip}
              </li>
            ))}
          </ul>
        </div>

        {/* Recorder error banner */}
        {recorder.error && (
          <div className="flex items-start gap-3 px-4 py-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20">
            <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs text-red-300">{recorder.error}</p>
              <button onClick={recorder.reset} className="text-[10px] text-red-200/70 hover:text-red-200 mt-1 underline">닫기</button>
            </div>
          </div>
        )}

        <div className="space-y-3 mb-8">
          {selectedTopic.questions.map((question, qIdx) => {
            const isExpanded = expandedQuestion === qIdx;
            const recKey = `${selectedTopic.id}-${qIdx}`;
            const myRec = recordings[recKey];
            const isCompleted = (completedQuestions[selectedTopic.id]?.has(qIdx)) || !!myRec;
            const isCurrentRecording = recorder.isRecording && recordingQuestionIdx === qIdx;
            const isCurrentPlaying = playingKey === recKey;
            const sampleAnswer = selectedTopic.sampleAnswers[sampleLevel];

            return (
              <div key={qIdx} className={`bg-[var(--bg-card)] rounded-2xl border transition-all ${isExpanded ? 'border-indigo-500/30 shadow-md' : 'border-[var(--border-color)]'}`}>
                <button onClick={() => setExpandedQuestion(isExpanded ? null : qIdx)} className="w-full flex items-center gap-3 px-5 py-4 text-left">
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${isCompleted ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/[0.06] text-zinc-500'}`}>
                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : qIdx + 1}
                  </div>
                  <p className="flex-1 text-sm font-medium text-[var(--text-primary)]">{question}</p>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)] shrink-0" />}
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-[var(--border-color)]">
                    {/* Question playback (TTS) */}
                    <div className="flex items-center gap-2 my-4">
                      <button
                        onClick={() => isSpeaking ? stopTTS() : speak(question, 0.85)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition-all text-xs font-medium border border-indigo-500/20"
                      >
                        {isSpeaking ? <Pause size={12} /> : <Volume2 size={12} />}
                        {isSpeaking ? '질문 정지' : '질문 듣기'}
                      </button>
                    </div>

                    {/* Recording Area */}
                    <div className="flex flex-col items-center py-6 bg-white/[0.02] rounded-xl border border-white/[0.04]">
                      <div className="relative inline-flex items-center justify-center mb-4">
                        {isCurrentRecording && <div className="absolute w-20 h-20 rounded-full bg-red-500/30 animate-ping" />}
                        <button
                          onClick={isCurrentRecording ? handleStopRecording : () => handleStartRecording(qIdx)}
                          disabled={!recorder.isSupported || (recorder.isRecording && !isCurrentRecording)}
                          className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
                            isCurrentRecording ? 'bg-red-500 hover:bg-red-600 text-white' : 'gradient-primary text-white hover:opacity-90 disabled:opacity-40'
                          }`}
                        >
                          {isCurrentRecording ? <Square className="w-6 h-6" /> : <Mic className="w-7 h-7" />}
                        </button>
                      </div>

                      {isCurrentRecording && (
                        <>
                          <p className="text-xl font-mono font-bold text-[var(--text-primary)] mb-2">{formatTime(recorder.duration)}</p>
                          {/* Live audio-level waveform */}
                          <div className="flex items-center justify-center gap-[2px] h-8 mb-2">
                            {Array.from({ length: 24 }).map((_, i) => {
                              const phase = Math.sin((Date.now() / 100 + i) * 0.4);
                              const h = 4 + Math.abs(phase) * recorder.level * 28 + recorder.level * 6;
                              return <div key={i} className="w-1 rounded-full bg-red-400 transition-all duration-75" style={{ height: `${Math.max(4, h)}px` }} />;
                            })}
                          </div>
                          <p className="text-xs text-[var(--text-muted)]">Recording... tap to stop</p>
                        </>
                      )}

                      {!isCurrentRecording && !myRec && (
                        <p className="text-xs text-[var(--text-muted)]">
                          {recorder.isSupported ? '마이크 버튼을 눌러 답변을 녹음하세요' : '이 브라우저는 녹음을 지원하지 않아요'}
                        </p>
                      )}

                      {!isCurrentRecording && myRec && (
                        <div className="mt-2 flex flex-col items-center gap-3">
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                            <CheckCircle2 size={12} />
                            녹음 완료 · {formatTime(myRec.duration)}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handlePlayRecording(recKey)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition-all text-xs font-medium border border-indigo-500/20"
                            >
                              {isCurrentPlaying ? <><Pause size={12} /> 일시정지</> : <><Play size={12} /> 내 녹음 듣기</>}
                            </button>
                            <button
                              onClick={() => handleStartRecording(qIdx)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 text-zinc-300 hover:bg-white/10 transition-all text-xs font-medium border border-white/10"
                            >
                              <RotateCcw size={12} /> 다시 녹음
                            </button>
                            <button
                              onClick={() => handleDeleteRecording(recKey)}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 text-red-300 hover:bg-red-500/20 transition-all text-xs font-medium border border-red-500/20"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sample Answer */}
                    <div className="bg-[var(--bg-secondary)] rounded-xl p-4 mt-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Headphones className="w-4 h-4 text-indigo-400" />
                          <span className="text-sm font-medium text-[var(--text-primary)]">Sample Answer</span>
                        </div>
                        <div className="flex gap-1">
                          {(['IM', 'IH', 'AL'] as AnswerLevel[]).map((level) => (
                            <button
                              key={level}
                              onClick={() => setSampleLevel(level)}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                                sampleLevel === level ? 'gradient-primary text-white' : 'text-[var(--text-muted)] hover:bg-[var(--bg-card)]'
                              }`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">{sampleAnswer}</p>
                      <button
                        onClick={() => isSpeaking ? stopTTS() : speak(sampleAnswer, 0.9)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-indigo-300 hover:bg-indigo-500/10 border border-indigo-500/20 bg-indigo-500/5 transition-all"
                      >
                        {isSpeaking ? <><Pause className="w-3.5 h-3.5" /> 정지</> : <><Volume2 className="w-3.5 h-3.5" /> 샘플 답변 듣기</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <button onClick={() => navigateTopic(-1)} disabled={topicIdx <= 0} className="flex items-center gap-1 px-4 py-2 rounded-xl border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <ChevronLeft className="w-4 h-4" />
            Previous Topic
          </button>
          <button onClick={() => navigateTopic(1)} disabled={topicIdx >= filteredTopics.length - 1} className="flex items-center gap-1 px-4 py-2 rounded-xl border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            Next Topic
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
