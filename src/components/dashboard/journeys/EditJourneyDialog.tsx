/**
 * Edit Journey Dialog
 *
 * Dialog for parents to edit journey details and manage steps/tasks.
 * Supports adding, removing, and reordering steps.
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  useJourney,
  useUpdateJourney,
  useAddJourneyStep,
  useRemoveJourneyStep,
  useDeleteJourney,
} from '@/hooks/queries/useJourneys';
import {
  Loader2,
  Plus,
  Trash2,
  GripVertical,
  CheckCircle2,
  Circle,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { JourneyForCard } from './JourneyCard';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface EditJourneyDialogProps {
  journey: JourneyForCard | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  onDelete?: () => void;
}

export function EditJourneyDialog({
  journey,
  open,
  onOpenChange,
  onSuccess,
  onDelete,
}: EditJourneyDialogProps) {
  // Fetch full journey details with steps
  const { data: journeyDetails, isLoading } = useJourney(journey?.id);

  // Mutations
  const updateJourney = useUpdateJourney();
  const addStep = useAddJourneyStep();
  const removeStep = useRemoveJourneyStep();
  const deleteJourney = useDeleteJourney();

  // Local state
  const [title, setTitle] = useState('');
  const [newStepTitle, setNewStepTitle] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [stepToDelete, setStepToDelete] = useState<string | null>(null);

  // Initialize form when journey loads
  useEffect(() => {
    if (journeyDetails) {
      setTitle(journeyDetails.title);
    }
  }, [journeyDetails]);

  // Reset on close
  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setTitle('');
      setNewStepTitle('');
      setStepToDelete(null);
    }
    onOpenChange(isOpen);
  };

  // Save title changes
  const handleSaveTitle = async () => {
    if (!journey?.id || !title.trim()) return;

    await updateJourney.mutateAsync({
      id: journey.id,
      updates: { title: title.trim() },
    });
    onSuccess?.();
  };

  // Add new step
  const handleAddStep = async () => {
    if (!journey?.id || !newStepTitle.trim()) return;

    await addStep.mutateAsync({
      journeyId: journey.id,
      step: {
        title: newStepTitle.trim(),
        step_order: (journeyDetails?.steps.length ?? 0) + 1,
      },
    });
    setNewStepTitle('');
  };

  // Confirm step deletion
  const handleConfirmDeleteStep = async () => {
    if (!journey?.id || !stepToDelete) return;

    await removeStep.mutateAsync({
      journeyId: journey.id,
      stepId: stepToDelete,
    });
    setStepToDelete(null);
  };

  // Delete entire journey
  const handleDeleteJourney = async () => {
    if (!journey?.id) return;

    await deleteJourney.mutateAsync(journey.id);
    setShowDeleteConfirm(false);
    handleClose(false);
    onDelete?.();
  };

  const isPending = updateJourney.isPending || addStep.isPending || removeStep.isPending;
  const isCompleted = journey?.status === 'completed';

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Journey</DialogTitle>
            <DialogDescription>
              Manage journey details and tasks
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : journeyDetails ? (
            <div className="flex-1 overflow-hidden space-y-4">
              {/* Journey Title */}
              <div className="space-y-2">
                <Label htmlFor="journey-title">Journey Title</Label>
                <div className="flex gap-2">
                  <Input
                    id="journey-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter journey title"
                    disabled={isCompleted}
                  />
                  {title !== journeyDetails.title && (
                    <Button
                      size="sm"
                      onClick={handleSaveTitle}
                      disabled={updateJourney.isPending || !title.trim()}
                    >
                      {updateJourney.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Save'
                      )}
                    </Button>
                  )}
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <Badge
                  variant="secondary"
                  className={cn(
                    journeyDetails.status === 'completed' && 'bg-primary/10 text-primary',
                    journeyDetails.status === 'active' && 'bg-primary/10 text-primary',
                    journeyDetails.status === 'paused' && 'bg-lala/10 text-lala'
                  )}
                >
                  {journeyDetails.status}
                </Badge>
                <span className="text-body-sm text-muted-foreground">
                  {journeyDetails.currentStep} of {journeyDetails.totalSteps} steps completed
                </span>
              </div>

              {/* Steps List */}
              <div className="space-y-2">
                <Label>Tasks / Steps</Label>
                <ScrollArea className="h-48 rounded-md border">
                  <div className="p-2 space-y-2">
                    {journeyDetails.steps.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4 text-body-sm">
                        No tasks yet. Add one below.
                      </p>
                    ) : (
                      journeyDetails.steps.map((step, index) => (
                        <Card
                          key={step.id}
                          className={cn(
                            'transition-all',
                            step.isCompleted && 'bg-primary/5 border-primary'
                          )}
                        >
                          <CardContent className="p-3 flex items-center gap-3">
                            <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-grab" />

                            {step.isCompleted ? (
                              <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                            ) : (
                              <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
                            )}

                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                'text-body-sm font-medium truncate',
                                step.isCompleted && 'text-primary'
                              )}>
                                {step.title}
                              </p>
                              <p className="text-caption text-muted-foreground">
                                Step {index + 1}
                              </p>
                            </div>

                            {!isCompleted && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => setStepToDelete(step.id)}
                                disabled={removeStep.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Add New Step */}
              {!isCompleted && (
                <div className="space-y-2">
                  <Label htmlFor="new-step">Add New Task</Label>
                  <div className="flex gap-2">
                    <Input
                      id="new-step"
                      value={newStepTitle}
                      onChange={(e) => setNewStepTitle(e.target.value)}
                      placeholder="Enter task name"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newStepTitle.trim()) {
                          handleAddStep();
                        }
                      }}
                    />
                    <Button
                      onClick={handleAddStep}
                      disabled={addStep.isPending || !newStepTitle.trim()}
                    >
                      {addStep.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Journey not found
            </p>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isPending || deleteJourney.isPending}
              className="sm:mr-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Journey
            </Button>
            <Button variant="outline" onClick={() => handleClose(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Step Confirmation */}
      <AlertDialog open={!!stepToDelete} onOpenChange={() => setStepToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this task? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeleteStep}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeStep.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Journey Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Delete Journey
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{journeyDetails?.title}"? This will remove all
              progress and tasks. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteJourney}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteJourney.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete Journey
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
