'use client';

import React, { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-gradient-to-r from-primary-500 to-accent-500',
    'text-white font-semibold',
    'shadow-lg shadow-primary-500/25',
    'hover:from-primary-600 hover:to-accent-600',
    'hover:shadow-xl hover:shadow-primary-500/30',
    'active:from-primary-700 active:to-accent-700',
    'active:scale-[0.98]',
  ].join(' '),
  secondary: [
    'bg-transparent',
    'text-primary-600 dark:text-primary-400',
    'border border-primary-300 dark:border-primary-700',
    'hover:bg-primary-50 dark:hover:bg-primary-950',
    'hover:border-primary-400 dark:hover:border-primary-600',
    'active:bg-primary-100 dark:active:bg-primary-900',
    'active:scale-[0.98]',
  ].join(' '),
  ghost: [
    'bg-transparent',
    'text-surface-600 dark:text-surface-400',
    'hover:bg-surface-100 dark:hover:bg-surface-800',
    'active:bg-surface-200 dark:active:bg-surface-700',
    'active:scale-[0.98]',
  ].join(' '),
  danger: [
    'bg-danger text-white font-semibold',
    'shadow-lg shadow-danger/25',
    'hover:bg-red-600 hover:shadow-xl hover:shadow-danger/30',
    'active:bg-red-700 active:scale-[0.98]',
  ].join(' '),
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-7 py-3.5 text-base rounded-xl gap-2.5',
};

const iconSizeStyles: Record<ButtonSize, string> = {
  sm: '[&_svg]:w-3.5 [&_svg]:h-3.5',
  md: '[&_svg]:w-4 [&_svg]:h-4',
  lg: '[&_svg]:w-5 [&_svg]:h-5',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon,
      iconPosition = 'left',
      loading = false,
      fullWidth = false,
      disabled,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          'inline-flex items-center justify-center',
          'transition-all duration-200 ease-out',
          'cursor-pointer select-none',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
          variantStyles[variant],
          sizeStyles[size],
          iconSizeStyles[size],
          fullWidth ? 'w-full' : '',
          isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {loading && (
          <Loader2 className="animate-spin shrink-0" />
        )}
        {!loading && icon && iconPosition === 'left' && (
          <span className="shrink-0">{icon}</span>
        )}
        {children && <span>{children}</span>}
        {!loading && icon && iconPosition === 'right' && (
          <span className="shrink-0">{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
