import React from 'react';
import { CHARACTER_CLASSES } from '../data/classes';
import { PROMPT_REGISTRY, PromptData } from '../data/prompts';
import { CustomAssetService } from '../services/CustomAssetService';

export interface VisualCombatant {
  id?: string;
  name: string;
  className?: string;
  classId?: string;
  level?: number;
  icon?: string;
  grade?: string;
  isPlayer?: boolean;
}

interface AttackerVisualBoxProps {
  attacker: VisualCombatant | null;
  side: 'player' | 'enemy';
  title?: string;
  isActing?: boolean;
  className?: string;
}

// 기본 정적 에셋 매핑
const DEFAULT_CLASS_IMAGES: Record<string, string> = {
  aegis_valkyrie: 'assets/valkyrie_saintess.jpg',
  paladin: 'assets/valkyrie_saintess.jpg',
  high_saintess: 'assets/valkyrie_saintess.jpg',
  valhalla_blade: 'assets/valkyrie_saintess.jpg',
  tactical_tower: 'assets/citadel_bonfire.jpg',
};

export const AttackerVisualBox: React.FC<AttackerVisualBoxProps> = ({
  attacker,
  side,
  title,
  isActing = false,
  className = '',
}) => {
  const isPlayer = side === 'player';
  const customAssetService = CustomAssetService.getInstance();

  if (!attacker) {
    return (
      <div
        className={`w-full p-2 rounded-xl border flex items-center justify-between transition-all ${
          isPlayer
            ? 'bg-[#09121f]/70 border-[#1a2d48] text-[#556987]'
            : 'bg-[#180d19]/70 border-[#321727] text-[#6b4c5e]'
        } ${className}`}
      >
        <div className="flex items-center gap-2">
          <div className="w-12 h-12 rounded-lg border border-dashed border-[#2b3a55] flex items-center justify-center text-xs text-[#556987]">
            {isPlayer ? '🛡️' : '⚔️'}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold">{title || (isPlayer ? '아군 공격 대기 중' : '적군 공격 대기 중')}</span>
            <span className="text-[10px] text-[#4a5a70]">다음 행동 턴을 기다리는 중입니다...</span>
          </div>
        </div>
      </div>
    );
  }

  // 1. 이미지 찾기 (커스텀 오버라이드 -> 기본 정적 에셋)
  const classId = attacker.classId || '';
  const customImg = customAssetService.getMercenaryOverride(classId);
  const staticImg = DEFAULT_CLASS_IMAGES[classId];
  const imageUrl = customImg || staticImg;

  // 2. 클래스 정보 및 프롬프트 데이터 찾기
  const clsInfo = CHARACTER_CLASSES[classId];
  const promptKey = clsInfo?.promptKey || `hero_${classId}`;
  const promptData: PromptData | undefined = PROMPT_REGISTRY[promptKey];

  // 프롬프트 대체 텍스트 생성 (레지스트리에 없더라도 각 클래스 속성에 맞춰 실시간 생성)
  const fallbackPrompt = promptData?.prompt ||
    `masterpiece portrait of anime ${attacker.className || classId || 'warrior'}, dark fantasy magitech style, clean sharp cel shading, dynamic battle action pose, glowing arcane aura, vibrant cinematic lighting, highly detailed lineart, 8k resolution`;
  
  const promptTitle = promptData?.title || `${attacker.className || attacker.name}의 시각 형상`;
  const promptDescription = promptData?.description || `${attacker.name}의 클래스 전술 외형 데이터입니다.`;

  return (
    <div
      className={`w-full p-2 rounded-xl border transition-all relative overflow-hidden shadow-lg ${
        isPlayer
          ? 'bg-gradient-to-r from-[#091424]/90 via-[#0d1c33]/90 to-[#07111e]/90 border-[#00d2ff55] shadow-[#00d2ff15]'
          : 'bg-gradient-to-r from-[#1c0c16]/90 via-[#270e1c]/90 to-[#140810]/90 border-[#ff416c55] shadow-[#ff416c15]'
      } ${isActing ? (isPlayer ? 'ring-2 ring-[#00d2ff] animate-pulse' : 'ring-2 ring-[#ff416c] animate-pulse') : ''} ${className}`}
    >
      {/* 액팅 뱃지 */}
      {isActing && (
        <div
          className={`absolute top-1 right-2 text-[9px] font-bold px-1.5 py-0.2 rounded-full font-mono uppercase ${
            isPlayer ? 'bg-[#00d2ff] text-black' : 'bg-[#ff416c] text-white'
          }`}
        >
          ATTACKING
        </div>
      )}

      {/* 헤더 바 */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <span className="text-xs">{isPlayer ? '🛡️' : '⚔️'}</span>
          <span className={`text-[11px] font-bold ${isPlayer ? 'text-[#00d2ff]' : 'text-[#ff6b8b]'}`}>
            {title || (isPlayer ? '아군 공격자' : '적군 공격자')}
          </span>
          <span className="text-[10px] text-white font-bold ml-1">{attacker.name}</span>
          {attacker.className && (
            <span className="text-[9px] text-[#8b9bb4]">({attacker.className} Lv.{attacker.level || 1})</span>
          )}
        </div>
      </div>

      {/* 메인 비주얼 영역: 이미지 or 프롬프트 */}
      {imageUrl ? (
        // ── Case A: 이미지가 존재하는 경우 ──
        <div className="flex items-center gap-2.5">
          <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-white/20 shrink-0 shadow-md">
            <img
              src={imageUrl}
              alt={attacker.name}
              className="w-full h-full object-cover object-center"
              onError={(e) => {
                // 이미지 로드 실패 시 숨김 처리하여 프롬프트 모드로 폴백
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="min-w-0 flex-1 flex flex-col justify-center">
            <div className="text-[11px] font-bold text-white truncate">{attacker.name}</div>
            <div className="text-[9px] text-[#8b9bb4] truncate">
              {promptTitle}
            </div>
            <div className="text-[9px] text-[#ffdd88] font-mono mt-0.5 truncate">
              ✦ 고유 전술 비주얼 활성화됨
            </div>
          </div>
        </div>
      ) : (
        // ── Case B: 이미지가 없는 경우 -> 클래스 맞춤 프롬프트 뷰어 노출 ──
        <div
          className={`p-2 rounded-lg border flex flex-col gap-1 text-[10px] ${
            isPlayer
              ? 'bg-[#0b182b]/80 border-[#00d2ff33] text-[#e1f5fe]'
              : 'bg-[#230f1b]/80 border-[#ff416c33] text-[#ffebee]'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 font-bold text-[9px]">
              <span className="text-[#ffd54f]">🎨</span>
              <span className={isPlayer ? 'text-[#00d2ff]' : 'text-[#ff80ab]'}>
                AI 일러스트 프롬프트 매트릭스
              </span>
              <span className="text-[8.5px] text-[#90caf9] font-normal">[{promptTitle}]</span>
            </div>
            <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-black/40 text-[#b0bec5]">
              PROMPT
            </span>
          </div>

          {/* 프롬프트 영문 키워드 박스 */}
          <div className="bg-black/50 p-1 rounded border border-white/10 font-mono text-[8.5px] text-[#cfd8dc] leading-tight line-clamp-2 select-all">
            "{fallbackPrompt}"
          </div>

          {/* 세계관 묘사 텍스트 */}
          <div className="text-[9px] text-[#b0bec5] truncate italic">
            💬 {promptDescription}
          </div>
        </div>
      )}
    </div>
  );
};
