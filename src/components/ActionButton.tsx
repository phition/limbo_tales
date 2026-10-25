import React from 'react';
import { SoundManager } from '../managers/SoundManager';

interface Props {
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'danger-outline';
  disabled?: boolean;
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  style?: React.CSSProperties;
  size?: 'sm' | 'md' | 'lg';
  'data-tutorial-target'?: string;
}

export const ActionButton: React.FC<Props> = ({
  label, icon, variant = 'primary', disabled, onClick, className = '', style, size = 'md',
  'data-tutorial-target': dataTutorialTarget
}) => {
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-ghost',
    danger: 'btn-danger',
    success: 'btn-success',
    ghost: 'btn-ghost',
    'danger-outline': 'btn-danger-outline'
  }[variant];
  const sizeClass = { sm: 'text-xs px-2 py-1', md: 'text-sm px-3 py-1.5', lg: 'text-base px-4 py-2' }[size];

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    SoundManager.getInstance().play('click');
    onClick?.(e);
  };

  // 🌐 긴 번역 텍스트에 따른 적응형 폰트 축소 및 줄바꿈 지원
  const length = label ? label.length : 0;
  const adaptiveTextClass = length > 28
    ? 'text-[10px] sm:text-xs leading-tight'
    : length > 18
      ? (size === 'sm' ? 'text-[10px] leading-tight' : 'text-xs sm:text-sm leading-tight')
      : '';

  return (
    <button
      className={`btn ${variantClass} ${sizeClass} ${adaptiveTextClass} min-w-0 max-w-full leading-tight text-center break-words hyphens-auto ${className}`}
      disabled={disabled}
      onClick={handleClick}
      style={style}
      data-tutorial-target={dataTutorialTarget}
    >
      {icon && <span className="mr-1 shrink-0">{icon}</span>}
      <span className="min-w-0 break-words hyphens-auto inline-block">{label}</span>
    </button>
  );
};
