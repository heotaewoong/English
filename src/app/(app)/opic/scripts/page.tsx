'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  FileText, Play, Save, Pencil, Trash2, Clock, ChevronLeft,
  Copy, Eye, Mic, Square, LetterText, BookOpen, Plus, Sparkles,
  ArrowRight, CheckCircle2, Upload, X, Volume2, VolumeX,
  FolderOpen, AlertCircle, Loader2,
} from 'lucide-react';
import { topics, opicExpressions } from '@/data/opic';
import { useTTS, useSpeechRecognition } from '@/hooks/useSpeech';

/* ─── Constants ───────────────────────────────────────────────────── */
const SCRIPTS_KEY = 'neuroeng_opic_scripts_v1';

/* ─── Types ───────────────────────────────────────────────────────── */
interface SavedScript {
  id: string;
  title: string;
  topicId: string;
  topicTitle: string;
  content: string;
  lastEdited: string;
  wordCount: number;
  isImported?: boolean;
}

/* ─── Template structure ──────────────────────────────────────────── */
const templateStructure = (topicTitle: string) =>
  `[Introduction]\nWell, let me tell you about ${topicTitle.toLowerCase()}. \n\n[Main Point 1]\nFirst of all, I'd like to mention that \n\n[Example]\nFor instance, I remember one time when \n\n[Main Point 2]\nAnother thing worth mentioning is \n\n[Conclusion]\nAll in all, I would say that `;

/* ─── File parser ─────────────────────────────────────────────────── */
function parseImportedContent(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  // Already has [Section] markers → keep as-is
  if (/^\[.+?\]/m.test(trimmed)) return trimmed;

  // Has Markdown ## headers → convert
  if (/^##\s+/m.test(trimmed)) {
    return trimmed.replace(/^##\s+(.+)$/gm, '[$1]').trim();
  }

  // Split by double newlines into paragraphs
  const paragraphs = trimmed.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length === 0) return trimmed;
  if (paragraphs.length === 1) return `[Introduction]\n${trimmed}`;

  const labels = ['Introduction', 'Main Point 1', 'Example', 'Main Point 2', 'Conclusion'];
  return paragraphs
    .map((p, i) => `[${labels[Math.min(i, labels.length - 1)]}]\n${p}`)
    .join('\n\n');
}

/* ─── Phrase group config ─────────────────────────────────────────── */
const phraseGroups = [
  { label: 'Opening', purposeIdx: 0 },
  { label: 'Transitions', purposeIdx: 2 },
  { label: 'Examples', purposeIdx: 1 },
  { label: 'Opinions', purposeIdx: 3 },
  { label: 'Comparing', purposeIdx: 4 },
  { label: 'Past', purposeIdx: 5 },
  { label: 'Closing', purposeIdx: 6 },
  { label: 'Fillers', purposeIdx: 7 },
];

/* ═══════════════════════════════════════════════════════════════════ */
/*  Main Component                                                     */
/* ═══════════════════════════════════════════════════════════════════ */

export default function ScriptsPage() {
  /* ── State ── */
  const [savedScripts, setSavedScripts] = useState<SavedScript[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [editingScriptId, setEditingScriptId] = useState<string | null>(null);
  const [scriptContent, setScriptContent] = useState('');
  const [scriptTitle, setScriptTitle] = useState('');
  const [activePhrase, setActivePhrase] = useState(0);
  const [isPracticing, setIsPracticing] = useState(false);
  const [copiedPhrase, setCopiedPhrase] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [practiceSpeaking, setPracticeSpeaking] = useState(false);

  /* ── AI Script Gen State ── */
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiKeywords, setAiKeywords] = useState('');
  const [targetGrade, setTargetGrade] = useState('IH');
  const [showAiGen, setShowAiGen] = useState(false);

  /* ── Refs ── */
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Speech hooks ── */
  const { speak, stop: stopTTS, isSpeaking } = useTTS();
  const { isListening, isSupported: sttSupported, toggleListening, stopListening } =
    useSpeechRecognition(() => {});

  /* ── Clear practiceSpeaking when TTS ends ── */
  useEffect(() => { if (!isSpeaking) setPracticeSpeaking(false); }, [isSpeaking]);

  /* ── Load from localStorage ── */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SCRIPTS_KEY);
      if (stored) {
        setSavedScripts(JSON.parse(stored));
      } else {
        // Default sample scripts
        setSavedScripts([
          {
            id: 'saved-1',
            title: 'My Self-Introduction',
            topicId: 'topic-1',
            topicTitle: 'Tell Me About Yourself',
            content: `[Introduction]\nWell, let me tell you about myself. My name is Minjun and I'm a software developer living in Seoul.\n\n[Main Point 1]\nFirst of all, I'd like to mention that I've been working in the tech industry for about five years. I specialize in web development and really enjoy creating user-friendly applications.\n\n[Example]\nFor instance, I recently led a project to redesign our company's main product, which was a challenging but incredibly rewarding experience.\n\n[Main Point 2]\nAnother thing worth mentioning is my passion for continuous learning. Outside of work, I enjoy watching tech talks and taking online courses.\n\n[Conclusion]\nAll in all, I would say that I'm a curious and driven person who loves both technology and personal growth.`,
            lastEdited: '2026-04-10',
            wordCount: 112,
          },
        ]);
      }
    } catch {
      console.error('Failed to load scripts');
    }
  }, []);

  /* ── Save to localStorage on change (runs after mount, not on initial load) ── */
  const [scriptsMounted, setScriptsMounted] = useState(false);
  useEffect(() => { setScriptsMounted(true); }, []);
  useEffect(() => {
    if (!scriptsMounted) return; // skip the initial render before mount
    try {
      localStorage.setItem(SCRIPTS_KEY, JSON.stringify(savedScripts));
    } catch {
      console.error('Failed to save scripts');
    }
  }, [savedScripts, scriptsMounted]);

  /* ── Derived ── */
  const selectedTopic = topics.find((t) => t.id === selectedTopicId);
  const wordCount = scriptContent.trim().split(/\s+/).filter(Boolean).length;
  const estimatedMinutes = Math.round((wordCount / 130) * 10) / 10;

  /* ── File import ── */
  const processFile = useCallback((file: File) => {
    setImportError(null);
    setImportSuccess(null);

    const allowedTypes = ['text/plain', 'text/markdown', ''];
    const allowedExts = /\.(txt|md|text|rtf)$/i;
    if (!allowedExts.test(file.name) && !allowedTypes.includes(file.type)) {
      setImportError('지원하지 않는 파일 형식입니다. .txt 또는 .md 파일을 사용해주세요.');
      return;
    }
    if (file.size > 500_000) {
      setImportError('파일이 너무 큽니다 (최대 500KB).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const raw = e.target?.result as string;
      if (!raw?.trim()) {
        setImportError('파일이 비어 있습니다.');
        return;
      }
      const parsed = parseImportedContent(raw);
      const title = file.name.replace(/\.(txt|md|text|rtf)$/i, '').replace(/[-_]/g, ' ');
      setScriptTitle(title || 'Imported Script');
      setScriptContent(parsed);
      setSelectedTopicId('imported');
      setEditingScriptId(null);
      setIsPracticing(false);
      setImportSuccess(`"${file.name}" 파일을 성공적으로 불러왔습니다!`);
    };
    reader.onerror = () => setImportError('파일을 읽는 중 오류가 발생했습니다.');
    reader.readAsText(file, 'UTF-8');
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  /* ── Script actions ── */
  const handleSelectTemplate = (topicId: string) => {
    const topic = topics.find((t) => t.id === topicId);
    if (!topic) return;
    setSelectedTopicId(topicId);
    setEditingScriptId(null);
    setScriptTitle(`My ${topic.title} Script`);
    setScriptContent(templateStructure(topic.title));
    setIsPracticing(false);
  };

  const handleEditScript = (script: SavedScript) => {
    setEditingScriptId(script.id);
    setSelectedTopicId(script.topicId || 'imported');
    setScriptTitle(script.title);
    setScriptContent(script.content);
    setIsPracticing(false);
  };

  const handleSave = () => {
    const wc = scriptContent.trim().split(/\s+/).filter(Boolean).length;
    const today = new Date().toISOString().split('T')[0];
    const topicTitle = selectedTopic?.title || (selectedTopicId === 'imported' ? 'Imported Script' : '');

    if (editingScriptId) {
      setSavedScripts((prev) =>
        prev.map((s) =>
          s.id === editingScriptId
            ? { ...s, title: scriptTitle, content: scriptContent, wordCount: wc, lastEdited: today }
            : s
        )
      );
    } else {
      const newScript: SavedScript = {
        id: `saved-${Date.now()}`,
        title: scriptTitle,
        topicId: selectedTopicId || '',
        topicTitle,
        content: scriptContent,
        lastEdited: today,
        wordCount: wc,
        isImported: selectedTopicId === 'imported',
      };
      setSavedScripts((prev) => [newScript, ...prev]);
      setEditingScriptId(newScript.id);
    }
  };

  const handleDelete = (id: string) => {
    setSavedScripts((prev) => prev.filter((s) => s.id !== id));
    if (editingScriptId === id) {
      setEditingScriptId(null);
      setSelectedTopicId(null);
    }
  };

  const handleCopyPhrase = (phrase: string) => {
    navigator.clipboard?.writeText(phrase);
    setCopiedPhrase(phrase);
    setTimeout(() => setCopiedPhrase(null), 1500);
  };

  const handleBack = () => {
    stopTTS();
    stopListening();
    setSelectedTopicId(null);
    setEditingScriptId(null);
    setIsPracticing(false);
    setPracticeSpeaking(false);
  };

  const handleSpeakScript = () => {
    if (practiceSpeaking) {
      stopTTS();
      setPracticeSpeaking(false);
    } else {
      speak(scriptContent, 0.85);
      setPracticeSpeaking(true);
    }
  };

  /* ── AI Script Generation ── */
  const handleGenerateAIScript = async () => {
    if (!aiKeywords.trim()) {
      setImportError('스크립트의 주제나 키워드를 입력해주세요.');
      return;
    }

    setIsGenerating(true);
    setImportError(null);
    setImportSuccess(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'script_gen',
          difficulty: targetGrade,
          context: aiKeywords,
          messages: [{ role: 'user', content: `Generate an OPIc script about: ${aiKeywords}` }],
        }),
      });

      if (!response.ok) throw new Error('AI 스크립트 생성에 실패했습니다.');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('응답 스트림을 읽을 수 없습니다.');

      let generatedContent = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        generatedContent += decoder.decode(value);
      }

      setScriptTitle(`${aiKeywords.slice(0, 15)} (AI)`);
      setScriptContent(generatedContent);
      setSelectedTopicId('ai-generated');
      setEditingScriptId(null);
      setIsPracticing(false);
      setImportSuccess('AI가 멋진 스크립트를 생성했습니다!');
      setShowAiGen(false);
      setAiKeywords('');
    } catch (err) {
      setImportError(err instanceof Error ? err.message : '오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  /* ══════════════════════════════════════════════════════════════════
     VIEW: Template Selection / Main View
  ══════════════════════════════════════════════════════════════════ */
  if (!selectedTopicId) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          {/* Header */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-400 text-sm font-medium mb-4">
              <FileText className="w-4 h-4" />
              Script Builder
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-2">
              OPIc Script Builder
            </h1>
            <p className="text-[var(--text-secondary)] text-lg">
              내 스크립트를 파일로 가져오거나, 템플릿으로 새로 작성하세요
            </p>
          </div>

          {/* ── AI Script Generator Zone ── */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-400" />
                AI 맞춤 스크립트 생성
              </h2>
              <button
                onClick={() => setShowAiGen(!showAiGen)}
                className="text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {showAiGen ? '접기' : '자세히 보기'}
              </button>
            </div>

            <div className={`rounded-2xl border transition-all overflow-hidden ${
              showAiGen ? 'bg-gradient-to-br from-indigo-500/5 to-violet-500/5 border-indigo-500/20 p-6' : 'bg-[var(--bg-card)] border-[var(--border-color)] p-4'
            }`}>
              {!showAiGen ? (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[var(--text-muted)]">나의 경험과 키워드를 입력하면 AI가 완벽한 OPIc 스크립트를 만들어 드립니다.</p>
                  <button
                    onClick={() => setShowAiGen(true)}
                    className="px-4 py-2 rounded-xl bg-indigo-500/15 text-indigo-400 text-sm font-medium hover:bg-indigo-500/25 transition-all"
                  >
                    시작하기
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                      주제 또는 핵심 키워드 (예: "공원 산책, 강아지, 주말 오후")
                    </label>
                    <textarea
                      value={aiKeywords}
                      onChange={(e) => setAiKeywords(e.target.value)}
                      placeholder="스크립트에 포함하고 싶은 경험이나 키워드를 간단히 입력하세요..."
                      className="w-full h-24 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-4 text-sm text-[var(--text-primary)] focus:outline-none focus:border-indigo-500/50 resize-none"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                        목표 등급
                      </label>
                      <div className="flex gap-2">
                        {['IM', 'IH', 'AL'].map((grade) => (
                          <button
                            key={grade}
                            onClick={() => setTargetGrade(grade)}
                            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                              targetGrade === grade
                                ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/20'
                                : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] border-[var(--border-color)] hover:border-indigo-500/30'
                            }`}
                          >
                            {grade}
                          </button>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={handleGenerateAIScript}
                      disabled={isGenerating || !aiKeywords.trim()}
                      className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          생성 중...
                        </>
                      ) : (
                        <>
                          <Sparkles size={16} />
                          생성하기
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── File Import Zone ── */}
          <div className="mb-10">
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-400" />
              내 스크립트 파일 가져오기
            </h2>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`relative rounded-2xl border-2 border-dashed transition-all p-8 text-center cursor-pointer ${
                isDragOver
                  ? 'border-indigo-500 bg-indigo-500/10'
                  : 'border-[var(--border-color)] hover:border-indigo-500/50 hover:bg-indigo-500/5'
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.text,.rtf"
                className="hidden"
                onChange={handleFileInput}
              />
              <div className="flex flex-col items-center gap-3">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                  isDragOver ? 'bg-indigo-500/20' : 'bg-[var(--bg-secondary)]'
                }`}>
                  <FolderOpen size={26} className={isDragOver ? 'text-indigo-400' : 'text-[var(--text-muted)]'} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    파일을 여기로 드래그하거나 클릭하여 선택
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    지원 형식: .txt · .md · .rtf (최대 500KB)
                  </p>
                </div>
                <button
                  className="px-4 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-sm font-medium hover:bg-indigo-500/25 transition-all flex items-center gap-2"
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                >
                  <Upload size={14} />
                  파일 선택
                </button>
              </div>
            </div>

            {/* Error/Success messages */}
            {importError && (
              <div className="mt-3 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle size={15} />
                {importError}
                <button className="ml-auto" onClick={() => setImportError(null)}><X size={14} /></button>
              </div>
            )}
            {importSuccess && (
              <div className="mt-3 flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                <CheckCircle2 size={15} />
                {importSuccess}
                <button className="ml-auto" onClick={() => setImportSuccess(null)}><X size={14} /></button>
              </div>
            )}

            {/* Format guide */}
            <div className="mt-3 p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
              <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">💡 파일 형식 가이드</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[var(--text-muted)]">
                <div>
                  <p className="font-medium text-[var(--text-secondary)] mb-1">권장 형식 (자동 섹션 인식):</p>
                  <pre className="bg-[var(--bg-secondary)] rounded-lg p-2 text-emerald-400 text-[10px] leading-relaxed">{`[Introduction]
Well, let me tell you...

[Main Point 1]
First of all...

[Example]
For instance...

[Conclusion]
All in all...`}</pre>
                </div>
                <div>
                  <p className="font-medium text-[var(--text-secondary)] mb-1">일반 텍스트도 OK:</p>
                  <p className="leading-relaxed">섹션 표시 없이 일반 텍스트를 붙여 넣어도 자동으로 섹션을 분석해서 정리해 드립니다.</p>
                  <p className="mt-2">Markdown ## 헤더도 자동 변환됩니다.</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── My Scripts Section ── */}
          {savedScripts.length > 0 && (
            <div className="mb-10">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-400" />
                내 스크립트 ({savedScripts.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {savedScripts.map((script) => (
                  <div
                    key={script.id}
                    className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-5 hover:border-indigo-500/30 transition-all"
                  >
                    <div className="flex items-start gap-2 mb-1">
                      {script.isImported && (
                        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mt-0.5">
                          IMPORTED
                        </span>
                      )}
                      <h3 className="font-semibold text-[var(--text-primary)] truncate">{script.title}</h3>
                    </div>
                    <p className="text-sm text-[var(--text-muted)] mb-3">{script.topicTitle || '내 스크립트'}</p>
                    <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mb-4">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{script.lastEdited}</span>
                      <span className="flex items-center gap-1"><LetterText className="w-3 h-3" />{script.wordCount} words</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditScript(script)}
                        className="flex-1 py-2 rounded-lg text-xs font-medium bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90 transition-all flex items-center justify-center gap-1"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
                      <button
                        onClick={() => { handleEditScript(script); setIsPracticing(true); }}
                        className="flex-1 py-2 rounded-lg text-xs font-medium border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 transition-colors flex items-center justify-center gap-1"
                      >
                        <Play className="w-3 h-3" />
                        Practice
                      </button>
                      <button
                        onClick={() => handleDelete(script.id)}
                        className="py-2 px-3 rounded-lg text-xs text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Template Selection ── */}
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" />
              템플릿으로 새 스크립트 작성
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {topics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => handleSelectTemplate(topic.id)}
                  className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-4 text-left hover:border-indigo-500/40 hover:shadow-sm transition-all group"
                >
                  <p className="text-xs text-[var(--text-muted)] mb-1">{topic.category}</p>
                  <p className="text-sm font-medium text-[var(--text-primary)] mb-2 group-hover:text-indigo-400 transition-colors">
                    {topic.title}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-3">
                    {topic.questions[0]}
                  </p>
                  <span className="inline-flex items-center gap-1 text-xs text-indigo-400 font-medium">
                    Use Template
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════
     VIEW: Script Editor
  ══════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Back */}
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-indigo-400 transition-colors mb-6"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to scripts
        </button>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Main Editor Area ── */}
          <div className="flex-1 min-w-0">
            {/* Topic / Import banner */}
            {selectedTopicId === 'imported' ? (
              <div className="bg-emerald-500/10 rounded-xl border border-emerald-500/20 p-4 mb-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Upload size={15} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-400">파일에서 가져온 스크립트</p>
                  <p className="text-xs text-emerald-400/70 mt-0.5">내용을 수정하고 저장하면 내 스크립트 목록에 추가됩니다.</p>
                </div>
              </div>
            ) : selectedTopic ? (
              <div className="bg-indigo-500/10 rounded-xl border border-indigo-500/20 p-4 mb-4">
                <p className="text-xs text-indigo-400 font-medium mb-1">{selectedTopic.category}</p>
                <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">{selectedTopic.title}</p>
                <p className="text-sm text-[var(--text-secondary)]">{selectedTopic.questions[0]}</p>
              </div>
            ) : null}

            {/* Title */}
            <input
              type="text"
              value={scriptTitle}
              onChange={(e) => setScriptTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] font-semibold text-lg mb-4 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
              placeholder="Script title..."
            />

            {/* Section badges */}
            <div className="flex flex-wrap gap-2 mb-3">
              {['Introduction', 'Main Point 1', 'Example', 'Main Point 2', 'Conclusion'].map((part) => (
                <span
                  key={part}
                  className="px-2.5 py-1 rounded-lg bg-[var(--bg-secondary)] text-xs font-medium text-[var(--text-muted)]"
                >
                  [{part}]
                </span>
              ))}
            </div>

            {/* Editor / Practice Mode */}
            {!isPracticing ? (
              <textarea
                value={scriptContent}
                onChange={(e) => setScriptContent(e.target.value)}
                className="w-full h-80 px-4 py-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] text-sm leading-relaxed resize-none focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                placeholder="Start writing your script here..."
              />
            ) : (
              /* ── Practice Mode ── */
              <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6">
                {/* Script display */}
                <div className="bg-[var(--bg-secondary)] rounded-lg p-4 mb-6 max-h-48 overflow-y-auto">
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">
                    {scriptContent}
                  </p>
                </div>

                {/* Controls */}
                <div className="flex flex-col items-center gap-4">
                  {/* TTS listen button */}
                  <button
                    onClick={handleSpeakScript}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                      practiceSpeaking
                        ? 'bg-violet-500/10 border-violet-500/30 text-violet-400'
                        : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:border-indigo-500/30 hover:text-indigo-400'
                    }`}
                  >
                    {practiceSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    {practiceSpeaking ? 'Stop Reading' : 'Listen to Script (AI Voice)'}
                  </button>

                  {/* STT record button */}
                  {sttSupported && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative inline-flex items-center justify-center">
                        {isListening && (
                          <div className="absolute w-20 h-20 rounded-full bg-red-500/20 animate-ping" />
                        )}
                        <button
                          onClick={toggleListening}
                          className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
                            isListening
                              ? 'bg-red-500 hover:bg-red-600 text-white'
                              : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white hover:opacity-90'
                          }`}
                        >
                          {isListening ? <Square className="w-6 h-6" /> : <Mic className="w-7 h-7" />}
                        </button>
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">
                        {isListening ? '🎤 Speaking... tap to stop' : 'Tap to practice aloud'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Stats & Actions */}
            <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
              <div className="flex items-center gap-4 text-sm text-[var(--text-muted)]">
                <span className="flex items-center gap-1"><LetterText className="w-4 h-4" />{wordCount} words</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" />~{estimatedMinutes} min</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsPracticing(!isPracticing)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1.5 transition-all ${
                    isPracticing
                      ? 'border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                      : 'border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10'
                  }`}
                >
                  {isPracticing ? <><Eye className="w-4 h-4" /> Edit</> : <><Mic className="w-4 h-4" /> Practice</>}
                </button>
                <button
                  onClick={handleSave}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-medium hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Save className="w-4 h-4" />
                  Save Script
                </button>
              </div>
            </div>
          </div>

          {/* ── Helpful Phrases Sidebar ── */}
          <div className="w-full lg:w-80 shrink-0">
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden sticky top-4">
              <div className="px-5 py-4 border-b border-[var(--border-color)]">
                <h3 className="font-semibold text-[var(--text-primary)] text-sm">Helpful Phrases</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">클릭하면 클립보드에 복사돼요</p>
              </div>

              {/* Tab Navigation */}
              <div className="flex flex-wrap gap-1 px-3 pt-3">
                {phraseGroups.map((group, i) => (
                  <button
                    key={group.label}
                    onClick={() => setActivePhrase(i)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      activePhrase === i
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white'
                        : 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]'
                    }`}
                  >
                    {group.label}
                  </button>
                ))}
              </div>

              {/* Phrases */}
              <div className="p-3 max-h-96 overflow-y-auto">
                {opicExpressions[phraseGroups[activePhrase]?.purposeIdx]?.phrases.map((phrase, i) => (
                  <button
                    key={i}
                    onClick={() => handleCopyPhrase(phrase.english)}
                    className="w-full text-left p-2.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors group mb-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-indigo-400 group-hover:text-indigo-300">
                        {phrase.english}
                      </p>
                      {copiedPhrase === phrase.english ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 shrink-0 mt-0.5" />
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{phrase.korean}</p>
                  </button>
                )) || null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
