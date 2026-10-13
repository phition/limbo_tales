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
}

export const ActionButton: React.FC<Props> = ({
  label, icon, variant = 'primary', disabled, onClick, className = '', style, size = 'md'
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

  return (
    <button
      className={`btn ${variantClass} ${sizeClass} ${className}`}
      disabled={disabled}
      onClick={handleClick}
      style={style}
    >
      {icon && <span className="mr-1">{icon}</span>}{label}
    </button>
  );
};
