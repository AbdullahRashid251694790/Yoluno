/**
 * Kids Family Page
 *
 * Interactive family album showing family members to the child.
 * Enhanced UI with larger photos, colorful cards, and detail modals.
 */

import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChildProfile, useFamilyMembers } from '@/hooks/queries';
import { useChildProfiles } from '@/hooks/queries/useChildProfiles';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner, ErrorState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, Crown } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  FamilyMemberCard,
  FamilyMemberDetail,
  RelationshipGroup,
  type RelationType,
} from '@/components/kids/family';
import type { FamilyMemberRow, ChildProfile } from '@/types/database';

// Group family members by relationship category
function groupFamilyMembers(members: FamilyMemberRow[]) {
  const groups: Record<string, FamilyMemberRow[]> = {
    grandparents: [],
    parents: [],
    auntsUncles: [],
    cousins: [],
    other: [],
  };

  const relationshipMap: Record<string, keyof typeof groups> = {
    grandmother: 'grandparents',
    grandfather: 'grandparents',
    grandma: 'grandparents',
    grandpa: 'grandparents',
    nana: 'grandparents',
    nani: 'grandparents',
    dada: 'grandparents',
    dadi: 'grandparents',
    mother: 'parents',
    father: 'parents',
    mom: 'parents',
    dad: 'parents',
    aunt: 'auntsUncles',
    uncle: 'auntsUncles',
    khala: 'auntsUncles',
    phupho: 'auntsUncles',
    chacha: 'auntsUncles',
    mama: 'auntsUncles',
    cousin: 'cousins',
  };

  members.forEach((member) => {
    const rel = member.relationship?.toLowerCase() || '';
    let found = false;
    for (const [key, group] of Object.entries(relationshipMap)) {
      if (rel.includes(key)) {
        groups[group].push(member);
        found = true;
        break;
      }
    }
    if (!found) {
      groups.other.push(member);
    }
  });

  return groups;
}

// Map group key to RelationType
function getRelationType(group: string): RelationType {
  const mapping: Record<string, RelationType> = {
    grandparents: 'grandparent',
    parents: 'parent',
    auntsUncles: 'aunt_uncle',
    cousins: 'cousin',
    other: 'other',
  };
  return mapping[group] || 'other';
}

export function KidsFamilyPage() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: child, isLoading: childLoading } = useChildProfile(childId);
  const { data: siblings = [], isLoading: siblingsLoading } = useChildProfiles(user?.id);
  const { data: familyMembers = [], isLoading: familyLoading } = useFamilyMembers(user?.id);

  // Selected member for detail modal
  const [selectedMember, setSelectedMember] = useState<{
    member: FamilyMemberRow | ChildProfile;
    type: RelationType;
  } | null>(null);

  const handleBack = () => {
    navigate(`/kids/${childId}`);
  };

  // Filter out current child to get siblings
  const otherChildren = useMemo(
    () => siblings.filter((s) => s.id !== childId),
    [siblings, childId]
  );

  // Group family members by relationship
  const groupedFamily = useMemo(() => groupFamilyMembers(familyMembers), [familyMembers]);

  // Count total family members
  const totalMembers = useMemo(() => {
    return otherChildren.length + familyMembers.length + 1; // +1 for parent account
  }, [otherChildren, familyMembers]);

  const isLoading = childLoading || siblingsLoading || familyLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-kids-gradient flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!child) {
    return (
      <ErrorState
        title="Oops!"
        message="We couldn't find your profile."
        onRetry={handleBack}
        retryLabel="Go Back"
        fullPage
      />
    );
  }

  return (
    <div className="min-h-screen bg-kids-gradient safe-area-inset">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4 bg-white/50 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="rounded-full bg-white/50 hover:bg-white/70"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-display font-bold flex items-center gap-2">
            <span>My Family Album</span>
            <span className="text-lg">👨‍👩‍👧‍👦</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {totalMembers} {totalMembers === 1 ? 'member' : 'members'}
          </p>
        </div>
        <Users className="h-6 w-6 text-primary" />
      </header>

      <div className="px-4 pb-8 pt-4 space-y-6">
        {/* Current Child (Me) */}
        <RelationshipGroup type="self">
          <FamilyMemberCard
            member={child}
            type="self"
            isSelf
            onPress={() => setSelectedMember({ member: child, type: 'self' })}
          />
        </RelationshipGroup>

        {/* Parent Account */}
        <RelationshipGroup type="parent">
          <button
            className="w-full p-4 rounded-2xl bg-white/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-200 active:scale-[0.98] hover:scale-[1.02] flex items-center gap-4 text-left"
          >
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-amber-400">
                <AvatarFallback className="text-2xl bg-amber-100">
                  <Crown className="h-8 w-8 text-amber-600" />
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-1 -right-1 text-xl bg-white rounded-full p-1 shadow-sm">
                👑
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-display font-bold text-lg text-foreground truncate">
                {user?.email?.split('@')[0] || 'Parent'}
              </h3>
              <p className="text-sm font-medium text-amber-600">
                Your parent
              </p>
            </div>
          </button>
        </RelationshipGroup>

        {/* Siblings */}
        {otherChildren.length > 0 && (
          <RelationshipGroup
            type="siblings"
            count={otherChildren.length}
            horizontal={otherChildren.length >= 3}
          >
            {otherChildren.map((sibling) => (
              <div key={sibling.id} className={otherChildren.length >= 3 ? 'w-48 flex-shrink-0' : ''}>
                <FamilyMemberCard
                  member={sibling}
                  type="sibling"
                  onPress={() => setSelectedMember({ member: sibling, type: 'sibling' })}
                />
              </div>
            ))}
          </RelationshipGroup>
        )}

        {/* Family Members by Group */}
        {Object.entries(groupedFamily).map(([group, members]) => {
          if (members.length === 0) return null;

          const groupType = group as 'grandparents' | 'auntsUncles' | 'cousins' | 'other';
          const relationType = getRelationType(group);

          return (
            <RelationshipGroup
              key={group}
              type={groupType}
              count={members.length}
              horizontal={members.length >= 3}
            >
              {members.map((member) => (
                <div key={member.id} className={members.length >= 3 ? 'w-48 flex-shrink-0' : ''}>
                  <FamilyMemberCard
                    member={member}
                    type={relationType}
                    onPress={() => setSelectedMember({ member, type: relationType })}
                  />
                </div>
              ))}
            </RelationshipGroup>
          );
        })}

        {/* Empty state */}
        {familyMembers.length === 0 && otherChildren.length === 0 && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl py-12 text-center">
            <div className="text-4xl mb-4">👨‍👩‍👧</div>
            <p className="text-muted-foreground">
              Ask your parent to add more family members!
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <FamilyMemberDetail
        member={selectedMember?.member || null}
        type={selectedMember?.type || 'other'}
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </div>
  );
}
