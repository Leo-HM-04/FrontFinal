'use client';

import { useState, useCallback } from 'react';
import { UserCheck, UserX, Loader2 } from 'lucide-react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'danger';
  labels?: {
    active: string;
    inactive: string;
  };
  icons?: {
    active: React.ReactNode;
    inactive: React.ReactNode;
  };
  className?: string;
  description?: React.ReactNode;
}

export function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  loading = false,
  size = 'md',
  variant = 'default',
  labels,
  icons,
  className = '',
  description
}: ToggleSwitchProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  const sizes = {
    sm: { 
      track: 'h-6 w-11', 
      thumb: 'h-4 w-4', 
      translate: 'translate-x-5',
      iconSize: 'w-3 h-3',
      textSize: 'text-xs',
      padding: 'p-1'
    },
    md: { 
      track: 'h-8 w-14', 
      thumb: 'h-6 w-6', 
      translate: 'translate-x-6',
      iconSize: 'w-4 h-4',
      textSize: 'text-sm',
      padding: 'p-1'
    },
    lg: { 
      track: 'h-10 w-18', 
      thumb: 'h-8 w-8', 
      translate: 'translate-x-8',
      iconSize: 'w-5 h-5',
      textSize: 'text-base',
      padding: 'p-1'
    }
  };

  const variants = {
    default: {
      active: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
      inactive: 'bg-gradient-to-r from-slate-400 to-slate-500',
      activeText: 'text-emerald-600',
      inactiveText: 'text-slate-500',
      activeShadow: 'shadow-emerald-200/50',
      inactiveShadow: 'shadow-slate-200/50'
    },
    success: {
      active: 'bg-gradient-to-r from-green-500 to-green-600',
      inactive: 'bg-gradient-to-r from-red-500 to-red-600',
      activeText: 'text-green-600',
      inactiveText: 'text-red-600',
      activeShadow: 'shadow-green-200/50',
      inactiveShadow: 'shadow-red-200/50'
    },
    danger: {
      active: 'bg-gradient-to-r from-red-500 to-red-600',
      inactive: 'bg-gradient-to-r from-slate-400 to-slate-500',
      activeText: 'text-red-600',
      inactiveText: 'text-slate-500',
      activeShadow: 'shadow-red-200/50',
      inactiveShadow: 'shadow-slate-200/50'
    }
  };

  const currentSize = sizes[size];
  const currentVariant = variants[variant];

  const handleToggle = useCallback(async () => {
    if (disabled || loading) return;
    
    setIsAnimating(true);
    onChange(!checked);
    
    setTimeout(() => setIsAnimating(false), 200);
  }, [disabled, loading, checked, onChange]);

  const defaultIcons = {
    active: <UserCheck className="w-full h-full" />,
    inactive: <UserX className="w-full h-full" />
  };

  const currentIcons = icons || defaultIcons;

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center justify-between space-x-4">
        {/* Left Label */}
        {labels && (
          <div className="flex flex-col">
            <span className={`${currentSize.textSize} font-semibold transition-all duration-300 ${
              !checked ? currentVariant.inactiveText : 'text-slate-400'
            }`}>
              {labels.inactive}
            </span>
            {description && size === 'lg' && (
              <span className="text-xs text-slate-500 mt-0.5">
                {!checked ? description : ''}
              </span>
            )}
          </div>
        )}
        
        {/* Toggle Switch */}
        <div className="relative">
          <button
            type="button"
            onClick={handleToggle}
            disabled={disabled || loading}
            className={`
              relative inline-flex items-center rounded-full transition-all duration-300 ease-out
              focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:ring-offset-0
              ${currentSize.track} ${currentSize.padding}
              ${checked 
                ? `${currentVariant.active} shadow-lg ${currentVariant.activeShadow}` 
                : `${currentVariant.inactive} shadow-lg ${currentVariant.inactiveShadow}`
              }
              ${disabled || loading 
                ? 'opacity-60 cursor-not-allowed' 
                : 'cursor-pointer hover:scale-105 active:scale-100'
              }
              ${isAnimating ? 'ring-4 ring-blue-500/30' : ''}
              shadow-lg border border-white/20
            `}
            aria-pressed={checked}
            aria-label={`Toggle switch, currently ${checked ? 'active' : 'inactive'}`}
            aria-describedby={description ? 'toggle-description' : undefined}
          >
            {/* Track inner glow */}
            <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
              checked 
                ? 'shadow-inner shadow-emerald-700/20' 
                : 'shadow-inner shadow-slate-700/20'
            }`} />
            
            {/* Thumb */}
            <span
              className={`
                relative inline-flex items-center justify-center transform rounded-full 
                bg-white transition-all duration-300 ease-out
                shadow-lg ring-1 ring-slate-900/5
                ${currentSize.thumb}
                ${checked ? currentSize.translate : 'translate-x-0'}
                ${!disabled && !loading ? 'hover:shadow-xl' : ''}
                ${isAnimating ? 'scale-110' : 'scale-100'}
              `}
            >
              {/* Icon or Loading */}
              <div className={`${currentSize.iconSize} flex items-center justify-center`}>
                {loading ? (
                  <Loader2 className={`${currentSize.iconSize} animate-spin text-slate-600`} />
                ) : (
                  <div className={`${currentSize.iconSize} transition-all duration-200 ${
                    checked ? currentVariant.activeText : currentVariant.inactiveText
                  }`}>
                    {checked ? currentIcons.active : currentIcons.inactive}
                  </div>
                )}
              </div>
            </span>

            {/* Ripple effect */}
            {isAnimating && !loading && (
              <div className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
            )}
          </button>
        </div>

        {/* Right Label */}
        {labels && (
          <div className="flex flex-col">
            <span className={`${currentSize.textSize} font-semibold transition-all duration-300 ${
              checked ? currentVariant.activeText : 'text-slate-400'
            }`}>
              {labels.active}
            </span>
            {description && size === 'lg' && (
              <span className="text-xs text-slate-500 mt-0.5">
                {checked ? description : ''}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Description below toggle (for smaller sizes) */}
      {description && size !== 'lg' && (
        <p id="toggle-description" className="text-xs text-slate-500 mt-2 text-center">
          {description}
        </p>
      )}
    </div>
  );
}
