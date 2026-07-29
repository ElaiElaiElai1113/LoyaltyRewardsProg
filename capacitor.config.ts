import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.rewardsplatform.app',
  appName: 'Pinas Rewards',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#11100E',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
}

export default config
