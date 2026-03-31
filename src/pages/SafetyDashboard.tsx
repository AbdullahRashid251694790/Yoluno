/**
 * Safety Dashboard Page
 *
 * Parent dashboard for monitoring Luno chat safety and managing Luno settings.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChildProfiles } from '@/hooks/queries';
import { SafetyReportsPanel, BuddySettingsPanel, JourneyReminderSettingsPanel } from '@/components/dashboard/safety';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/shared/feedback/EmptyState';
import { LoadingState } from '@/components/shared/feedback/LoadingState';
import { Shield, Users, Bell } from 'lucide-react';

export function SafetyDashboardPage() {
  const { user } = useAuth();
  const { data: childProfiles = [], isLoading } = useChildProfiles(user?.id);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  // Auto-select first child if available
  useEffect(() => {
    if (childProfiles.length > 0 && !selectedChildId) {
      setSelectedChildId(childProfiles[0].id);
    }
  }, [childProfiles, selectedChildId]);

  const selectedChild = childProfiles.find((child) => child.id === selectedChildId);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingState message="Loading safety dashboard..." />
      </div>
    );
  }

  if (childProfiles.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-h3 font-bold">Safety & Luno Chat</h1>
          <p className="mt-2 text-muted-foreground">
            Monitor conversations and customize your children's AI companion Luno
          </p>
        </div>

        <EmptyState
          icon={Users}
          title="No child profiles yet"
          description="Create a child profile to start monitoring Luno chat conversations."
          className="py-12"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-h3 font-bold">Safety & Luno Chat</h1>
        <p className="mt-2 text-muted-foreground">
          Monitor conversations and customize your children's AI companion Luno
        </p>
      </div>

      {/* Child Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
              <label className="text-body-sm font-medium">Select Child</label>
              <Select
                value={selectedChildId || undefined}
                onValueChange={setSelectedChildId}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choose a child" />
                </SelectTrigger>
                <SelectContent>
                  {childProfiles.map((child) => (
                    <SelectItem key={child.id} value={child.id}>
                      {child.name} (Age {child.age})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {selectedChild ? (
        <Tabs defaultValue="reports" className="space-y-6">
          <TabsList>
            <TabsTrigger value="reports">Safety Reports</TabsTrigger>
            <TabsTrigger value="buddy">Luno Settings</TabsTrigger>
            <TabsTrigger value="reminders">
              <Bell className="h-4 w-4 mr-1" />
              Journey Reminders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports" className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Safety reports are generated when the AI detects concerning content in{' '}
                {selectedChild.name}'s conversations. Review them regularly to ensure safe
                interactions.
              </AlertDescription>
            </Alert>

            <SafetyReportsPanel childId={selectedChild.id} />
          </TabsContent>

          <TabsContent value="buddy" className="space-y-4">
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Customize {selectedChild.name}'s Luno to match their personality and
                learning needs. Changes take effect immediately.
              </AlertDescription>
            </Alert>

            <BuddySettingsPanel
              childId={selectedChild.id}
              childName={selectedChild.name}
            />
          </TabsContent>

          <TabsContent value="reminders" className="space-y-4">
            <Alert>
              <Bell className="h-4 w-4" />
              <AlertDescription>
                Configure how Luno reminds {selectedChild.name} about their journey tasks.
                Reminders are sent via push notification and as buddy messages.
              </AlertDescription>
            </Alert>

            <JourneyReminderSettingsPanel
              childId={selectedChild.id}
              childName={selectedChild.name}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <Alert>
          <AlertDescription>Please select a child to view their safety reports and Luno settings.</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
