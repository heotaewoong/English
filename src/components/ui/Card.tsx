'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
  hoverLift?: boolean;
  gradientBorder?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

function Card({
  children,
  className = '',
  glass = false,
  hoverLift = false,
  gradientBorder = false,
  padding = 'md',
  onClick,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      className={[
        'rounded-2xl',
        'transition-all duration-300 ease-out',
        paddingStyles[padding],
        glass
          ? 'glass'
          : [
              'bg-[var(--bg-card)]',
              'border border-[var(--border-color)]',
              'shadow-sm',
            ].join(' '),
        hoverLift
          ? 'hover-lift hover:border-primary-300 dark:hover:border-primary-700'
          : '',
        gradientBorder ? 'gradient-border' : '',
        onClick ? 'cursor-pointer' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div
      className={[
        'pb-4 mb-4',
        'border-b border-[var(--border-color)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

function CardBody({ children, className = '' }: CardBodyProps) {
  return <div className={className}>{children}</div>;
}

function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div
      className={[
        'pt-4 mt-4',
        'border-t border-[var(--border-color)]',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
