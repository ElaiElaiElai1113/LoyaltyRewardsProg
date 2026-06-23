import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.medellinrewards.app',
  appName: 'Medellin Rewards',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#2F2014',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
}

export default config
