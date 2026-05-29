'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

/* ── Minimal type shims for Web Speech API ──────────────────────── */

interface ISpeechRecognitionResult {
  readonly 0: { readonly transcript: string };
  readonly isFinal: boolean;
  readonly length: number;
}
interface ISpeechRecognitionResultList {
  readonly length: number;
  [index: number]: ISpeechRecognitionResult;
}
interface ISpeechRecognitionEvent extends Event {
  readonly results: ISpeechRecognitionResultList;
  readonly resultIndex: number;
}
interface ISpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}
interface ISpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  onresult: ((e: ISpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: ISpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
type ISpeechRecognitionCtor = new () => ISpeechRecognition;

const STT_ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': '마이크 권한이 거부됐어요. 브라우저 주소창 옆 자물쇠 아이콘에서 마이크를 허용해 주세요.',
  'service-not-allowed': 'HTTPS 환경에서만 음성 인식이 가능합니다.',
  'network': '네트워크 오류로 음성 인식에 실패했어요. 인터넷 연결을 확인해 주세요.',
  'audio-capture': '마이크를 찾을 수 없어요. 마이크가 연결되어 있는지 확인해 주세요.',
  'no-speech': '음성이 감지되지 않았어요. 마이크에 대고 말해보세요.',
  'aborted': '',
};

/* ─── STT (Speech Recognition) ─────────────────────────────────── */

/**
 * autoRestart: true  — for free-talk (keeps listening across utterance boundaries)
 * autoRestart: false — for one-shot shadowing scoring (default)
 */
export function useSpeechRecognition(
  onResult: (text: string) => void,
  { autoRestart = false }: { autoRestart?: boolean } = {}
) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interimText, setInterimText] = useState('');

  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const SpeechRecCtorRef = useRef<ISpeechRecognitionCtor | null>(null);
  const onResultRef = useRef(onResult);
  const isActiveRef = useRef(false);     // user intent: keep listening
  const autoRestartRef = useRef(autoRestart);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { onResultRef.current = onResult; }, [onResult]);
  useEffect(() => { autoRestartRef.current = autoRestart; }, [autoRestart]);

  useEffect(() => {
    const win = window as Window & {
      SpeechRecognition?: ISpeechRecognitionCtor;
      webkitSpeechRecognition?: ISpeechRecognitionCtor;
    };
    const Ctor = win.SpeechRecognition ?? win.webkitSpeechRecognition ?? null;
    SpeechRecCtorRef.current = Ctor;
    setIsSupported(!!Ctor);
  }, []);

  // Stored as a ref so onend can always call the latest version (avoids stale closure)
  const spawnRef = useRef<() => void>(() => {});
  spawnRef.current = () => {
    const Ctor = SpeechRecCtorRef.current;
    if (!Ctor || !isActiveRef.current) return;

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }

    const rec = new Ctor();
    rec.lang = 'en-US';
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.continuous = false; // always false — we handle restart manually for reliability

    rec.onresult = (e: ISpeechRecognitionEvent) => {
      const result = e.results[e.resultIndex];
      const transcript = result[0].transcript;
      if (result.isFinal) {
        setInterimText('');
        if (transcript.trim()) onResultRef.current(transcript.trim());
      } else {
        setInterimText(transcript);
      }
    };

    rec.onend = () => {
      if (recognitionRef.current === rec) recognitionRef.current = null;
      setInterimText('');
      if (isActiveRef.current && autoRestartRef.current) {
        // Auto-restart so the mic keeps listening between utterances
        restartTimerRef.current = setTimeout(() => spawnRef.current(), 150);
      } else if (!isActiveRef.current) {
        setIsListening(false);
      }
    };

    rec.onerror = (e: ISpeechRecognitionErrorEvent) => {
      if (recognitionRef.current === rec) recognitionRef.current = null;

      if (e.error === 'aborted') return; // triggered by our own abort() — ignore

      if (e.error === 'no-speech' && isActiveRef.current && autoRestartRef.current) {
        // Silence detected — restart silently instead of showing an error
        restartTimerRef.current = setTimeout(() => spawnRef.current(), 150);
        return;
      }

      const msg = STT_ERROR_MESSAGES[e.error];
      if (msg) setError(msg);
      isActiveRef.current = false;
      setIsListening(false);
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      recognitionRef.current = null;
      isActiveRef.current = false;
      setIsListening(false);
      setError('마이크를 시작할 수 없어요. 브라우저 마이크 권한을 확인해 주세요.');
    }
  };

  const startListening = useCallback(() => {
    if (restartTimerRef.current) { clearTimeout(restartTimerRef.current); restartTimerRef.current = null; }
    isActiveRef.current = true;
    setIsListening(true);
    setError(null);
    spawnRef.current();
  }, []);

  const stopListening = useCallback(() => {
    if (restartTimerRef.current) { clearTimeout(restartTimerRef.current); restartTimerRef.current = null; }
    isActiveRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimText('');
  }, []);

  const toggleListening = useCallback(() => {
    if (isActiveRef.current) stopListening();
    else startListening();
  }, [startListening, stopListening]);

  const clearError = useCallback(() => setError(null), []);

  // Cleanup on unmount
  useEffect(() => () => {
    isActiveRef.current = false;
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    if (recognitionRef.current) { try { recognitionRef.current.abort(); } catch { /* ignore */ } }
  }, []);

  return { isListening, isSupported, error, clearError, toggleListening, startListening, stopListening, interimText };
}

/* ─── TTS (Speech Synthesis) ────────────────────────────────────── */
export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported] = useState(() =>
    typeof window !== 'undefined' && !!window.speechSynthesis
  );

  const speak = useCallback((text: string, rate = 0.9, pitch = 1.0) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    // Clean up markdown / emoji before speaking
    const cleaned = text
      .replace(/💡.*?:/g, '')
      .replace(/[✅📝⭐🌟🎉💪🔥🎤]/gu, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/[#>`]/g, '')
      .trim();

    if (!cleaned) return;

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = 'en-US';
    utterance.rate = rate;
    utterance.pitch = pitch;

    // Prefer a natural English voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Zira'))
    );
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking, isSupported };
}
