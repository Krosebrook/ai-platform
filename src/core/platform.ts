import { detectPlatform, type Platform } from './types';

let _platform: Platform | null = null;

export function getPlatform(): Platform {
  if (!_platform) _platform = detectPlatform();
  return _platform;
}

export function isElectron(): boolean {
  return getPlatform() === 'electron';
}

export function isPWA(): boolean {
  return getPlatform() === 'pwa';
}

export function checkBrowserSupport() {
  if (typeof window === 'undefined') return {};
  return {
    serviceWorker: 'serviceWorker' in navigator,
    pushManager: 'PushManager' in window,
    notification: 'Notification' in window,
    clipboard: 'clipboard' in navigator,
    indexedDB: 'indexedDB' in window,
    localStorage: 'localStorage' in window,
    cacheAPI: 'caches' in window,
    share: 'share' in navigator,
    fileSystemAccess: 'showOpenFilePicker' in window,
    speechRecognition: 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
    speechSynthesis: 'speechSynthesis' in window,
    mediaRecorder: 'MediaRecorder' in window,
  };
}
