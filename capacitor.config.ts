import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.rewardsplatform.app',
  appName: 'RewardMe',
  webDir: 'dist',
  bundledWebRuntime: false,
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#173F32',
      androidSplashResourceName: 'splash',
      showSpinner: false,
    },
  },
}

export default config
