/**
 * Add Method Selector
 *
 * Allows user to choose between manual form entry or voice description
 * when adding a new family member.
 */

import { FileText, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

export type AddMethod = 'manual' | 'voice';

interface AddMethodSelectorProps {
  onSelect: (method: AddMethod) => void;
  className?: string;
}

export function AddMethodSelector({ onSelect, className }: AddMethodSelectorProps) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2', className)}>
      <button
        type="button"
        onClick={() => onSelect('manual')}
        className="flex flex-col items-center gap-4 p-6 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary hover:bg-primary/5 transition-colors text-center group"
      >
        <div className="p-4 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
          <FileText className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Fill in manually</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Enter details using a form
          </p>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onSelect('voice')}
        className="flex flex-col items-center gap-4 p-6 rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-primary hover:bg-primary/5 transition-colors text-center group"
      >
        <div className="p-4 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
          <Mic className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">Describe with voice</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Record a description and we'll fill in the details
          </p>
        </div>
      </button>
    </div>
  );
}
