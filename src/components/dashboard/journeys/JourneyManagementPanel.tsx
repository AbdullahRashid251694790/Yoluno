/**
 * Journey Management Panel
 *
 * Parent dashboard panel for managing children's journeys.
 * Supports creating, viewing, editing, and deleting journeys.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Progress } from '@/components/ui/progress';
import {
  useJourneys,
  useActiveJourneys,
  useCompletedJourneys,
  useDeleteJourney,
} from '@/hooks/queries/useJourneys';
import { useChildProfiles } from '@/hooks/queries/useChildProfiles';
import { useAuth } from '@/hooks/useAuth';
import { CreateJourneyDialog } from './CreateJourneyDialog';
import {
  Plus,
  Loader2,
  Trash2,
  Edit,
  MoreVertical,
  ImageIcon,
  CheckCircle2,
  Clock,
  Play,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { JourneyWithSteps } from '@/types/domain';

export function JourneyManagementPanel() {
  const { user } = useAuth();
  const { data: children = [] } = useChildProfiles(user?.id);

  const [selectedChildId, setSelectedChildId] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [journeyToDelete, setJourneyToDelete] = useState<JourneyWithSteps | null>(null);

  // Determine which child ID to use for queries
  const childIdForQuery = selectedChildId === 'all' ? undefined : selectedChildId;

  // Fetch journeys based on selection
  const { data: allJourneys = [], isLoading: loadingAll } = useJourneys(childIdForQuery);
  const { data: activeJourneys = [], isLoading: loadingActive } = useActiveJourneys(childIdForQuery);
  const { data: completedJourneys = [], isLoading: loadingCompleted } = useCompletedJourneys(childIdForQuery);

  const deleteJourney = useDeleteJourney();

  const handleDelete = async () => {
    if (!journeyToDelete) return;

    try {
      await deleteJourney.mutateAsync(journeyToDelete.id);
      setJourneyToDelete(null);
    } catch {
      // Error handled by mutation
    }
  };

  const getChildName = (childProfileId: string | undefined) => {
    if (!childProfileId) return '';
    const child = children.find((c) => c.id === childProfileId);
    return child?.name || '';
  };

  const renderJourneyCard = (journey: JourneyWithSteps) => {
    const childName = getChildName(journey.childProfileId);
    const progress = journey.progress || 0;
    const isCompleted = journey.status === 'completed';

    return (
      <Card key={journey.id} className="relative">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base font-medium">
                {journey.title}
              </CardTitle>
              {selectedChildId === 'all' && childName && (
                <Badge variant="outline" className="mt-1 text-xs">
                  {childName}
                </Badge>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => setJourneyToDelete(journey)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {/* Status badge */}
          <div className="flex items-center gap-2 mb-3">
            {isCompleted ? (
              <Badge className="bg-green-100 text-green-700">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            ) : (
              <Badge className="bg-blue-100 text-blue-700">
                <Play className="h-3 w-3 mr-1" />
                Active
              </Badge>
            )}
            {journey.templateId && (
              <Badge variant="secondary" className="text-xs">
                <ImageIcon className="h-3 w-3 mr-1" />
                Has Reward
              </Badge>
            )}
          </div>

          {/* Progress */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps info */}
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>
              {journey.currentStep || 1} of {journey.totalSteps} steps
            </span>
          </div>
        </CardContent>
      </Card>
    );
  };

  const isLoading = loadingAll || loadingActive || loadingCompleted;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Journey Management</h2>
          {children.length > 1 && (
            <Select value={selectedChildId} onValueChange={setSelectedChildId}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select child" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Children</SelectItem>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Journey
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">
            Active ({activeJourneys.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedJourneys.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({allJourneys.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="mt-4">
          {loadingActive ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : activeJourneys.length === 0 ? (
            <Card className="py-8">
              <CardContent className="text-center text-muted-foreground">
                <p>No active journeys</p>
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => setShowCreateDialog(true)}
                >
                  Create a new journey
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeJourneys.map(renderJourneyCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="mt-4">
          {loadingCompleted ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : completedJourneys.length === 0 ? (
            <Card className="py-8">
              <CardContent className="text-center text-muted-foreground">
                <p>No completed journeys yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedJourneys.map(renderJourneyCard)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          {loadingAll ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : allJourneys.length === 0 ? (
            <Card className="py-8">
              <CardContent className="text-center text-muted-foreground">
                <p>No journeys found</p>
                <Button
                  variant="link"
                  className="mt-2"
                  onClick={() => setShowCreateDialog(true)}
                >
                  Create your first journey
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allJourneys.map(renderJourneyCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Create Journey Dialog */}
      <CreateJourneyDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        preselectedChildId={selectedChildId !== 'all' ? selectedChildId : undefined}
        onSuccess={() => {
          // Journeys will auto-refresh via query invalidation
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!journeyToDelete}
        onOpenChange={(open) => !open && setJourneyToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Journey</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{journeyToDelete?.title}"? This
              action cannot be undone and all progress will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteJourney.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
