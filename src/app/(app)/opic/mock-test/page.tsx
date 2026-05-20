'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play, Pause, Mic, Square, SkipForward, ChevronRight, Trophy, RotateCcw,
  ChevronDown, ChevronUp, Clock, Target, TrendingUp, Award,
  CheckCircle2, XCircle, BarChart3, Volume2, AlertCircle, ChevronLeft,
  Timer, Lightbulb, Check,
} from 'lucide-react';
import { useTTS } from '@/hooks/useSpeech';
import { useRecorder } from '@/hooks/useRecorder';

// ─── Types ──────────────────────────────────────────────────────────────────
type Phase = 'survey' | 'orientation' | 'test' | 'results';
type SurveyStep = 'level' | 'job' | 'living' | 'hobbies' | 'sports';
type QuestionType = 'self-intro' | 'describe' | 'routine' | 'experience' | 'roleplay' | 'unexpected';

interface SurveyData {
  level: string;
  job: string;
  living: string;
  hobbies: string[];
  sports: string[];
}

interface TestQuestion {
  question: string;
  category: string;
  type: QuestionType;
  tips: string[];
}

interface QuestionResult {
  question: string;
  category: string;
  type: QuestionType;
  duration: number;
  estimatedScore: number;
  audioUrl?: string;
}

interface SessionRecord {
  id: string;
  type: 'mock';
  date: string;
  topic: string;
  duration: number;
  grade: string;
  questionsAnswered: number;
  totalQuestions: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const HISTORY_KEY = 'neuroeng_opic_history_v1';
const PREP_SECONDS = 20;
const MAX_RECORD_SECONDS = 120;
const SURVEY_STEPS: SurveyStep[] = ['level', 'job', 'living', 'hobbies', 'sports'];

// ─── Survey Options ───────────────────────────────────────────────────────────
const LEVEL_OPTIONS = [
  { id: '3&4', label: '3번 & 4번', grade: 'NL ~ IM1', color: 'gray' },
  { id: '4&5', label: '4번 & 5번', grade: 'IM1 ~ IM2', color: 'teal' },
  { id: '5&5', label: '5번 & 5번', grade: 'IM2 ~ IM3', color: 'blue' },
  { id: '5&6', label: '5번 & 6번', grade: 'IH 목표', color: 'violet', recommended: true },
  { id: '6&6', label: '6번 & 6번', grade: 'AL 목표', color: 'amber' },
];

const JOB_OPTIONS = [
  { id: 'employee', label: '직장인', sub: '현재 직장에 다니고 있음' },
  { id: 'student', label: '대학(원)생', sub: '현재 학교에 재학 중' },
  { id: 'jobseeker', label: '취업준비생 / 구직자', sub: '현재 직장에 다니고 있지 않음' },
  { id: 'homemaker', label: '주부', sub: '가사를 담당하고 있음' },
];

const LIVING_OPTIONS = [
  { id: 'house', label: '단독주택 / 전원주택', sub: 'House or villa' },
  { id: 'apartment', label: '아파트 / 오피스텔', sub: 'Apartment or studio' },
  { id: 'dorm', label: '기숙사', sub: 'Dormitory' },
  { id: 'shared', label: '친구 / 룸메이트와 함께', sub: 'Shared housing' },
];

const HOBBY_OPTIONS = [
  { id: 'movies',           label: '영화보기' },
  { id: 'music',            label: '음악 감상' },
  { id: 'concerts',         label: '공연 / 콘서트 관람' },
  { id: 'sports-watch',     label: '스포츠 관람' },
  { id: 'gaming',           label: '게임하기' },
  { id: 'tv',               label: 'TV / OTT 시청' },
  { id: 'shopping',         label: '쇼핑' },
  { id: 'reading',          label: '독서' },
  { id: 'cooking',          label: '요리' },
  { id: 'camping',          label: '캠핑' },
  { id: 'hiking',           label: '등산' },
  { id: 'beach',            label: '해변 가기' },
  { id: 'domestic-travel',  label: '국내 여행' },
  { id: 'overseas-travel',  label: '해외 여행' },
];

const SPORT_OPTIONS = [
  { id: 'walking',    label: '걷기 / 산책' },
  { id: 'running',    label: '달리기' },
  { id: 'swimming',   label: '수영' },
  { id: 'cycling',    label: '자전거 타기' },
  { id: 'gym',        label: '헬스 / 웨이트 트레이닝' },
  { id: 'baseball',   label: '야구' },
  { id: 'basketball', label: '농구' },
  { id: 'soccer',     label: '축구' },
  { id: 'yoga',       label: '요가 / 필라테스' },
  { id: 'golf',       label: '골프' },
  { id: 'badminton',  label: '배드민턴' },
  { id: 'tennis',     label: '테니스' },
];

// ─── Question Database: Hobbies ───────────────────────────────────────────────
interface TopicSet {
  category: string;
  describe: { question: string; tips: string[] };
  routine:  { question: string; tips: string[] };
  experience: { question: string; tips: string[] };
}

const HOBBY_QS: Record<string, TopicSet> = {
  movies: {
    category: 'Movies',
    describe: {
      question: 'Describe the place where you usually watch movies. What does it look like and what kind of atmosphere does it have?',
      tips: ['극장/집/카페 등 구체적인 장소를 묘사하세요', '분위기, 크기, 특징을 상세히 설명하세요', '그 장소를 좋아하는 이유도 언급하세요'],
    },
    routine: {
      question: 'What kinds of movies do you enjoy watching? Tell me about your typical movie-watching routine and habits.',
      tips: ['좋아하는 장르를 구체적으로 언급하세요', '얼마나 자주, 누구와 보는지 말하세요', '스트리밍 vs 극장 등 방식도 설명하세요'],
    },
    experience: {
      question: 'Tell me about a movie that made a strong impression on you recently. What was it about and what made it so memorable?',
      tips: ['영화 제목과 줄거리를 간략히 소개하세요', '인상 깊었던 장면이나 이유를 구체적으로 말하세요', '자신의 감정과 반응을 포함하세요'],
    },
  },
  music: {
    category: 'Music',
    describe: {
      question: 'Describe the places or situations where you usually listen to music. What is it like there?',
      tips: ['주로 언제, 어디서 음악을 듣는지 묘사하세요', '그 환경의 분위기를 설명하세요', '왜 그때 음악을 듣는지 이유도 말하세요'],
    },
    routine: {
      question: 'What types of music do you enjoy? Describe your music-listening habits and routine.',
      tips: ['좋아하는 장르, 아티스트를 구체적으로 말하세요', '하루에 얼마나 음악을 듣는지 설명하세요', '음악을 즐기는 방법(스트리밍 등)도 언급하세요'],
    },
    experience: {
      question: 'Have you ever been to a concert or live performance? Tell me about a memorable music experience you had.',
      tips: ['구체적인 공연 이름/아티스트를 언급하세요', '그 경험에서 느낀 감정을 생생하게 묘사하세요', '기억에 남는 이유를 설명하세요'],
    },
  },
  concerts: {
    category: 'Concerts & Performances',
    describe: {
      question: 'Describe the venue or theater where you usually go to watch concerts or performances. What does it look like?',
      tips: ['공연장의 크기, 분위기, 특징을 묘사하세요', '좌석, 무대 등을 설명하세요', '처음 갔을 때 느낌도 말하세요'],
    },
    routine: {
      question: 'How often do you go to concerts or performances? What types do you enjoy? Tell me about your habits.',
      tips: ['얼마나 자주 가는지 구체적으로 말하세요', '좋아하는 공연 장르를 설명하세요', '함께 가는 사람이 있다면 언급하세요'],
    },
    experience: {
      question: 'Tell me about the most memorable concert or performance you have ever attended. What happened and why was it special?',
      tips: ['구체적인 공연/아티스트 이름을 말하세요', '특별했던 순간을 생생하게 묘사하세요', '그 경험이 자신에게 미친 영향을 말하세요'],
    },
  },
  'sports-watch': {
    category: 'Watching Sports',
    describe: {
      question: 'Describe the place where you usually watch sports — whether it\'s a stadium or at home. What is it like?',
      tips: ['장소의 분위기와 특징을 생동감 있게 묘사하세요', '경기 전/중/후의 분위기를 설명하세요', '장소의 장단점도 언급하세요'],
    },
    routine: {
      question: 'What sports do you enjoy watching? Tell me about your sports-watching habits and routine.',
      tips: ['좋아하는 스포츠 종목을 구체적으로 말하세요', '얼마나 자주, 어떻게 보는지 설명하세요', '응원하는 팀이나 선수가 있다면 말하세요'],
    },
    experience: {
      question: 'Tell me about the most memorable sporting event you have watched. What happened and what made it so unforgettable?',
      tips: ['구체적인 경기/팀/선수를 언급하세요', '경기 중 특별한 순간을 묘사하세요', '그 경험 후 자신의 감정을 표현하세요'],
    },
  },
  gaming: {
    category: 'Gaming',
    describe: {
      question: 'Describe the place where you usually play games. What does your gaming setup look like?',
      tips: ['게임하는 장소의 환경을 구체적으로 묘사하세요', '어떤 기기를 사용하는지 설명하세요', '그 환경이 게임에 미치는 영향도 말하세요'],
    },
    routine: {
      question: 'What kinds of games do you enjoy playing? Tell me about your gaming habits and routine.',
      tips: ['좋아하는 게임 장르/제목을 구체적으로 말하세요', '얼마나 자주, 언제 게임을 하는지 설명하세요', '혼자인지 친구와 함께 하는지도 말하세요'],
    },
    experience: {
      question: 'Tell me about a particularly memorable gaming experience you had. What happened and why was it so special?',
      tips: ['특정 게임의 기억에 남는 순간을 묘사하세요', '그때 느꼈던 감정을 표현하세요', '그 경험이 게임에 대한 생각에 어떤 영향을 미쳤는지 말하세요'],
    },
  },
  tv: {
    category: 'TV & Streaming',
    describe: {
      question: 'Describe where and how you usually watch TV shows or streaming content. What is that experience like?',
      tips: ['TV/모니터/스마트폰 등 시청 환경을 묘사하세요', '주로 어디서 시청하는지 설명하세요', '혼자인지 가족과 함께인지도 말하세요'],
    },
    routine: {
      question: 'What kinds of shows or content do you usually watch? Tell me about your viewing habits.',
      tips: ['좋아하는 프로그램 장르/이름을 구체적으로 말하세요', '얼마나 자주 보는지 설명하세요', '넷플릭스, 유튜브 등 플랫폼도 언급하세요'],
    },
    experience: {
      question: 'Tell me about a TV show or series that you really enjoyed recently. What was it about and why did you like it so much?',
      tips: ['프로그램 제목과 줄거리를 간략히 소개하세요', '특별히 마음에 들었던 점을 설명하세요', '추천하고 싶은 이유도 말하세요'],
    },
  },
  shopping: {
    category: 'Shopping',
    describe: {
      question: 'Describe your favorite store or shopping area. What does it look like and what makes it special?',
      tips: ['매장의 외관, 분위기, 특징을 묘사하세요', '주로 어떤 물건을 파는지 설명하세요', '그 장소가 좋은 이유를 말하세요'],
    },
    routine: {
      question: 'How often do you go shopping? What kinds of things do you usually buy? Describe your shopping habits.',
      tips: ['얼마나 자주 쇼핑하는지 말하세요', '주로 무엇을 사는지 구체적으로 설명하세요', '온라인 vs 오프라인 쇼핑 습관도 언급하세요'],
    },
    experience: {
      question: 'Tell me about a memorable or unusual shopping experience you had. What happened?',
      tips: ['구체적인 에피소드를 말하세요', '좋았거나 문제가 있었던 상황을 묘사하세요', '그 경험 후 어떻게 해결했는지 말하세요'],
    },
  },
  reading: {
    category: 'Reading',
    describe: {
      question: 'Describe your favorite place to read. What does it look like and what is the atmosphere like?',
      tips: ['독서하기 좋아하는 장소를 구체적으로 묘사하세요', '그 환경의 분위기를 설명하세요', '왜 그 장소를 좋아하는지 말하세요'],
    },
    routine: {
      question: 'What kinds of books do you enjoy reading? Tell me about your reading habits and routine.',
      tips: ['좋아하는 책 장르나 제목을 구체적으로 말하세요', '얼마나 자주, 언제 읽는지 설명하세요', '종이책 vs 전자책 방식도 언급하세요'],
    },
    experience: {
      question: 'Tell me about a book that had a big impact on you. What was it about and why was it so meaningful?',
      tips: ['책 제목과 저자, 간략한 내용을 소개하세요', '감동받은 부분이나 배운 점을 설명하세요', '그 책이 자신에게 미친 영향을 말하세요'],
    },
  },
  cooking: {
    category: 'Cooking',
    describe: {
      question: 'Describe your kitchen at home. What does it look like and how is it set up?',
      tips: ['주방의 크기, 구조, 기기들을 묘사하세요', '요리할 때의 환경을 설명하세요', '주방이 마음에 드는 점이나 아쉬운 점도 말하세요'],
    },
    routine: {
      question: 'How often do you cook? What kinds of food do you usually make? Tell me about your cooking habits.',
      tips: ['얼마나 자주 요리하는지 말하세요', '주로 어떤 음식을 만드는지 설명하세요', '요리를 좋아하는 이유도 언급하세요'],
    },
    experience: {
      question: 'Tell me about a time when you tried to cook something challenging or had a memorable cooking experience. What happened?',
      tips: ['도전했던 요리를 구체적으로 말하세요', '요리 과정에서 있었던 일을 묘사하세요', '결과와 그때 느낀 감정을 표현하세요'],
    },
  },
  camping: {
    category: 'Camping',
    describe: {
      question: 'Describe your favorite camping site or the type of place where you enjoy camping. What is it like?',
      tips: ['캠핑 장소의 환경과 분위기를 묘사하세요', '그 장소의 특징(산, 강, 바다 등)을 설명하세요', '왜 그런 장소를 좋아하는지 말하세요'],
    },
    routine: {
      question: 'How often do you go camping? What do you usually do when camping? Tell me about your camping habits.',
      tips: ['얼마나 자주 캠핑을 가는지 말하세요', '캠핑할 때 주로 하는 활동을 설명하세요', '함께 가는 사람들도 언급하세요'],
    },
    experience: {
      question: 'Tell me about a memorable camping trip you have been on. What happened and what made it special or challenging?',
      tips: ['구체적인 캠핑 경험을 이야기하세요', '좋았던 점이나 어려웠던 점을 묘사하세요', '그 경험에서 배운 것이나 느낀 점을 말하세요'],
    },
  },
  hiking: {
    category: 'Hiking',
    describe: {
      question: 'Describe your favorite hiking trail or mountain. What does it look like and what makes it special?',
      tips: ['등산 코스나 산의 특징을 묘사하세요', '경치, 난이도, 소요시간 등을 설명하세요', '그 장소를 좋아하는 이유를 말하세요'],
    },
    routine: {
      question: 'How often do you go hiking? What is your typical hiking routine like?',
      tips: ['얼마나 자주 등산하는지 말하세요', '준비 과정과 등산할 때 하는 것들을 설명하세요', '혼자인지 다른 사람과 함께인지도 언급하세요'],
    },
    experience: {
      question: 'Tell me about the most memorable hiking experience you have had. What happened and what made it unforgettable?',
      tips: ['구체적인 등산 에피소드를 말하세요', '도전적이었거나 특별했던 순간을 묘사하세요', '그 경험 후 느낀 성취감 등을 표현하세요'],
    },
  },
  beach: {
    category: 'Beach',
    describe: {
      question: 'Describe your favorite beach or a beach you like to visit. What does it look like and what is the atmosphere like?',
      tips: ['해변의 외관, 분위기, 특징을 묘사하세요', '모래, 바다, 주변 환경을 설명하세요', '그 해변만의 특별한 점을 말하세요'],
    },
    routine: {
      question: 'How often do you go to the beach? What do you usually do when you are there?',
      tips: ['얼마나 자주 해변에 가는지 말하세요', '해변에서 주로 하는 활동을 설명하세요', '함께 가는 사람이나 계절도 언급하세요'],
    },
    experience: {
      question: 'Tell me about a memorable trip to the beach. What happened and why was it so special?',
      tips: ['구체적인 해변 방문 경험을 이야기하세요', '특별한 순간이나 기억에 남는 일을 묘사하세요', '그 경험의 감정을 생생하게 표현하세요'],
    },
  },
  'domestic-travel': {
    category: 'Domestic Travel',
    describe: {
      question: 'Describe one of your favorite places to visit within your country. What does it look like and what makes it special?',
      tips: ['장소의 외관, 분위기, 특징을 생생하게 묘사하세요', '그 지역의 문화나 볼거리를 설명하세요', '왜 그곳을 좋아하는지 말하세요'],
    },
    routine: {
      question: 'How often do you travel within your country? How do you usually plan and prepare for your trips?',
      tips: ['얼마나 자주 국내 여행을 하는지 말하세요', '여행 계획을 세우는 방법을 설명하세요', '혼자인지 가족/친구와 함께인지도 언급하세요'],
    },
    experience: {
      question: 'Tell me about a memorable domestic trip you have taken. What happened and what made it unforgettable?',
      tips: ['구체적인 여행 경험을 이야기하세요', '특별했던 순간이나 에피소드를 묘사하세요', '그 여행에서 배우거나 느낀 점을 말하세요'],
    },
  },
  'overseas-travel': {
    category: 'International Travel',
    describe: {
      question: 'Describe a foreign country or city that you have visited and really liked. What did it look like and what was the atmosphere like?',
      tips: ['방문한 나라/도시의 특징을 생생하게 묘사하세요', '그곳의 분위기, 문화, 환경을 설명하세요', '한국과 다른 점을 비교해서 말해도 좋아요'],
    },
    routine: {
      question: 'How do you usually prepare for international travel? Tell me about your habits when going abroad.',
      tips: ['해외여행 준비 과정을 구체적으로 설명하세요', '여행 계획을 어떻게 세우는지 말하세요', '여행할 때 중요하게 생각하는 것을 언급하세요'],
    },
    experience: {
      question: 'Tell me about the most memorable international trip you have ever taken. What happened and why was it so special?',
      tips: ['구체적인 해외여행 경험을 이야기하세요', '특별했던 순간이나 문화 충격 등을 묘사하세요', '그 경험이 자신에게 미친 영향을 말하세요'],
    },
  },
};

// ─── Question Database: Sports ────────────────────────────────────────────────
const SPORT_QS: Record<string, TopicSet> = {
  walking: {
    category: 'Walking',
    describe: {
      question: 'Describe the place where you usually go for walks. What does it look like and what is the atmosphere like?',
      tips: ['산책 장소의 환경과 분위기를 묘사하세요', '공원, 강변, 동네 등을 설명하세요', '그 장소가 산책하기 좋은 이유를 말하세요'],
    },
    routine: {
      question: 'How often do you go for walks? Tell me about your typical walking routine.',
      tips: ['얼마나 자주, 어느 시간대에 걷는지 말하세요', '얼마나, 어떤 코스인지 설명하세요', '걷는 동안 무엇을 하는지(음악 등)도 언급하세요'],
    },
    experience: {
      question: 'Tell me about a particularly enjoyable or memorable walk you have taken. What made it special?',
      tips: ['기억에 남는 산책 경험을 구체적으로 말하세요', '특별했던 날씨, 계절, 동행 등을 묘사하세요', '그때 느낀 감정을 생생하게 표현하세요'],
    },
  },
  running: {
    category: 'Running',
    describe: {
      question: 'Describe the place where you usually run. What does it look like and what kind of environment is it?',
      tips: ['달리기하는 장소의 환경을 구체적으로 묘사하세요', '트랙, 공원, 도로 등을 설명하세요', '그 장소가 달리기에 적합한 이유를 말하세요'],
    },
    routine: {
      question: 'How often do you run? Tell me about your typical running routine and training habits.',
      tips: ['얼마나 자주 달리는지, 거리나 시간을 말하세요', '훈련 방법이나 루틴을 설명하세요', '달리기 전후에 하는 것들도 언급하세요'],
    },
    experience: {
      question: 'Tell me about a memorable running experience or race you participated in. What happened?',
      tips: ['마라톤, 단체 달리기 등 구체적인 경험을 말하세요', '그때 느낀 도전감이나 성취감을 표현하세요', '어려움을 어떻게 극복했는지도 말하세요'],
    },
  },
  swimming: {
    category: 'Swimming',
    describe: {
      question: 'Describe the pool or swimming facility where you usually swim. What does it look like?',
      tips: ['수영장의 규모, 환경, 특징을 묘사하세요', '수영장 내 시설에 대해 설명하세요', '그곳을 이용하는 이유를 말하세요'],
    },
    routine: {
      question: 'How often do you swim? Tell me about your typical swimming routine and what you usually do in the pool.',
      tips: ['얼마나 자주 수영을 하는지 말하세요', '수영 방식(자유형, 접영 등)을 설명하세요', '수영 전후 준비/마무리도 언급하세요'],
    },
    experience: {
      question: 'Tell me about a memorable swimming experience you had. What happened and why was it special?',
      tips: ['바다 수영, 대회 참가 등 특별한 경험을 말하세요', '그때 느낀 감정을 생생하게 표현하세요', '어려움이 있었다면 어떻게 극복했는지 말하세요'],
    },
  },
  cycling: {
    category: 'Cycling',
    describe: {
      question: 'Describe the route or area where you usually cycle. What does it look like?',
      tips: ['주로 자전거를 타는 경로나 장소를 묘사하세요', '그 환경의 특징(강변, 산, 도심 등)을 설명하세요', '자신의 자전거에 대해서도 말하세요'],
    },
    routine: {
      question: 'How often do you ride your bicycle? Tell me about your typical cycling routine.',
      tips: ['얼마나 자주 자전거를 타는지 말하세요', '주로 어디서, 얼마나 타는지 설명하세요', '교통수단으로 이용하는지 레저인지 말하세요'],
    },
    experience: {
      question: 'Tell me about a memorable cycling experience you had. What happened and what made it unforgettable?',
      tips: ['장거리 라이딩이나 특별한 코스 경험을 말하세요', '그때 있었던 일을 구체적으로 묘사하세요', '도전적이었던 부분과 성취감을 표현하세요'],
    },
  },
  gym: {
    category: 'Gym & Fitness',
    describe: {
      question: 'Describe the gym or fitness center where you usually work out. What does it look like and what facilities does it have?',
      tips: ['헬스장의 규모, 기기, 분위기를 묘사하세요', '어떤 시설이 있는지 설명하세요', '그 헬스장을 선택한 이유를 말하세요'],
    },
    routine: {
      question: 'How often do you go to the gym? Tell me about your typical workout routine and what exercises you do.',
      tips: ['얼마나 자주 가는지, 어느 시간대에 하는지 말하세요', '주로 하는 운동 종류를 구체적으로 설명하세요', '워밍업, 쿨다운 등 루틴을 설명하세요'],
    },
    experience: {
      question: 'Tell me about a particularly memorable or challenging experience you had at the gym. What happened?',
      tips: ['특별했던 운동 경험이나 에피소드를 말하세요', '목표 달성, 부상, 새 운동 도전 등을 묘사하세요', '그 경험 후 느낀 점을 표현하세요'],
    },
  },
  soccer: {
    category: 'Soccer',
    describe: {
      question: 'Describe the place where you usually play or watch soccer. What does it look like?',
      tips: ['축구장, 풋살장 등의 환경을 묘사하세요', '그 장소의 특징을 설명하세요', '어떤 상황(동네 팀, 회사팀 등)에서 하는지도 말하세요'],
    },
    routine: {
      question: 'How often do you play or watch soccer? Tell me about your soccer habits and routine.',
      tips: ['얼마나 자주 하는지/보는지 말하세요', '누구와 함께 하는지, 어떤 포지션인지 설명하세요', '응원하는 팀이 있다면 언급하세요'],
    },
    experience: {
      question: 'Tell me about a memorable soccer match you played in or watched. What happened and why was it unforgettable?',
      tips: ['구체적인 경기 상황을 묘사하세요', '가장 인상 깊었던 장면이나 순간을 말하세요', '그때 느낀 감정을 표현하세요'],
    },
  },
  basketball: {
    category: 'Basketball',
    describe: {
      question: 'Describe the court or place where you usually play or watch basketball. What is it like?',
      tips: ['농구장의 환경과 특징을 묘사하세요', '실내/실외 여부와 시설을 설명하세요', '그 장소를 좋아하는 이유를 말하세요'],
    },
    routine: {
      question: 'How often do you play or watch basketball? Tell me about your typical basketball routine.',
      tips: ['얼마나 자주 하는지/보는지 말하세요', '함께하는 사람들에 대해 설명하세요', '좋아하는 팀이나 선수가 있다면 언급하세요'],
    },
    experience: {
      question: 'Tell me about a memorable basketball game or experience you had. What happened?',
      tips: ['구체적인 경기나 상황을 묘사하세요', '특별했던 순간을 생생하게 표현하세요', '그때 느낀 감정이나 배운 점을 말하세요'],
    },
  },
  baseball: {
    category: 'Baseball',
    describe: {
      question: 'Describe the baseball stadium or place where you usually play or watch baseball. What does it look like?',
      tips: ['야구장의 분위기와 특징을 묘사하세요', '관중석, 경기장 등을 설명하세요', '야구 경기장만의 특별한 점을 말하세요'],
    },
    routine: {
      question: 'How often do you play or watch baseball? Tell me about your baseball habits.',
      tips: ['얼마나 자주 하는지/보는지 말하세요', '응원하는 팀에 대해 설명하세요', '직관 vs TV 시청 방식도 언급하세요'],
    },
    experience: {
      question: 'Tell me about a particularly memorable baseball game or experience. What happened and why was it special?',
      tips: ['구체적인 경기 에피소드를 말하세요', '극적인 순간이나 특별한 기억을 묘사하세요', '그때 응원한 경험이나 감동을 표현하세요'],
    },
  },
  yoga: {
    category: 'Yoga & Pilates',
    describe: {
      question: 'Describe the studio or place where you usually practice yoga or pilates. What does it look like?',
      tips: ['요가원/스튜디오의 환경을 묘사하세요', '분위기, 시설 등을 설명하세요', '그곳을 선택한 이유를 말하세요'],
    },
    routine: {
      question: 'How often do you practice yoga or pilates? Tell me about your typical practice routine.',
      tips: ['얼마나 자주 하는지 말하세요', '주로 어떤 동작이나 수업을 하는지 설명하세요', '시작한 이유도 언급하세요'],
    },
    experience: {
      question: 'Tell me about a memorable experience you had while practicing yoga or pilates. What happened?',
      tips: ['특별했던 수업이나 경험을 말하세요', '도전적인 자세나 순간을 묘사하세요', '요가/필라테스를 통해 얻은 것을 표현하세요'],
    },
  },
  golf: {
    category: 'Golf',
    describe: {
      question: 'Describe the golf course or driving range where you usually play. What does it look like?',
      tips: ['골프장/연습장의 환경과 특징을 묘사하세요', '코스, 시설 등을 설명하세요', '그 장소를 좋아하는 이유를 말하세요'],
    },
    routine: {
      question: 'How often do you play golf or practice? Tell me about your typical golf routine.',
      tips: ['얼마나 자주 치는지, 어떻게 연습하는지 말하세요', '함께 치는 사람들을 언급하세요', '골프를 시작한 계기도 설명하세요'],
    },
    experience: {
      question: 'Tell me about a memorable round of golf or a golf-related experience you had. What happened?',
      tips: ['기억에 남는 라운딩 경험을 말하세요', '특별했던 홀이나 순간을 묘사하세요', '골프를 통해 배운 것이나 느낀 점을 말하세요'],
    },
  },
  badminton: {
    category: 'Badminton',
    describe: {
      question: 'Describe the court or place where you usually play badminton. What is it like?',
      tips: ['배드민턴장의 환경을 묘사하세요', '실내/실외 여부, 시설을 설명하세요', '그 장소를 선택한 이유를 말하세요'],
    },
    routine: {
      question: 'How often do you play badminton? Tell me about your typical badminton routine.',
      tips: ['얼마나 자주 치는지 말하세요', '누구와 함께 하는지 설명하세요', '실력이 어느 정도인지도 언급하세요'],
    },
    experience: {
      question: 'Tell me about a memorable badminton match or experience. What happened?',
      tips: ['기억에 남는 경기나 순간을 묘사하세요', '특별했던 점을 구체적으로 말하세요', '그 경험 후 느낀 점을 표현하세요'],
    },
  },
  tennis: {
    category: 'Tennis',
    describe: {
      question: 'Describe the tennis court or facility where you usually play. What does it look like?',
      tips: ['테니스 코트의 환경을 묘사하세요', '코트 종류(클레이, 하드 등), 시설을 설명하세요', '그곳을 좋아하는 이유를 말하세요'],
    },
    routine: {
      question: 'How often do you play tennis? Tell me about your typical tennis practice or game routine.',
      tips: ['얼마나 자주 치는지 말하세요', '누구와 함께 하는지 설명하세요', '레슨을 받는지도 언급하세요'],
    },
    experience: {
      question: 'Tell me about a memorable tennis match or experience you had. What happened?',
      tips: ['기억에 남는 경기나 연습 경험을 말하세요', '특별한 순간이나 에피소드를 묘사하세요', '그 경험에서 배운 점을 표현하세요'],
    },
  },
};

// ─── Roleplay Sets ────────────────────────────────────────────────────────────
const ROLEPLAY_SETS = [
  {
    category: 'Role-Play: Travel Agency',
    q1: { question: 'I\'d like to give you a situation and ask you to act it out. You want to plan a vacation and you\'re calling a travel agency. Ask the travel agent 3 or 4 questions to get all the information you need.', tips: ['공손하게 전화를 시작하세요 (Hello, I\'d like to...)', '여행 날짜, 비용, 포함 사항 등을 물어보세요', '3-4개의 다른 질문을 자연스럽게 연결하세요'] },
    q2: { question: 'I\'m sorry, there is a problem I need to tell you about. The hotel you had planned to stay at is fully booked for those dates. Explain the situation to your friend and suggest 2 or 3 alternatives to solve the problem.', tips: ['상황을 차분하게 설명하세요', '2-3가지 대안을 구체적으로 제시하세요', '상대방의 입장을 이해하는 표현을 사용하세요'] },
    q3: { question: 'That\'s the end of the situation. Have you ever experienced a travel problem or inconvenience? What happened and how did you resolve it?', tips: ['구체적인 여행 중 문제 경험을 말하세요', '어떻게 해결했는지 과정을 설명하세요', '그 경험에서 배운 점도 표현하세요'] },
  },
  {
    category: 'Role-Play: Shopping',
    q1: { question: 'I\'d like to give you a situation and ask you to act it out. You want to buy a birthday gift for a close friend. Call a store and ask 3 or 4 questions to help you find the perfect gift.', tips: ['필요한 정보를 묻는 구체적인 질문을 하세요', '예산, 상품 종류, 포장 여부 등을 물어보세요', '자연스럽고 정중하게 대화를 이어가세요'] },
    q2: { question: 'I\'m sorry, there is a problem I need to tell you about. The item you ordered online has arrived, but it is damaged. Call the store and suggest 2 or 3 ways to resolve the issue.', tips: ['상황을 명확하게 설명하세요', '교환, 환불, 보상 등 대안을 제시하세요', '정중하지만 단호하게 말하세요'] },
    q3: { question: 'That\'s the end of the situation. Have you ever had a problem while shopping — online or in a store? What happened and how did you handle it?', tips: ['구체적인 쇼핑 문제 경험을 말하세요', '어떻게 해결했는지 설명하세요', '그 경험에서 배운 점을 표현하세요'] },
  },
  {
    category: 'Role-Play: Restaurant',
    q1: { question: 'I\'d like to give you a situation and ask you to act it out. You want to make a dinner reservation at a popular restaurant. Call the restaurant and ask 3 or 4 questions to make all the necessary arrangements.', tips: ['날짜, 시간, 인원수를 말하며 예약을 시작하세요', '자리 선호도, 특별 요청 등을 물어보세요', '정중하고 명확하게 말하세요'] },
    q2: { question: 'I\'m sorry, there is a problem I need to tell you about. The restaurant has overbooked and cannot accommodate your party at the reserved time. Suggest 2 or 3 solutions to resolve the situation.', tips: ['상황을 이해하면서도 해결책을 요청하세요', '다른 시간, 다른 지점, 보상 등을 제안하세요', '침착하게 대안을 제시하세요'] },
    q3: { question: 'That\'s the end of the situation. Have you ever had a problem at a restaurant? What happened and how did you deal with it?', tips: ['구체적인 식당 문제 경험을 말하세요', '어떻게 해결했는지 과정을 설명하세요', '그 경험 후 느낀 점을 표현하세요'] },
  },
];

// ─── Unexpected Questions ─────────────────────────────────────────────────────
const UNEXPECTED_QS = [
  { category: 'Unexpected: Technology', question: 'I\'d like to ask you some questions about technology and the internet. How has the internet changed the way people communicate and get information these days? Do you think these changes have been mostly positive or negative?', tips: ['인터넷이 소통과 정보 접근에 미친 변화를 구체적으로 말하세요', '긍정적, 부정적 측면 모두 언급하세요', '자신의 경험을 예로 들어 설명하세요'] },
  { category: 'Unexpected: Environment', question: 'I\'d like to ask you about environmental issues. What are some of the biggest environmental problems in your country right now? What are people doing to address these problems?', tips: ['구체적인 환경 문제를 언급하세요 (미세먼지, 플라스틱 등)', '정부, 기업, 개인의 노력을 설명하세요', '자신의 의견도 포함하세요'] },
  { category: 'Unexpected: Housing', question: 'I\'d like to ask you about housing in your country. What types of housing are common and how have housing trends changed in recent years? What challenges do people face when it comes to housing?', tips: ['아파트, 원룸, 단독주택 등 주거 형태를 설명하세요', '최근 변화(가격 상승, 새 트렌드 등)를 말하세요', '자신의 경험이나 의견을 포함하세요'] },
  { category: 'Unexpected: Health', question: 'I\'d like to ask you about health trends. What are some popular health and wellness trends in your country right now? Why do you think people are paying more attention to health these days?', tips: ['인기 있는 건강 트렌드를 2-3가지 말하세요', '그 이유와 배경을 설명하세요', '자신도 실천하는 것이 있다면 언급하세요'] },
  { category: 'Unexpected: Media', question: 'Let\'s talk about media and how people get news and information. How do people in your country usually get their news? How has this changed compared to the past?', tips: ['현재와 과거의 미디어 소비 방식을 비교하세요', '소셜미디어, 유튜브, 신문 등을 언급하세요', '이런 변화에 대한 자신의 생각을 말하세요'] },
  { category: 'Unexpected: Transportation', question: 'Let\'s talk about transportation. What is the most popular form of transportation in your city or country? How has transportation changed over the years? What do you think is the biggest transportation challenge?', tips: ['대중교통, 자가용, 킥보드 등을 구체적으로 언급하세요', '과거와 현재의 교통수단 변화를 설명하세요', '자신이 주로 이용하는 교통수단도 말하세요'] },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  return `${m.toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
}

function getTypeConfig(type: QuestionType) {
  const cfg = {
    'self-intro': { label: '자기소개', color: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20' },
    describe:     { label: '묘사',     color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' },
    routine:      { label: '루틴',     color: 'bg-blue-500/15 text-blue-400 border-blue-500/20' },
    experience:   { label: '경험',     color: 'bg-amber-500/15 text-amber-400 border-amber-500/20' },
    roleplay:     { label: '롤플레이', color: 'bg-purple-500/15 text-purple-400 border-purple-500/20' },
    unexpected:   { label: '돌발',     color: 'bg-red-500/15 text-red-400 border-red-500/20' },
  };
  return cfg[type];
}

function generateQuestions(survey: SurveyData): TestQuestion[] {
  const qs: TestQuestion[] = [];

  // 1. Self-introduction
  qs.push({
    question: 'Tell me a little bit about yourself.',
    category: 'Self-Introduction',
    type: 'self-intro',
    tips: ['이름, 직업/학교, 사는 곳 등 기본 정보로 시작하세요', '취미나 관심사를 자연스럽게 연결하세요', '1분 내외로 자연스럽게 답변하세요'],
  });

  // 2. Hobby topics (first 2 selected)
  const h1 = HOBBY_QS[survey.hobbies[0]];
  const h2 = HOBBY_QS[survey.hobbies[1]];
  for (const h of [h1, h2]) {
    if (!h) continue;
    qs.push({ question: h.describe.question, category: h.category, type: 'describe', tips: h.describe.tips });
    qs.push({ question: h.routine.question,  category: h.category, type: 'routine',  tips: h.routine.tips });
    qs.push({ question: h.experience.question, category: h.category, type: 'experience', tips: h.experience.tips });
  }

  // 3. Sport topic (first selected)
  const sp = SPORT_QS[survey.sports[0]] ?? SPORT_QS.gym;
  qs.push({ question: sp.describe.question,   category: sp.category, type: 'describe',   tips: sp.describe.tips });
  qs.push({ question: sp.routine.question,    category: sp.category, type: 'routine',    tips: sp.routine.tips });
  qs.push({ question: sp.experience.question, category: sp.category, type: 'experience', tips: sp.experience.tips });

  // 4. Roleplay set (random)
  const rp = ROLEPLAY_SETS[Math.floor(Math.random() * ROLEPLAY_SETS.length)];
  qs.push({ question: rp.q1.question, category: rp.category, type: 'roleplay', tips: rp.q1.tips });
  qs.push({ question: rp.q2.question, category: rp.category, type: 'roleplay', tips: rp.q2.tips });
  qs.push({ question: rp.q3.question, category: rp.category, type: 'roleplay', tips: rp.q3.tips });

  // 5. Unexpected (2 random)
  const shuffled = [...UNEXPECTED_QS].sort(() => Math.random() - 0.5);
  qs.push({ question: shuffled[0].question, category: shuffled[0].category, type: 'unexpected', tips: shuffled[0].tips });
  qs.push({ question: shuffled[1].question, category: shuffled[1].category, type: 'unexpected', tips: shuffled[1].tips });

  return qs.slice(0, 15);
}

function estimateGrade(scores: number[]): { grade: string; label: string; color: string; position: number } {
  const answered = scores.filter((s) => s > 0);
  if (answered.length === 0) return { grade: 'IL', label: 'Intermediate Low', color: 'from-gray-500 to-gray-400', position: 5 };
  const avg = answered.reduce((a, b) => a + b, 0) / answered.length;
  if (avg >= 8.5) return { grade: 'AL',  label: 'Advanced Low',        color: 'from-amber-500 to-yellow-400',  position: 90 };
  if (avg >= 7.0) return { grade: 'IH',  label: 'Intermediate High',   color: 'from-violet-500 to-purple-400', position: 70 };
  if (avg >= 5.5) return { grade: 'IM3', label: 'Intermediate Mid 3',  color: 'from-blue-500 to-cyan-400',     position: 55 };
  if (avg >= 4.0) return { grade: 'IM2', label: 'Intermediate Mid 2',  color: 'from-indigo-500 to-blue-400',   position: 40 };
  if (avg >= 2.5) return { grade: 'IM1', label: 'Intermediate Mid 1',  color: 'from-teal-500 to-emerald-400',  position: 25 };
  return { grade: 'IL', label: 'Intermediate Low', color: 'from-gray-500 to-gray-400', position: 10 };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function MockTestPage() {
  // ── Survey state
  const [phase, setPhase] = useState<Phase>('survey');
  const [surveyStep, setSurveyStep] = useState<SurveyStep>('level');
  const [survey, setSurvey] = useState<SurveyData>({
    level: '5&6', job: '', living: '', hobbies: [], sports: [],
  });

  // ── Orientation countdown
  const [orientCount, setOrientCount] = useState(3);

  // ── Test state
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [qIdx, setQIdx] = useState(0);
  const [isPreparing, setIsPreparing] = useState(true);
  const [prepLeft, setPrepLeft] = useState(PREP_SECONDS);
  const [totalTime, setTotalTime] = useState(0);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [showTips, setShowTips] = useState(false);

  // ── Playback
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopRecPendingRef = useRef<boolean>(false);

  const totalTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prepTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const { speak, stop: stopTTS, isSpeaking } = useTTS();
  const recorder = useRecorder();

  const currentQ = questions[qIdx];

  // ── Orientation countdown effect
  useEffect(() => {
    if (phase !== 'orientation') return;
    if (orientCount <= 0) { setPhase('test'); return; }
    const t = setTimeout(() => setOrientCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, orientCount]);

  // ── Total test timer
  useEffect(() => {
    if (phase === 'test') {
      totalTimerRef.current = setInterval(() => setTotalTime((t) => t + 1), 1000);
    }
    return () => { if (totalTimerRef.current) clearInterval(totalTimerRef.current); };
  }, [phase]);

  // ── Prep countdown
  useEffect(() => {
    if (phase !== 'test' || !isPreparing) return;
    if (prepLeft <= 0) { setIsPreparing(false); return; }
    prepTimerRef.current = setInterval(() => setPrepLeft((p) => p - 1), 1000);
    return () => { if (prepTimerRef.current) clearInterval(prepTimerRef.current); };
  }, [phase, isPreparing, prepLeft]);

  // ── Auto-stop recording at 2:00
  useEffect(() => {
    if (recorder.isRecording && recorder.duration >= MAX_RECORD_SECONDS) recorder.stop();
  }, [recorder.isRecording, recorder.duration, recorder]);

  // ── Finish question when audio ready
  const finishQuestion = useCallback((withRec: boolean, dur: number, url?: string) => {
    const levelMap: Record<string, number> = {
      '3&4': 3, '4&5': 4, '5&5': 5, '5&6': 6.5, '6&6': 8,
    };
    const base = levelMap[survey.level] ?? 5;
    const timeBonus   = withRec ? Math.min(dur / 90, 1) * 2 : 0;
    const variation   = withRec ? (Math.random() - 0.3) * 1.5 : 0;
    const score       = withRec ? Math.min(10, Math.max(1, base + timeBonus + variation)) : 0;

    const result: QuestionResult = {
      question: questions[qIdx].question,
      category: questions[qIdx].category,
      type:     questions[qIdx].type,
      duration: withRec ? dur : 0,
      estimatedScore: withRec ? Math.round(score * 10) / 10 : 0,
      audioUrl: url,
    };

    const next = [...results, result];
    setResults(next);
    recorder.reset();
    setShowTips(false);

    if (qIdx < questions.length - 1) {
      setQIdx((i) => i + 1);
      setIsPreparing(true);
      setPrepLeft(PREP_SECONDS);
    } else {
      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
      const grade = estimateGrade(next.map((r) => r.estimatedScore)).grade;
      try {
        const raw = localStorage.getItem(HISTORY_KEY);
        const arr: SessionRecord[] = raw ? JSON.parse(raw) : [];
        arr.unshift({ id: `mock-${Date.now()}`, type: 'mock', date: new Date().toISOString(), topic: 'Full Mock Test', duration: totalTime, grade, questionsAnswered: next.filter((r) => r.duration > 0).length, totalQuestions: next.length });
        localStorage.setItem(HISTORY_KEY, JSON.stringify(arr.slice(0, 100)));
      } catch { /* ignore */ }
      setPhase('results');
    }
  }, [qIdx, questions, results, survey.level, recorder, totalTime]);

  useEffect(() => {
    if (recorder.audioURL && stopRecPendingRef.current) {
      stopRecPendingRef.current = false;
      finishQuestion(true, recorder.duration, recorder.audioURL);
    }
  }, [recorder.audioURL, finishQuestion, recorder.duration]);

  const saveAndNext = useCallback(() => {
    if (recorder.isRecording) {
      stopRecPendingRef.current = true;
      recorder.stop();
      return;
    }
    if (recorder.audioURL) {
      finishQuestion(true, recorder.duration, recorder.audioURL);
    } else {
      finishQuestion(false, 0);
    }
  }, [recorder, finishQuestion]);

  const skipQuestion = useCallback(() => {
    if (recorder.isRecording) recorder.stop();
    stopRecPendingRef.current = false;
    finishQuestion(false, 0);
  }, [recorder, finishQuestion]);

  const startTest = () => {
    const qs = generateQuestions(survey);
    setQuestions(qs);
    setQIdx(0);
    setResults([]);
    setTotalTime(0);
    setIsPreparing(true);
    setPrepLeft(PREP_SECONDS);
    setOrientCount(3);
    setPhase('orientation');
  };

  const resetAll = () => {
    recorder.reset();
    setPhase('survey');
    setSurveyStep('level');
    setSurvey({ level: '5&6', job: '', living: '', hobbies: [], sports: [] });
    setResults([]);
    setQIdx(0);
  };

  useEffect(() => {
    return () => { results.forEach((r) => { if (r.audioUrl) URL.revokeObjectURL(r.audioUrl); }); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const gradeResult = results.length > 0 ? estimateGrade(results.map((r) => r.estimatedScore)) : null;

  // ── Survey validation
  const canAdvance = (() => {
    if (surveyStep === 'level')   return !!survey.level;
    if (surveyStep === 'job')     return !!survey.job;
    if (surveyStep === 'living')  return !!survey.living;
    if (surveyStep === 'hobbies') return survey.hobbies.length >= 2;
    if (surveyStep === 'sports')  return survey.sports.length >= 1;
    return false;
  })();

  const stepIdx   = SURVEY_STEPS.indexOf(surveyStep);
  const isLastStep = surveyStep === 'sports';

  const goNextStep = () => {
    if (!canAdvance) return;
    if (isLastStep) { startTest(); return; }
    setSurveyStep(SURVEY_STEPS[stepIdx + 1]);
  };
  const goPrevStep = () => {
    if (stepIdx === 0) return;
    setSurveyStep(SURVEY_STEPS[stepIdx - 1]);
  };

  // ════════════════════════════════════════════════════════════════════════════
  // ─── RENDER: SURVEY ──────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === 'survey') {
    const LEVEL_COLORS: Record<string, string> = {
      gray: 'border-gray-400/40 bg-gray-400/[0.07]',
      teal: 'border-teal-400/40 bg-teal-400/[0.07]',
      blue: 'border-blue-400/40 bg-blue-400/[0.07]',
      violet: 'border-violet-400/40 bg-violet-400/[0.07]',
      amber: 'border-amber-400/40 bg-amber-400/[0.07]',
    };

    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col">
        {/* Header bar */}
        <div className="bg-[var(--bg-card)] border-b border-[var(--border-color)]">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">OPIc 모의고사</span>
              <span className="text-xs text-[var(--text-muted)]">{stepIdx + 1} / {SURVEY_STEPS.length}</span>
            </div>
            {/* Step progress dots */}
            <div className="flex gap-1.5">
              {SURVEY_STEPS.map((s, i) => (
                <div
                  key={s}
                  className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                    i < stepIdx ? 'bg-indigo-500' : i === stepIdx ? 'bg-indigo-400' : 'bg-[var(--border-color)]'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">

          {/* ── Step: Level ── */}
          {surveyStep === 'level' && (
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wider font-semibold">난이도 선택</p>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">목표 난이도를 선택해 주세요</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">실제 OPIc 시험의 콤보 선택 방식과 동일합니다</p>
              <div className="space-y-3">
                {LEVEL_OPTIONS.map((opt) => {
                  const isSelected = survey.level === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSurvey((s) => ({ ...s, level: opt.id }))}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? `${LEVEL_COLORS[opt.color]} ring-1 ring-indigo-400/30`
                          : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-white/[0.15]'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected ? 'border-indigo-400 bg-indigo-400' : 'border-[var(--border-color)]'}`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex-1">
                        <span className="font-semibold text-[var(--text-primary)] text-sm">{opt.label}</span>
                        {'recommended' in opt && opt.recommended && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-400">추천</span>
                        )}
                      </div>
                      <span className="text-xs text-[var(--text-muted)]">{opt.grade}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Step: Job ── */}
          {surveyStep === 'job' && (
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wider font-semibold">배경 서베이 1/4</p>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">현재 귀하의 신분은 무엇입니까?</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">하나를 선택해 주세요</p>
              <div className="space-y-3">
                {JOB_OPTIONS.map((opt) => {
                  const isSelected = survey.job === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSurvey((s) => ({ ...s, job: opt.id }))}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-indigo-400/50 bg-indigo-500/[0.08] ring-1 ring-indigo-400/20'
                          : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-white/[0.15]'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-indigo-400 bg-indigo-400' : 'border-[var(--border-color)]'}`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)] text-sm">{opt.label}</p>
                        <p className="text-xs text-[var(--text-muted)]">{opt.sub}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Step: Living ── */}
          {surveyStep === 'living' && (
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wider font-semibold">배경 서베이 2/4</p>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">현재 어떤 형태의 집에 살고 있습니까?</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">하나를 선택해 주세요</p>
              <div className="space-y-3">
                {LIVING_OPTIONS.map((opt) => {
                  const isSelected = survey.living === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setSurvey((s) => ({ ...s, living: opt.id }))}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                        isSelected
                          ? 'border-indigo-400/50 bg-indigo-500/[0.08] ring-1 ring-indigo-400/20'
                          : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-white/[0.15]'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isSelected ? 'border-indigo-400 bg-indigo-400' : 'border-[var(--border-color)]'}`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--text-primary)] text-sm">{opt.label}</p>
                        <p className="text-xs text-[var(--text-muted)]">{opt.sub}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Step: Hobbies ── */}
          {surveyStep === 'hobbies' && (
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wider font-semibold">배경 서베이 3/4</p>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">여가 시간에 주로 하는 활동을 선택해 주세요</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                최소 2개, 최대 3개 선택
                <span className={`ml-2 font-semibold ${survey.hobbies.length >= 2 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  ({survey.hobbies.length}개 선택됨)
                </span>
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {HOBBY_OPTIONS.map((opt) => {
                  const isSelected = survey.hobbies.includes(opt.id);
                  const maxReached = survey.hobbies.length >= 3 && !isSelected;
                  return (
                    <button
                      key={opt.id}
                      disabled={maxReached}
                      onClick={() => {
                        setSurvey((s) => ({
                          ...s,
                          hobbies: isSelected
                            ? s.hobbies.filter((h) => h !== opt.id)
                            : s.hobbies.length < 3 ? [...s.hobbies, opt.id] : s.hobbies,
                        }));
                      }}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-left text-sm transition-all disabled:opacity-40 ${
                        isSelected
                          ? 'border-indigo-400/50 bg-indigo-500/[0.12] text-indigo-300 font-semibold'
                          : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-white/[0.15]'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border ${isSelected ? 'bg-indigo-400 border-indigo-400' : 'border-[var(--border-color)]'}`}>
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Step: Sports ── */}
          {surveyStep === 'sports' && (
            <div>
              <p className="text-xs text-[var(--text-muted)] mb-1 uppercase tracking-wider font-semibold">배경 서베이 4/4</p>
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">주로 하는 운동을 선택해 주세요</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                최소 1개, 최대 2개 선택
                <span className={`ml-2 font-semibold ${survey.sports.length >= 1 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  ({survey.sports.length}개 선택됨)
                </span>
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {SPORT_OPTIONS.map((opt) => {
                  const isSelected = survey.sports.includes(opt.id);
                  const maxReached = survey.sports.length >= 2 && !isSelected;
                  return (
                    <button
                      key={opt.id}
                      disabled={maxReached}
                      onClick={() => {
                        setSurvey((s) => ({
                          ...s,
                          sports: isSelected
                            ? s.sports.filter((x) => x !== opt.id)
                            : s.sports.length < 2 ? [...s.sports, opt.id] : s.sports,
                        }));
                      }}
                      className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-left text-sm transition-all disabled:opacity-40 ${
                        isSelected
                          ? 'border-emerald-400/50 bg-emerald-500/[0.12] text-emerald-300 font-semibold'
                          : 'border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-white/[0.15]'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border ${isSelected ? 'bg-emerald-400 border-emerald-400' : 'border-[var(--border-color)]'}`}>
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {stepIdx > 0 && (
              <button
                onClick={goPrevStep}
                className="flex items-center gap-2 px-5 py-3 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--bg-secondary)] transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                이전
              </button>
            )}
            <button
              onClick={goNextStep}
              disabled={!canAdvance}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl gradient-primary text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all shadow-sm"
            >
              {isLastStep ? (
                <><Play className="w-4 h-4" />시험 시작하기</>
              ) : (
                <>다음<ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
          {surveyStep === 'hobbies' && survey.hobbies.length < 2 && (
            <p className="text-center text-xs text-amber-400 mt-3">최소 2개를 선택해야 다음으로 이동할 수 있습니다</p>
          )}
          {surveyStep === 'sports' && survey.sports.length < 1 && (
            <p className="text-center text-xs text-amber-400 mt-3">최소 1개를 선택해야 시험을 시작할 수 있습니다</p>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ─── RENDER: ORIENTATION ────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === 'orientation') {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-32 h-32 rounded-full border-4 border-indigo-500/30 bg-indigo-500/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-6xl font-bold text-indigo-400 tabular-nums">{orientCount || '!'}</span>
          </div>
          <p className="text-xl font-semibold text-[var(--text-primary)] mb-2">
            {orientCount > 0 ? '시험을 시작합니다' : '시작!'}
          </p>
          <p className="text-sm text-[var(--text-secondary)]">총 15문항 · 실제 OPIc 시험 방식</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs text-[var(--text-muted)]">
            <span className="px-3 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)]">자기소개 → 취미 → 스포츠</span>
            <span className="px-3 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)]">롤플레이 → 돌발 문제</span>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ─── RENDER: TEST ────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === 'test' && currentQ) {
    const progress = ((qIdx + 1) / questions.length) * 100;
    const typeConfig = getTypeConfig(currentQ.type);
    const recTime = recorder.duration;
    const isRec = recorder.isRecording;

    return (
      <div className="min-h-screen bg-[var(--bg-primary)]">
        {/* Sticky header */}
        <div className="sticky top-0 z-20 bg-[var(--bg-card)] border-b border-[var(--border-color)] shadow-sm">
          <div className="max-w-3xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[var(--text-primary)]">
                  문항 {qIdx + 1} / {questions.length}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${typeConfig.color}`}>
                  {typeConfig.label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                <Clock className="w-4 h-4" />
                <span className="tabular-nums font-mono">{formatTime(totalTime)}</span>
              </div>
            </div>
            <div className="h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
              <div className="h-full rounded-full gradient-primary transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
          {/* Question card */}
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 sm:p-8 mb-4 shadow-sm">
            <div className="flex items-start justify-between gap-4 mb-4">
              <p className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] leading-relaxed">
                {currentQ.question}
              </p>
            </div>
            <button
              onClick={() => isSpeaking ? stopTTS() : speak(currentQ.question, 0.85)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition-all text-sm font-medium border border-indigo-500/20"
            >
              {isSpeaking ? <Pause size={13} /> : <Volume2 size={13} />}
              {isSpeaking ? '정지' : '질문 듣기'}
            </button>
          </div>

          {/* ── PREP TIME ── */}
          {isPreparing ? (
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-8 mb-4 shadow-sm text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-3">문항 준비 시간</p>
              <div className="relative inline-flex items-center justify-center mb-4">
                <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="44" fill="none" stroke="var(--border-color)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="44" fill="none"
                    stroke="#6366f1" strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 44}`}
                    strokeDashoffset={`${2 * Math.PI * 44 * (1 - prepLeft / PREP_SECONDS)}`}
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <span className="absolute text-4xl font-bold tabular-nums text-[var(--text-primary)]">{prepLeft}</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-6">답변을 준비하세요. 준비되면 바로 녹음을 시작하세요.</p>
              <button
                onClick={() => { setIsPreparing(false); if (prepTimerRef.current) clearInterval(prepTimerRef.current); }}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition-all shadow-md"
              >
                <Mic className="w-5 h-5" />
                지금 바로 녹음 시작
              </button>
            </div>
          ) : (
            /* ── RECORDING AREA ── */
            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 sm:p-8 mb-4 shadow-sm">
              {recorder.error && (
                <div className="flex items-start gap-3 px-4 py-3 mb-4 rounded-xl bg-red-500/10 border border-red-500/20">
                  <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">{recorder.error}</p>
                </div>
              )}
              <div className="text-center">
                {/* Record button */}
                <div className="relative inline-flex items-center justify-center mb-5">
                  {isRec && (
                    <>
                      <div className="absolute w-32 h-32 rounded-full bg-red-500/25 animate-ping" />
                      <div className="absolute w-28 h-28 rounded-full bg-red-500/35 animate-pulse" />
                    </>
                  )}
                  <button
                    onClick={isRec ? () => recorder.stop() : async () => { if (isSpeaking) stopTTS(); await recorder.start(); }}
                    disabled={!recorder.isSupported}
                    className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg disabled:opacity-50 ${
                      isRec ? 'bg-red-500 hover:bg-red-600 text-white' : 'gradient-primary text-white hover:opacity-90'
                    }`}
                  >
                    {isRec ? <Square className="w-10 h-10" /> : <Mic className="w-10 h-10" />}
                  </button>
                </div>

                {/* Timer */}
                <div className="mb-5">
                  <p className="text-4xl font-mono font-bold tabular-nums text-[var(--text-primary)]">
                    {formatTime(recTime)}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-1.5">
                    {isRec
                      ? '녹음 중... (최대 2:00)'
                      : recorder.audioURL
                      ? '✓ 녹음 완료 — "다음 문항"으로 저장'
                      : '마이크 버튼을 눌러 녹음을 시작하세요'}
                  </p>
                  {/* Progress bar */}
                  <div className="mt-3 max-w-xs mx-auto h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${recTime > 90 ? 'bg-red-500' : 'bg-indigo-500'}`}
                      style={{ width: `${(recTime / MAX_RECORD_SECONDS) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Waveform */}
                <div className="flex items-center justify-center gap-[3px] h-10 mb-5">
                  {Array.from({ length: 28 }).map((_, i) => {
                    const ph = Math.sin((Date.now() / 80 + i) * 0.5);
                    const h = isRec ? 4 + Math.abs(ph) * recorder.level * 32 + recorder.level * 6 : 4;
                    return (
                      <div
                        key={i}
                        className={`w-1 rounded-full transition-all duration-75 ${isRec ? 'bg-red-400' : 'bg-[var(--border-color)]'}`}
                        style={{ height: `${Math.max(4, h)}px` }}
                      />
                    );
                  })}
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={skipQuestion}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--bg-secondary)] transition-colors"
                  >
                    <SkipForward className="w-4 h-4" />
                    건너뛰기
                  </button>
                  <button
                    onClick={saveAndNext}
                    className="flex items-center gap-2 px-7 py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
                  >
                    {qIdx < questions.length - 1 ? '다음 문항' : '시험 완료'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tips toggle */}
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden">
            <button
              onClick={() => setShowTips(!showTips)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-[var(--bg-secondary)] transition-colors"
            >
              <span className="flex items-center gap-2 text-sm font-medium text-[var(--text-secondary)]">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                답변 팁 보기
              </span>
              {showTips ? <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" /> : <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />}
            </button>
            {showTips && (
              <div className="px-5 pb-4 border-t border-[var(--border-color)]">
                <ul className="space-y-2 pt-3">
                  {currentQ.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                      <span className="text-amber-400 font-bold shrink-0">·</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ─── RENDER: RESULTS ────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  const strengths  = [...new Set(results.filter((r) => r.estimatedScore >= 7).map((r) => r.category))].slice(0, 3);
  const weaknesses = [...new Set(results.filter((r) => r.estimatedScore > 0 && r.estimatedScore < 5).map((r) => r.category))].slice(0, 3);

  const typeBreakdown = (['self-intro', 'describe', 'routine', 'experience', 'roleplay', 'unexpected'] as QuestionType[]).map((t) => {
    const group = results.filter((r) => r.type === t && r.estimatedScore > 0);
    const avg   = group.length > 0 ? group.reduce((a, b) => a + b.estimatedScore, 0) / group.length : null;
    return { type: t, avg, count: group.length, config: getTypeConfig(t) };
  }).filter((x) => x.count > 0);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20 text-sm font-medium mb-4">
            <Trophy className="w-4 h-4" />
            시험 완료
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-2">결과 리포트</h1>
          <p className="text-[var(--text-secondary)]">
            총 {formatTime(totalTime)} 소요 · {results.filter((r) => r.duration > 0).length}/{results.length} 문항 답변 완료
          </p>
        </div>

        {/* Grade display */}
        {gradeResult && (
          <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-8 sm:p-10 mb-6 text-center shadow-lg">
            <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">예상 등급</p>
            <div className={`inline-flex items-center justify-center w-28 h-28 rounded-full bg-gradient-to-br ${gradeResult.color} text-white mb-4 shadow-xl`}>
              <span className="text-4xl font-bold">{gradeResult.grade}</span>
            </div>
            <p className="text-xl font-semibold text-[var(--text-primary)] mb-6">{gradeResult.label}</p>
            <div className="max-w-lg mx-auto">
              <div className="relative h-3 rounded-full overflow-visible mb-2">
                <div className="absolute inset-0 rounded-full overflow-hidden flex">
                  {['bg-gray-400','bg-teal-400','bg-blue-400','bg-indigo-400','bg-violet-400','bg-amber-400'].map((c,i) => (
                    <div key={i} className={`h-full flex-1 ${c}`} />
                  ))}
                </div>
                <div
                  className="absolute top-1/2 w-5 h-5 rounded-full bg-white border-2 border-indigo-600 shadow-md"
                  style={{ left: `${gradeResult.position}%`, transform: 'translate(-50%, -50%)' }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                {['IL','IM1','IM2','IM3','IH','AL'].map((g) => <span key={g}>{g}</span>)}
              </div>
            </div>
          </div>
        )}

        {/* Type breakdown */}
        {typeBreakdown.length > 0 && (
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-6 mb-6">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              문항 유형별 분석
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {typeBreakdown.map(({ type, avg, count, config }) => (
                <div key={type} className={`p-3 rounded-xl border ${config.color} border-opacity-50`}>
                  <p className={`text-xs font-bold mb-1 ${config.color.split(' ')[1]}`}>{config.label}</p>
                  <p className="text-lg font-bold text-[var(--text-primary)] tabular-nums">{avg?.toFixed(1)}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{count}문항 평균</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-200 dark:border-emerald-500/20 p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-semibold text-emerald-800 dark:text-emerald-300 text-sm">잘한 영역</h3>
            </div>
            {strengths.length > 0 ? (
              <ul className="space-y-1.5">
                {strengths.map((s, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />{s}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">계속 연습하면 강점이 보입니다!</p>
            )}
          </div>
          <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-200 dark:border-red-500/20 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-red-600 dark:text-red-400" />
              <h3 className="font-semibold text-red-800 dark:text-red-300 text-sm">보완할 영역</h3>
            </div>
            {weaknesses.length > 0 ? (
              <ul className="space-y-1.5">
                {weaknesses.map((w, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-red-700 dark:text-red-400">
                    <XCircle className="w-3.5 h-3.5 shrink-0" />{w}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-red-600 dark:text-red-400">전반적으로 균형 잡힌 결과입니다!</p>
            )}
          </div>
        </div>

        {/* Per-question breakdown */}
        <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden mb-8">
          <div className="px-5 py-4 border-b border-[var(--border-color)]">
            <h3 className="font-semibold text-[var(--text-primary)]">문항별 결과</h3>
          </div>
          <audio ref={audioRef} onEnded={() => setPlayingIdx(null)} onPause={() => setPlayingIdx(null)} />
          <div className="divide-y divide-[var(--border-color)]">
            {results.map((r, i) => {
              const tc = getTypeConfig(r.type);
              return (
                <div key={i} className="px-5 py-3.5 flex items-center gap-3">
                  <div className="shrink-0 w-7 h-7 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center text-xs font-bold text-[var(--text-muted)]">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text-primary)] truncate">{r.question}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${tc.color}`}>{tc.label}</span>
                      <span className="text-xs text-[var(--text-muted)]">{r.category}</span>
                      {r.duration > 0 && <span className="text-xs text-[var(--text-muted)]">{formatTime(r.duration)}</span>}
                    </div>
                  </div>
                  {r.audioUrl && (
                    <button
                      onClick={() => {
                        if (!audioRef.current) return;
                        if (playingIdx === i) { audioRef.current.pause(); setPlayingIdx(null); return; }
                        audioRef.current.pause();
                        audioRef.current.src = r.audioUrl!;
                        audioRef.current.play().then(() => setPlayingIdx(i)).catch(() => setPlayingIdx(null));
                      }}
                      className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 text-xs font-medium border border-indigo-500/20 transition-all"
                    >
                      {playingIdx === i ? <Pause size={11} /> : <Play size={11} />}
                      {playingIdx === i ? '정지' : '듣기'}
                    </button>
                  )}
                  <div className="shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      r.estimatedScore >= 7 ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                      : r.estimatedScore >= 4 ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                      : r.estimatedScore > 0 ? 'bg-red-500/15 text-red-400 border-red-500/20'
                      : 'bg-gray-500/15 text-gray-400 border-gray-500/20'
                    }`}>
                      {r.estimatedScore > 0 ? r.estimatedScore.toFixed(1) : '건너뜀'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={resetAll}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 rounded-xl gradient-primary text-white font-semibold hover:opacity-90 transition-all shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            다시 시험 보기
          </button>
          <button
            onClick={() => { window.location.href = '/opic/history'; }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-secondary)] transition-colors"
          >
            <Award className="w-4 h-4" />
            기록 보기
          </button>
        </div>
      </div>
    </div>
  );
}
