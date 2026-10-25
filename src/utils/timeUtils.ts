import { SupportedLanguage } from '../i18n/types';

/**
 * ⏱️ 다국어 지원 시간 포맷터
 * 밀리초(ms) 또는 초(sec)를 받아 언어 설정(ko, en, ja)에 맞게 포맷팅
 */
export function formatDuration(seconds: number, lang: SupportedLanguage = 'ko', includeSeconds: boolean = false): string {
  const totalSec = Math.max(0, Math.ceil(seconds));
  if (totalSec <= 0) {
    if (lang === 'en') return '0s';
    if (lang === 'ja') return '0秒';
    return '0초';
  }

  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;

  if (days > 0) {
    if (lang === 'en') return `${days}d ${hours}h`;
    if (lang === 'ja') return `${days}日 ${hours}時間`;
    return `${days}일 ${hours}시간`;
  }
  if (hours > 0) {
    if (includeSeconds) {
      if (lang === 'en') return `${hours}h ${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
      if (lang === 'ja') return `${hours}時間 ${mins}分 ${secs < 10 ? '0' : ''}${secs}秒`;
      return `${hours}시간 ${mins}분 ${secs < 10 ? '0' : ''}${secs}초`;
    }
    if (lang === 'en') return `${hours}h ${mins}m`;
    if (lang === 'ja') return `${hours}時間 ${mins}分`;
    return `${hours}시간 ${mins}분`;
  }
  if (mins > 0) {
    if (lang === 'en') return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
    if (lang === 'ja') return `${mins}分 ${secs < 10 ? '0' : ''}${secs}秒`;
    return `${mins}분 ${secs < 10 ? '0' : ''}${secs}초`;
  }
  if (lang === 'en') return `${secs}s`;
  if (lang === 'ja') return `${secs}秒`;
  return `${secs}초`;
}

export function formatCooldownMs(ms: number, lang: SupportedLanguage = 'ko'): string {
  return formatDuration(ms / 1000, lang);
}

export function formatTimeLeft(seconds: number, lang: SupportedLanguage = 'ko'): string {
  const durationStr = formatDuration(seconds, lang);
  if (lang === 'en') return `${durationStr} left`;
  if (lang === 'ja') return `残り${durationStr}`;
  return `${durationStr} 남음`;
}

export function formatPerSec(seconds: number, lang: SupportedLanguage = 'ko'): string {
  if (lang === 'en') return `every ${seconds}s`;
  if (lang === 'ja') return `${seconds}秒ごと`;
  return `${seconds}초마다`;
}
