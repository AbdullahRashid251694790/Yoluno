/**
 * Child Profile Card
 *
 * Card displaying a child profile with actions including PIN management.
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ChildProfileRow } from '@/types/database';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn, formatRelativeTime, getInitials } from '@/lib/utils';
import { getUploadUrl } from '@/integrations/api/client';
import { Play, BookOpen, Settings, KeyRound, ShieldCheck } from 'lucide-react';
import { PINSetupDialog } from './PINSetupDialog';
import { usePinStatus } from '@/hooks/queries/usePin';

interface ChildProfileCardProps {
  child: ChildProfileRow;
  avatarUrl?: string;
  onEdit?: () => void;
}

export function ChildProfileCard({ child, avatarUrl, onEdit }: ChildProfileCardProps) {
  const [showPinDialog, setShowPinDialog] = useState(false);
  const { data: pinStatus } = usePinStatus(child.id);

  const hasPin = pinStatus?.hasPin ?? !!child.pin_hash;

  return (
    <>
      <Card className="overflow-hidden transition-shadow hover:shadow-lg">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={getUploadUrl(avatarUrl || child.custom_avatar_url) || undefined} alt={child.name} />
                <AvatarFallback className="bg-child-primary/20 text-2xl text-child-primary">
                  {getInitials(child.name)}
                </AvatarFallback>
              </Avatar>
              {/* PIN indicator */}
              {hasPin && (
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center border-2 border-white">
                  <ShieldCheck className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </div>

            <h3 className="mt-4 text-xl font-semibold">{child.name}</h3>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <Badge variant="secondary">{child.age} years old</Badge>
              {child.gender && child.gender !== 'prefer_not_to_say' && (
                <Badge
                  variant="outline"
                  className={cn(
                    child.gender === 'boy' && 'border-blue-300 bg-blue-50 text-blue-700',
                    child.gender === 'girl' && 'border-pink-300 bg-pink-50 text-pink-700'
                  )}
                >
                  {child.gender === 'boy' ? '👦 Boy' : '👧 Girl'}
                </Badge>
              )}
            </div>

            {child.last_active_at && (
              <p className="mt-2 text-sm text-muted-foreground">
                Active {formatRelativeTime(child.last_active_at)}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-center gap-2 border-t bg-muted/50 px-6 py-4">
          <Link to={`/kids/${child.id}`}>
            <Button size="sm" className="gap-2">
              <Play className="h-4 w-4" />
              Play
            </Button>
          </Link>
          <Link to="/dashboard/stories">
            <Button size="sm" variant="outline" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Story
            </Button>
          </Link>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowPinDialog(true)}
            title={hasPin ? 'Reset PIN' : 'Set PIN'}
          >
            <KeyRound className="h-4 w-4" />
          </Button>
          {onEdit && (
            <Button size="sm" variant="ghost" onClick={onEdit}>
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* PIN Setup Dialog */}
      <PINSetupDialog
        open={showPinDialog}
        onOpenChange={setShowPinDialog}
        childId={child.id}
        childName={child.name}
        hasExistingPin={hasPin}
      />
    </>
  );
}
