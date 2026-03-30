/**
 * Loading State
 *
 * Consistent loading indicator component.
 */

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  fullPage?: boolean;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

const textClasses = {
  sm: 'text-body-sm',
  md: 'text-body',
  lg: 'text-body-lg',
};

export function LoadingState({
  message = 'Loading...',
  size = 'md',
  className,
  fullPage = false,
}: LoadingStateProps) {
  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn('animate-spin text-muted-foreground', sizeClasses[size])} />
      {message && (
        <p className={cn('text-muted-foreground', textClasses[size])}>{message}</p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex min-h-screen items-center justify-center">{content}</div>
    );
  }

  return content;
}

export function LoadingSpinner({ size = 'md', className }: Pick<LoadingStateProps, 'size' | 'className'>) {
  return <Loader2 className={cn('animate-spin', sizeClasses[size], className)} />;
}
