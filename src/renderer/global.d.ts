import type { StickboardApi } from '@shared/types/ipc';

declare global {
  interface Window {
    /** Presente só dentro do Electron (preload). */
    stickboard?: StickboardApi;
  }
}

export {};
