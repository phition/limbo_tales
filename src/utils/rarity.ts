import React from 'react';
import { I18nService } from '../i18n/I18nService';

export type ItemRarity = 'common' | 'rare' | 'unique' | 'epic' | 'legendary' | 'legend' | 'mythic' | string;

export const RARITY_COLORS: Record<string, string> = {
  common: '#90a4ae',
  rare: '#42a5f5',
  unique: '#ab47bc',
  epic: '#ce93d8',
  legendary: '#ffd54f',
  legend: '#ffd54f',
  mythic: '#ff416c',
};

export const getRarityColor = (rarity?: string): string => {
  if (!rarity) return '#90a4ae';
  return RARITY_COLORS[rarity.toLowerCase()] || '#90a4ae';
};

export const getRarityLabel = (rarity?: string, lang?: string): string => {
  const currentLang = lang || I18nService.getInstance().getLanguage();
  if (currentLang === 'en') {
    switch (rarity?.toLowerCase()) {
      case 'rare': return 'Rare';
      case 'unique': return 'Unique';
      case 'epic': return 'Epic';
      case 'legendary':
      case 'legend': return 'Legendary';
      case 'mythic': return 'Mythic';
      case 'ancient': return 'Ancient';
      case 'relic': return 'Relic';
      default: return 'Common';
    }
  } else if (currentLang === 'ja') {
    switch (rarity?.toLowerCase()) {
      case 'rare': return '希少';
      case 'unique': return '固有';
      case 'epic': return '英雄';
      case 'legendary':
      case 'legend': return '伝説';
      case 'mythic': return '神話';
      case 'ancient': return '古代';
      case 'relic': return '遺物';
      default: return '一般';
    }
  }
  switch (rarity?.toLowerCase()) {
    case 'rare': return '희귀';
    case 'unique': return '고유';
    case 'epic': return '영웅';
    case 'legendary':
    case 'legend': return '전설';
    case 'mythic': return '신화';
    case 'ancient': return '고대';
    case 'relic': return '유물';
    default: return '일반';
  }
};

/** 장비 아이콘/슬롯용 테두리 및 은은한 발광 스타일 생성 */
export const getRarityBorderStyle = (rarity?: string): React.CSSProperties => {
  const color = getRarityColor(rarity);
  const isHighTier = rarity === 'epic' || rarity === 'legendary' || rarity === 'legend' || rarity === 'mythic';
  return {
    borderColor: `${color}aa`,
    boxShadow: isHighTier ? `0 0 8px ${color}55` : `0 0 4px ${color}33`,
    backgroundColor: `${color}15`,
  };
};
