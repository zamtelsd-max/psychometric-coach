import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.psychometriccoach.app',
  appName: 'PsychometricCoach',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
  android: {
    buildOptions: {
      releaseType: 'AAB',
    },
    backgroundColor: '#0A528A',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0A528A',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
};

export default config;
