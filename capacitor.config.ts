import type { CapacitorConfig } from '@capacitor/cli';

// O APK empacota a build do renderer (React) em `dist/`; o processo principal do Electron não vai para o Android.
const config: CapacitorConfig = {
  appId: 'com.stickboard.app',
  appName: 'StickBoard',
  webDir: 'dist',
  backgroundColor: '#1e1e1e',
  android: { allowMixedContent: false },
};

export default config;
