/**
 * Kids Moments Page
 *
 * Full view of a child's moments — reads from the shared_moments table which
 * is auto-populated by the backend (curiosity, family_listen, mood_checkin,
 * journey_complete, story_created) plus any manually-shared moments.
 */

import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useChildProfile } from '@/hooks/queries';
import { useChildSharedMoments } from '@/hooks/queries/useSharedMoments';
import { useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/integrations/api/client';
import { toast } from 'sonner';

const TYPE_STYLES: Record<string, { border: string; bg: string; color: string; icon: string }> = {
  journey_complete: { border: '#E8946A', bg: '#FEF0EA', color: '#E8946A', icon: '🧭' },
  story_created: { border: '#B8A5D4', bg: '#F3EFF8', color: '#B8A5D4', icon: '📖' },
  story_read: { border: '#B8A5D4', bg: '#F3EFF8', color: '#B8A5D4', icon: '📖' },
  curiosity: { border: '#3ECDC6', bg: '#E8F6F4', color: '#3ECDC6', icon: '?' },
  family_listen: { border: '#D4A843', bg: '#FDF6E8', color: '#D4A843', icon: '💛' },
  mood_checkin: { border: '#9B978E', bg: '#F5F3EE', color: '#9B978E', icon: '😊' },
};

const FLOAT_ELEMENTS = Array.from({ length: 10 }, (_, i) => ({
  id: i,
  type: i % 3 === 0 ? 'star' : i % 3 === 1 ? 'cloud' : 'sparkle',
  left: `${5 + Math.random() * 90}%`,
  top: `${5 + Math.random() * 90}%`,
  size: 6 + Math.random() * 10,
  delay: Math.random() * 20,
  duration: 22 + Math.random() * 12,
  opacity: 0.1 + Math.random() * 0.06,
}));

interface MomentItem {
  id: string;
  name: string;
  type: string;
  date: string;
  context: string;
  reflection?: string;
  shared: boolean;
  referenceId?: string;
  childProfileId: string;
  momentType: string;
}

export function KidsMomentsPage() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const mood = (location.state as any)?.mood || 'happy';

  const { data: child } = useChildProfile(childId);
  const { data: sharedMoments = [] } = useChildSharedMoments(childId);
  const queryClient = useQueryClient();

  const [localSharedIds, setLocalSharedIds] = useState<Set<string>>(new Set());
  const [sharingIds, setSharingIds] = useState<Set<string>>(new Set());

  // All moments come from the shared_moments table (auto-populated by backend)
  const moments: MomentItem[] = sharedMoments.map((m) => ({
    id: m.id,
    name: m.title,
    type: m.moment_type,
    date: new Date(m.shared_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    context: m.context || m.title,
    reflection: m.reflection || undefined,
    shared: !m.is_auto || localSharedIds.has(m.id),
    referenceId: m.reference_id || undefined,
    childProfileId: m.child_profile_id,
    momentType: m.moment_type,
  }));

  const handleShare = async (moment: MomentItem) => {
    if (!childId) return;
    setSharingIds((prev) => new Set([...prev, moment.id]));
    try {
      await apiClient.post(`/shared-moments/${moment.id}/share`);
      setLocalSharedIds((prev) => new Set([...prev, moment.id]));
      queryClient.invalidateQueries({ queryKey: ['sharedMoments'] });
      toast.success('Shared with your parent!');
    } catch {
      toast.error('Could not share right now');
    } finally {
      setSharingIds((prev) => {
        const next = new Set(prev);
        next.delete(moment.id);
        return next;
      });
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{
        background: 'linear-gradient(165deg, #E8F6F4 0%, #F3EFF8 40%, #FEF0EA 70%, #FDF6E8 100%)',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Floating bg */}
      {FLOAT_ELEMENTS.map((el) => (
        <div key={el.id} className="absolute pointer-events-none" style={{ left: el.left, top: el.top, opacity: el.opacity, animation: `kidsFloat ${el.duration}s ease-in-out ${el.delay}s infinite alternate` }}>
          {el.type === 'star' && (
            <svg width={el.size} height={el.size} viewBox="0 0 24 24" fill="none">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6L12 2z" fill="#D4A843" opacity="0.5" />
            </svg>
          )}
          {el.type === 'cloud' && <div style={{ width: el.size * 2.5, height: el.size, borderRadius: el.size, background: 'rgba(180,222,215,0.4)', filter: 'blur(4px)' }} />}
          {el.type === 'sparkle' && <div style={{ width: el.size * 0.6, height: el.size * 0.6, borderRadius: '50%', background: 'rgba(184,165,212,0.4)', filter: 'blur(1px)', animation: `kidsTwinkle ${3 + Math.random() * 2}s ease-in-out infinite` }} />}
        </div>
      ))}

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-5 pt-5 pb-2">
        <button
          onClick={() => navigate(`/kids/${childId}`, { state: { mood } })}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/40 transition-colors"
          aria-label="Go back"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 4l-6 6 6 6" stroke="#2A2926" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span style={{ fontSize: 22, fontWeight: 600, color: '#2A2926' }}>My Moments ✨</span>
        <div className="w-10" />
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-5 pb-8 relative z-10">
        <div className="max-w-[500px] w-full flex flex-col items-center">
          {/* Intro */}
          <p className="text-center mb-8" style={{ fontSize: 15, color: '#6B675E', maxWidth: 500, lineHeight: 1.5 }}>
            These are the special things you've done in Yoluno. They're yours to keep — and yours to share.
          </p>

          {/* Empty state */}
          {moments.length === 0 && (
            <div className="flex flex-col items-center text-center mt-8">
              <div
                className="rounded-full flex items-center justify-center mb-5"
                style={{ width: 100, height: 100, background: 'linear-gradient(135deg, #3ECDC6, #5EBAAA)', boxShadow: '0 6px 24px rgba(62,205,198,0.2)' }}
              >
                <span style={{ fontSize: 48 }}>😊</span>
              </div>
              <p style={{ fontSize: 16, color: '#6B675E', maxWidth: 380, lineHeight: 1.5 }}>
                Your moments will appear here as you explore. There's no rush — just follow your curiosity.
              </p>
            </div>
          )}

          {/* Moment cards */}
          {moments.map((m, i) => {
            const s = TYPE_STYLES[m.type] || TYPE_STYLES.curiosity;
            const isShared = m.shared || localSharedIds.has(m.id);
            return (
              <div
                key={m.id}
                className="w-full"
                style={{
                  background: '#FFFFFF',
                  borderRadius: 20,
                  borderLeft: `4px solid ${s.border}`,
                  padding: 24,
                  boxShadow: '0 4px 12px rgba(42,41,38,0.06)',
                  marginBottom: 20,
                  animation: `kidsFadeIn 0.4s ease-out ${i * 0.08}s both`,
                }}
              >
                {/* Top row */}
                <div className="flex items-start gap-4 mb-3">
                  <div
                    className="flex-shrink-0 rounded-full flex items-center justify-center"
                    style={{ width: 48, height: 48, background: s.bg }}
                  >
                    <span style={{ fontSize: s.icon.length > 1 ? 20 : 18, fontWeight: 700, color: s.color }}>{s.icon}</span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: '#2A2926', marginBottom: 2 }}>{m.name}</h3>
                    <span style={{ fontSize: 13, color: '#9B978E' }}>{m.date}</span>
                  </div>
                </div>

                {/* Context */}
                <p style={{ fontSize: 15, color: '#6B675E', lineHeight: 1.5, marginBottom: m.reflection ? 12 : 16 }}>
                  {m.context}
                </p>

                {/* Reflection */}
                {m.reflection && (
                  <div className="mb-4" style={{ background: '#F5F3EE', borderRadius: 10, padding: 12 }}>
                    <p style={{ fontSize: 14, color: '#6B675E', fontStyle: 'italic', lineHeight: 1.5 }}>
                      "{m.reflection}"
                    </p>
                  </div>
                )}

                {/* Action row */}
                {m.type === 'mood_checkin' ? (
                  <span style={{ fontSize: 12, color: '#9B978E' }}>✓ Recorded</span>
                ) : isShared ? (
                  <span style={{ fontSize: 12, color: '#9B978E' }}>✓ Shared with parent</span>
                ) : (
                  <button
                    onClick={() => handleShare(m)}
                    disabled={sharingIds.has(m.id)}
                    className="transition hover:bg-[#FDF6E8]"
                    style={{
                      border: '1.5px solid #D4A843',
                      color: '#D4A843',
                      fontSize: 13,
                      fontWeight: 600,
                      borderRadius: 8,
                      padding: '8px 16px',
                      background: 'transparent',
                      cursor: 'pointer',
                    }}
                  >
                    {sharingIds.has(m.id) ? 'Sharing...' : 'Share with parent'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-5 text-center">
        <span style={{ fontSize: 12, color: '#9B978E' }}>Made with 💛 for curious minds</span>
      </footer>

      <style>{`
        @keyframes kidsFloat {
          0% { transform: translateY(0) translateX(0); }
          100% { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes kidsTwinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        @keyframes kidsFadeIn {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
