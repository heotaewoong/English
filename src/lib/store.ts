'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ─── Types ───
export type Category =
  | 'Self-Development'
  | 'Motivation'
  | 'Entertainment'
  | 'V-log'
  | 'Education'
  | 'News'
  | 'Filmmaking'
  | 'Interview'
  | 'Language-Learning'
  | 'Youtube'
  | 'Business'
  | 'Economy'
  | 'Review'
  | 'Celebrities'
  | 'Soccer'
  | 'Exercise'
  | 'Technology'
  | 'Science'
  | 'Cooking'
  | 'Movie'
  | 'Travel';

export type OPIcDifficulty = 'IM' | 'IH' | 'AL';

export interface VocabularyWord {
  id: string;
  word: string;
  meaningKo: string;
  definitionEn: string;
  pronunciation?: string;
  example: string;
  audio?: string;
  source?: string;
  sourceContext?: string;
  synonyms?: string[];

  // SRS Data
  level: number; // 0-5
  nextReview: string;
  lastReview: string;
  interval: number;
  easeFactor: number;
  tags: string[];
}

export type SentenceStatus = 'new' | 'known' | 'hold';

export interface Sentence {
  id: string;
  text: string;             // English sentence
  translation: string;      // Korean translation
  status: SentenceStatus;   // 신규 / 알아요(1) / 보류(2)
  repeatCount: number;      // TTS repetition count (xlsx 'n')
  source?: string;          // 출처
  notes?: string;

  // SRS Data
  level: number;            // 0-5
  nextReview: string;
  lastReview: string;
  interval: number;
  easeFactor: number;

  createdAt: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
}

export interface MistakeEntry {
  id: string;
  type: 'vocab' | 'sentence';
  itemId: string;
  mode: string;
  question: string;
  userAnswer: string;
  correctAnswer: string;
  timestamp: string;
}

export interface StudyDay {
  date: string; // 'YYYY-MM-DD'
  reviewed: number;
  correct: number;
}

export interface DailyGoal {
  vocabTarget: number;
  sentenceTarget: number;
}

export interface DailyQuest {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  completed: boolean;
}

// ─── User State ───
interface UserState {
  name: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  streak: number;
  badges: Badge[];
  dailyQuestsCompleted: number;
  dailyQuests: DailyQuest[];
  totalPracticeMinutes: number;
  joinedDate: string;
  vocabulary: VocabularyWord[];
  sentences: Sentence[];
  mistakes: MistakeEntry[];
  studyHistory: StudyDay[];
  dailyGoal: DailyGoal;
}

// ─── Channel Filter State ───
interface ChannelFilterState {
  selectedLevel: number | null;
  selectedCategories: Category[];
  searchQuery: string;
  sortBy: 'name' | 'subscribers' | 'level';
  contentType: 'all' | 'youtube' | 'podcast';
}

// ─── OPIc State ───
interface OPIcState {
  currentTopicId: string | null;
  currentQuestionIndex: number;
  answers: Record<string, string>;
  selectedDifficulty: OPIcDifficulty;
  practiceHistory: { topicId: string; date: string; score: number }[];
}

// ─── UI State ───
interface UIState {
  sidebarOpen: boolean;
  currentPage: string;
  theme: 'light' | 'dark' | 'system';
  modalOpen: string | null;
}

// ─── Combined Store ───
interface AppStore {
  user: UserState;
  channelFilters: ChannelFilterState;
  opic: OPIcState;
  ui: UIState;

  // User actions
  setUserName: (name: string) => void;
  addXP: (amount: number) => void;
  incrementStreak: () => void;
  resetStreak: () => void;
  addBadge: (badge: Badge) => void;
  completeQuest: (questId: string) => void;
  resetDailyQuests: (quests: DailyQuest[]) => void;
  addPracticeMinutes: (minutes: number) => void;

  // Vocabulary actions
  addWord: (word: Omit<VocabularyWord, 'id' | 'level' | 'nextReview' | 'lastReview' | 'interval' | 'easeFactor' | 'tags'>) => void;
  updateWordSRS: (wordId: string, performance: number) => void;
  deleteWord: (wordId: string) => void;

  // Mistake / study-history actions
  addMistake: (entry: Omit<MistakeEntry, 'id' | 'timestamp'>) => void;
  removeMistake: (id: string) => void;
  clearMistakes: () => void;
  recordStudy: (reviewed: number, correct: number) => void;
  setDailyGoal: (goal: DailyGoal) => void;

  // Sentence actions
  addSentence: (sentence: Omit<Sentence, 'id' | 'level' | 'nextReview' | 'lastReview' | 'interval' | 'easeFactor' | 'createdAt' | 'status'> & { status?: SentenceStatus }) => void;
  addSentencesBulk: (sentences: Array<Omit<Sentence, 'id' | 'level' | 'nextReview' | 'lastReview' | 'interval' | 'easeFactor' | 'createdAt' | 'status'> & { status?: SentenceStatus }>) => number;
  updateSentenceStatus: (id: string, status: SentenceStatus) => void;
  updateSentenceSRS: (id: string, performance: number) => void;
  updateSentence: (id: string, patch: Partial<Pick<Sentence, 'text' | 'translation' | 'notes' | 'source' | 'repeatCount'>>) => void;
  deleteSentence: (id: string) => void;

  // Channel filter actions
  setSelectedLevel: (level: number | null) => void;
  toggleCategory: (category: Category) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sortBy: 'name' | 'subscribers' | 'level') => void;
  setContentType: (type: 'all' | 'youtube' | 'podcast') => void;
  clearFilters: () => void;

  // OPIc actions
  setCurrentTopic: (topicId: string | null) => void;
  setCurrentQuestionIndex: (index: number) => void;
  saveAnswer: (questionKey: string, answer: string) => void;
  setOPIcDifficulty: (difficulty: OPIcDifficulty) => void;
  addPracticeResult: (topicId: string, score: number) => void;
  clearOPIcSession: () => void;

  // UI actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setCurrentPage: (page: string) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
}

const XP_PER_LEVEL = [0, 100, 250, 500, 1000, 2000];

function calculateLevel(totalXP: number): { level: number; xpToNextLevel: number } {
  let level = 1;
  let remaining = totalXP;
  for (let i = 1; i < XP_PER_LEVEL.length; i++) {
    if (remaining >= XP_PER_LEVEL[i]) {
      remaining -= XP_PER_LEVEL[i];
      level = i + 1;
    } else {
      break;
    }
  }
  const nextLevelXP = level < XP_PER_LEVEL.length ? XP_PER_LEVEL[level] : XP_PER_LEVEL[XP_PER_LEVEL.length - 1];
  return { level: Math.min(level, 5), xpToNextLevel: nextLevelXP };
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // ─── Initial State ───
      user: {
        name: '',
        level: 1,
        xp: 0,
        xpToNextLevel: 100,
        streak: 0,
        badges: [],
        dailyQuestsCompleted: 0,
        dailyQuests: [
          { id: 'dq-1', title: 'Complete 1 OPIc Practice', description: 'Practice any OPIc topic', xpReward: 20, completed: false },
          { id: 'dq-2', title: 'Watch a Channel Video', description: 'Watch a video from your channel list', xpReward: 10, completed: false },
          { id: 'dq-3', title: 'Practice Roleplay', description: 'Complete a roleplay scenario', xpReward: 25, completed: false },
        ],
        totalPracticeMinutes: 0,
        joinedDate: new Date().toISOString(),
        vocabulary: [],
        sentences: [],
        mistakes: [],
        studyHistory: [],
        dailyGoal: { vocabTarget: 10, sentenceTarget: 5 },
      },

      channelFilters: {
        selectedLevel: null,
        selectedCategories: [],
        searchQuery: '',
        sortBy: 'name',
        contentType: 'all',
      },

      opic: {
        currentTopicId: null,
        currentQuestionIndex: 0,
        answers: {},
        selectedDifficulty: 'IM',
        practiceHistory: [],
      },

      ui: {
        sidebarOpen: true,
        currentPage: 'dashboard',
        theme: 'light',
        modalOpen: null,
      },

      // ─── User Actions ───
      setUserName: (name) =>
        set((state) => ({ user: { ...state.user, name } })),

      addXP: (amount) =>
        set((state) => {
          const newXP = state.user.xp + amount;
          const { level, xpToNextLevel } = calculateLevel(newXP);
          return {
            user: { ...state.user, xp: newXP, level, xpToNextLevel },
          };
        }),

      incrementStreak: () =>
        set((state) => ({ user: { ...state.user, streak: state.user.streak + 1 } })),

      resetStreak: () =>
        set((state) => ({ user: { ...state.user, streak: 0 } })),

      addBadge: (badge) =>
        set((state) => {
          if (state.user.badges.some((b) => b.id === badge.id)) return state;
          return { user: { ...state.user, badges: [...state.user.badges, badge] } };
        }),

      completeQuest: (questId) =>
        set((state) => {
          const quests = state.user.dailyQuests.map((q) =>
            q.id === questId ? { ...q, completed: true } : q
          );
          const completedCount = quests.filter((q) => q.completed).length;
          const quest = state.user.dailyQuests.find((q) => q.id === questId);
          const xpGain = quest && !quest.completed ? quest.xpReward : 0;
          const newXP = state.user.xp + xpGain;
          const { level, xpToNextLevel } = calculateLevel(newXP);
          return {
            user: {
              ...state.user,
              dailyQuests: quests,
              dailyQuestsCompleted: completedCount,
              xp: newXP,
              level,
              xpToNextLevel,
            },
          };
        }),

      resetDailyQuests: (quests) =>
        set((state) => ({
          user: { ...state.user, dailyQuests: quests, dailyQuestsCompleted: 0 },
        })),

      addPracticeMinutes: (minutes) =>
        set((state) => ({
          user: { ...state.user, totalPracticeMinutes: state.user.totalPracticeMinutes + minutes },
        })),

      // ─── Mistake / Study-History Actions ───
      addMistake: (entry) =>
        set((state) => {
          const newEntry: MistakeEntry = {
            ...entry,
            id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: new Date().toISOString(),
          };
          const mistakes = [newEntry, ...(state.user.mistakes || [])].slice(0, 300);
          return { user: { ...state.user, mistakes } };
        }),

      removeMistake: (id) =>
        set((state) => ({
          user: { ...state.user, mistakes: (state.user.mistakes || []).filter((m) => m.id !== id) },
        })),

      clearMistakes: () =>
        set((state) => ({ user: { ...state.user, mistakes: [] } })),

      recordStudy: (reviewed, correct) =>
        set((state) => {
          const today = new Date().toISOString().slice(0, 10);
          const history = state.user.studyHistory || [];
          const existing = history.find((d) => d.date === today);
          let newHistory: StudyDay[];
          if (existing) {
            newHistory = history.map((d) =>
              d.date === today
                ? { ...d, reviewed: d.reviewed + reviewed, correct: d.correct + correct }
                : d
            );
          } else {
            newHistory = [{ date: today, reviewed, correct }, ...history].slice(0, 90);
          }
          return { user: { ...state.user, studyHistory: newHistory } };
        }),

      setDailyGoal: (goal) =>
        set((state) => ({ user: { ...state.user, dailyGoal: goal } })),

      // ─── Vocabulary Actions ───
      addWord: (word) =>
        set((state) => {
          if (state.user.vocabulary.some((w) => w.word.toLowerCase() === word.word.toLowerCase())) {
            return state;
          }
          const newWord: VocabularyWord = {
            ...word,
            id: `v-${Date.now()}`,
            level: 0,
            nextReview: new Date().toISOString(),
            lastReview: new Date().toISOString(),
            interval: 0,
            easeFactor: 2.5,
            tags: [],
          };
          return {
            user: { ...state.user, vocabulary: [newWord, ...state.user.vocabulary] },
          };
        }),

      updateWordSRS: (wordId, performance) =>
        set((state) => {
          const newVocab = state.user.vocabulary.map((w) => {
            if (w.id !== wordId) return w;

            // Simple SuperMemo-2 like algorithm
            let { level, interval, easeFactor } = w;
            
            if (performance >= 3) {
              if (level === 0) interval = 1;
              else if (level === 1) interval = 6;
              else interval = Math.round(interval * easeFactor);
              level += 1;
            } else {
              level = 0;
              interval = 1;
            }
            
            easeFactor = easeFactor + (0.1 - (5 - performance) * (0.08 + (5 - performance) * 0.02));
            if (easeFactor < 1.3) easeFactor = 1.3;

            const nextReview = new Date();
            nextReview.setDate(nextReview.getDate() + interval);

            return {
              ...w,
              level,
              interval,
              easeFactor,
              lastReview: new Date().toISOString(),
              nextReview: nextReview.toISOString(),
            };
          });
          return { user: { ...state.user, vocabulary: newVocab } };
        }),

      deleteWord: (wordId) =>
        set((state) => ({
          user: { ...state.user, vocabulary: state.user.vocabulary.filter((w) => w.id !== wordId) },
        })),

      // ─── Sentence Actions ───
      addSentence: (s) =>
        set((state) => {
          const sentences = state.user.sentences || [];
          if (sentences.some((x) => x.text.trim().toLowerCase() === s.text.trim().toLowerCase())) return state;
          const now = new Date().toISOString();
          const newSentence: Sentence = {
            id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            text: s.text.trim(),
            translation: s.translation || '',
            status: s.status ?? 'new',
            repeatCount: s.repeatCount ?? 3,
            source: s.source,
            notes: s.notes,
            level: 0,
            nextReview: now,
            lastReview: now,
            interval: 0,
            easeFactor: 2.5,
            createdAt: now,
          };
          return { user: { ...state.user, sentences: [newSentence, ...sentences] } };
        }),

      addSentencesBulk: (list) => {
        let added = 0;
        set((state) => {
          const existing = new Set((state.user.sentences || []).map((s) => s.text.trim().toLowerCase()));
          const now = new Date().toISOString();
          const additions: Sentence[] = [];
          for (const s of list) {
            const key = s.text.trim().toLowerCase();
            if (!key || existing.has(key)) continue;
            existing.add(key);
            additions.push({
              id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${additions.length}`,
              text: s.text.trim(),
              translation: s.translation || '',
              status: s.status ?? 'new',
              repeatCount: s.repeatCount ?? 3,
              source: s.source,
              notes: s.notes,
              level: 0,
              nextReview: now,
              lastReview: now,
              interval: 0,
              easeFactor: 2.5,
              createdAt: now,
            });
          }
          added = additions.length;
          return { user: { ...state.user, sentences: [...additions, ...(state.user.sentences || [])] } };
        });
        return added;
      },

      updateSentenceStatus: (id, status) =>
        set((state) => ({
          user: {
            ...state.user,
            sentences: (state.user.sentences || []).map((s) => (s.id === id ? { ...s, status } : s)),
          },
        })),

      updateSentenceSRS: (id, performance) =>
        set((state) => {
          const sentences = (state.user.sentences || []).map((s) => {
            if (s.id !== id) return s;
            let { level, interval, easeFactor } = s;
            if (performance >= 3) {
              if (level === 0) interval = 1;
              else if (level === 1) interval = 6;
              else interval = Math.round(interval * easeFactor);
              level += 1;
            } else {
              level = 0;
              interval = 1;
            }
            easeFactor = easeFactor + (0.1 - (5 - performance) * (0.08 + (5 - performance) * 0.02));
            if (easeFactor < 1.3) easeFactor = 1.3;
            const next = new Date();
            next.setDate(next.getDate() + interval);
            return {
              ...s,
              level: Math.min(level, 5),
              interval,
              easeFactor,
              lastReview: new Date().toISOString(),
              nextReview: next.toISOString(),
            };
          });
          return { user: { ...state.user, sentences } };
        }),

      updateSentence: (id, patch) =>
        set((state) => ({
          user: {
            ...state.user,
            sentences: (state.user.sentences || []).map((s) => (s.id === id ? { ...s, ...patch } : s)),
          },
        })),

      deleteSentence: (id) =>
        set((state) => ({
          user: { ...state.user, sentences: (state.user.sentences || []).filter((s) => s.id !== id) },
        })),

      // ─── Channel Filter Actions ───
      setSelectedLevel: (level) =>
        set((state) => ({
          channelFilters: { ...state.channelFilters, selectedLevel: level },
        })),

      toggleCategory: (category) =>
        set((state) => {
          const cats = state.channelFilters.selectedCategories;
          const newCats = cats.includes(category)
            ? cats.filter((c) => c !== category)
            : [...cats, category];
          return {
            channelFilters: { ...state.channelFilters, selectedCategories: newCats },
          };
        }),

      setSearchQuery: (query) =>
        set((state) => ({
          channelFilters: { ...state.channelFilters, searchQuery: query },
        })),

      setSortBy: (sortBy) =>
        set((state) => ({
          channelFilters: { ...state.channelFilters, sortBy },
        })),

      setContentType: (type) =>
        set((state) => ({
          channelFilters: { ...state.channelFilters, contentType: type },
        })),

      clearFilters: () =>
        set((state) => ({
          channelFilters: {
            selectedLevel: null,
            selectedCategories: [],
            searchQuery: '',
            sortBy: 'name',
            contentType: 'all',
          },
        })),

      // ─── OPIc Actions ───
      setCurrentTopic: (topicId) =>
        set((state) => ({
          opic: { ...state.opic, currentTopicId: topicId, currentQuestionIndex: 0 },
        })),

      setCurrentQuestionIndex: (index) =>
        set((state) => ({
          opic: { ...state.opic, currentQuestionIndex: index },
        })),

      saveAnswer: (questionKey, answer) =>
        set((state) => ({
          opic: { ...state.opic, answers: { ...state.opic.answers, [questionKey]: answer } },
        })),

      setOPIcDifficulty: (difficulty) =>
        set((state) => ({
          opic: { ...state.opic, selectedDifficulty: difficulty },
        })),

      addPracticeResult: (topicId, score) =>
        set((state) => ({
          opic: {
            ...state.opic,
            practiceHistory: [
              ...state.opic.practiceHistory,
              { topicId, date: new Date().toISOString(), score },
            ],
          },
        })),

      clearOPIcSession: () =>
        set((state) => ({
          opic: { ...state.opic, currentTopicId: null, currentQuestionIndex: 0, answers: {} },
        })),

      // ─── UI Actions ───
      toggleSidebar: () =>
        set((state) => ({ ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen } })),

      setSidebarOpen: (open) =>
        set((state) => ({ ui: { ...state.ui, sidebarOpen: open } })),

      setCurrentPage: (page) =>
        set((state) => ({ ui: { ...state.ui, currentPage: page } })),

      setTheme: (theme) =>
        set((state) => ({ ui: { ...state.ui, theme } })),

      openModal: (modalId) =>
        set((state) => ({ ui: { ...state.ui, modalOpen: modalId } })),

      closeModal: () =>
        set((state) => ({ ui: { ...state.ui, modalOpen: null } })),
    }),
    {
      name: 'english-speaking-app',
      partialize: (state) => ({
        user: state.user,
        opic: { ...state.opic, answers: {} },
        ui: { theme: state.ui.theme },
      }),
    }
  )
);
