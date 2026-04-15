/**
 * Share With Parent Button
 *
 * Kids-facing button that creates a shared_moments row so the parent sees
 * it in "Shared with you" on their dashboard home. Flips to a "Shared!"
 * confirmation state once tapped so the child can't spam it.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, Check } from 'lucide-react';
import { useCreateSharedMoment } from '@/hooks/queries/useSharedMoments';
import type { SharedMomentType } from '@/services/sharedMoments';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ShareWithParentButtonProps {
  childId: string;
  momentType: SharedMomentType;
  title: string;
  context?: string;
  reflection?: string;
  referenceId?: string;
  className?: string;
  label?: string;
  sharedLabel?: string;
}

export function ShareWithParentButton({
  childId,
  momentType,
  title,
  context,
  reflection,
  referenceId,
  className,
  label = 'Share with parent',
  sharedLabel = 'Shared!',
}: ShareWithParentButtonProps) {
  const createShare = useCreateSharedMoment();
  const [shared, setShared] = useState(false);

  const handleClick = async () => {
    if (shared) return;
    try {
      await createShare.mutateAsync({
        child_profile_id: childId,
        moment_type: momentType,
        title,
        context,
        reflection,
        reference_id: referenceId,
      });
      setShared(true);
      toast.success('Shared with your parent!');
    } catch {
      // handleError already shows a toast via the mutation hook
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={createShare.isPending || shared}
      className={cn(
        'gap-2 rounded-full',
        shared
          ? 'bg-lala text-white hover:bg-lala'
          : 'bg-gold text-white hover:bg-gold/90',
        className
      )}
    >
      {shared ? (
        <>
          <Check className="h-4 w-4" />
          {sharedLabel}
        </>
      ) : (
        <>
          <Heart className="h-4 w-4" />
          {createShare.isPending ? 'Sharing…' : label}
        </>
      )}
    </Button>
  );
}
