/**
 * Kids Family Page
 *
 * Shows family members to the child, including:
 * - The child themselves
 * - Siblings (other child profiles)
 * - Family members added by parents (grandparents, aunts, uncles, etc.)
 */

import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChildProfile, useFamilyMembers } from '@/hooks/queries';
import { useChildProfiles } from '@/hooks/queries/useChildProfiles';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner, ErrorState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Users, Crown, Heart } from 'lucide-react';
import { getUploadUrl } from '@/integrations/api/client';
import type { FamilyMemberRow } from '@/types/database';

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

// Get display label for relationship group
function getGroupLabel(group: string): string {
  const labels: Record<string, string> = {
    grandparents: 'Grandparents',
    parents: 'Parents',
    auntsUncles: 'Aunts & Uncles',
    cousins: 'Cousins',
    other: 'Other Family',
  };
  return labels[group] || group;
}

// Get border color for relationship group
function getGroupBorderColor(group: string): string {
  const colors: Record<string, string> = {
    grandparents: 'border-purple-200',
    parents: 'border-amber-200',
    auntsUncles: 'border-blue-200',
    cousins: 'border-green-200',
    other: 'border-gray-200',
  };
  return colors[group] || 'border-gray-200';
}

// Get fallback background color for relationship group
function getGroupBgColor(group: string): string {
  const colors: Record<string, string> = {
    grandparents: 'bg-purple-100',
    parents: 'bg-amber-100',
    auntsUncles: 'bg-blue-100',
    cousins: 'bg-green-100',
    other: 'bg-gray-100',
  };
  return colors[group] || 'bg-gray-100';
}

export function KidsFamilyPage() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: child, isLoading: childLoading } = useChildProfile(childId);
  const { data: siblings = [], isLoading: siblingsLoading } = useChildProfiles(user?.id);
  const { data: familyMembers = [], isLoading: familyLoading } = useFamilyMembers(user?.id);

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

  // Count total family members (excluding self)
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
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold">My Family</h1>
          <p className="text-sm text-muted-foreground">
            {totalMembers} {totalMembers === 1 ? 'member' : 'members'}
          </p>
        </div>
        <Users className="h-6 w-6 text-primary" />
      </header>

      <div className="px-4 pb-8 pt-4 space-y-4">
        {/* Current Child (Me) */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-primary">
                <AvatarImage src={child.avatarUrl || undefined} alt={child.name} />
                <AvatarFallback className="text-xl bg-primary/20">
                  {child.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">{child.name}</h2>
                  <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                    That's me!
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{child.age} years old</p>
              </div>
              <Heart className="h-6 w-6 text-pink-500 fill-pink-500" />
            </div>
          </CardContent>
        </Card>

        {/* Parent Account */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">Parent</h3>
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-amber-200">
                  <AvatarFallback className="text-lg bg-amber-100">
                    <Crown className="h-6 w-6 text-amber-600" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="font-semibold">{user?.email?.split('@')[0] || 'Parent'}</h2>
                  <p className="text-sm text-muted-foreground">Your parent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Siblings (from child profiles) */}
        {otherChildren.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">
              {otherChildren.length === 1 ? 'Sibling' : 'Siblings'}
            </h3>
            <div className="space-y-2">
              {otherChildren.map((sibling) => (
                <Card key={sibling.id} className="bg-white/70 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-14 w-14 border-2 border-cyan-200">
                        <AvatarImage src={sibling.avatarUrl || undefined} alt={sibling.name} />
                        <AvatarFallback className="text-lg bg-cyan-100">
                          {sibling.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h2 className="font-semibold">{sibling.name}</h2>
                        <p className="text-sm text-muted-foreground">{sibling.age} years old</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Family Members (from parent's family tree) */}
        {Object.entries(groupedFamily).map(([group, members]) => {
          if (members.length === 0) return null;

          return (
            <div key={group}>
              <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">
                {getGroupLabel(group)}
              </h3>
              <div className="space-y-2">
                {members.map((member) => (
                  <Card key={member.id} className="bg-white/70 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <Avatar className={`h-14 w-14 border-2 ${getGroupBorderColor(group)}`}>
                          {member.photo_url ? (
                            <AvatarImage
                              src={getUploadUrl(member.photo_url)}
                              alt={member.name}
                            />
                          ) : null}
                          <AvatarFallback className={`text-lg ${getGroupBgColor(group)}`}>
                            {member.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h2 className="font-semibold">{member.name}</h2>
                          <p className="text-sm text-muted-foreground capitalize">
                            {member.relationship}
                          </p>
                          {member.connection_description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {member.connection_description}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}

        {/* Empty state when no extended family */}
        {familyMembers.length === 0 && otherChildren.length === 0 && (
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardContent className="py-8 text-center">
              <Users className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">
                Ask your parent to add more family members!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
