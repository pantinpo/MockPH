import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.mockcallph.ai',
  appName: 'MockCall AI',
  webDir: 'dist',
  server: {
    url: process.env.CAPACITOR_SERVER_URL,
  },
}

export default config
