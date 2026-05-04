import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  extra: {
    backendUrl: process.env.EXPO_PUBLIC_BACKEND_BASE_URL || 'http://localhost:9091',
  },
});
