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
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
import { useJourneyTemplates } from '@/hooks/queries/useJourneyTemplates';
import { useChildProfiles } from '@/hooks/queries/useChildProfiles';
import { useCreateCustomJourney } from '@/hooks/queries/useJourneys';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, CheckCircle2, ImageIcon } from 'lucide-react';
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
  const createJourney = useCreateCustomJourney();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<string>(preselectedChildId || '');
  const [requiresImageProof, setRequiresImageProof] = useState(false);

  // Find selected template
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  const handleCreate = async () => {
    if (!selectedTemplateId || !selectedChildId) return;

    const template = templates.find((t) => t.id === selectedTemplateId);
    if (!template) return;

    try {
      await createJourney.mutateAsync({
        child_profile_id: selectedChildId,
        title: template.title,
        template_id: selectedTemplateId,
        requires_image_proof: requiresImageProof,
        steps: template.steps?.map((s) => ({
          title: s.title,
          description: s.description,
        })) || [],
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
    setRequiresImageProof(false);
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
                          <div className="flex items-center gap-2">
                            {template.rewardImageUrl && (
                              <ImageIcon className="h-4 w-4 text-muted-foreground" />
                            )}
                            {selectedTemplateId === template.id && (
                              <CheckCircle2 className="h-4 w-4 text-primary" />
                            )}
                          </div>
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
                          {template.stepCount > 0 && (
                            <span className="text-xs text-muted-foreground">
                              {template.stepCount} steps
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Image proof toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="image-proof">Require Image Proof</Label>
              <p className="text-sm text-muted-foreground">
                Child must attach a photo when marking tasks complete
              </p>
            </div>
            <Switch
              id="image-proof"
              checked={requiresImageProof}
              onCheckedChange={setRequiresImageProof}
            />
          </div>

          {/* Preview selected template */}
          {selectedTemplate && (
            <div className="rounded-lg border p-4 bg-muted/50">
              <h4 className="font-medium text-sm mb-2">Journey Preview</h4>
              <p className="text-xs text-muted-foreground mb-2">
                {selectedTemplate.description}
              </p>
              {selectedTemplate.steps && selectedTemplate.steps.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium">Steps:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {selectedTemplate.steps.slice(0, 3).map((step, i) => (
                      <li key={step.id || i}>• {step.title}</li>
                    ))}
                    {selectedTemplate.steps.length > 3 && (
                      <li>• ... and {selectedTemplate.steps.length - 3} more</li>
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
              createJourney.isPending
            }
          >
            {createJourney.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Create Journey
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
