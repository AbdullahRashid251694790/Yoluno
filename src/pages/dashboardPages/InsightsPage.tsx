/**
 * Insights Page
 *
 * Parent dashboard for viewing analytics and insights about children's activities.
 * All data from database - no hardcoding.
 */

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChildProfiles } from '@/hooks/queries/useChildProfiles';
import {
  useActivityTimeline,
  useWeeklySummary,
  useChatTopics,
  useJourneyProgressAnalytics,
  useAnalyticsOverview,
} from '@/hooks/queries/useAnalytics';
import { LoadingSpinner, EmptyState } from '@/components/shared';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  MessageCircle,
  BookOpen,
  Map,
  TrendingUp,
  Clock,
  Flame,
  Trophy,
  Tag,
  Calendar,
  Filter,
  Heart,
} from 'lucide-react';
import {
  MoodCalendar,
  MoodDistributionChart,
  MoodAlerts,
} from '@/components/dashboard/insights';

export function InsightsPage() {
  const { user } = useAuth();
  const { data: children = [], isLoading: childrenLoading } = useChildProfiles(user?.id);
  const [selectedChildId, setSelectedChildId] = useState<string>('all');

  // Analytics queries
  const { data: overview, isLoading: overviewLoading } = useAnalyticsOverview();
  const activeChildId = selectedChildId !== 'all' ? selectedChildId : children[0]?.id;
  const { data: activityTimeline = [] } = useActivityTimeline(activeChildId, 7);
  const { data: weeklySummary } = useWeeklySummary(activeChildId);
  const { data: chatTopics = [] } = useChatTopics(activeChildId, 10);
  const { data: journeyProgress = [] } = useJourneyProgressAnalytics(activeChildId);

  if (childrenLoading || overviewLoading) {
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
            icon={BarChart3}
            title="No children to track"
            description="Add a child profile to start seeing insights about their learning."
          />
        </CardContent>
      </Card>
    );
  }

  const selectedChild = children.find((c) => c.id === activeChildId);
  const childOverview = overview?.children.find((c) => c.child.id === activeChildId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-body-lg sm:text-h4 lg:text-h3 font-bold">Insights & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Track your children's learning progress and activities.
          </p>
        </div>

        {children.length > 0 && (
          <Select value={selectedChildId === 'all' ? children[0]?.id : selectedChildId} onValueChange={setSelectedChildId}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
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

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-primary/10 to-primary/20 border border-primary/15">
          <CardHeader className="pb-2">
            <CardTitle className="text-body-sm font-medium text-muted-foreground flex items-center gap-2">
              <div className="rounded-lg bg-primary/15 p-1.5">
                <MessageCircle className="h-4 w-4 text-primary" />
              </div>
              Weekly Messages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-h4 font-bold">{weeklySummary?.total_messages || 0}</div>
            <p className="text-caption text-muted-foreground">
              ~{weeklySummary?.average_daily_messages || 0} per day
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-lumi/10 to-lumi/20 border border-lumi/15">
          <CardHeader className="pb-2">
            <CardTitle className="text-body-sm font-medium text-muted-foreground flex items-center gap-2">
              <div className="rounded-lg bg-lumi/15 p-1.5">
                <BookOpen className="h-4 w-4 text-lumi" />
              </div>
              Stories Created
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-h4 font-bold">{weeklySummary?.total_stories || 0}</div>
            <p className="text-caption text-muted-foreground">this week</p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-lolo/10 to-lolo/20 border border-lolo/15">
          <CardHeader className="pb-2">
            <CardTitle className="text-body-sm font-medium text-muted-foreground flex items-center gap-2">
              <div className="rounded-lg bg-lolo/15 p-1.5">
                <Map className="h-4 w-4 text-lolo" />
              </div>
              Journey Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-h4 font-bold">{weeklySummary?.total_journey_steps || 0}</div>
            <p className="text-caption text-muted-foreground">completed this week</p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-gold/10 to-gold/20 border border-gold/15">
          <CardHeader className="pb-2">
            <CardTitle className="text-body-sm font-medium text-muted-foreground flex items-center gap-2">
              <div className="rounded-lg bg-gold/15 p-1.5">
                <Flame className="h-4 w-4 text-gold" />
              </div>
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-h4 font-bold">
              {childOverview?.stats.current_streak || 0} days
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity" className="space-y-6">
        <TabsList>
          <TabsTrigger value="activity" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Activity
          </TabsTrigger>
          <TabsTrigger value="mood" className="gap-2">
            <Heart className="h-4 w-4" />
            Mood
          </TabsTrigger>
          <TabsTrigger value="topics" className="gap-2">
            <Tag className="h-4 w-4" />
            Topics
          </TabsTrigger>
          <TabsTrigger value="journeys" className="gap-2">
            <Map className="h-4 w-4" />
            Journeys
          </TabsTrigger>
        </TabsList>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-6">
          <Card className="shadow-md border border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Last 7 Days Activity
              </CardTitle>
              <CardDescription>
                Daily breakdown of {selectedChild?.name || 'your child'}'s activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activityTimeline.length === 0 ? (
                <EmptyState
                  icon={BarChart3}
                  title="No activity data yet"
                  description="Activity will be tracked as your child uses the app."
                />
              ) : (
                <div className="space-y-4">
                  {activityTimeline.map((day) => (
                    <div key={day.date} className="flex items-center gap-4">
                      <div className="w-24 text-body-sm text-muted-foreground">
                        {new Date(day.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 text-body-sm">
                          <MessageCircle className="h-3 w-3 text-primary" />
                          <span>{day.message_count} messages</span>
                          <BookOpen className="h-3 w-3 text-primary ml-4" />
                          <span>{day.story_count} stories</span>
                          <Map className="h-3 w-3 text-primary ml-4" />
                          <span>{day.journey_steps_completed} steps</span>
                        </div>
                        <Progress
                          value={Math.min(
                            ((day.message_count + day.story_count * 10 + day.journey_steps_completed * 5) /
                              50) *
                              100,
                            100
                          )}
                          className="h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {weeklySummary?.most_active_day && (
            <Card className="shadow-md border border-border/50">
              <CardHeader>
                <CardTitle className="text-body-sm font-medium">Most Active Day</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-lala" />
                  <span className="font-medium">
                    {new Date(weeklySummary.most_active_day).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Mood Tab */}
        <TabsContent value="mood" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Mood Calendar */}
            <Card className="shadow-md border border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Mood Calendar
                </CardTitle>
                <CardDescription>
                  {selectedChild?.name || 'Your child'}'s daily mood check-ins
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeChildId ? (
                  <MoodCalendar childId={activeChildId} days={28} />
                ) : (
                  <EmptyState
                    icon={Heart}
                    title="No child selected"
                    description="Select a child to view their mood calendar."
                  />
                )}
              </CardContent>
            </Card>

            {/* Mood Distribution */}
            <Card className="shadow-md border border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Weekly Mood Distribution
                </CardTitle>
                <CardDescription>
                  How {selectedChild?.name || 'your child'} has been feeling
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeChildId ? (
                  <MoodDistributionChart childId={activeChildId} days={7} />
                ) : (
                  <EmptyState
                    icon={Heart}
                    title="No child selected"
                    description="Select a child to view their mood distribution."
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Mood Alerts */}
          <Card className="shadow-md border border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Mood Insights
              </CardTitle>
              <CardDescription>
                Patterns and observations from mood check-ins
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeChildId && selectedChild ? (
                <MoodAlerts childId={activeChildId} childName={selectedChild.name} />
              ) : (
                <EmptyState
                  icon={Heart}
                  title="No child selected"
                  description="Select a child to view mood insights."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Topics Tab */}
        <TabsContent value="topics" className="space-y-6">
          <Card className="shadow-md border border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Topics Explored
              </CardTitle>
              <CardDescription>
                What {selectedChild?.name || 'your child'} has been curious about
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chatTopics.length === 0 ? (
                <EmptyState
                  icon={Tag}
                  title="No topics tracked yet"
                  description="Topics will appear as your child chats with Luno."
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {chatTopics.map((topic) => (
                    <Badge
                      key={topic.topic}
                      variant="secondary"
                      className="px-3 py-1.5 text-body-sm"
                    >
                      {topic.topic}
                      <span className="ml-2 text-muted-foreground">({topic.mention_count})</span>
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {weeklySummary?.topics_explored && weeklySummary.topics_explored.length > 0 && (
            <Card className="shadow-md border border-border/50">
              <CardHeader>
                <CardTitle className="text-body-sm font-medium">This Week's Discoveries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {weeklySummary.topics_explored.map((topic) => (
                    <Badge key={topic} variant="outline">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Journeys Tab */}
        <TabsContent value="journeys" className="space-y-6">
          <Card className="shadow-md border border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Map className="h-5 w-5 text-lolo" />
                Journey Progress
              </CardTitle>
              <CardDescription>
                {selectedChild?.name || 'Your child'}'s learning journey status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {journeyProgress.length === 0 ? (
                <EmptyState
                  icon={Map}
                  title="No journeys started"
                  description="Start a journey from the Journeys page to see progress here."
                />
              ) : (
                <div className="space-y-4">
                  {journeyProgress.map((journey) => (
                    <div
                      key={journey.id}
                      className="flex items-center gap-4 p-3 rounded-lg bg-lolo/5 border border-lolo/15"
                    >
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{journey.title}</h4>
                          <Badge className="bg-lolo/15 text-lolo border-lolo/30 hover:bg-lolo/20">
                            {journey.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-body-sm text-muted-foreground">
                          <span>
                            {journey.steps_completed} of {journey.total_steps} steps
                          </span>
                        </div>
                        <Progress
                          value={journey.progress_percent}
                          className="h-2 mt-2 bg-lolo/20 [&>div]:bg-lolo"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Journey Stats Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-lolo/10 to-lolo/20 border border-lolo/15">
              <CardHeader className="pb-2">
                <CardTitle className="text-body-sm font-medium text-muted-foreground flex items-center gap-2">
                  <div className="rounded-lg bg-lolo/15 p-1.5">
                    <Map className="h-4 w-4 text-lolo" />
                  </div>
                  Active Journeys
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-h4 font-bold">
                  {journeyProgress.filter((j) => j.status === 'active').length}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-lala/10 to-gold/10 border border-lala/15">
              <CardHeader className="pb-2">
                <CardTitle className="text-body-sm font-medium text-muted-foreground flex items-center gap-2">
                  <div className="rounded-lg bg-lala/15 p-1.5">
                    <Trophy className="h-4 w-4 text-lala" />
                  </div>
                  Completed Journeys
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-h4 font-bold">
                  {childOverview?.stats.total_journeys_completed || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
