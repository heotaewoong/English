'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Brain, Plus, Upload, RotateCcw, Check, X, Clock,
  ChevronDown, ChevronUp, Search, Filter, Trash2,
  BookOpen, Zap, Calendar, TrendingUp, Star, Eye,
  EyeOff, FileSpreadsheet, Download, ArrowRight,
  CheckCircle2, AlertCircle, RefreshCw,
} from 'lucide-react';
// xlsx is loaded dynamically at runtime — see handleFile()

/* ─── Types ─────────────────────────────────────────────────────── */
type ItemType = 'word' | 'expression' | 'sentence';
type ReviewResult = 'know' | 'skip' | 'again';

interface VocabItem {
  id: string;
  type: ItemType;
  english: string;
  korean: string;
  example: string;
  addedAt: string;       // ISO date string
  nextReview: string;    // ISO date string
  stage: number;         // 0-5 (5 = mastered)
  reviewCount: number;
  known: boolean;
  skipped: boolean;
}

/* ─── Spaced repetition intervals (days) ────────────────────────── */
const INTERVALS = [1, 3, 7, 14, 28];
const STAGE_LABELS = ['New', '1d', '3d', '7d', '14d', '28d', '✓'];

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

function excelDateToISO(serial: number): string {
  // Excel serial date to JS Date
  const utc = new Date((serial - 25569) * 86400 * 1000);
  return utc.toISOString().split('T')[0];
}

/* ─── Pure-JS CSV parser (RFC 4180 compliant) ───────────────────── */
function parseCSV(text: string): (string | number | null)[][] {
  const lines = text.split(/\r?\n/);
  return lines
    .filter(l => l.trim())
    .map(line => {
      const fields: (string | number | null)[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"'; // escaped double-quote
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === ',' && !inQuotes) {
          const v = current.trim();
          const n = v !== '' ? Number(v) : NaN;
          fields.push(!isNaN(n) && v !== '' ? n : v || null);
          current = '';
        } else {
          current += ch;
        }
      }
      const v = current.trim();
      const n = v !== '' ? Number(v) : NaN;
      fields.push(!isNaN(n) && v !== '' ? n : v || null);
      return fields;
    });
}

/* ─── LocalStorage helpers ───────────────────────────────────────── */
const STORAGE_KEY = 'fluentpath_vocab_v2';

function loadItems(): VocabItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveItems(items: VocabItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

/* ─── Review result handler ──────────────────────────────────────── */
function applyReview(item: VocabItem, result: ReviewResult): VocabItem {
  const todayStr = today();
  if (result === 'know') {
    const newStage = Math.min(item.stage + 1, INTERVALS.length);
    return {
      ...item,
      stage: newStage,
      reviewCount: item.reviewCount + 1,
      known: newStage >= INTERVALS.length,
      nextReview: newStage >= INTERVALS.length
        ? addDays(new Date(todayStr), 999)
        : addDays(new Date(todayStr), INTERVALS[newStage - 1] ?? 28),
    };
  } else if (result === 'again') {
    return {
      ...item,
      stage: Math.max(0, item.stage - 1),
      reviewCount: item.reviewCount + 1,
      nextReview: addDays(new Date(todayStr), 1),
    };
  } else {
    // skip — postpone 14 days, mark skipped
    return { ...item, skipped: true, nextReview: addDays(new Date(todayStr), 14) };
  }
}

/* ─── Tab types ──────────────────────────────────────────────────── */
type Tab = 'dashboard' | 'review' | 'add' | 'list';

/* ═══════════════════════════════════════════════════════════════════ */
export default function MemorizePage() {
  const [items, setItems] = useState<VocabItem[]>([]);
  const [tab, setTab] = useState<Tab>('dashboard');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setItems(loadItems());
    setMounted(true);
  }, []);

  const updateItems = (updated: VocabItem[]) => {
    setItems(updated);
    saveItems(updated);
  };

  const todayStr = today();
  const dueItems = items.filter(i => !i.known && !i.skipped && i.nextReview <= todayStr);
  const masteredCount = items.filter(i => i.known).length;
  const skippedCount = items.filter(i => i.skipped).length;

  if (!mounted) return <div className="animate-pulse h-40 rounded-2xl bg-white/[0.04]" />;

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Brain size={22} className="text-indigo-400" />
            단어 암기 대시보드
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">간격 반복 학습 · 1 / 3 / 7 / 14 / 28일</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <span className="px-2 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]">
            총 {items.length}개
          </span>
          {dueItems.length > 0 && (
            <span className="px-2 py-1 rounded-lg bg-red-500/15 border border-red-500/20 text-red-400 font-semibold">
              오늘 복습 {dueItems.length}개
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)]">
        {([
          { id: 'dashboard', label: '대시보드', icon: TrendingUp },
          { id: 'review', label: `복습 ${dueItems.length > 0 ? `(${dueItems.length})` : ''}`, icon: RotateCcw },
          { id: 'add', label: '추가/가져오기', icon: Plus },
          { id: 'list', label: '전체 목록', icon: BookOpen },
        ] as { id: Tab; label: string; icon: typeof Plus }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
              tab === t.id
                ? 'bg-indigo-500 text-white shadow'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-white/5'
            }`}
          >
            <t.icon size={13} />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'dashboard' && (
        <DashboardTab items={items} dueItems={dueItems} masteredCount={masteredCount} skippedCount={skippedCount} onGoReview={() => setTab('review')} />
      )}
      {tab === 'review' && (
        <ReviewTab dueItems={dueItems} onResult={(item, result) => {
          const updated = items.map(i => i.id === item.id ? applyReview(i, result) : i);
          updateItems(updated);
        }} />
      )}
      {tab === 'add' && (
        <AddTab onAdd={(item) => {
          const updated = [item, ...items];
          updateItems(updated);
        }} onImport={(imported) => {
          const existing = new Set(items.map(i => i.english.toLowerCase().trim()));
          const newItems = imported.filter(i => !existing.has(i.english.toLowerCase().trim()));
          updateItems([...newItems, ...items]);
          alert(`✅ ${newItems.length}개 항목을 가져왔습니다! (중복 ${imported.length - newItems.length}개 제외)`);
        }} />
      )}
      {tab === 'list' && (
        <ListTab items={items} onDelete={(id) => {
          updateItems(items.filter(i => i.id !== id));
        }} onReset={(id) => {
          updateItems(items.map(i => i.id === id ? {
            ...i, stage: 0, known: false, skipped: false,
            nextReview: today(), reviewCount: 0,
          } : i));
        }} />
      )}
    </div>
  );
}

/* ─── Dashboard Tab ─────────────────────────────────────────────── */
function DashboardTab({ items, dueItems, masteredCount, skippedCount, onGoReview }: {
  items: VocabItem[];
  dueItems: VocabItem[];
  masteredCount: number;
  skippedCount: number;
  onGoReview: () => void;
}) {
  const todayStr = today();
  const todayAdded = items.filter(i => i.addedAt === todayStr).length;

  // Upcoming reviews
  const upcomingDays = [1, 3, 7].map(d => {
    const targetDate = addDays(new Date(), d);
    return {
      label: `+${d}일`,
      count: items.filter(i => !i.known && i.nextReview === targetDate).length,
    };
  });

  // Stage distribution
  const stageCounts = INTERVALS.map((_, idx) =>
    items.filter(i => i.stage === idx + 1 && !i.known).length
  );

  return (
    <div className="space-y-4">
      {/* Today's review CTA */}
      {dueItems.length > 0 ? (
        <button
          onClick={onGoReview}
          className="w-full flex items-center justify-between px-5 py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all"
        >
          <div className="text-left">
            <p className="text-lg font-bold">오늘 복습할 단어 {dueItems.length}개</p>
            <p className="text-sm text-white/70 mt-0.5">지금 바로 복습을 시작하세요!</p>
          </div>
          <div className="flex items-center gap-2">
            <RotateCcw size={20} />
            <ArrowRight size={18} />
          </div>
        </button>
      ) : (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 size={22} className="text-emerald-400 shrink-0" />
          <div>
            <p className="font-semibold text-emerald-300">오늘 복습 완료! 🎉</p>
            <p className="text-sm text-emerald-400/70">모든 단어를 복습했어요.</p>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '전체', value: items.length, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20', icon: BookOpen },
          { label: '완전 암기', value: masteredCount, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: Star },
          { label: '오늘 추가', value: todayAdded, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: Plus },
          { label: '보류', value: skippedCount, color: 'text-zinc-400', bg: 'bg-zinc-500/10 border-zinc-500/20', icon: EyeOff },
        ].map(s => (
          <div key={s.label} className={`p-4 rounded-xl border ${s.bg} flex items-center gap-3`}>
            <s.icon size={18} className={s.color} />
            <div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-[var(--text-muted)]">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Stage progress */}
      <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
        <p className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <Zap size={14} className="text-amber-400" /> 단계별 분포
        </p>
        <div className="flex gap-2">
          {INTERVALS.map((interval, idx) => {
            const count = stageCounts[idx];
            const label = `${interval}일 후`;
            return (
              <div key={interval} className="flex-1 text-center">
                <div className="text-lg font-bold text-[var(--text-primary)]">{count}</div>
                <div className="text-[10px] text-[var(--text-muted)]">{label}</div>
                <div className="mt-1 h-1.5 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                    style={{ width: items.length > 0 ? `${(count / items.length) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            );
          })}
          <div className="flex-1 text-center">
            <div className="text-lg font-bold text-emerald-400">{masteredCount}</div>
            <div className="text-[10px] text-[var(--text-muted)]">완전암기</div>
            <div className="mt-1 h-1.5 rounded-full bg-emerald-500/20 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: items.length > 0 ? `${(masteredCount / items.length) * 100}%` : '0%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming */}
      <div className="p-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)]">
        <p className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <Calendar size={14} className="text-indigo-400" /> 예정된 복습
        </p>
        <div className="flex gap-3">
          {upcomingDays.map(d => (
            <div key={d.label} className="flex-1 text-center p-3 rounded-xl bg-[var(--bg-secondary)]">
              <p className="text-xl font-bold text-[var(--text-primary)]">{d.count}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{d.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Review Tab ─────────────────────────────────────────────────── */
function ReviewTab({ dueItems, onResult }: {
  dueItems: VocabItem[];
  onResult: (item: VocabItem, result: ReviewResult) => void;
}) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(false);
  const total = dueItems.length;
  const current = dueItems[idx];

  const handleResult = (result: ReviewResult) => {
    onResult(current, result);
    setFlipped(false);
    if (idx + 1 >= total) {
      setDone(true);
    } else {
      setIdx(idx + 1);
    }
  };

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-emerald-400" />
        </div>
        <p className="text-lg font-semibold text-[var(--text-primary)]">오늘 복습할 단어가 없어요!</p>
        <p className="text-sm text-[var(--text-muted)]">새 단어를 추가하거나 내일 다시 확인하세요.</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <Star size={36} className="text-amber-400" />
        </div>
        <p className="text-2xl font-bold text-[var(--text-primary)]">복습 완료! 🎉</p>
        <p className="text-sm text-[var(--text-muted)]">{total}개 단어 복습을 마쳤습니다.</p>
        <button
          onClick={() => { setIdx(0); setFlipped(false); setDone(false); }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-all text-sm font-medium"
        >
          <RefreshCw size={14} /> 다시 복습
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-[var(--text-muted)] shrink-0">{idx + 1} / {total}</span>
        <div className="flex-1 h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-300"
            style={{ width: `${((idx) / total) * 100}%` }}
          />
        </div>
        <span className="text-xs text-indigo-400 shrink-0">
          단계 {STAGE_LABELS[current.stage]}
        </span>
      </div>

      {/* Card */}
      <div
        className="cursor-pointer min-h-52 p-7 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] flex flex-col items-center justify-center text-center gap-4 hover:border-indigo-500/30 transition-all select-none"
        onClick={() => setFlipped(!flipped)}
      >
        {!flipped ? (
          <>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {current.type === 'word' ? '단어' : current.type === 'expression' ? '표현' : '문장'}
            </span>
            <p className="text-3xl font-bold text-[var(--text-primary)]">{current.english}</p>
            {current.type === 'word' && (
              <p className="text-xs text-[var(--text-muted)]">탭해서 뜻 확인 →</p>
            )}
          </>
        ) : (
          <>
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">뜻</span>
            <p className="text-2xl font-bold text-indigo-300">{current.korean || '뜻 없음'}</p>
            {current.example && (
              <div className="mt-2 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10 max-w-sm">
                <p className="text-sm text-[var(--text-secondary)] italic">&ldquo;{current.example}&rdquo;</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => handleResult('again')}
          className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
        >
          <RotateCcw size={18} />
          <span className="text-xs font-semibold">다시 (1일 후)</span>
        </button>
        <button
          onClick={() => handleResult('know')}
          className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-all"
        >
          <Check size={18} />
          <span className="text-xs font-semibold">알아요 ✓</span>
        </button>
        <button
          onClick={() => handleResult('skip')}
          className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-zinc-500/20 bg-zinc-500/5 text-[var(--text-muted)] hover:bg-zinc-500/10 transition-all"
        >
          <EyeOff size={18} />
          <span className="text-xs font-semibold">보류 (14일)</span>
        </button>
      </div>

      <p className="text-center text-xs text-[var(--text-muted)]">카드를 탭하면 뜻을 확인할 수 있어요</p>
    </div>
  );
}

/* ─── Add Tab ────────────────────────────────────────────────────── */
function AddTab({ onAdd, onImport }: {
  onAdd: (item: VocabItem) => void;
  onImport: (items: VocabItem[]) => void;
}) {
  const [type, setType] = useState<ItemType>('sentence');
  const [english, setEnglish] = useState('');
  const [korean, setKorean] = useState('');
  const [example, setExample] = useState('');
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<VocabItem[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    if (!english.trim()) return;
    const todayStr = today();
    const item: VocabItem = {
      id: `v-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type,
      english: english.trim(),
      korean: korean.trim(),
      example: example.trim(),
      addedAt: todayStr,
      nextReview: todayStr,
      stage: 0,
      reviewCount: 0,
      known: false,
      skipped: false,
    };
    onAdd(item);
    setEnglish('');
    setKorean('');
    setExample('');
  };

  /** Convert a parsed row array into a VocabItem (shared by xlsx + CSV paths) */
  const rowToItem = (row: (string | number | null)[], idx: number, todayStr: string): VocabItem | null => {
    if (!row || !Array.isArray(row)) return null;
    // Column mapping (matches 영어 문장 암기.xlsx):
    // col 0: 번호 | col 1: 입력일 | col 2: 알아요/보류
    // col 3: 한국어 뜻 | col 4: 단어 영어 | col 7: 영어 문장
    const statusRaw = row[2]; // 1=know, 2=skip
    const korean = String(row[3] || '').trim();
    const wordEn = String(row[4] || '').trim();
    const sentence = String(row[7] || '').trim();
    const dateSerial = typeof row[1] === 'number' ? row[1] : 0;

    const english = sentence || wordEn;
    if (!english) return null;

    const addedAt = dateSerial > 40000 ? excelDateToISO(dateSerial) : todayStr;
    const isKnown = statusRaw === 1;
    const isSkipped = statusRaw === 2;

    let stage = 0;
    let nextReview = addedAt <= todayStr ? todayStr : addedAt;
    if (isKnown)  { stage = INTERVALS.length; nextReview = addDays(new Date(), 999); }
    if (isSkipped) { nextReview = addDays(new Date(), 14); }

    return {
      id: `xl-${idx}-${Date.now()}`,
      type: wordEn && !sentence ? 'word' : 'sentence',
      english,
      korean,
      example: sentence && wordEn ? sentence : '',
      addedAt,
      nextReview,
      stage,
      reviewCount: isKnown ? 1 : 0,
      known: isKnown,
      skipped: isSkipped,
    };
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);

    try {
      const isCSV = file.name.toLowerCase().endsWith('.csv');
      let rows: (string | number | null)[][] = [];

      if (isCSV) {
        // ── CSV: parse natively — no library required ────────────────
        const text = await file.text();
        rows = parseCSV(text);
      } else {
        // ── XLSX: dynamic import so the app compiles even without the package ──
        const XLSX = await import('xlsx').catch(() => null);
        if (!XLSX) {
          alert(
            'Excel 파일을 열려면 xlsx 라이브러리가 필요합니다.\n\n' +
            '방법 1: 터미널에서 "npm install xlsx" 실행 후 재시작\n' +
            '방법 2: Excel 파일을 CSV로 내보낸 후 다시 업로드'
          );
          return;
        }
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
        const sheetName = wb.SheetNames.find((n: string) => n.includes('암기')) || wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(ws, { header: 1 });
      }

      const todayStr = today();
      const imported: VocabItem[] = rows
        .slice(1) // skip header row
        .map((row, i) => rowToItem(row, i + 1, todayStr))
        .filter((item): item is VocabItem => item !== null);

      setImportPreview(imported.slice(0, 5));
      onImport(imported);
    } catch (err) {
      alert('파일을 읽을 수 없습니다. 파일 형식(.xlsx 또는 .csv)을 확인하세요.');
      console.error(err);
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="space-y-5">
      {/* Manual add */}
      <div className="p-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] space-y-4">
        <p className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Plus size={15} className="text-indigo-400" /> 새 항목 추가
        </p>

        {/* Type selector */}
        <div className="flex gap-2">
          {(['word', 'expression', 'sentence'] as ItemType[]).map(t => {
            const labels = { word: '단어', expression: '표현', sentence: '문장' };
            return (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  type === t
                    ? 'bg-indigo-500 text-white'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:bg-white/5'
                }`}
              >
                {labels[t]}
              </button>
            );
          })}
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">영어 * (단어 / 표현 / 문장)</label>
            <textarea
              value={english}
              onChange={e => setEnglish(e.target.value)}
              placeholder="예: I was wondering if you could help me."
              rows={2}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-indigo-500/40 resize-none"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">한국어 뜻</label>
            <input
              type="text"
              value={korean}
              onChange={e => setKorean(e.target.value)}
              placeholder="예: 혹시 도움을 주실 수 있는지 여쭤봐도 될까요?"
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-indigo-500/40"
            />
          </div>
          {type === 'word' && (
            <div>
              <label className="text-xs text-[var(--text-muted)] mb-1 block">예문 (선택)</label>
              <input
                type="text"
                value={example}
                onChange={e => setExample(e.target.value)}
                placeholder="예문을 입력하세요..."
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-indigo-500/40"
              />
            </div>
          )}
        </div>

        <button
          onClick={handleAdd}
          disabled={!english.trim()}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-sm font-semibold text-white disabled:opacity-40 hover:shadow-lg hover:shadow-indigo-500/25 transition-all"
        >
          추가하기
        </button>
      </div>

      {/* Excel import */}
      <div className="p-5 rounded-2xl border border-dashed border-indigo-500/30 bg-indigo-500/5 space-y-4">
        <p className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <FileSpreadsheet size={15} className="text-indigo-400" /> Excel 파일 가져오기
        </p>
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          <span className="text-indigo-400 font-medium">.xlsx</span> 또는 <span className="text-emerald-400 font-medium">.csv</span> 파일을 지원합니다.<br />
          열 구성: <code className="bg-white/5 px-1 rounded">번호 | 입력일 | 상태 | 한국어 뜻 | 단어 영어 | ... | 영어 문장</code><br />
          <span className="text-zinc-600">Excel에서 CSV로 저장하면 라이브러리 없이도 가져올 수 있습니다.</span>
        </p>

        {/* Import status */}
        {importPreview.length > 0 && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-xs font-semibold text-emerald-400 mb-2">미리보기 (처음 5개):</p>
            {importPreview.map((item, i) => (
              <p key={i} className="text-xs text-[var(--text-secondary)] truncate">
                • {item.english} {item.korean && `— ${item.korean}`}
              </p>
            ))}
          </div>
        )}

        <label className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl border ${importing ? 'border-indigo-500/40 bg-indigo-500/10' : 'border-indigo-500/30 hover:bg-indigo-500/10'} text-sm font-medium text-indigo-300 cursor-pointer transition-all`}>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFile}
            disabled={importing}
          />
          {importing ? (
            <><RefreshCw size={15} className="animate-spin" /> 가져오는 중...</>
          ) : (
            <><Upload size={15} /> .xlsx / .csv 파일 선택</>
          )}
        </label>

        <p className="text-[11px] text-[var(--text-muted)] text-center">
          중복 항목은 자동으로 제외됩니다 · 알아요(1) / 보류(2) 상태 유지
        </p>
      </div>
    </div>
  );
}

/* ─── List Tab ───────────────────────────────────────────────────── */
function ListTab({ items, onDelete, onReset }: {
  items: VocabItem[];
  onDelete: (id: string) => void;
  onReset: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'due' | 'known' | 'skipped'>('all');
  const todayStr = today();

  const filtered = items.filter(item => {
    const matchSearch = !search || item.english.toLowerCase().includes(search.toLowerCase()) || item.korean.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === 'due') return !item.known && !item.skipped && item.nextReview <= todayStr;
    if (filter === 'known') return item.known;
    if (filter === 'skipped') return item.skipped;
    return true;
  });

  return (
    <div className="space-y-3">
      {/* Search + filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="영어 또는 한국어로 검색..."
            className="w-full bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl pl-9 pr-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-indigo-500/40"
          />
        </div>
        <select
          value={filter}
          onChange={e => setFilter(e.target.value as typeof filter)}
          className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-sm text-[var(--text-secondary)] outline-none"
        >
          <option value="all">전체 ({items.length})</option>
          <option value="due">오늘 복습 ({items.filter(i => !i.known && !i.skipped && i.nextReview <= todayStr).length})</option>
          <option value="known">완전 암기 ({items.filter(i => i.known).length})</option>
          <option value="skipped">보류 ({items.filter(i => i.skipped).length})</option>
        </select>
      </div>

      {/* List */}
      <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[var(--text-muted)] text-sm">항목이 없습니다</div>
        )}
        {filtered.map(item => (
          <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] hover:border-indigo-500/20 transition-all">
            {/* Stage badge */}
            <span className={`shrink-0 mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
              item.known ? 'bg-emerald-500/20 text-emerald-400' :
              item.skipped ? 'bg-zinc-500/20 text-zinc-400' :
              item.nextReview <= todayStr ? 'bg-red-500/20 text-red-400' :
              'bg-indigo-500/10 text-indigo-400'
            }`}>
              {item.known ? '완료' : item.skipped ? '보류' : item.nextReview <= todayStr ? '복습' : STAGE_LABELS[item.stage]}
            </span>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">{item.english}</p>
              {item.korean && <p className="text-xs text-[var(--text-muted)] mt-0.5">{item.korean}</p>}
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                추가: {item.addedAt} · 다음복습: {item.known ? '완료' : item.nextReview}
              </p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => onReset(item.id)}
                title="초기화"
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-amber-400 hover:bg-amber-500/10 transition-all"
              >
                <RefreshCw size={13} />
              </button>
              <button
                onClick={() => onDelete(item.id)}
                title="삭제"
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
