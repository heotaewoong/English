'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface RecorderState {
  isRecording: boolean;
  isPaused: boolean;
  isSupported: boolean;
  duration: number;          // seconds
  audioURL: string | null;   // blob URL for playback
  audioBlob: Blob | null;
  level: number;             // 0-1 live audio level (RMS)
  error: string | null;
}

export interface RecorderControls extends RecorderState {
  start: () => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

/**
 * useRecorder — real microphone audio recording via MediaRecorder API.
 *
 * Captures audio + provides live audio level (for waveform animation) +
 * exposes a playable blob URL when stopped.
 */
export function useRecorder(): RecorderControls {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [duration, setDuration] = useState(0);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [level, setLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastURLRef = useRef<string | null>(null);

  useEffect(() => {
    setIsSupported(
      typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices &&
      typeof MediaRecorder !== 'undefined'
    );
    return () => {
      cleanupResources();
      if (lastURLRef.current) URL.revokeObjectURL(lastURLRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanupResources = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
  };

  const startLevelMonitor = (stream: MediaStream) => {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);
      analyserRef.current = analyser;

      const buf = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (let i = 0; i < buf.length; i++) {
          const v = (buf[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / buf.length);
        // Boost a little so quiet voices still show
        setLevel(Math.min(1, rms * 2.5));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // silent — level monitor is non-essential
    }
  };

  const start = useCallback(async () => {
    setError(null);
    if (!isSupported) {
      setError('이 브라우저는 녹음을 지원하지 않아요. Chrome을 사용하세요.');
      return;
    }
    if (lastURLRef.current) {
      URL.revokeObjectURL(lastURLRef.current);
      lastURLRef.current = null;
    }
    setAudioURL(null);
    setAudioBlob(null);
    setDuration(0);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      startLevelMonitor(stream);

      // Pick a widely-supported mime type
      const mimeCandidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];
      const mimeType = mimeCandidates.find((t) => MediaRecorder.isTypeSupported(t)) || '';
      const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const type = mr.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        const url = URL.createObjectURL(blob);
        lastURLRef.current = url;
        setAudioBlob(blob);
        setAudioURL(url);
        setIsRecording(false);
        setIsPaused(false);
        setLevel(0);
        cleanupResources();
      };

      mr.start(100); // small timeslices for live data
      setIsRecording(true);

      const startedAt = Date.now();
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startedAt) / 1000));
      }, 250);
    } catch (e) {
      const msg = e instanceof Error ? e.message : '마이크 권한이 필요합니다.';
      setError(`녹음을 시작할 수 없어요: ${msg}`);
      cleanupResources();
    }
  }, [isSupported]);

  const stop = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== 'inactive') mr.stop();
  }, []);

  const pause = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state === 'recording') { mr.pause(); setIsPaused(true); }
  }, []);

  const resume = useCallback(() => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state === 'paused') { mr.resume(); setIsPaused(false); }
  }, []);

  const reset = useCallback(() => {
    if (lastURLRef.current) URL.revokeObjectURL(lastURLRef.current);
    lastURLRef.current = null;
    setAudioURL(null);
    setAudioBlob(null);
    setDuration(0);
    setLevel(0);
    setError(null);
  }, []);

  return {
    isRecording,
    isPaused,
    isSupported,
    duration,
    audioURL,
    audioBlob,
    level,
    error,
    start,
    stop,
    pause,
    resume,
    reset,
  };
}
