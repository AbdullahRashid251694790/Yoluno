/**
 * Kids Family Page
 *
 * Shows family members to the child.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useChildProfile } from '@/hooks/queries';
import { useChildProfiles } from '@/hooks/queries/useChildProfiles';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner, ErrorState } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Users, Crown, Heart } from 'lucide-react';

export function KidsFamilyPage() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: child, isLoading: childLoading } = useChildProfile(childId);
  const { data: siblings = [], isLoading: siblingsLoading } = useChildProfiles(user?.id);

  const handleBack = () => {
    navigate(`/kids/${childId}`);
  };

  if (childLoading || siblingsLoading) {
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

  // Filter out current child to get siblings
  const otherChildren = siblings.filter((s) => s.id !== childId);

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
            {otherChildren.length > 0 ? `${otherChildren.length + 1} members` : 'Your family'}
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
                <p className="text-sm text-muted-foreground">
                  {child.age} years old
                </p>
              </div>
              <Heart className="h-6 w-6 text-pink-500 fill-pink-500" />
            </div>
          </CardContent>
        </Card>

        {/* Parent */}
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">
            Parent
          </h3>
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 border-2 border-amber-200">
                  <AvatarFallback className="text-lg bg-amber-100">
                    <Crown className="h-6 w-6 text-amber-600" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h2 className="font-semibold">
                    {user?.email?.split('@')[0] || 'Parent'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Your parent
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Siblings */}
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
                        <p className="text-sm text-muted-foreground">
                          {sibling.age} years old
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* No siblings message */}
        {otherChildren.length === 0 && (
          <Card className="bg-white/70 backdrop-blur-sm">
            <CardContent className="py-8 text-center">
              <Users className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">
                You don't have any siblings yet!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
