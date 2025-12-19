/**
 * Topics Page
 *
 * Manage content topics for children.
 * All data from database - no hardcoding.
 */

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChildProfiles } from '@/hooks/queries/useChildProfiles';
import {
  useChildTopicSettings,
  useUpdateTopicSetting,
} from '@/hooks/queries/useTopics';
import { LoadingSpinner, EmptyState } from '@/components/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  Tag,
  Filter,
  Users,
  Info,
} from 'lucide-react';

export function TopicsPage() {
  const { user } = useAuth();
  const { data: children = [], isLoading: childrenLoading } = useChildProfiles(user?.id);
  const [selectedChildId, setSelectedChildId] = useState<string>('');

  // Set first child as default when loaded
  const activeChildId = selectedChildId || children[0]?.id;

  const { data: topicSettings, isLoading: topicsLoading } = useChildTopicSettings(activeChildId);
  const updateSetting = useUpdateTopicSetting();

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

  // Group topics by category
  const topicsByCategory = topicSettings?.topics.reduce(
    (acc, topic) => {
      const category = topic.category_name || 'Other';
      if (!acc[category]) acc[category] = [];
      acc[category].push(topic);
      return acc;
    },
    {} as Record<string, typeof topicSettings.topics>
  ) || {};

  const selectedChild = children.find((c) => c.id === activeChildId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Content Topics</h1>
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
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="flex items-start gap-3 py-4">
          <Info className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900">
              Topics shown are age-appropriate for {selectedChild?.name} (age {topicSettings?.child_age}).
              Enabled topics can be discussed during conversations.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Topics List */}
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Topic Settings for {selectedChild?.name}
            </CardTitle>
            <CardDescription>
              Toggle topics on or off to control conversation content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="multiple" className="w-full">
              {Object.entries(topicsByCategory).map(([category, topics]) => {
                const allowedCount = topics.filter((t) => t.is_allowed).length;
                return (
                  <AccordionItem key={category} value={category}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{category}</span>
                        <Badge variant="secondary">
                          {allowedCount}/{topics.length} allowed
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        {topics.map((topic) => (
                          <div
                            key={topic.id}
                            className="flex items-center justify-between rounded-lg border p-3"
                          >
                            <div className="space-y-0.5">
                              <Label
                                htmlFor={topic.id}
                                className="text-sm font-medium cursor-pointer"
                              >
                                {topic.name}
                              </Label>
                              {topic.description && (
                                <p className="text-xs text-muted-foreground">
                                  {topic.description}
                                </p>
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
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
