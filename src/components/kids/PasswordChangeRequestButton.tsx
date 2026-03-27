/**
 * Password Change Request Button
 *
 * Gear icon button for kids to request their parent to change the account password.
 * Shows a confirmation dialog and sends a notification to the parent.
 */

import { useState } from 'react';
import { Settings, AlertTriangle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useRequestPasswordChange } from '@/hooks/queries';
import { toast } from 'sonner';

interface PasswordChangeRequestButtonProps {
  childId: string;
  childName: string;
  className?: string;
}

export function PasswordChangeRequestButton({
  childId,
  childName,
  className,
}: PasswordChangeRequestButtonProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const requestPasswordChange = useRequestPasswordChange();

  const handleRequest = async () => {
    try {
      await requestPasswordChange.mutateAsync(childId);
      setShowConfirmDialog(false);
      setShowSuccessDialog(true);
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { status?: number } })?.response?.status === 429
        ? 'You already sent a request recently. Please wait before trying again.'
        : 'Something went wrong. Please try again later.';
      toast.error(errorMessage);
      setShowConfirmDialog(false);
    }
  };

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setShowConfirmDialog(true)}
        className={className}
        aria-label="Request password change"
      >
        <Settings className="h-5 w-5" />
      </Button>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="h-6 w-6 text-gold" />
              Tell a Grown-Up?
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              This will send a message to your parent asking them to check their password.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <p className="text-center text-lg">
              Do you want to tell{' '}
              <span className="font-semibold text-primary">Mom or Dad</span>{' '}
              to check the password?
            </p>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="w-full sm:w-auto"
            >
              No, go back
            </Button>
            <Button
              onClick={handleRequest}
              disabled={requestPasswordChange.isPending}
              className="w-full sm:w-auto bg-gold/50 hover:bg-gold/10"
            >
              {requestPasswordChange.isPending ? 'Sending...' : 'Yes, tell them!'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2 text-xl">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Check className="h-6 w-6 text-primary" />
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 text-center">
            <h3 className="text-xl font-semibold mb-2">Message Sent!</h3>
            <p className="text-muted-foreground">
              Your parent will see a notification to check the password.
            </p>
          </div>

          <DialogFooter>
            <Button
              onClick={() => setShowSuccessDialog(false)}
              className="w-full"
            >
              Okay!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
