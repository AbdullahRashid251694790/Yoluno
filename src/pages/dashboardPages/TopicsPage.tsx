/**
 * Topics Page
 *
 * Manage content topics for children.
 * Includes system topics, custom topics, and topic posts.
 */

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChildProfiles } from '@/hooks/queries/useChildProfiles';
import {
  useChildTopicSettings,
  useUpdateTopicSetting,
} from '@/hooks/queries/useTopics';
import {
  useCustomTopics,
  useTopicPosts,
  useDeleteCustomTopic,
} from '@/hooks/queries/useTopicPosts';
import {
  CustomTopicDialog,
  TopicPostsList,
} from '@/components/dashboard/topics';
import { LoadingSpinner, EmptyState } from '@/components/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
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
import {
  Tag,
  Filter,
  Users,
  Info,
  Plus,
  Pencil,
  Trash2,
  Sparkles,
} from 'lucide-react';
import type { CustomTopic } from '@/hooks/queries/useTopicPosts';

export function TopicsPage() {
  const { user } = useAuth();
  const { data: children = [], isLoading: childrenLoading } = useChildProfiles(user?.id);
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  // Set first child as default when loaded
  const activeChildId = selectedChildId || children[0]?.id;

  const { data: topicSettings, isLoading: topicsLoading } = useChildTopicSettings(activeChildId);
  const { data: customTopics = [], isLoading: customTopicsLoading } = useCustomTopics(activeChildId);
  const { data: allPosts = [] } = useTopicPosts(activeChildId);
  const updateSetting = useUpdateTopicSetting();
  const deleteCustomTopic = useDeleteCustomTopic();

  // Dialog states
  const [customTopicDialogOpen, setCustomTopicDialogOpen] = useState(false);
  const [editingCustomTopic, setEditingCustomTopic] = useState<CustomTopic | null>(null);
  const [deletingCustomTopic, setDeletingCustomTopic] = useState<CustomTopic | null>(null);

  if (childrenLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <EmptyState
            icon={Users}
            title="No children to manage"
            description="Add a child profile first to manage their content topics."
          />
        </CardContent>
      </Card>
    );
  }

  const handleToggleTopic = (topicId: string, currentAllowed: boolean) => {
    if (!activeChildId) return;
    updateSetting.mutate({
      childId: activeChildId,
      topicId,
      isAllowed: !currentAllowed,
    });
  };

  const handleEditCustomTopic = (topic: CustomTopic) => {
    setEditingCustomTopic(topic);
    setCustomTopicDialogOpen(true);
  };

  const handleDeleteCustomTopic = async () => {
    if (!deletingCustomTopic || !activeChildId) return;
    try {
      await deleteCustomTopic.mutateAsync({
        childId: activeChildId,
        customTopicId: deletingCustomTopic.id,
      });
      setDeletingCustomTopic(null);
    } catch {
      // Error handled by mutation
    }
  };

  // Group system topics by category
  const topicsByCategory = topicSettings?.topics.reduce(
    (acc, topic) => {
      const category = topic.category_name || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(topic);
      return acc;
    },
    {} as Record<string, typeof topicSettings.topics>
  ) || {};

  // Meta-cluster definitions matching loveable's grouping
  const CLUSTERS: { label: string; categories: string[] }[] = [
    {
      label: 'British National Curriculum',
      categories: [
        'British Curriculum: English',
        'British Curriculum: Maths',
        'British Curriculum: Science',
        'British Curriculum: History',
        'British Curriculum: Geography',
        'British Curriculum: Computing',
        'British Curriculum: Languages',
        'British Curriculum: Design & Technology',
        'British Curriculum: Citizenship & PSHE',
      ],
    },
    {
      label: 'International Baccalaureate (IB)',
      categories: [
        'IB: Who We Are',
        'IB: Where We Are in Place and Time',
        'IB: How We Express Ourselves',
        'IB: How the World Works',
        'IB: How We Organize Ourselves',
        'IB: Sharing the Planet',
        'IB: Thinking & Learning Skills',
        'IB: Design Thinking & Innovation',
      ],
    },
    {
      label: 'Learning & Knowledge',
      categories: [
        'Science & Space',
        'History & Culture',
        'Math & Logic',
        'Technology & Future',
        'World & Geography',
        'Everyday Learning',
      ],
    },
    {
      label: 'Creative & Imaginative',
      categories: ['Arts & Creativity', 'Adventure & Fantasy', 'Careers & Dreams'],
    },
    {
      label: 'Wellbeing & Relationships',
      categories: [
        'Emotions & Feelings',
        'Family & Friends',
        'Health & Body',
        'Mindfulness & Wellbeing',
        'Safety & Life Skills',
      ],
    },
    {
      label: 'Fun & Exploration',
      categories: ['Animals & Nature', 'Food & Cooking'],
    },
  ];

  // Build list of clusters that actually have topics loaded
  const clusterGroups = CLUSTERS.map((cluster) => ({
    ...cluster,
    presentCategories: cluster.categories.filter((c) => topicsByCategory[c]?.length > 0),
  })).filter((c) => c.presentCategories.length > 0);

  // Any categories not mapped to a cluster land in "Other"
  const mappedCategories = new Set(CLUSTERS.flatMap((c) => c.categories));
  const unmappedCategories = Object.keys(topicsByCategory).filter((c) => !mappedCategories.has(c));
  if (unmappedCategories.length > 0) {
    clusterGroups.push({
      label: 'Other',
      categories: unmappedCategories,
      presentCategories: unmappedCategories,
    });
  }

  // Get posts for a specific topic
  const getPostsForTopic = (topicId: string) =>
    allPosts.filter((p) => p.topic_id === topicId);

  const getPostsForCustomTopic = (customTopicId: string) =>
    allPosts.filter((p) => p.custom_topic_id === customTopicId);

  const selectedChild = children.find((c) => c.id === activeChildId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-h3 font-bold">Content Topics</h1>
          <p className="text-muted-foreground mt-1">
            Control what topics Luno can discuss with your children.
          </p>
        </div>

        {children.length > 1 && (
          <Select value={activeChildId} onValueChange={setSelectedChildId}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select child" />
            </SelectTrigger>
            <SelectContent>
              {children.map((child) => (
                <SelectItem key={child.id} value={child.id}>
                  {child.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Info Card */}
      <Card className="bg-primary/5 border-primary">
        <CardContent className="flex items-start gap-3 py-4">
          <Info className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-body-sm text-primary">
              Topics shown are age-appropriate for {selectedChild?.name} (age {topicSettings?.child_age}).
              Add content to topics to give Luno special knowledge for personalized conversations.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Custom Topics Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Custom Topics
              </CardTitle>
              <CardDescription>
                Create your own topics and add custom content for Luno
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                setEditingCustomTopic(null);
                setCustomTopicDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Topic
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {customTopicsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : customTopics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No custom topics yet.</p>
              <p className="text-body-sm">Create a topic to add personalized content for Luno.</p>
            </div>
          ) : (
            <Accordion type="multiple" className="w-full">
              {customTopics.map((customTopic) => {
                const posts = getPostsForCustomTopic(customTopic.id);
                return (
                  <AccordionItem key={customTopic.id} value={customTopic.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 flex-1">
                        {customTopic.icon && (
                          <span className="text-body-lg">{customTopic.icon}</span>
                        )}
                        <span className="font-medium">{customTopic.name}</span>
                        <Badge variant="secondary" className="!text-caption !px-2.5 !py-0.5">
                          {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        {/* Edit/Delete buttons */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditCustomTopic(customTopic)}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1.5" />
                            Edit Topic
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeletingCustomTopic(customTopic)}
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            Delete Topic
                          </Button>
                        </div>

                        {customTopic.description && (
                          <p className="text-body-sm text-muted-foreground">
                            {customTopic.description}
                          </p>
                        )}

                        {/* Posts list */}
                        <TopicPostsList
                          childId={activeChildId}
                          childAge={selectedChild?.age}
                          customTopicId={customTopic.id}
                          topicName={customTopic.name}
                          topicDescription={customTopic.description}
                          posts={posts}
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* System Topics List */}
      {topicsLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : Object.keys(topicsByCategory).length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Tag}
              title="No topics available"
              description="Topic categories will appear here once configured."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {clusterGroups.map((cluster) => {
            const clusterTopicCount = cluster.presentCategories.reduce(
              (sum, cat) => sum + (topicsByCategory[cat]?.length ?? 0),
              0
            );
            const clusterAllowedCount = cluster.presentCategories.reduce(
              (sum, cat) => sum + (topicsByCategory[cat]?.filter((t) => t.is_allowed).length ?? 0),
              0
            );

            return (
              <div key={cluster.label}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-[13px] uppercase tracking-[1.5px] font-semibold text-muted-foreground">
                    {cluster.label}
                  </h3>
                  <span className="text-caption text-muted-foreground">
                    {clusterAllowedCount}/{clusterTopicCount} allowed
                  </span>
                </div>
                <Card>
                  <CardContent className="p-4">
                    <Accordion type="multiple" className="w-full">
                      {cluster.presentCategories.map((category) => {
                        const topics = topicsByCategory[category] || [];
                        const allowedCount = topics.filter((t) => t.is_allowed).length;
                        return (
                          <AccordionItem key={category} value={category}>
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-center gap-3">
                                <span className="font-medium">{category}</span>
                                <Badge
                                  className={`!text-caption !px-2.5 !py-0.5 ${
                                    allowedCount === topics.length
                                      ? 'bg-primary/10 text-primary border-primary/20'
                                      : 'bg-gold/10 text-gold border-gold/20'
                                  }`}
                                  variant="outline"
                                >
                                  {allowedCount}/{topics.length} allowed
                                </Badge>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-4 pt-2">
                                {topics.map((topic) => {
                                  const posts = getPostsForTopic(topic.id);
                                  return (
                                    <div key={topic.id}>
                                      <div className="flex items-center justify-between rounded-lg border p-3">
                                        <div className="space-y-0.5">
                                          <Label
                                            htmlFor={topic.id}
                                            className="text-body-sm font-medium cursor-pointer"
                                          >
                                            {topic.name}
                                          </Label>
                                          {posts.length > 0 && (
                                            <Badge variant="outline" className="text-caption mt-1">
                                              {posts.length} custom {posts.length === 1 ? 'post' : 'posts'}
                                            </Badge>
                                          )}
                                        </div>
                                        <Switch
                                          id={topic.id}
                                          checked={topic.is_allowed}
                                          onCheckedChange={() =>
                                            handleToggleTopic(topic.id, topic.is_allowed || false)
                                          }
                                          disabled={updateSetting.isPending}
                                        />
                                      </div>

                                      {/* Posts for this system topic */}
                                      {topic.is_allowed && (
                                        <div className="ml-4 mt-2 border-l-2 pl-4">
                                          <TopicPostsList
                                            childId={activeChildId}
                                            childAge={selectedChild?.age}
                                            topicId={topic.id}
                                            topicName={topic.name}
                                            topicDescription={topic.description}
                                            posts={posts}
                                          />
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        );
                      })}
                    </Accordion>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      )}

      {/* Custom Topic Dialog */}
      <CustomTopicDialog
        open={customTopicDialogOpen}
        onOpenChange={setCustomTopicDialogOpen}
        childId={activeChildId}
        topic={editingCustomTopic}
      />

      {/* Delete Custom Topic Confirmation */}
      <AlertDialog
        open={!!deletingCustomTopic}
        onOpenChange={(open) => !open && setDeletingCustomTopic(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Custom Topic</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingCustomTopic?.name}"? This will also
              delete all posts within this topic. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCustomTopic}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Topic
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
