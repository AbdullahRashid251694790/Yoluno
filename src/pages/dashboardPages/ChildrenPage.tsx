/**
 * Children Management Page
 *
 * Page for managing child profiles.
 */

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChildProfiles } from '@/hooks/queries/useChildProfiles';
import { ChildProfileCard } from '@/components/dashboard/children/ChildProfileCard';
import { CreateChildDialog } from '@/components/dashboard/children/CreateChildDialog';
import { EditChildDialog } from '@/components/dashboard/children/EditChildDialog';
import { LoadingState, EmptyState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Plus } from 'lucide-react';
import type { ChildProfileWithAvatar } from '@/services/childProfiles';

export function ChildrenPage() {
  const { user } = useAuth();
  const { data: children = [], isLoading } = useChildProfiles(user?.id);
  const [editingChild, setEditingChild] = useState<ChildProfileWithAvatar | null>(null);

  if (isLoading) {
    return <LoadingState message="Loading children..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Children</h1>
          <p className="text-muted-foreground mt-1">
            Manage your child profiles and settings.
          </p>
        </div>
        <CreateChildDialog
          trigger={
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Child
            </Button>
          }
        />
      </div>

      {children.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Users}
              title="No children yet"
              description="Add your first child profile to get started with Yoluno."
              action={
                <CreateChildDialog
                  trigger={
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Your First Child
                    </Button>
                  }
                />
              }
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {children.map((child) => (
            <ChildProfileCard
              key={child.id}
              child={child}
              avatarUrl={child.avatarUrl}
              onEdit={() => setEditingChild(child)}
            />
          ))}
        </div>
      )}

      {/* Edit Child Dialog */}
      <EditChildDialog
        child={editingChild}
        open={!!editingChild}
        onOpenChange={(open) => {
          if (!open) setEditingChild(null);
        }}
        onSuccess={() => setEditingChild(null)}
        onDelete={() => setEditingChild(null)}
      />
    </div>
  );
}
