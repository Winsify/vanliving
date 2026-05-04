import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Vanliving',
  slug: 'vanliving',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/vanliving logo1.png',
  scheme: 'vanliving',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  splash: {
    image: './assets/images/vanliving logo1.png',
    resizeMode: 'contain',
    backgroundColor: '#6F4E37',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'coffee.vanliving.app',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/images/vanliving logo1.png',
      backgroundColor: '#6F4E37',
    },
    package: 'coffee.vanliving.app',
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/vanliving logo1.png',
  },
  extra: {
    backendUrl: process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091',
  },
});
