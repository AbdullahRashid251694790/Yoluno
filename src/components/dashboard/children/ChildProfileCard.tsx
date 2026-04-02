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
      <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-primary/10 to-lumi/10 border border-primary/15">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={getUploadUrl(avatarUrl || child.custom_avatar_url) || undefined} alt={child.name} />
                <AvatarFallback className="bg-child-primary/20 text-h4 text-child-primary">
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

            <h3 className="mt-3 text-body font-semibold">{child.name}</h3>

            <div className="mt-1.5 flex flex-wrap items-center justify-center gap-1.5">
              <Badge variant="secondary" className="text-caption px-2.5 py-0.5">{child.age} years old</Badge>
              {child.gender && child.gender !== 'prefer_not_to_say' && (
                <Badge
                  variant="outline"
                  className={cn(
                    '!text-caption !px-2.5 !py-0.5',
                    child.gender === 'boy' && 'border-primary bg-primary/5 text-primary',
                    child.gender === 'girl' && 'border-lolo bg-lolo/10 text-lolo'
                  )}
                >
                  {child.gender === 'boy' ? '👦 Boy' : '👧 Girl'}
                </Badge>
              )}
            </div>

            {child.last_active_at && (
              <p className="mt-2 text-body-sm text-muted-foreground">
                Active {formatRelativeTime(child.last_active_at)}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-center gap-2 border-t border-white/50 bg-white/60 px-4 py-3">
          <Link to={`/kids/${child.id}/mood`}>
            <Button size="sm" className="gap-1.5 !h-8 !px-3 !text-caption text-white/85">
              <Play className="h-3.5 w-3.5" />
              Play
            </Button>
          </Link>
          <Link to="/dashboard/stories">
            <Button size="sm" variant="outline" className="gap-1.5 !h-8 !px-3 !text-caption">
              <BookOpen className="h-3.5 w-3.5" />
              Story
            </Button>
          </Link>
          <Button
            size="icon"
            variant="outline"
            className="!h-8 !w-8"
            onClick={() => setShowPinDialog(true)}
            title={hasPin ? 'Reset PIN' : 'Set PIN'}
          >
            <KeyRound className="h-3.5 w-3.5" />
          </Button>
          {onEdit && (
            <Button size="icon" variant="ghost" className="!h-8 !w-8" onClick={onEdit}>
              <Settings className="h-3.5 w-3.5" />
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
