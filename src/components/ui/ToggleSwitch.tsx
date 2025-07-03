'use client';

import { useState } from 'react';
import { UserCheck, UserX } from 'lucide-react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  labels?: {
    active: string;
    inactive: string;
  };
  icons?: {
    active: React.ReactNode;
    inactive: React.ReactNode;
  };
  className?: string;
}

export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  loading = false,
  size = 'md',
  labels,
  icons,
  className = ''
}: ToggleSwitchProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const sizes = {
    sm: { 
      track: 'h-6 w-11', 
      thumb: 'h-4 w-4', 
      translate: 'translate-x-5',
      iconSize: 'w-3 h-3',
      textSize: 'text-xs'
    },
    md: { 
      track: 'h-8 w-14', 
      thumb: 'h-6 w-6', 
      translate: 'translate-x-6',
      iconSize: 'w-4 h-4',
      textSize: 'text-sm'
    },
    lg: { 
      track: 'h-10 w-18', 
      thumb: 'h-8 w-8', 
      translate: 'translate-x-8',
      iconSize: 'w-5 h-5',
      textSize: 'text-base'
    }
  };

  const currentSize = sizes[size];

  const handleToggle = async () => {
    if (disabled || loading) return;
    
    setIsAnimating(true);
    onChange(!checked);
    
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Label izquierda */}
      {labels && (
        <span className={`${currentSize.textSize} font-medium transition-all duration-300 ${
          !checked ? 'text-red-400 scale-105' : 'text-white/70 scale-95'
        }`}>
          {labels.inactive}
        </span>
      )}
      
      {/* Toggle Switch */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled || loading}
        className={`
          relative inline-flex items-center rounded-full transition-all duration-300 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-transparent
          ${currentSize.track}
          ${checked 
            ? 'bg-gradient-to-r from-green-400 to-green-600 shadow-green-200' 
            : 'bg-gradient-to-r from-red-400 to-red-600 shadow-red-200'
          }
          ${disabled || loading 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer hover:scale-105 active:scale-95 shadow-lg'
          }
          ${isAnimating ? 'animate-pulse' : ''}
        `}
        aria-pressed={checked}
        aria-label={`Toggle switch, currently ${checked ? 'active' : 'blocked'}`}
      >
        {/* Track glow effect */}
        <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
          checked ? 'shadow-green-300 shadow-md' : 'shadow-red-300 shadow-md'
        }`} />
        
        {/* Thumb */}
        <span
          className={`
            relative inline-block transform rounded-full bg-white transition-all duration-300 ease-in-out
            shadow-lg ring-0 ring-white ring-opacity-20
            ${currentSize.thumb}
            ${checked ? currentSize.translate : 'translate-x-1'}
            ${!disabled && !loading ? 'hover:shadow-xl' : ''}
            ${isAnimating ? 'scale-110' : ''}
          `}
        >
          {/* Icon container */}
          <div className="absolute inset-0 flex items-center justify-center">
            {loading ? (
              <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 ${
                size === 'sm' ? 'h-2 w-2' : size === 'md' ? 'h-3 w-3' : 'h-4 w-4'
              }`} />
            ) : icons ? (
              <div className={`${currentSize.iconSize} transition-all duration-200 ${
                checked ? 'text-green-600' : 'text-red-600'
              }`}>
                {checked ? icons.active : icons.inactive}
              </div>
            ) : (
              <div className={`${currentSize.iconSize} transition-all duration-200 ${
                checked ? 'text-green-600' : 'text-red-600'
              }`}>
                {checked ? <UserCheck /> : <UserX />}
              </div>
            )}
          </div>
        </span>

        {/* Ripple effect */}
        {isAnimating && (
          <div className="absolute inset-0 rounded-full bg-white opacity-30 animate-ping" />
        )}
      </button>

      {/* Label derecha */}
      {labels && (
        <span className={`${currentSize.textSize} font-medium transition-all duration-300 ${
          checked ? 'text-green-400 scale-105' : 'text-white/70 scale-95'
        }`}>
          {labels.active}
        </span>
      )}
    </div>
  );
}
