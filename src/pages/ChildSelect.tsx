/**
 * Child Selection Portal
 *
 * Entry point where children select their profile.
 * Features floating animated avatar cards and child-friendly design.
 * Supports PIN protection for child profiles.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChildProfiles } from '@/hooks/queries/useChildProfiles';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, getInitials } from '@/lib/utils';
import { Sparkles, Lock, Star, ShieldCheck } from 'lucide-react';
import { KidsPINDialog } from '@/components/kids/auth';
import type { ChildProfileWithAvatar } from '@/services/childProfiles';

export function ChildSelectPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: children = [], isLoading } = useChildProfiles(user?.id);

  // State for PIN dialog
  const [selectedChild, setSelectedChild] = useState<ChildProfileWithAvatar | null>(null);
  const [showPinDialog, setShowPinDialog] = useState(false);

  const handleParentLogin = () => {
    navigate('/dashboard');
  };

  // Handle child profile selection
  const handleChildSelect = useCallback(
    (child: ChildProfileWithAvatar) => {
      // Check if child has a PIN set
      if (child.pin_hash) {
        // Show PIN dialog
        setSelectedChild(child);
        setShowPinDialog(true);
      } else {
        // No PIN, navigate directly
        navigate(`/kids/${child.id}`);
      }
    },
    [navigate]
  );

  // Handle successful PIN verification
  const handlePinSuccess = useCallback(() => {
    if (selectedChild) {
      navigate(`/kids/${selectedChild.id}`);
    }
    setShowPinDialog(false);
    setSelectedChild(null);
  }, [selectedChild, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-kids-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl animate-bounce-gentle mb-4">✨</div>
          <p className="text-xl font-display font-semibold text-primary">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kids-gradient flex flex-col">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <span className="text-2xl font-display font-bold text-primary">Yoluno</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleParentLogin}
          className="text-muted-foreground hover:text-foreground"
        >
          <Lock className="h-4 w-4 mr-2" />
          Parent Login
        </Button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        {/* Welcome message */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-2">
            <span className="mr-2">🌈</span>
            Welcome back!
            <span className="ml-2">🌈</span>
          </h1>
          <p className="text-xl text-muted-foreground mt-4">
            Tap your picture to start playing!
          </p>
        </div>

        {/* Child profiles */}
        {children.length === 0 ? (
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">👋</div>
            <h2 className="text-2xl font-display font-bold mb-2">No profiles yet!</h2>
            <p className="text-muted-foreground mb-6">
              Ask a parent to create your profile.
            </p>
            <Button onClick={handleParentLogin}>
              Go to Parent Dashboard
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-8 max-w-4xl">
            {children.map((child, index) => (
              <div
                key={child.id}
                onClick={() => handleChildSelect(child)}
                className="group cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleChildSelect(child);
                  }
                }}
              >
                <div
                  className={cn(
                    'flex flex-col items-center p-6 rounded-3xl',
                    'bg-white/80 backdrop-blur-sm shadow-lg',
                    'hover:shadow-2xl hover:scale-105 transition-all duration-300',
                    'cursor-pointer animate-float',
                    'border-4 border-transparent hover:border-primary/30'
                  )}
                  style={{
                    animationDelay: `${index * 0.2}s`,
                  }}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className="h-32 w-32 border-4 border-white shadow-md group-hover:animate-wiggle">
                      <AvatarImage src={child.avatarUrl || undefined} alt={child.name} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-child-secondary text-4xl text-white font-display">
                        {getInitials(child.name)}
                      </AvatarFallback>
                    </Avatar>

                    {/* PIN indicator */}
                    {child.pin_hash && (
                      <div className="absolute -top-1 -right-1 h-7 w-7 rounded-full bg-primary flex items-center justify-center border-2 border-white shadow-sm">
                        <ShieldCheck className="h-4 w-4 text-white" />
                      </div>
                    )}

                    {/* Online indicator */}
                    {child.last_active_at &&
                      new Date(child.last_active_at).getTime() > Date.now() - 5 * 60 * 1000 && (
                        <div className="absolute bottom-2 right-2 h-5 w-5 rounded-full bg-green-500 border-2 border-white" />
                      )}
                  </div>

                  {/* Name */}
                  <h3 className="mt-4 text-2xl font-display font-bold text-foreground">
                    {child.name}
                  </h3>

                  {/* Stars based on age */}
                  <div className="flex items-center gap-1 mt-2">
                    {[...Array(Math.min(child.age || 0, 5))].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 text-yellow-400 fill-yellow-400"
                      />
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {/* Add more hint (for parents) */}
            <div
              onClick={handleParentLogin}
              className={cn(
                'flex flex-col items-center justify-center p-6 rounded-3xl',
                'bg-white/40 backdrop-blur-sm border-2 border-dashed border-gray-300',
                'hover:bg-white/60 hover:border-primary/30 transition-all duration-300',
                'cursor-pointer min-w-[180px] min-h-[220px]'
              )}
            >
              <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center text-4xl">
                ➕
              </div>
              <p className="mt-4 text-gray-500 font-medium">Add Me!</p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Made with ❤️ for curious minds
        </p>
      </footer>

      {/* PIN Dialog */}
      {selectedChild && (
        <KidsPINDialog
          open={showPinDialog}
          onOpenChange={setShowPinDialog}
          childId={selectedChild.id}
          childName={selectedChild.name}
          onSuccess={handlePinSuccess}
        />
      )}
    </div>
  );
}
