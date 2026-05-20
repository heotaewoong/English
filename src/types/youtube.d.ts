type YTConfig = {
  videoId?: string;
  playerVars?: Record<string, unknown>;
  events?: { onReady?: () => void; onStateChange?: (e: { data: number }) => void };
};

type YTPlayer = {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(sec: number, allow: boolean): void;
  getCurrentTime(): number;
  setPlaybackRate(r: number): void;
  destroy(): void;
};

declare global {
  interface Window {
    YT: {
      Player: new (el: HTMLElement, cfg: YTConfig) => YTPlayer;
      PlayerState: { UNSTARTED: -1; ENDED: 0; PLAYING: 1; PAUSED: 2; BUFFERING: 3; CUED: 5 };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}
