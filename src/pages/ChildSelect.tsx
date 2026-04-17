/**
 * Child Selection Portal
 *
 * Entry point where children select their profile.
 * Redesigned to match loveable KidsWelcomePage exactly.
 * Supports PIN protection for child profiles.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChildProfiles } from '@/hooks/queries/useChildProfiles';
import { getUploadUrl } from '@/integrations/api/client';
import { Lock } from 'lucide-react';
import { KidsPINDialog } from '@/components/kids/auth';
import { getInitials } from '@/lib/utils';
import lunoHero from '@/assets/landing/luno-hero.png';
import yolunoLogo from '@/assets/landing/yoluno-logo-original.png';
import type { ChildProfileWithAvatar } from '@/services/childProfiles';

const F = "'DM Sans', sans-serif";

// Character-themed colors for children
const CHILD_COLORS = [
  { color: '#3ECDC6', colorBg: '#E8F6F4', teaserColor: '#B8A5D4' },
  { color: '#B8A5D4', colorBg: '#F3EFF8', teaserColor: '#E8946A' },
  { color: '#E8946A', colorBg: '#FEF0EA', teaserColor: '#D4A843' },
  { color: '#D4A843', colorBg: '#FDF6E8', teaserColor: '#3ECDC6' },
  { color: '#3ECDC6', colorBg: '#E8F6F4', teaserColor: '#B8A5D4' },
];

const FLOATING_ELEMENTS = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  type: i % 3 === 0 ? 'star' : i % 3 === 1 ? 'cloud' : 'sparkle',
  left: `${5 + Math.random() * 90}%`,
  top: `${5 + Math.random() * 90}%`,
  size: 6 + Math.random() * 10,
  delay: Math.random() * 20,
  duration: 20 + Math.random() * 10,
  opacity: 0.15 + Math.random() * 0.1,
}));

export function ChildSelectPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: children = [], isLoading } = useChildProfiles(user?.id);

  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [selectedChild, setSelectedChild] = useState<ChildProfileWithAvatar | null>(null);
  const [showPinDialog, setShowPinDialog] = useState(false);

  const handleParentLogin = () => {
    navigate('/dashboard');
  };

  const handleChildSelect = useCallback(
    (child: ChildProfileWithAvatar) => {
      if (child.pin_hash) {
        setSelectedChild(child);
        setShowPinDialog(true);
      } else {
        navigate(`/kids/${child.id}/mood`);
      }
    },
    [navigate]
  );

  const handlePinSuccess = useCallback(() => {
    if (selectedChild) {
      navigate(`/kids/${selectedChild.id}/mood`);
    }
    setShowPinDialog(false);
    setSelectedChild(null);
  }, [selectedChild, navigate]);

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'linear-gradient(165deg, #E8F6F4 0%, #F3EFF8 40%, #FEF0EA 70%, #FDF6E8 100%)',
          fontFamily: F,
        }}
      >
        <div className="text-center">
          <div style={{ fontSize: 48 }} className="animate-bounce mb-4">✨</div>
          <p style={{ fontSize: 18, fontWeight: 600, color: '#3ECDC6' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="kids-welcome-scope min-h-screen relative overflow-hidden flex flex-col"
      style={{
        background: 'linear-gradient(165deg, #E8F6F4 0%, #F3EFF8 40%, #FEF0EA 70%, #FDF6E8 100%)',
      }}
    >
      {/* Floating background elements */}
      {FLOATING_ELEMENTS.map((el) => (
        <div
          key={el.id}
          className="absolute pointer-events-none"
          style={{
            left: el.left,
            top: el.top,
            opacity: el.opacity,
            animation: `kidsFloat ${el.duration}s ease-in-out ${el.delay}s infinite alternate`,
          }}
        >
          {el.type === 'star' && (
            <svg width={el.size} height={el.size} viewBox="0 0 24 24" fill="none">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6L12 2z" fill="#D4A843" opacity="0.6" />
            </svg>
          )}
          {el.type === 'cloud' && (
            <div
              style={{
                width: el.size * 2.5,
                height: el.size,
                borderRadius: el.size,
                background: 'rgba(180, 222, 215, 0.4)',
                filter: 'blur(4px)',
              }}
            />
          )}
          {el.type === 'sparkle' && (
            <div
              style={{
                width: el.size * 0.6,
                height: el.size * 0.6,
                borderRadius: '50%',
                background: 'rgba(184, 165, 212, 0.5)',
                filter: 'blur(1px)',
                animation: `kidsTwinkle ${3 + Math.random() * 2}s ease-in-out infinite`,
              }}
            />
          )}
        </div>
      ))}

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <img src={yolunoLogo} alt="Yoluno" style={{ height: 36 }} />
        <button
          onClick={handleParentLogin}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors hover:bg-white/40"
          aria-label="Parent login"
        >
          <Lock size={14} style={{ color: '#9B978E' }} />
          <span style={{ fontSize: 12, color: '#9B978E', fontWeight: 500 }}>Parent</span>
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <div className="max-w-[900px] w-full flex flex-col items-center">
          {/* Luno character */}
          <div
            className="mb-4 flex items-center justify-center"
            style={{ animation: 'lunoBreath 4s ease-in-out infinite' }}
          >
            <img
              src={lunoHero}
              alt="Luno"
              className="drop-shadow-2xl"
              style={{ width: 140, height: 140, objectFit: 'contain' }}
            />
          </div>

          {/* Greeting */}
          <h1
            className="text-center"
            style={{ fontSize: 28, fontWeight: 600, color: '#2A2926', marginBottom: 8 }}
          >
            Hey! Ready to explore?
          </h1>
          <p
            className="text-center"
            style={{ fontSize: 16, color: '#6B675E', marginBottom: 40 }}
          >
            Pick your name to jump in
          </p>

          {/* Child cards */}
          {children.length === 0 ? (
            <div className="text-center">
              <p style={{ fontSize: 48 }} className="mb-4">👋</p>
              <p style={{ fontSize: 20, fontWeight: 600, color: '#2A2926', marginBottom: 8 }}>No profiles yet!</p>
              <p style={{ fontSize: 14, color: '#6B675E', marginBottom: 20 }}>Ask a parent to create your profile.</p>
              <button
                onClick={handleParentLogin}
                className="px-6 py-2.5 rounded-full text-white font-semibold transition hover:-translate-y-0.5"
                style={{ background: '#3ECDC6', fontSize: 15 }}
              >
                Go to Parent Dashboard
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-6">
              {children.map((child, i) => {
                const colors = CHILD_COLORS[i % CHILD_COLORS.length];
                const isHovered = hoveredCard === i;
                const avatarUrl = getUploadUrl(child.avatarUrl);
                const initials = getInitials(child.name);

                return (
                  <button
                    key={child.id}
                    className="flex flex-col items-center text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{
                      width: 180,
                      height: 240,
                      background: '#FFFFFF',
                      border: `2px solid ${isHovered ? colors.color : 'transparent'}`,
                      borderRadius: 20,
                      padding: 24,
                      boxShadow: isHovered
                        ? '0 8px 28px rgba(42,41,38,0.12)'
                        : '0 4px 16px rgba(42,41,38,0.08)',
                      transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                      transition: 'all 0.3s ease-out',
                      cursor: 'pointer',
                      animation: `kidsFadeIn 0.5s ease-out ${i * 0.1}s both`,
                    }}
                    onMouseEnter={() => setHoveredCard(i)}
                    onMouseLeave={() => setHoveredCard(null)}
                    onClick={() => handleChildSelect(child)}
                    aria-label={`Select ${child.name} to start exploring Yoluno`}
                  >
                    {/* Avatar */}
                    <div className="relative mb-4">
                      <div
                        className="rounded-full flex items-center justify-center overflow-hidden"
                        style={{
                          width: 80,
                          height: 80,
                          background: avatarUrl ? 'transparent' : colors.colorBg,
                        }}
                      >
                        {avatarUrl ? (
                          <img src={avatarUrl} alt={child.name} className="w-full h-full object-cover" />
                        ) : (
                          <span style={{ fontSize: 28, fontWeight: 700, color: colors.color }}>
                            {initials}
                          </span>
                        )}
                      </div>
                      {/* PIN indicator — hidden to match loveable design
                      {child.pin_hash && (
                        <div
                          className="absolute -top-1 -right-1 rounded-full flex items-center justify-center"
                          style={{
                            width: 22,
                            height: 22,
                            background: colors.color,
                            border: '2px solid #fff',
                          }}
                        >
                          <Lock size={10} style={{ color: '#fff' }} />
                        </div>
                      )}
                      */}
                    </div>

                    {/* Name */}
                    <span style={{ fontSize: 20, fontWeight: 600, color: '#2A2926', marginBottom: 6 }}>
                      {child.name}
                    </span>

                    {/* Age teaser */}
                    <span style={{ fontSize: 13, color: colors.teaserColor, lineHeight: 1.4 }}>
                      Age {child.age}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center">
        <span style={{ fontSize: 13, color: '#9B978E' }}>
          Made with 💛 for curious minds
        </span>
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

      <style>{`
        .kids-welcome-scope { font-family: 'DM Sans', sans-serif; }
        .kids-welcome-scope h1,
        .kids-welcome-scope h2,
        .kids-welcome-scope h3 { font-family: 'DM Serif Display', Georgia, serif !important; }
        @keyframes kidsFloat {
          0% { transform: translateY(0) translateX(0); }
          100% { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes kidsTwinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        @keyframes lunoBreath {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes kidsFadeIn {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
