/**
 * Empty State
 *
 * Consistent empty state display component.
 */

import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { type LucideIcon, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  // Support both button config and ReactNode
  action?: ReactNode | {
    label: string;
    onClick: () => void;
  };
  children?: ReactNode;
  className?: string;
}

function isActionConfig(action: unknown): action is { label: string; onClick: () => void } {
  return typeof action === 'object' && action !== null && 'label' in action && 'onClick' in action;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  children,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-4 py-12 text-center', className)}>
      <div className="rounded-full bg-muted p-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <h3 className="font-semibold text-foreground">{title}</h3>
        {description && <p className="text-body-sm text-muted-foreground">{description}</p>}
      </div>
      {action && (
        isActionConfig(action) ? (
          <Button onClick={action.onClick}>{action.label}</Button>
        ) : (
          action
        )
      )}
      {children}
    </div>
  );
}
