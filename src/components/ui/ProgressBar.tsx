'use client';

import React from 'react';

type ProgressSize = 'sm' | 'md' | 'lg';

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: ProgressSize;
  label?: string;
  showPercentage?: boolean;
  gradient?: boolean;
  color?: string;
  animated?: boolean;
  className?: string;
}

const sizeStyles: Record<ProgressSize, { track: string; bar: string; text: string }> = {
  sm: { track: 'h-1.5', bar: 'h-1.5', text: 'text-xs' },
  md: { track: 'h-2.5', bar: 'h-2.5', text: 'text-sm' },
  lg: { track: 'h-4', bar: 'h-4', text: 'text-sm' },
};

export default function ProgressBar({
  value,
  max = 100,
  size = 'md',
  label,
  showPercentage = false,
  gradient = true,
  color,
  animated = true,
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const styles = sizeStyles[size];

  const barStyle: React.CSSProperties = {
    width: `${percentage}%`,
    transition: animated ? 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
    ...(color ? { backgroundColor: color } : {}),
  };

  return (
    <div className={['w-full', className].filter(Boolean).join(' ')}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && (
            <span className={['font-medium text-[var(--text-primary)]', styles.text].join(' ')}>
              {label}
            </span>
          )}
          {showPercentage && (
            <span className={['text-[var(--text-muted)] tabular-nums', styles.text].join(' ')}>
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={[
          'w-full rounded-full overflow-hidden',
          'bg-surface-200 dark:bg-surface-700',
          styles.track,
        ].join(' ')}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || 'Progress'}
      >
        <div
          className={[
            'rounded-full',
            styles.bar,
            gradient && !color
              ? 'bg-gradient-to-r from-primary-500 via-accent-500 to-primary-400'
              : '',
          ]
            .filter(Boolean)
            .join(' ')}
          style={barStyle}
        >
          {animated && gradient && !color && (
            <div
              className="w-full h-full rounded-full opacity-30"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s linear infinite',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
