/**
 * Create Child Dialog
 *
 * Dialog for creating a new child profile with required avatar and PIN.
 * Supports both controlled and trigger-based patterns.
 */

import { useState, cloneElement, isValidElement, type ReactElement } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormDialog } from '@/components/shared/dialogs/FormDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AvatarPicker } from '@/components/shared/AvatarPicker';
import { useCreateChildProfile } from '@/hooks/queries';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { pinService } from '@/services/pin';
import { apiPostFormData } from '@/lib/api';

// Extended schema with avatar and PIN requirements
const createChildWithAvatarPinSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  age: z
    .number()
    .int('Age must be a whole number')
    .min(3, 'Minimum age is 3')
    .max(18, 'Maximum age is 18'),
  gender: z.enum(['boy', 'girl', 'prefer_not_to_say']).optional(),
  avatar: z.object({
    type: z.enum(['library', 'custom']),
    avatarId: z.string().optional(),
    avatarUrl: z.string().optional(),
    customFile: z.instanceof(File).optional(),
    customPreview: z.string().optional(),
  }).refine(
    (data) => data.type === 'library' ? !!data.avatarId : !!data.customFile,
    { message: 'Please select an avatar or upload a photo' }
  ),
  pin: z
    .string()
    .length(4, 'PIN must be exactly 4 digits')
    .regex(/^\d{4}$/, 'PIN must contain only numbers'),
  confirmPin: z.string().length(4, 'PIN must be exactly 4 digits'),
}).refine((data) => data.pin === data.confirmPin, {
  message: 'PINs do not match',
  path: ['confirmPin'],
});

type CreateChildWithAvatarPinFormData = z.infer<typeof createChildWithAvatarPinSchema>;

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
    control,
    formState: { errors },
  } = useForm<CreateChildWithAvatarPinFormData>({
    resolver: zodResolver(createChildWithAvatarPinSchema),
    defaultValues: {
      name: '',
      age: 7,
      gender: undefined,
      avatar: undefined,
      pin: '',
      confirmPin: '',
    },
  });

  const selectedGender = watch('gender');

  const onSubmit = async (data: CreateChildWithAvatarPinFormData) => {
    if (!user) return;

    setIsSubmitting(true);
    try {
      let avatarId: string | undefined;
      let customAvatarUrl: string | undefined;

      // Handle avatar upload if custom
      if (data.avatar.type === 'custom' && data.avatar.customFile) {
        const formData = new FormData();
        formData.append('file', data.avatar.customFile);

        const uploadResult = await apiPostFormData<{ key: string; url: string }>(
          '/upload/child-avatars',
          'createChildDialog.uploadAvatar',
          formData
        );
        customAvatarUrl = uploadResult.key;
      } else if (data.avatar.type === 'library') {
        avatarId = data.avatar.avatarId;
      }

      // Create the child profile
      const profile = await createChild.mutateAsync({
        user_id: user.id,
        name: data.name,
        age: data.age,
        gender: data.gender,
        avatar_id: avatarId,
        custom_avatar_url: customAvatarUrl,
        interests: [],
        learning_style: null,
        pin_hash: null,
      });

      // Set the PIN for the created profile
      await pinService.set(profile.id, data.pin);

      toast.success('Child profile created!');
      reset();
      setOpen(false);
    } catch (error) {
      console.error('Failed to create child profile:', error);
      toast.error('Failed to create profile. Please try again.');
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
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="Enter child's name"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-body-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Age */}
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
              <p className="text-body-sm text-destructive">{errors.age.message}</p>
            )}
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <Label>Gender (optional)</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setValue('gender', selectedGender === 'boy' ? undefined : 'boy')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 rounded-lg border-2 p-3 transition-all',
                  selectedGender === 'boy'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-muted hover:border-primary'
                )}
              >
                <span className="text-body-lg">👦</span>
                <span className="font-medium">Boy</span>
              </button>
              <button
                type="button"
                onClick={() => setValue('gender', selectedGender === 'girl' ? undefined : 'girl')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 rounded-lg border-2 p-3 transition-all',
                  selectedGender === 'girl'
                    ? 'border-lolo bg-lolo/10 text-lolo'
                    : 'border-muted hover:border-lolo'
                )}
              >
                <span className="text-body-lg">👧</span>
                <span className="font-medium">Girl</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setValue('gender', 'prefer_not_to_say')}
              className={cn(
                'w-full text-body-sm text-muted-foreground hover:text-foreground transition-colors',
                selectedGender === 'prefer_not_to_say' && 'text-foreground font-medium'
              )}
            >
              Prefer not to say
            </button>
          </div>

          {/* Avatar Picker */}
          <div className="space-y-2">
            <Label>Avatar <span className="text-destructive">*</span></Label>
            <Controller
              name="avatar"
              control={control}
              render={({ field }) => (
                <AvatarPicker
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isSubmitting}
                  maxAvatars={6}
                />
              )}
            />
            {errors.avatar && (
              <p className="text-body-sm text-destructive text-center">
                {errors.avatar.message || 'Please select an avatar or upload a photo'}
              </p>
            )}
          </div>

          {/* PIN Setup */}
          <div className="space-y-4 border-t pt-4">
            <div>
              <Label className="text-body font-semibold">Set a 4-digit PIN <span className="text-destructive">*</span></Label>
              <p className="text-body-sm text-muted-foreground mt-1">
                Your child will use this PIN to access their profile in Kids Mode.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pin">PIN</Label>
                <Input
                  id="pin"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  placeholder="****"
                  className="text-center text-h4 tracking-widest"
                  {...register('pin')}
                />
                {errors.pin && (
                  <p className="text-body-sm text-destructive">{errors.pin.message}</p>
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
                  className="text-center text-h4 tracking-widest"
                  {...register('confirmPin')}
                />
                {errors.confirmPin && (
                  <p className="text-body-sm text-destructive">{errors.confirmPin.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </FormDialog>
    </>
  );
}
