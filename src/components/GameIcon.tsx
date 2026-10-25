import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { getIconMeta, ICON_MAP } from '../utils/iconMap';
import { CustomAssetService } from '../services/CustomAssetService';
import { getRarityBorderStyle } from '../utils/rarity';

/**
 * 🌟 에셋 경로 정규화 (Web / Capacitor Android WebView / 서브경로 호환)
 * - data:, http:, https:, blob: 등은 그대로 반환
 * - assets/... 또는 /assets/... 경로는 안전한 상대 경로('./assets/...')로 통일하여
 *   모바일 앱(file:/// 또는 https://localhost)에서 404 및 엑박 방지
 */
export function normalizeAssetPath(src?: string): string | undefined {
  if (!src || src === 'emoji') return src;
  if (src.startsWith('data:') || src.startsWith('http://') || src.startsWith('https://') || src.startsWith('blob:')) {
    return src;
  }
  const clean = src.replace(/^\/+/, '');
  if (!clean.startsWith('assets/')) {
    return src;
  }
  const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL)
    ? import.meta.env.BASE_URL.replace(/\/$/, '') + '/'
    : './';
  return `${base}${clean}`;
}

interface GameIconProps {
  /** 아이콘 식별 키 (예: 'wood', 'torch', 'bleed', 'bonfire') 또는 이모지/이미지 URL */
  name?: string;
  /** 직접 전달하는 이모지 또는 이미지 URL (name 대신 사용 가능) */
  icon?: string;
  /** 스튜디오 프리뷰용 직접 오버라이드 URL */
  overrideUrl?: string;
  /** 아이콘 픽셀 크기 (기본값: 18) */
  size?: number | string;
  /** 추가 CSS 클래스 */
  className?: string;
  /** 툴팁 / 대체 텍스트 */
  alt?: string;
  /** 인라인 텍스트 정렬 여부 (기본값: true) */
  inline?: boolean;
  /** 장비 등급별 테두리 및 글로우 적용 ('common' | 'rare' | 'unique' | 'epic' | 'legendary') */
  rarity?: string;
}

/**
 * 🌟 GameIcon: 커스텀 에셋 스튜디오 연동 및 스마트 이모지/이미지 하이브리드 아이콘 컴포넌트
 * - 순수 이모지 모드(Pure Emoji Mode): 0ms 즉시 렌더링 (단, 명시적 커스텀 오버라이드는 우선 표시)
 * - 외부 에셋 모드(Asset Mode): 고해상도 64x64 PNG 및 커스텀 에셋 렌더링
 * - 이미지 로드 실패 시 유니코드 이모지 즉각 폴백
 * - React 18 useSyncExternalStore로 스튜디오 설정 변경 시 0 렉 실시간 동기화
 */
export const GameIcon: React.FC<GameIconProps> = ({
  name,
  icon,
  overrideUrl,
  size = 18,
  className = '',
  alt,
  inline = true,
  rarity,
}) => {
  const [imgError, setImgError] = useState(false);
  const service = CustomAssetService.getInstance();

  // 에셋 스튜디오 변경 실시간 구독
  const version = useSyncExternalStore(service.subscribe.bind(service), () => service.getVersion());

  // 버전 또는 대상 키 변경 시 에러 상태 리셋
  useEffect(() => {
    setImgError(false);
  }, [version, name, icon, overrideUrl]);

  const targetKey = name || icon;
  const meta = targetKey ? (ICON_MAP[targetKey] || getIconMeta(targetKey)) : undefined;
  const emoji = meta?.fallback || icon || name || '❓';

  // 🌟 이모지(글리프 볼륨)와 64x64 그래픽 이미지 간의 시각적 크기 차이를 완벽 보정 (약 1.28배 & 최소 +4px)
  const numSize = typeof size === 'number' ? size : (parseInt(String(size), 10) || 18);
  const imgPixelSize = Math.round(Math.max(numSize * 1.28, numSize + 4));
  const imgWidthHeight = `${imgPixelSize}px`;
  const emojiWidthHeight = typeof size === 'number' ? `${size}px` : size;

  // 1. 커스텀 오버라이드 탐색 (overrideUrl 직접 전달 우선 -> name -> icon -> targetKey -> meta 매핑 키 순차 탐색)
  let customSrc: string | undefined = overrideUrl;
  if (!customSrc && name) customSrc = service.getIconOverride(name);
  if (!customSrc && icon) customSrc = service.getIconOverride(icon);
  if (!customSrc && targetKey) customSrc = service.getIconOverride(targetKey);
  if (!customSrc && meta && !targetKey?.startsWith('forge_t') && !targetKey?.startsWith('boss_uniq_')) {
    const foundEntry = Object.entries(ICON_MAP).find(([_, m]) => m === meta || m.src === meta.src);
    if (foundEntry) {
      customSrc = service.getIconOverride(foundEntry[0]);
    }
  }

  // customSrc 상대경로 정규화 (assets/... 및 /assets/... -> ./assets/...)
  const normalizedCustomSrc = normalizeAssetPath(customSrc);

  const isImageSource = (src?: string) => {
    if (!src || src === 'emoji') return false;
    return (
      src.startsWith('./') ||
      src.startsWith('/') ||
      src.startsWith('assets/') ||
      src.startsWith('http') ||
      src.startsWith('data:') ||
      src.startsWith('blob:') ||
      src.includes('.png') ||
      src.includes('.jpg') ||
      src.includes('.svg') ||
      src.includes('.webp')
    );
  };

  const isCustomEmojiString = !!(normalizedCustomSrc && normalizedCustomSrc !== 'emoji' && !isImageSource(normalizedCustomSrc));
  const effectiveEmoji = isCustomEmojiString ? normalizedCustomSrc : emoji;

  // 🌟 Asset Mode 기본 이미지 fallback: customSrc가 명시적 'emoji'가 아니고 Pure Emoji 모드가 아니라면 meta.src 활용!
  const effectiveImgSrc = (normalizedCustomSrc && normalizedCustomSrc !== 'emoji')
    ? normalizedCustomSrc
    : (!service.isPureEmojiMode() && normalizedCustomSrc !== 'emoji' && meta?.src)
    ? normalizeAssetPath(meta.src)
    : undefined;

  // 2. 렌더링 노드 생성
  let node: React.ReactNode = null;
  if (normalizedCustomSrc === 'emoji' || (service.isPureEmojiMode() && !normalizedCustomSrc) || isCustomEmojiString) {
    node = (
      <span
        className={`select-none shrink-0 ${inline && !rarity ? 'inline-flex items-center justify-center align-middle' : 'flex items-center justify-center'}`}
        style={{
          fontSize: emojiWidthHeight,
          lineHeight: 1,
          verticalAlign: (inline && !rarity) ? '-0.1em' : undefined,
        }}
        title={alt || meta?.label}
      >
        {effectiveEmoji}
      </span>
    );
  } else if (effectiveImgSrc && !imgError) {
    node = (
      <img
        src={effectiveImgSrc}
        alt={alt || meta?.label || targetKey || 'icon'}
        title={alt || meta?.label}
        onError={() => setImgError(true)}
        className={`select-none shrink-0 ${inline && !rarity ? 'inline-block align-middle' : ''}`}
        style={{
          width: imgWidthHeight,
          height: imgWidthHeight,
          objectFit: 'contain',
          verticalAlign: (inline && !rarity) ? '-0.20em' : undefined,
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
        }}
      />
    );
  } else if (icon && isImageSource(icon) && !imgError) {
    const cleanSrc = normalizeAssetPath(icon) || icon;
    node = (
      <img
        src={cleanSrc}
        alt={alt || 'icon'}
        onError={() => setImgError(true)}
        className={`select-none shrink-0 ${inline && !rarity ? 'inline-block align-middle' : ''}`}
        style={{
          width: imgWidthHeight,
          height: imgWidthHeight,
          objectFit: 'contain',
          verticalAlign: (inline && !rarity) ? '-0.20em' : undefined,
          filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.4))',
        }}
      />
    );
  } else {
    node = (
      <span
        className={`select-none shrink-0 ${inline && !rarity ? 'inline-flex items-center justify-center align-middle' : 'flex items-center justify-center'}`}
        style={{
          fontSize: emojiWidthHeight,
          lineHeight: 1,
          verticalAlign: (inline && !rarity) ? '-0.1em' : undefined,
        }}
        title={alt || meta?.label}
      >
        {emoji}
      </span>
    );
  }

  // 3. 만약 rarity가 전달된 경우 등급 테두리 박스로 감싸기
  if (rarity) {
    const rStyle = getRarityBorderStyle(rarity);
    return (
      <span
        className={`inline-flex items-center justify-center rounded-lg border p-1 shrink-0 transition-all ${className}`}
        style={{ ...rStyle, verticalAlign: inline ? '-0.25em' : undefined }}
        title={alt || meta?.label}
      >
        {node}
      </span>
    );
  }

  // 기본 출력 (래퍼 없이 기존대로 반환)
  return (
    <span className={className}>
      {node}
    </span>
  );
};

