/**
 * Child Profile List
 *
 * Grid of child profile cards with empty state.
 */

import { useState } from 'react';
import { useChildProfiles } from '@/hooks/queries';
import { useAuth } from '@/contexts/AuthContext';
import { ChildProfileCard } from './ChildProfileCard';
import { CreateChildDialog } from './CreateChildDialog';
import { EditChildDialog } from './EditChildDialog';
import { QueryState } from '@/components/shared/feedback/QueryState';
import { Button } from '@/components/ui/button';
import { Users, Plus } from 'lucide-react';
import type { ChildProfileWithAvatar } from '@/services/childProfiles';

export function ChildProfileList() {
  const { user } = useAuth();
  const { data: children, isLoading, isError, error, refetch } = useChildProfiles(user?.id);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingChild, setEditingChild] = useState<ChildProfileWithAvatar | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Children</h2>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Child
        </Button>
      </div>

      <QueryState
        isLoading={isLoading}
        isError={isError}
        error={error}
        data={children}
        loadingMessage="Loading profiles..."
        emptyIcon={Users}
        emptyTitle="No children yet"
        emptyDescription="Add a child profile to get started with personalized learning."
        emptyAction={{
          label: 'Add Child',
          onClick: () => setShowCreateDialog(true),
        }}
        onRetry={refetch}
      >
        {(profiles) => (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {profiles.map((child) => (
              <ChildProfileCard
                key={child.id}
                child={child}
                onEdit={() => setEditingChild(child)}
              />
            ))}
          </div>
        )}
      </QueryState>

      <CreateChildDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

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
