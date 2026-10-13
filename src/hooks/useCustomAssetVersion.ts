import { useSyncExternalStore } from 'react';
import { CustomAssetService } from '../services/CustomAssetService';

/**
 * 🎨 useCustomAssetVersion: 에셋 스튜디오 설정 변경 시 0ms 실시간 리렌더링 훅
 */
export function useCustomAssetVersion(): number {
  const service = CustomAssetService.getInstance();
  return useSyncExternalStore(
    service.subscribe.bind(service),
    () => service.getVersion()
  );
}
