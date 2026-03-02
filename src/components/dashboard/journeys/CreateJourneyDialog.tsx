/**
 * Create Journey Dialog
 *
 * Dialog for parents to create a new journey for their child.
 * Supports selecting from templates and assigning to a child.
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useJourneyTemplates, useJourneyTemplate, useStartJourneyFromTemplate } from '@/hooks/queries/useJourneyTemplates';
import { useChildProfiles } from '@/hooks/queries/useChildProfiles';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateJourneyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedChildId?: string;
  onSuccess?: () => void;
}

export function CreateJourneyDialog({
  open,
  onOpenChange,
  preselectedChildId,
  onSuccess,
}: CreateJourneyDialogProps) {
  const { user } = useAuth();
  const { data: templates = [], isLoading: templatesLoading } = useJourneyTemplates();
  const { data: children = [] } = useChildProfiles(user?.id);
  const startJourney = useStartJourneyFromTemplate();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string>(preselectedChildId || '');

  // Fetch selected template details (with steps) for preview
  const { data: selectedTemplateDetail } = useJourneyTemplate(selectedTemplateId ?? undefined);

  const handleCreate = async () => {
    if (!selectedTemplateId || !selectedChildId) return;

    try {
      await startJourney.mutateAsync({
        templateId: selectedTemplateId,
        childId: selectedChildId,
      });

      onSuccess?.();
      onOpenChange(false);
      resetForm();
    } catch {
      // Error handled by mutation
    }
  };

  const resetForm = () => {
    setSelectedTemplateId(null);
    setSelectedChildId(preselectedChildId || '');
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Journey</DialogTitle>
          <DialogDescription>
            Select a journey template to assign to your child.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden space-y-4">
          {/* Child selector */}
          <div className="space-y-2">
            <Label htmlFor="child">Assign to Child</Label>
            <Select
              value={selectedChildId}
              onValueChange={setSelectedChildId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a child" />
              </SelectTrigger>
              <SelectContent>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template selection */}
          <div className="space-y-2">
            <Label>Select Journey Template</Label>
            <ScrollArea className="h-64 rounded-md border p-2">
              {templatesLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : templates.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No templates available
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-2">
                  {templates.map((template) => (
                    <Card
                      key={template.id}
                      className={cn(
                        'cursor-pointer transition-all hover:shadow-sm',
                        selectedTemplateId === template.id &&
                          'ring-2 ring-primary bg-primary/5'
                      )}
                      onClick={() => setSelectedTemplateId(template.id)}
                    >
                      <CardHeader className="py-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">
                            {template.title}
                          </CardTitle>
                          {selectedTemplateId === template.id && (
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="py-2">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {template.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {template.duration_days} days
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Preview selected template */}
          {selectedTemplateDetail && (
            <div className="rounded-lg border p-4 bg-muted/50">
              <h4 className="font-medium text-sm mb-2">Journey Preview</h4>
              <p className="text-xs text-muted-foreground mb-2">
                {selectedTemplateDetail.description}
              </p>
              {selectedTemplateDetail.steps && selectedTemplateDetail.steps.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium">{selectedTemplateDetail.steps.length} Steps:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {selectedTemplateDetail.steps.slice(0, 3).map((step, i) => (
                      <li key={step.id || i}>• {step.title}</li>
                    ))}
                    {selectedTemplateDetail.steps.length > 3 && (
                      <li>• ... and {selectedTemplateDetail.steps.length - 3} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              !selectedTemplateId ||
              !selectedChildId ||
              startJourney.isPending
            }
          >
            {startJourney.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Create Journey
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
