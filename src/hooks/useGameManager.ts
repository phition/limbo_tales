import { useEffect, useState, useCallback } from 'react';
import { GameManager } from '../managers/GameManager';

export type GameSnapshot = ReturnType<GameManager['getSnapshot']>;

export function useGameManager() {
  const gm = GameManager.getInstance();
  const [state, setState] = useState<GameSnapshot>(() => gm.getSnapshot());

  useEffect(() => {
    const handler = () => {
      setState(gm.getSnapshot());
    };

    // 모든 주요 이벤트에 구독
    const events = [
      'update',
      'resourcesChanged',
      'partyUpdated',
      'buildingUpdated',
      'logAdded',
      'questUpdated',
      'screenChanged',
      'battleStateChanged',
      'dungeonUpdated',
      'dungeonInventoryUpdated',
      'pendingLootUpdated',
      'inventoryUpdated',
      'equipmentUpdated',
      'bondsUpdated',
      'invasionUpdated',
      'nemesisUpdated',
      'codexUpdated',
      'skillBooksUpdated',
      'cemeteryUpdated',
      'ancestralBlessingUpdated',
      'dungeonPurified',
    ];

    events.forEach(ev => gm.on(ev, handler));
    return () => {
      events.forEach(ev => gm.off(ev, handler));
    };
  }, [gm]);

  const navigateTo = useCallback((screen: 'citadel' | 'exploration' | 'battle' | 'arena') => {
    gm.navigateTo(screen);
  }, [gm]);

  return { state, gm, navigateTo };
}
