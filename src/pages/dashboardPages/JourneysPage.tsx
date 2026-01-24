/**
 * Journeys Page
 *
 * Full journey dashboard with active journeys, templates marketplace,
 * and completed journeys. All data from database - no hardcoding.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChildProfiles } from '@/hooks/queries/useChildProfiles';
import { useJourneys } from '@/hooks/queries/useJourneys';
import {
  useFeaturedTemplates,
  useTemplatesForChild,
  useTemplateCategories,
  useStartJourneyFromTemplate,
} from '@/hooks/queries/useJourneyTemplates';
import { EmptyState, LoadingSpinner } from '@/components/shared';
import {
  JourneyTemplateCard,
  JourneyCard,
  type JourneyForCard,
  CreateJourneyDialog,
  EditJourneyDialog,
} from '@/components/dashboard';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Map,
  Sparkles,
  Trophy,
  Play,
  CheckCircle2,
  Filter,
  Plus,
} from 'lucide-react';
import type { JourneyTemplate } from '@/services/journeyTemplates';

export function JourneysPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: children = [], isLoading: loadingChildren } = useChildProfiles(user?.id);

  // State
  const [selectedChildId, setSelectedChildId] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<JourneyTemplate | null>(null);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingJourney, setEditingJourney] = useState<JourneyForCard | null>(null);

  // Get active child for template filtering
  const activeChildId = selectedChildId !== 'all' ? selectedChildId : children[0]?.id;

  // Queries
  const { data: journeys = [], isLoading: loadingJourneys } = useJourneys(
    selectedChildId !== 'all' ? selectedChildId : undefined
  );
  const { data: featuredTemplates = [] } = useFeaturedTemplates(6);
  const { data: childTemplates = [] } = useTemplatesForChild(activeChildId);
  const { data: categories = [] } = useTemplateCategories();

  // Mutations
  const startJourney = useStartJourneyFromTemplate();

  // Filter journeys by status
  const activeJourneys = journeys.filter((j) => j.status === 'active');
  const completedJourneys = journeys.filter((j) => j.status === 'completed');

  // Handle starting a journey
  const handleStartJourney = useCallback(
    (template: JourneyTemplate) => {
      if (children.length === 0) return;

      if (children.length === 1) {
        // Start directly for single child
        startJourney.mutate(
          { templateId: template.id, childId: children[0].id },
          {
            onSuccess: () => {
              setShowStartDialog(false);
              setSelectedTemplate(null);
            },
          }
        );
      } else {
        // Show child selection dialog
        setSelectedTemplate(template);
        setShowStartDialog(true);
      }
    },
    [children, startJourney]
  );

  const handleConfirmStart = useCallback(
    (childId: string) => {
      if (!selectedTemplate) return;

      startJourney.mutate(
        { templateId: selectedTemplate.id, childId },
        {
          onSuccess: () => {
            setShowStartDialog(false);
            setSelectedTemplate(null);
          },
        }
      );
    },
    [selectedTemplate, startJourney]
  );

  const handleContinueJourney = useCallback(
    (journey: JourneyForCard) => {
      const childId = journey.child_profile_id || journey.childProfileId;
      if (childId) {
        navigate(`/kids/${childId}/journeys/${journey.id}`);
      }
    },
    [navigate]
  );

  const handleEditJourney = useCallback((journey: JourneyForCard) => {
    setEditingJourney(journey);
  }, []);

  if (loadingChildren) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Learning Journeys</h1>
          <p className="text-muted-foreground mt-1">
            Track progress and discover new learning adventures.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {children.length > 1 && (
            <Select value={selectedChildId} onValueChange={setSelectedChildId}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All children" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All children</SelectItem>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {children.length > 0 && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Journey
            </Button>
          )}
        </div>
      </div>

      {children.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Map}
              title="Add a child profile first"
              description="Create a child profile to start exploring learning journeys."
              action={
                <Button onClick={() => navigate('/dashboard/children')}>
                  Add Child Profile
                </Button>
              }
            />
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="active" className="space-y-6">
          <TabsList>
            <TabsTrigger value="active" className="gap-2">
              <Play className="h-4 w-4" />
              Active
              {activeJourneys.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeJourneys.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="explore" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Explore
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <Trophy className="h-4 w-4" />
              Completed
              {completedJourneys.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {completedJourneys.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Active Journeys Tab */}
          <TabsContent value="active" className="space-y-6">
            {loadingJourneys ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : activeJourneys.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={Map}
                    title="No active journeys"
                    description="Start a new journey from the Explore tab to begin learning!"
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeJourneys.map((journey) => {
                  const childId = journey.child_profile_id || journey.childProfileId;
                  const childName = selectedChildId === 'all'
                    ? children.find(c => c.id === childId)?.name
                    : undefined;
                  return (
                    <JourneyCard
                      key={journey.id}
                      journey={journey}
                      childName={childName}
                      onContinue={handleContinueJourney}
                      onView={handleContinueJourney}
                      onEdit={handleEditJourney}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Explore Templates Tab */}
          <TabsContent value="explore" className="space-y-6">
            {/* Featured Section */}
            {featuredTemplates.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    Featured Journeys
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {featuredTemplates.map((template) => (
                      <JourneyTemplateCard
                        key={template.id}
                        template={template}
                        onStart={handleStartJourney}
                        isStarting={
                          startJourney.isPending &&
                          selectedTemplate?.id === template.id
                        }
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommended for Child */}
            {activeChildId && childTemplates.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Recommended for{' '}
                    {children.find((c) => c.id === activeChildId)?.name || 'Your Child'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {childTemplates.slice(0, 6).map((template) => (
                      <JourneyTemplateCard
                        key={template.id}
                        template={template}
                        onStart={handleStartJourney}
                        isStarting={
                          startJourney.isPending &&
                          selectedTemplate?.id === template.id
                        }
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Categories */}
            {categories.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Browse by Category</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((cat) => (
                      <Badge
                        key={cat.category}
                        variant="outline"
                        className="px-3 py-1.5 text-sm cursor-pointer hover:bg-accent"
                      >
                        {cat.category}
                        <span className="ml-1.5 text-muted-foreground">
                          ({cat.count})
                        </span>
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Completed Journeys Tab */}
          <TabsContent value="completed" className="space-y-6">
            {completedJourneys.length === 0 ? (
              <Card>
                <CardContent className="py-12">
                  <EmptyState
                    icon={Trophy}
                    title="No completed journeys yet"
                    description="Complete your active journeys to see them here!"
                  />
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {completedJourneys.map((journey) => {
                  const childId = journey.child_profile_id || journey.childProfileId;
                  const childName = selectedChildId === 'all'
                    ? children.find(c => c.id === childId)?.name
                    : undefined;
                  return (
                    <JourneyCard
                      key={journey.id}
                      journey={journey}
                      childName={childName}
                      onView={handleContinueJourney}
                      onEdit={handleEditJourney}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Start Journey Dialog (for multiple children) */}
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Journey</DialogTitle>
            <DialogDescription>
              Choose which child should start "{selectedTemplate?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            {children.map((child) => (
              <Button
                key={child.id}
                variant="outline"
                className="justify-start h-auto py-3"
                onClick={() => handleConfirmStart(child.id)}
                disabled={startJourney.isPending}
              >
                <div className="text-left">
                  <div className="font-medium">{child.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Age {child.age}
                  </div>
                </div>
              </Button>
            ))}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowStartDialog(false);
                setSelectedTemplate(null);
              }}
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Journey Dialog */}
      <CreateJourneyDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        preselectedChildId={selectedChildId !== 'all' ? selectedChildId : undefined}
      />

      {/* Edit Journey Dialog */}
      <EditJourneyDialog
        journey={editingJourney}
        open={!!editingJourney}
        onOpenChange={(open) => !open && setEditingJourney(null)}
      />
    </div>
  );
}
