/**
 * Kids PIN Dialog Component
 *
 * Modal dialog for PIN verification before entering Kids Mode.
 * No fallback mechanisms - proper error handling.
 */

import { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { PINInputGrid } from './PINInputGrid';
import { useVerifyPin } from '@/hooks/queries/usePin';
import { ChatAvatar } from '@/components/chat/ChatAvatar';
import { cn } from '@/lib/utils';

interface KidsPINDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childId: string;
  childName: string;
  onSuccess: () => void;
}

export function KidsPINDialog({
  open,
  onOpenChange,
  childId,
  childName,
  onSuccess,
}: KidsPINDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const verifyPin = useVerifyPin();

  const handlePinComplete = useCallback(
    async (pin: string) => {
      setError(null);

      try {
        await verifyPin.mutateAsync({ childId, pin });
        onSuccess();
        onOpenChange(false);
      } catch (err) {
        // Error is handled by the mutation hook's error handling
        // Set local error for UI feedback
        setError('Wrong PIN. Try again!');
      }
    },
    [childId, verifyPin, onSuccess, onOpenChange]
  );

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        setError(null);
      }
      onOpenChange(newOpen);
    },
    [onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          'sm:max-w-md',
          'bg-gradient-to-b from-background to-muted/50',
          'border-2 border-primary/20'
        )}
      >
        <DialogHeader className="text-center items-center">
          <ChatAvatar expression="curious" size="lg" className="mb-2" />
          <DialogTitle className="text-2xl font-display">
            Enter PIN
          </DialogTitle>
          <DialogDescription className="text-base">
            Enter {childName}'s secret PIN to continue
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <PINInputGrid
            onComplete={handlePinComplete}
            error={error}
            disabled={verifyPin.isPending}
          />
        </div>

        {verifyPin.isPending && (
          <div className="text-center text-sm text-muted-foreground">
            Checking...
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
