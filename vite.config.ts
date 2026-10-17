import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import fs from 'fs';
import path from 'path';

function customAssetSyncPlugin(): Plugin {
  return {
    name: 'vite-plugin-custom-asset-sync',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/custom-assets/status' && req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'ok', serverSyncActive: true }));
          return;
        }

        if (req.url === '/api/custom-assets/save' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const incoming = JSON.parse(body);
              const rootDir = process.cwd();
              const publicAssetsDir = path.join(rootDir, 'public', 'assets');
              const customUploadsDir = path.join(publicAssetsDir, 'custom_uploaded');
              const presetPath = path.join(publicAssetsDir, 'custom_assets_preset.json');

              // 1. 기존 프리셋 로드
              let preset: any = {
                pureEmojiMode: false,
                syntheticAudioOnly: false,
                iconOverrides: {},
                bgmOverrides: {},
                sfxOverrides: {},
                vfxOverrides: {},
                vfxConfigs: {},
                dungeonFloorOverrides: {},
                monsterOverrides: {},
                monsterVideoOverrides: {},
                mercenaryOverrides: {},
                npcOverrides: {},
                version: 1,
              };

              if (fs.existsSync(presetPath)) {
                try {
                  const raw = fs.readFileSync(presetPath, 'utf-8');
                  preset = { ...preset, ...JSON.parse(raw) };
                } catch (_) {}
              }

              // 2. 단일 base64 파일 디코더 및 저장
              const saveBase64 = (dataUrl: string, subfolder: string, safeKey: string): string => {
                if (!dataUrl || !dataUrl.startsWith('data:')) return dataUrl;
                const match = dataUrl.match(/^data:([a-zA-Z0-9\/+-]+);base64,(.+)$/);
                if (!match) return dataUrl;

                const mime = match[1];
                const b64 = match[2];
                let ext = '.png';
                if (mime.includes('jpeg') || mime.includes('jpg')) ext = '.jpg';
                else if (mime.includes('webp')) ext = '.webp';
                else if (mime.includes('gif')) ext = '.gif';
                else if (mime.includes('svg')) ext = '.svg';
                else if (mime.includes('mpeg') || mime.includes('mp3')) ext = '.mp3';
                else if (mime.includes('ogg')) ext = '.ogg';
                else if (mime.includes('wav')) ext = '.wav';
                else if (mime.includes('mp4')) ext = '.mp4';
                else if (mime.includes('webm')) ext = '.webm';

                const cleanKey = safeKey.replace(/[^a-zA-Z0-9_-]/g, '_');
                const filename = `${cleanKey}${ext}`;
                const targetDir = path.join(customUploadsDir, subfolder);
                fs.mkdirSync(targetDir, { recursive: true });

                const targetPath = path.join(targetDir, filename);
                fs.writeFileSync(targetPath, Buffer.from(b64, 'base64'));

                // 상대 에셋 경로 반환 (배포/서빙 호환)
                return `assets/custom_uploaded/${subfolder}/${filename}`;
              };

              // 3. 각 오버라이드 맵 처리
              const NPC_NAME_TO_ID_MAP: Record<string, string> = {
                '선봉대장 로이드': 'npc_lloyd',
                '방주 총괄 참모': 'npc_chief_advisor',
                '성녀 발키리아': 'npc_valkyria',
                '수석 대장장이 불카누스': 'npc_vulcanus',
                '수석 연금술사 알리샤': 'npc_alyssa',
                '기사단장 베른하르트': 'npc_bernhard',
                '보급관 엘릭': 'npc_elrik',
                '연금술사 이안': 'npc_ian',
                '성혈의 처녀 실비아': 'npc_sylvia_virgin',
                '타락에서 해방된 기사단장의 영혼': 'npc_knights_soul',
                '고대 방주의 잔류 사념': 'npc_ark_ai',
              };

              const categories: Array<{ key: string; folder: string }> = [
                { key: 'iconOverrides', folder: 'icons' },
                { key: 'vfxOverrides', folder: 'vfx' },
                { key: 'dungeonFloorOverrides', folder: 'dungeons' },
                { key: 'monsterOverrides', folder: 'monsters' },
                { key: 'monsterVideoOverrides', folder: 'monster_videos' },
                { key: 'mercenaryOverrides', folder: 'mercenaries' },
                { key: 'npcOverrides', folder: 'npcs' },
                { key: 'bgmOverrides', folder: 'bgm' },
                { key: 'sfxOverrides', folder: 'sfx' },
              ];

              const processedPreset: any = { ...incoming };

              for (const { key, folder } of categories) {
                if (incoming[key] && typeof incoming[key] === 'object') {
                  const updatedMap: Record<string, string> = { ...(preset[key] || {}) };
                  for (const [k, v] of Object.entries(incoming[key])) {
                    if (/^_+$/.test(k)) continue; // 언더스코어 잔여물 키 무시
                    if (typeof v === 'string') {
                      let fileKey = k;
                      if (folder === 'npcs' && NPC_NAME_TO_ID_MAP[k]) {
                        fileKey = NPC_NAME_TO_ID_MAP[k];
                      }
                      const finalUrl = saveBase64(v, folder, fileKey);
                      updatedMap[k] = finalUrl;
                    }
                  }
                  // 언더스코어 잔여 키 정화
                  Object.keys(updatedMap).forEach(k => {
                    if (/^_+$/.test(k)) delete updatedMap[k];
                  });
                  preset[key] = updatedMap;
                  processedPreset[key] = updatedMap;
                }
              }

              if (incoming.vfxConfigs && typeof incoming.vfxConfigs === 'object') {
                preset.vfxConfigs = { ...(preset.vfxConfigs || {}), ...incoming.vfxConfigs };
                processedPreset.vfxConfigs = preset.vfxConfigs;
              }

              if (incoming.pureEmojiMode !== undefined) preset.pureEmojiMode = incoming.pureEmojiMode;
              if (incoming.syntheticAudioOnly !== undefined) preset.syntheticAudioOnly = incoming.syntheticAudioOnly;
              preset.version = (preset.version || 1) + 1;
              processedPreset.version = preset.version;

              // 4. public/assets/custom_assets_preset.json 에 즉시 저장
              fs.writeFileSync(presetPath, JSON.stringify(preset, null, 2), 'utf-8');

              // 5. 루트 custom_assets/ 에도 백업 저장
              const customAssetsBackup = path.join(rootDir, 'custom_assets', 'custom_assets_preset.json');
              fs.mkdirSync(path.dirname(customAssetsBackup), { recursive: true });
              fs.writeFileSync(customAssetsBackup, JSON.stringify(preset, null, 2), 'utf-8');

              console.log(`[customAssetSyncPlugin] ✅ 에셋 프리셋이 로컬 파일시스템에 저장되었습니다. (version ${preset.version})`);

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, savedPreset: processedPreset }));
            } catch (err: any) {
              console.error('[customAssetSyncPlugin] ❌ 에셋 저장 실패:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        // ══════════════════════════════════════════════════════════
        // 📊 [마스터 데이터 스튜디오] 게임 수치/밸런스 영구 저장 API
        // ══════════════════════════════════════════════════════════
        if (req.url === '/api/custom-data/save' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const incoming = JSON.parse(body);
              const rootDir = process.cwd();
              const publicAssetsDir = path.join(rootDir, 'public', 'assets');
              const dataPresetPath = path.join(publicAssetsDir, 'custom_game_data.json');
              fs.mkdirSync(publicAssetsDir, { recursive: true });

              let existing: any = {};
              if (fs.existsSync(dataPresetPath)) {
                try {
                  existing = JSON.parse(fs.readFileSync(dataPresetPath, 'utf-8'));
                } catch (_) {}
              }

              const merged = {
                ...existing,
                ...incoming,
                version: (existing.version || 0) + 1,
                updatedAt: Date.now()
              };

              fs.writeFileSync(dataPresetPath, JSON.stringify(merged, null, 2), 'utf-8');

              // 루트 custom_assets/ 에도 백업 저장
              const backupPath = path.join(rootDir, 'custom_assets', 'custom_game_data.json');
              fs.mkdirSync(path.dirname(backupPath), { recursive: true });
              fs.writeFileSync(backupPath, JSON.stringify(merged, null, 2), 'utf-8');

              // 빌드 산출물(dist/assets)이 존재하는 경우 함께 동기화
              const distAssetsDir = path.join(rootDir, 'dist', 'assets');
              if (fs.existsSync(distAssetsDir)) {
                const distPresetPath = path.join(distAssetsDir, 'custom_game_data.json');
                fs.writeFileSync(distPresetPath, JSON.stringify(merged, null, 2), 'utf-8');
              }

              console.log(`[customAssetSyncPlugin] 📊 게임 밸런스/수치 데이터가 로컬 파일시스템에 저장되었습니다. (version ${merged.version})`);

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, savedData: merged }));
            } catch (err: any) {
              console.error('[customAssetSyncPlugin] ❌ 게임 데이터 저장 실패:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: false, error: err.message }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    customAssetSyncPlugin(),
  ],
  server: {
    port: 3000,
    open: false,
    host: true,
  },
  build: {
    target: 'esnext',
    assetsInlineLimit: 0,
  }
});
