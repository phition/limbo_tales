import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.limbo.tales',
  appName: 'Project: Limbo Tales',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    // 시스템 바 인셋(상태바/네비게이션 바/키보드)은 MainActivity 에서 단일 관리 → Capacitor 내장 처리와의 이중 패딩 방지
    SystemBars: {
      insetsHandling: 'disable'
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'DARK',
      backgroundColor: '#0b0d13'
    }
  }
};

export default config;
