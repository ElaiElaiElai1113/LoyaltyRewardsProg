import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.rewardsplatform.app',
  appName: 'Rewards Platform',
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
