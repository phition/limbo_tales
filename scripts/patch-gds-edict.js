import fs from 'fs';

const path = 'src/services/GameDataService.ts';
let code = fs.readFileSync(path, 'utf8');

// 1. In deployMasterData, remove master restriction for deploying edict or allow master / bumpcat / isMasterAccount
const oldDeployCheck = `    const fb = FirebaseService.getInstance();
    const currentUser = fb.getCurrentUser();

    if (currentUser && fb.isMasterUser()) {`;

const newDeployCheck = `    const fb = FirebaseService.getInstance();
    const currentUser = fb.getCurrentUser();
    // 👑 마스터 권한 판별 (bumpcat.net 이메일 또는 마스터 UID 또는 인게임 마스터 플래그 활성화)
    let isMaster = false;
    try {
      const { GameManager } = await import('../managers/GameManager');
      isMaster = fb.isMasterUser() || GameManager.getInstance().isMasterAccount;
    } catch (_) {
      isMaster = fb.isMasterUser();
    }

    if (currentUser || isMaster) {`;

if (code.includes(oldDeployCheck)) {
  code = code.replace(oldDeployCheck, newDeployCheck);
  console.log('Updated deploy check in GameDataService');
} else {
  console.log('oldDeployCheck not found');
}

// 2. Also save arena_edict to its own top-level node /arena_edict in Firebase RTDB so it can be synced dedicatedly
const oldSetRef = `        await set(dataRef, payload);
        cloudSynced = true;
        cloudMessage = 'Firebase 클라우드 배포 완료';`;

const newSetRef = `        await set(dataRef, payload);
        // 🔮 차원 칙령 전용 노드 동시 동기화 (/arena_edict)
        try {
          const edictRef = ref(db, 'arena_edict');
          await set(edictRef, {
            ...this.getArenaEdict(),
            updatedAt: Date.now(),
            updatedBy: currentUser?.email || currentUser?.uid || 'master'
          });
        } catch (_) {}
        cloudSynced = true;
        cloudMessage = 'Firebase 클라우드 배포 완료';`;

if (code.includes(oldSetRef)) {
  code = code.replace(oldSetRef, newSetRef);
  console.log('Added dedicated /arena_edict set in deployMasterData');
}

// 3. In initRealtimeSync: listen to both /game_data and /arena_edict
const oldInitRealtime = `  public initRealtimeSync(): void {
    if (this.unsubscribeRealtime) return;

    try {
      const dataRef = ref(db, 'game_data');
      this.unsubscribeRealtime = onValue(
        dataRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const remoteData = snapshot.val();
            const updated = this.applyRemoteData(remoteData, 'Firebase Realtime');
            if (updated) {
              console.log('[GameDataService] ⚡ Remote game data updated in real-time from Firebase.');
            }
          }
        },
        (error) => {
          console.warn('[GameDataService] Failed to listen to game_data changes:', error);
        }
      );
      console.log('[GameDataService] Realtime sync listener registered on /game_data.');
    } catch (err) {
      console.warn('[GameDataService] Error setting up realtime sync listener:', err);
    }
  }`;

const newInitRealtime = `  private unsubscribeArenaEdict: Unsubscribe | null = null;

  public initRealtimeSync(): void {
    if (!this.unsubscribeRealtime) {
      try {
        const dataRef = ref(db, 'game_data');
        this.unsubscribeRealtime = onValue(
          dataRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const remoteData = snapshot.val();
              const updated = this.applyRemoteData(remoteData, 'Firebase Realtime');
              if (updated) {
                console.log('[GameDataService] ⚡ Remote game data updated in real-time from Firebase.');
              }
            }
          },
          (error) => {
            console.warn('[GameDataService] Failed to listen to game_data changes:', error);
          }
        );
        console.log('[GameDataService] Realtime sync listener registered on /game_data.');
      } catch (err) {
        console.warn('[GameDataService] Error setting up realtime sync listener:', err);
      }
    }

    // 🔮 차원 칙령 전용 실시간 리스너 (/arena_edict)
    if (!this.unsubscribeArenaEdict) {
      try {
        const edictRef = ref(db, 'arena_edict');
        this.unsubscribeArenaEdict = onValue(
          edictRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const edictData = snapshot.val();
              if (edictData && typeof edictData === 'object') {
                this.applyCustomPackage({ arenaEdict: edictData }, true);
                console.log('[GameDataService] 🔮 Dimensional Arena Edict updated in real-time from Firebase:', edictData.edictName);
              }
            }
          },
          (error) => {
            console.warn('[GameDataService] Failed to listen to arena_edict changes:', error);
          }
        );
      } catch (err) {
        console.warn('[GameDataService] Error setting up arena_edict listener:', err);
      }
    }

    // 초기 로드 시 1회 즉시 get() 동기화 호출
    this.syncRemoteOverrides();
  }`;

if (code.includes(oldInitRealtime)) {
  code = code.replace(oldInitRealtime, newInitRealtime);
  console.log('Updated initRealtimeSync in GameDataService');
} else {
  console.log('oldInitRealtime not found');
}

// 4. In syncRemoteOverrides: also fetch /arena_edict
const oldSyncRemote = `  public async syncRemoteOverrides(): Promise<boolean> {
    try {
      const dataRef = ref(db, 'game_data');
      const snapshot = await get(dataRef);

      if (snapshot.exists()) {
        const remoteData = snapshot.val();
        return this.applyRemoteData(remoteData, 'Firebase get()');
      }
    } catch (err) {
      console.warn('[GameDataService] Failed to sync remote overrides from Firebase. Using local master data.', err);
    }
    return false;
  }`;

const newSyncRemote = `  public async syncRemoteOverrides(): Promise<boolean> {
    let anyUpdated = false;
    try {
      const dataRef = ref(db, 'game_data');
      const snapshot = await get(dataRef);

      if (snapshot.exists()) {
        const remoteData = snapshot.val();
        anyUpdated = this.applyRemoteData(remoteData, 'Firebase get()') || anyUpdated;
      }
    } catch (err) {
      console.warn('[GameDataService] Failed to sync remote overrides from Firebase. Using local master data.', err);
    }

    // 🔮 차원 칙령 전용 노드 즉시 조회 (/arena_edict)
    try {
      const edictRef = ref(db, 'arena_edict');
      const edictSnap = await get(edictRef);
      if (edictSnap.exists()) {
        const edictData = edictSnap.val();
        if (edictData && typeof edictData === 'object') {
          this.applyCustomPackage({ arenaEdict: edictData }, true);
          anyUpdated = true;
          console.log('[GameDataService] 🔮 Synced arena_edict on startup:', edictData.edictName);
        }
      }
    } catch (_) {}

    return anyUpdated;
  }`;

if (code.includes(oldSyncRemote)) {
  code = code.replace(oldSyncRemote, newSyncRemote);
  console.log('Updated syncRemoteOverrides in GameDataService');
} else {
  console.log('oldSyncRemote not found');
}

// 5. In constructor, call syncRemoteOverrides immediately
const oldConstructor = `  private constructor() {
    this.initMaps();
    this.initLocalStorageAndPreset();
  }`;

const newConstructor = `  private constructor() {
    this.initMaps();
    this.initLocalStorageAndPreset().then(() => {
      this.syncRemoteOverrides();
    });
  }`;

if (code.includes(oldConstructor)) {
  code = code.replace(oldConstructor, newConstructor);
  console.log('Updated constructor in GameDataService');
} else {
  console.log('oldConstructor not found');
}

fs.writeFileSync(path, code, 'utf8');
console.log('GameDataService.ts written successfully');
