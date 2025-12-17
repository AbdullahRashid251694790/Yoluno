/**
 * Family Tree Page
 *
 * Main page component for the Family Tree feature in the parent dashboard.
 * Allows parents to manage family members and view the family tree.
 */

import { useState } from 'react';
import { Plus, Users, Grid, List, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FamilyTreeCanvas } from './FamilyTreeCanvas';
import { FamilyMemberCard } from './FamilyMemberCard';
import { FamilyMemberDialog } from './FamilyMemberDialog';
import {
  useFamilyMembers,
  useDeleteFamilyMember,
  useUpdateTreePositions,
} from '@/hooks/queries/useFamily';
import { useAuth } from '@/contexts/AuthContext';
import type { FamilyMemberRow } from '@/types/database';
import { toast } from 'sonner';

type ViewMode = 'tree' | 'list';

export function FamilyTreePage() {
  const { user } = useAuth();
  const { data: members = [], isLoading, refetch } = useFamilyMembers(user?.id);
  const deleteMember = useDeleteFamilyMember();
  const updatePositions = useUpdateTreePositions();

  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMemberRow | undefined>();

  const handleAddMember = () => {
    setSelectedMember(undefined);
    setDialogOpen(true);
  };

  const handleEditMember = (member: FamilyMemberRow) => {
    setSelectedMember(member);
    setDialogOpen(true);
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      await deleteMember.mutateAsync(memberId);
      toast.success('Family member removed');
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handlePositionChange = async (
    memberId: string,
    x: number,
    y: number
  ) => {
    if (!user) return;

    try {
      await updatePositions.mutateAsync({
        userId: user.id,
        positions: [{ memberId, positionX: x, positionY: y }],
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setSelectedMember(undefined);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Family Tree</h1>
          <p className="text-muted-foreground">
            Add family members so your child's buddy can answer questions about
            your family
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          <Button onClick={handleAddMember}>
            <Plus className="h-4 w-4 mr-2" />
            Add Family Member
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>{members.length} family members</span>
        </div>
      </div>

      {/* View Toggle */}
      <Tabs
        value={viewMode}
        onValueChange={(v) => setViewMode(v as ViewMode)}
        className="w-full"
      >
        <TabsList>
          <TabsTrigger value="tree" className="gap-2">
            <Grid className="h-4 w-4" />
            Tree View
          </TabsTrigger>
          <TabsTrigger value="list" className="gap-2">
            <List className="h-4 w-4" />
            List View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tree" className="mt-6">
          <FamilyTreeCanvas
            members={members}
            onEditMember={handleEditMember}
            onDeleteMember={handleDeleteMember}
            onPositionChange={handlePositionChange}
          />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          {members.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="font-medium">No family members yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Add family members to help your child's buddy answer questions
              </p>
              <Button onClick={handleAddMember} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add First Member
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {members.map((member) => (
                <FamilyMemberCard
                  key={member.id}
                  member={member}
                  onClick={() => handleEditMember(member)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Info Box */}
      <div className="bg-muted/50 rounded-lg p-4 text-sm">
        <h4 className="font-medium mb-2">How the Family Tree helps your child</h4>
        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
          <li>
            The buddy can answer questions like "Who is grandma?" or "What does
            dad do?"
          </li>
          <li>
            Add hobbies and fun facts so the buddy can share interesting stories
          </li>
          <li>
            Photo descriptions help the buddy describe family members naturally
          </li>
          <li>
            Connection descriptions (like "Dad's sister") help explain
            relationships
          </li>
        </ul>
      </div>

      {/* Dialog */}
      <FamilyMemberDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        member={selectedMember}
      />
    </div>
  );
}
