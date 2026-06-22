import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'receipt-detective',
  brand: {
    displayName: '영수증 탐정',
    primaryColor: '#3182F6',
    icon: 'https://static.toss.im/assets/apps-in-toss/replace-with-console-uploaded-receipt-detective-icon.png',
  },
  web: {
    host: '172.30.1.27',
    port: 5173,
    commands: {
      dev: 'vite --host 0.0.0.0 --port 5173',
      build: 'vite build',
    },
  },
  webViewProps: {
    type: 'partner',
  },
  navigationBar: {
    withHomeButton: true,
  },
  permissions: [],
  outdir: 'dist',
});
