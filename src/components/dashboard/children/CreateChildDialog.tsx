/**
 * Create Child Dialog
 *
 * Dialog for creating a new child profile.
 * Supports both controlled and trigger-based patterns.
 */

import { useState, cloneElement, isValidElement, type ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormDialog } from '@/components/shared/dialogs/FormDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createChildSchema, type CreateChildFormData } from '@/types/forms';
import { useCreateChildProfile } from '@/hooks/queries';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CreateChildDialogProps {
  // Controlled mode
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // Trigger mode
  trigger?: ReactElement;
}

export function CreateChildDialog({ open: controlledOpen, onOpenChange, trigger }: CreateChildDialogProps) {
  const { user } = useAuth();
  const createChild = useCreateChildProfile();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [internalOpen, setInternalOpen] = useState(false);

  // Use controlled or internal state
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? onOpenChange! : setInternalOpen;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateChildFormData>({
    resolver: zodResolver(createChildSchema),
    defaultValues: {
      name: '',
      age: 7,
      gender: undefined,
    },
  });

  const selectedGender = watch('gender');

  const onSubmit = async (data: CreateChildFormData) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      await createChild.mutateAsync({
        user_id: user.id,
        name: data.name,
        age: data.age,
        gender: data.gender,
        personality_mode: data.personalityMode,
        interests: data.interests,
      });
      toast.success('Child profile created!');
      reset();
      setOpen(false);
    } catch {
      // Error handled by mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      reset();
    }
  };

  // Render trigger if provided
  const triggerElement = trigger && isValidElement(trigger)
    ? cloneElement(trigger, {
        onClick: (e: React.MouseEvent) => {
          (trigger.props as { onClick?: (e: React.MouseEvent) => void }).onClick?.(e);
          setOpen(true);
        },
      } as Partial<unknown>)
    : null;

  return (
    <>
      {triggerElement}
      <FormDialog
        open={open}
        onOpenChange={handleOpenChange}
        title="Add Child Profile"
        description="Create a profile for your child to personalize their experience."
        submitLabel="Create Profile"
        onSubmit={handleSubmit(onSubmit)}
        isLoading={isSubmitting}
        onCancel={() => reset()}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Enter child's name"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Age</Label>
            <Input
              id="age"
              type="number"
              min={3}
              max={18}
              {...register('age', { valueAsNumber: true })}
            />
            {errors.age && (
              <p className="text-sm text-destructive">{errors.age.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Gender (optional)</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setValue('gender', selectedGender === 'boy' ? undefined : 'boy')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 rounded-lg border-2 p-3 transition-all',
                  selectedGender === 'boy'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-muted hover:border-blue-300'
                )}
              >
                <span className="text-xl">👦</span>
                <span className="font-medium">Boy</span>
              </button>
              <button
                type="button"
                onClick={() => setValue('gender', selectedGender === 'girl' ? undefined : 'girl')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 rounded-lg border-2 p-3 transition-all',
                  selectedGender === 'girl'
                    ? 'border-pink-500 bg-pink-50 text-pink-700'
                    : 'border-muted hover:border-pink-300'
                )}
              >
                <span className="text-xl">👧</span>
                <span className="font-medium">Girl</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setValue('gender', 'prefer_not_to_say')}
              className={cn(
                'w-full text-sm text-muted-foreground hover:text-foreground transition-colors',
                selectedGender === 'prefer_not_to_say' && 'text-foreground font-medium'
              )}
            >
              Prefer not to say
            </button>
          </div>
        </div>
      </FormDialog>
    </>
  );
}
