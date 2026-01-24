/**
 * PIN Setup Dialog
 *
 * Dialog for setting, changing, or resetting a child's PIN.
 * Used in the parent dashboard for PIN management.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { pinService } from '@/services/pin';
import { useSetPin } from '@/hooks/queries/usePin';
import { toast } from 'sonner';
import { KeyRound, Loader2 } from 'lucide-react';

const pinSchema = z.object({
  pin: z
    .string()
    .length(4, 'PIN must be exactly 4 digits')
    .regex(/^\d{4}$/, 'PIN must contain only numbers'),
  confirmPin: z.string().length(4, 'PIN must be exactly 4 digits'),
}).refine((data) => data.pin === data.confirmPin, {
  message: 'PINs do not match',
  path: ['confirmPin'],
});

type PinFormData = z.infer<typeof pinSchema>;

interface PINSetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  childId: string;
  childName: string;
  hasExistingPin: boolean;
}

export function PINSetupDialog({
  open,
  onOpenChange,
  childId,
  childName,
  hasExistingPin,
}: PINSetupDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setPin = useSetPin();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PinFormData>({
    resolver: zodResolver(pinSchema),
    defaultValues: {
      pin: '',
      confirmPin: '',
    },
  });

  const onSubmit = async (data: PinFormData) => {
    setIsSubmitting(true);
    try {
      await setPin.mutateAsync({ childId, pin: data.pin });
      toast.success(hasExistingPin ? 'PIN updated successfully!' : 'PIN set successfully!');
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to set PIN:', error);
      toast.error('Failed to set PIN. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            {hasExistingPin ? 'Reset PIN' : 'Set PIN'} for {childName}
          </DialogTitle>
          <DialogDescription>
            {hasExistingPin
              ? 'Enter a new 4-digit PIN to replace the current one.'
              : 'Set a 4-digit PIN for your child to access their profile in Kids Mode.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pin">New PIN</Label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder="****"
                className="text-center text-2xl tracking-widest"
                disabled={isSubmitting}
                {...register('pin')}
              />
              {errors.pin && (
                <p className="text-sm text-destructive">{errors.pin.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPin">Confirm PIN</Label>
              <Input
                id="confirmPin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder="****"
                className="text-center text-2xl tracking-widest"
                disabled={isSubmitting}
                {...register('confirmPin')}
              />
              {errors.confirmPin && (
                <p className="text-sm text-destructive">{errors.confirmPin.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {hasExistingPin ? 'Update PIN' : 'Set PIN'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
