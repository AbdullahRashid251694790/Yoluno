/**
 * Kids Family Page
 *
 * Outer layout (gradient background, floating elements, Loti greeting,
 * voice messages strip) matches loveable KidsFamilyPage.
 * The inner tree structure is the premium tree layout with side-split
 * generations and animated connectors (the previous design).
 * Member detail card is still the existing FamilyMemberDetail component.
 */

import { useMemo, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiClient, getUploadUrl } from '@/integrations/api/client';
import { useChildProfile, useFamilyMembers } from '@/hooks/queries';
import { useChildProfiles } from '@/hooks/queries/useChildProfiles';
import { useAuth } from '@/contexts/AuthContext';
import { FamilyMemberDetail, type RelationType } from '@/components/kids/family';
import lotiFamily from '@/assets/landing/loti-family.png';
import { cn } from '@/lib/utils';
import type { FamilyMemberRow, ChildProfileRow as ChildProfile } from '@/types/database';
import type { VoiceClip } from '@/services/voiceVault';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const LABELS: Record<string, string> = {
  father: 'Dad', mother: 'Mom',
  paternal_grandfather: 'Grandpa', paternal_grandmother: 'Grandma',
  maternal_grandfather: 'Grandpa', maternal_grandmother: 'Grandma',
  paternal_uncle: 'Uncle', paternal_aunt: 'Aunty',
  paternal_uncle_wife: 'Aunty', paternal_aunt_husband: 'Uncle',
  maternal_uncle: 'Uncle', maternal_aunt: 'Aunty',
  maternal_uncle_wife: 'Aunty', maternal_aunt_husband: 'Uncle',
  brother: 'Brother', sister: 'Sister', cousin: 'Cousin',
};

function getLabel(m: FamilyMemberRow): string {
  const s = (m as any).specific_relationship;
  if (s && LABELS[s]) return LABELS[s];
  const desc = (m.connection_description || '').toLowerCase();
  if (desc.includes('uncle') || desc.includes('brother')) {
    const r = m.relationship?.toLowerCase() || '';
    if (r.includes('aunt') || r.includes('uncle')) return 'Uncle';
  }
  if (desc.includes('aunt') || desc.includes('sister')) {
    const r = m.relationship?.toLowerCase() || '';
    if (r.includes('aunt') || r.includes('uncle')) return 'Aunty';
  }
  const r = m.relationship?.toLowerCase() || '';
  if (r.includes('grand')) return 'Grandparent';
  if (r.includes('parent')) return 'Parent';
  if (r.includes('aunt') || r.includes('uncle')) return 'Aunt/Uncle';
  if (r.includes('cousin')) return 'Cousin';
  return r.charAt(0).toUpperCase() + r.slice(1);
}

function getSide(m: FamilyMemberRow): string {
  return (m as any).side || 'direct';
}

function getRelType(m: FamilyMemberRow): RelationType {
  const r = m.relationship;
  if (r === 'parent' || r === 'step_parent' || r === 'grandparent' || r === 'sibling' || r === 'aunt_uncle' || r === 'cousin') {
    return r === 'step_parent' ? 'parent' : r;
  }
  return 'other';
}

function getInitial(name: string): string {
  return (name || '?').charAt(0).toUpperCase();
}

// ─── Premium Person Card ─────────────────────────────────────────────────────

interface PersonProps {
  name: string;
  label: string;
  photoUrl?: string | null;
  isMe?: boolean;
  isDeceased?: boolean;
  color: string;
  delay?: number;
  onClick?: () => void;
}

function Person({ name, label, photoUrl, isMe, isDeceased, color, delay = 0, onClick }: PersonProps) {
  const resolved = photoUrl ? (photoUrl.startsWith('http') ? photoUrl : getUploadUrl(photoUrl)) : null;
  const sz = isMe ? 96 : 76;

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 group outline-none"
      style={{ animation: `fadeInUp 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s both` }}
    >
      <div className="relative" style={{ width: sz, height: sz }}>
        {/* Photo container */}
        <div
          className={cn(
            'relative w-full h-full rounded-full overflow-hidden transition-all duration-300',
            'group-hover:-translate-y-1 group-active:scale-95',
            isDeceased && 'opacity-40 grayscale',
          )}
          style={{
            background: '#FDF6E8',
            border: isMe ? '3px solid #D4A843' : '2px solid #FDF6E8',
            boxShadow: isMe
              ? '0 4px 12px rgba(212,168,67,0.2)'
              : '0 2px 8px rgba(42,41,38,0.06)',
          }}
        >
          {resolved ? (
            <img src={resolved} alt={name} className="w-full h-full object-cover" />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                color: isMe ? '#D4A843' : '#2A2926',
                fontSize: isMe ? 28 : 22,
                fontWeight: 600,
              }}
            >
              {getInitial(name)}
            </div>
          )}
        </div>

        {/* Me crown */}
        {isMe && (
          <div
            className="absolute -top-2 -right-1 z-20 drop-shadow-lg"
            style={{ fontSize: 18, animation: 'crownFloat 2.5s ease-in-out infinite' }}
          >
            👑
          </div>
        )}
      </div>

      {/* Name + label */}
      <div className="text-center mt-1">
        <p
          style={{
            fontSize: isMe ? 14 : 13,
            fontWeight: 700,
            color: isMe ? color : '#2A2926',
            lineHeight: 1.2,
          }}
        >
          {name}
        </p>
        <p
          className="mt-1 inline-block"
          style={{
            fontSize: 10,
            fontWeight: 600,
            padding: '2px 10px',
            borderRadius: 999,
            background: `${color}20`,
            color,
          }}
        >
          {label}
        </p>
      </div>

      {isDeceased && (
        <p style={{ fontSize: 9, color: '#9B978E', marginTop: -2 }}>In loving memory 💕</p>
      )}
    </button>
  );
}

// ─── Generation Row ──────────────────────────────────────────────────────────

interface GenRowProps {
  title?: string;
  emoji?: string;
  color?: string;
  delay?: number;
  children?: React.ReactNode;
  split?: boolean;
  leftTitle?: string;
  rightTitle?: string;
  leftChildren?: React.ReactNode;
  rightChildren?: React.ReactNode;
  leftColor?: string;
  rightColor?: string;
}

function GenRow({
  title, emoji, color, delay = 0, children,
  split, leftTitle, rightTitle, leftChildren, rightChildren, leftColor, rightColor,
}: GenRowProps) {
  const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.7)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    borderRadius: 24,
    padding: 20,
    border: '1px solid rgba(212,168,67,0.15)',
    boxShadow: '0 4px 16px rgba(42,41,38,0.05)',
  };

  if (split) {
    return (
      <div style={{ animation: `fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}s both` }}>
        <div className="flex gap-3">
          {leftChildren && (
            <div className="flex-1" style={cardStyle}>
              <p
                className="text-center mb-3"
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: 2.5,
                  textTransform: 'uppercase',
                  color: leftColor || '#D4A843',
                }}
              >
                {leftTitle}
              </p>
              <div className="flex justify-center gap-4 flex-wrap">{leftChildren}</div>
            </div>
          )}
          {rightChildren && (
            <div className="flex-1" style={cardStyle}>
              <p
                className="text-center mb-3"
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: 2.5,
                  textTransform: 'uppercase',
                  color: rightColor || '#D4A843',
                }}
              >
                {rightTitle}
              </p>
              <div className="flex justify-center gap-4 flex-wrap">{rightChildren}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: `fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}s both` }}>
      <div style={cardStyle}>
        <div className="flex items-center justify-center gap-2 mb-4">
          {emoji && <span style={{ fontSize: 16 }}>{emoji}</span>}
          <p
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: 2.5,
              textTransform: 'uppercase',
              color: color || '#D4A843',
            }}
          >
            {title}
          </p>
          {emoji && <span style={{ fontSize: 16 }}>{emoji}</span>}
        </div>
        <div className="flex justify-center gap-5 flex-wrap">{children}</div>
      </div>
    </div>
  );
}

// ─── Connector ───────────────────────────────────────────────────────────────

function Connector({ delay = 0 }: { color?: string; delay?: number }) {
  return (
    <div
      className="flex justify-center my-2"
      style={{ animation: `fadeInUp 0.3s ease-out ${delay}s both` }}
    >
      <span style={{ fontSize: 14, color: '#D4A843', opacity: 0.5 }}>✦</span>
    </div>
  );
}

// ─── Floating bg elements ────────────────────────────────────────────────────

const FLOAT_ELEMENTS = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  type: i % 4 === 0 ? 'heart' : i % 4 === 1 ? 'star' : i % 4 === 2 ? 'sparkle' : 'dot',
  left: `${5 + Math.random() * 90}%`,
  top: `${5 + Math.random() * 90}%`,
  size: 6 + Math.random() * 10,
  delay: Math.random() * 20,
  duration: 22 + Math.random() * 12,
  opacity: 0.08 + Math.random() * 0.06,
}));

const AVATAR_COLORS = ['#E8F6F4', '#FDF6E8', '#F3EFF8', '#FEF0EA', '#F5F3EE'];

// ─── Main Page ───────────────────────────────────────────────────────────────

export function KidsFamilyPage() {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const mood = (location.state as any)?.mood || 'happy';

  const { user } = useAuth();
  const { data: child, isLoading: childLoading } = useChildProfile(childId);
  const { data: siblings = [], isLoading: siblingsLoading } = useChildProfiles(user?.id);
  const { data: familyMembers = [], isLoading: familyLoading } = useFamilyMembers(user?.id);

  const [selectedMember, setSelectedMember] = useState<{
    member: FamilyMemberRow | ChildProfile;
    type: RelationType;
  } | null>(null);

  const [voiceClips, setVoiceClips] = useState<VoiceClip[]>([]);
  const [playingClipId, setPlayingClipId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    apiClient
      .get('/voice-vault', { params: { limit: 100 } })
      .then((r) => setVoiceClips(r.data?.items || []))
      .catch(() => setVoiceClips([]));
  }, [user?.id]);

  useEffect(() => {
    if (childId) {
      apiClient.post(`/daily-missions/${childId}/log-visit/family_explored`).catch(() => {});
    }
  }, [childId]);

  const handleBack = () => navigate(`/kids/${childId}`, { state: { mood } });

  const handlePlayVoice = (clip: VoiceClip) => {
    if (playingClipId === clip.id) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingClipId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const audio = new Audio(getUploadUrl(clip.audio_url));
    audio.play();
    audioRef.current = audio;
    setPlayingClipId(clip.id);
    audio.addEventListener('ended', () => {
      setPlayingClipId(null);
      audioRef.current = null;
    });
    apiClient.post(`/voice-vault/${clip.id}/play`, { childId }).catch(() => {});
  };

  // Build the tree (Dad's parents / Mom's parents, Parents, Dad's aunts/uncles / Mom's aunts/uncles, Me+siblings, Cousins, Other)
  const tree = useMemo(() => {
    const pg: FamilyMemberRow[] = [];
    const mg: FamilyMemberRow[] = [];
    const parents: FamilyMemberRow[] = [];
    const pe: FamilyMemberRow[] = [];
    const me: FamilyMemberRow[] = [];
    const cousins: FamilyMemberRow[] = [];
    const other: FamilyMemberRow[] = [];

    const cs = siblings.filter((s) => s.id !== childId);

    for (const m of familyMembers) {
      const side = getSide(m);
      const rel = m.relationship;
      if (rel === 'grandparent') {
        (side === 'maternal' ? mg : pg).push(m);
      } else if (rel === 'parent' || rel === 'step_parent') {
        parents.push(m);
      } else if (rel === 'aunt_uncle') {
        (side === 'maternal' ? me : side === 'paternal' ? pe : other).push(m);
      } else if (rel === 'cousin') {
        cousins.push(m);
      } else if (rel !== 'sibling') {
        other.push(m);
      }
    }
    return { pg, mg, parents, pe, me, cs, cousins, other };
  }, [familyMembers, siblings, childId]);

  const hasFamily = familyMembers.length > 0 || tree.cs.length > 0;
  const voiceMessages = voiceClips.filter((c) => c.family_member_id);
  const hasVoice = voiceMessages.length > 0;

  const greeting = (() => {
    if (hasVoice) return 'Your family left something special for you. Want to listen?';
    if (hasFamily) return 'These are the people who love you most. Tap anyone to learn about them.';
    return "This is your family's special place.";
  })();

  const pageBg = 'linear-gradient(165deg, #FDF6E8 0%, #FEF0EA 30%, #F3EFF8 60%, #E8F6F4 100%)';

  // Tree colors
  const GOLD = '#D4A843';
  const TEAL = '#3ECDC6';
  const CORAL = '#E8946A';
  const PURPLE = '#B8A5D4';

  if (childLoading || siblingsLoading || familyLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: pageBg, fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="text-center">
          <div style={{ fontSize: 48 }} className="animate-bounce mb-4">🏠</div>
          <p style={{ fontSize: 18, fontWeight: 600, color: GOLD }}>Loading your family...</p>
        </div>
      </div>
    );
  }

  if (!child) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: pageBg, fontFamily: "'DM Sans', sans-serif" }}
      >
        <div className="text-center">
          <p style={{ fontSize: 48 }} className="mb-4">😅</p>
          <p style={{ fontSize: 20, fontWeight: 600, color: '#2A2926', marginBottom: 8 }}>Oops!</p>
          <p style={{ fontSize: 14, color: '#6B675E', marginBottom: 20 }}>We couldn't find your profile.</p>
          <button
            onClick={handleBack}
            className="px-6 py-2.5 rounded-full text-white font-semibold"
            style={{ background: GOLD, fontSize: 15 }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  let d = 0;
  const nd = () => {
    d += 0.08;
    return d;
  };

  return (
    <div
      className="kids-family-scope min-h-screen relative overflow-hidden flex flex-col"
      style={{ background: pageBg, fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Floating elements */}
      {FLOAT_ELEMENTS.map((el) => (
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
          {el.type === 'heart' && (
            <svg width={el.size} height={el.size} viewBox="0 0 24 24" fill="none">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#D4A843" opacity="0.4" />
            </svg>
          )}
          {el.type === 'star' && (
            <svg width={el.size} height={el.size} viewBox="0 0 24 24" fill="none">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6L12 2z" fill="#D4A843" opacity="0.4" />
            </svg>
          )}
          {el.type === 'sparkle' && (
            <div style={{ width: el.size * 0.6, height: el.size * 0.6, borderRadius: '50%', background: 'rgba(212,168,67,0.3)', filter: 'blur(1px)', animation: `kidsTwinkle ${3 + Math.random() * 2}s ease-in-out infinite` }} />
          )}
          {el.type === 'dot' && (
            <div style={{ width: el.size * 0.4, height: el.size * 0.4, borderRadius: '50%', background: 'rgba(232,148,106,0.3)' }} />
          )}
        </div>
      ))}

      {/* Top bar */}
      <header className="relative z-10 flex items-center justify-between px-5 pt-5 pb-2">
        <button
          onClick={handleBack}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-white/40 transition-colors"
          aria-label="Go back"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 4l-6 6 6 6" stroke="#2A2926" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <img src={lotiFamily} alt="Loti" style={{ width: 32, height: 32, objectFit: 'contain' }} />
          <span style={{ fontSize: 20, fontWeight: 600, color: '#2A2926' }}>My Family</span>
        </div>
        <div className="w-10" />
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-5 pb-8 relative z-10">
        <div className="max-w-[600px] w-full flex flex-col items-center">
          {/* Loti greeting */}
          <div
            className="flex flex-col items-center my-5"
            style={{ animation: 'lotiBreath 4s ease-in-out infinite' }}
          >
            <img
              src={lotiFamily}
              alt="Loti"
              className="drop-shadow-2xl mb-3"
              style={{ width: 90, height: 90, objectFit: 'contain' }}
            />
            <p className="text-center" style={{ fontSize: 17, color: '#6B675E', maxWidth: 380, lineHeight: 1.5 }}>
              {greeting}
            </p>
          </div>

          {/* Empty state */}
          {!hasFamily && (
            <div className="flex flex-col items-center text-center mt-4">
              <div
                className="rounded-full flex items-center justify-center mb-5"
                style={{ width: 120, height: 120, background: 'linear-gradient(135deg, #D4A843, #E8C040)', boxShadow: '0 8px 32px rgba(212,168,67,0.2)' }}
              >
                <span style={{ fontSize: 60 }}>🏠</span>
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 600, color: '#2A2926', marginBottom: 8 }}>
                Your family space is getting ready
              </h2>
              <p style={{ fontSize: 16, color: '#6B675E', maxWidth: 380, lineHeight: 1.5 }}>
                Ask your parent to add your family members — grandparents, aunts, uncles, and anyone special. Loti will help you learn all about them.
              </p>
            </div>
          )}

          {/* Voice Messages strip */}
          {hasVoice && (
            <div className="w-full mb-6" style={{ animation: 'kidsFadeIn 0.4s ease-out both' }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: '#2A2926', marginBottom: 12 }}>
                Messages for you
              </h3>
              <div className="flex gap-3 overflow-x-auto pb-2 family-voices-scroll">
                {voiceMessages.map((vm) => {
                  const isPlaying = playingClipId === vm.id;
                  const memberName = vm.family_member_name || 'Family';
                  const initial = getInitial(memberName);
                  const colorIdx = memberName.charCodeAt(0) % AVATAR_COLORS.length;
                  return (
                    <button
                      key={vm.id}
                      onClick={() => handlePlayVoice(vm)}
                      className="flex-shrink-0 flex items-center gap-3 transition-all hover:scale-[1.02]"
                      style={{
                        background: '#FFFFFF',
                        borderRadius: 16,
                        padding: '14px 18px',
                        border: '1.5px solid #FDF6E8',
                        boxShadow: '0 2px 8px rgba(42,41,38,0.04)',
                        cursor: 'pointer',
                        minWidth: 260,
                      }}
                    >
                      <div
                        className="rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          width: 40,
                          height: 40,
                          background: AVATAR_COLORS[colorIdx],
                          border: '2px solid #FDF6E8',
                        }}
                      >
                        <span style={{ fontSize: 15, fontWeight: 600, color: '#2A2926' }}>{initial}</span>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <span className="block truncate" style={{ fontSize: 14, fontWeight: 600, color: '#2A2926' }}>
                          {vm.title}
                        </span>
                        <span style={{ fontSize: 12, color: '#9B978E' }}>
                          {memberName}
                          {vm.duration_seconds ? ` · ${Math.round(vm.duration_seconds)}s` : ''}
                        </span>
                      </div>
                      <div
                        className="flex-shrink-0 rounded-full flex items-center justify-center transition-all"
                        style={{
                          width: 44,
                          height: 44,
                          background: isPlaying ? '#E8C040' : GOLD,
                          boxShadow: '0 2px 8px rgba(212,168,67,0.3)',
                        }}
                      >
                        {isPlaying ? (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
                            <rect x="3" y="2" width="4" height="12" rx="1" />
                            <rect x="9" y="2" width="4" height="12" rx="1" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
                            <path d="M4 2l10 6-10 6V2z" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Premium family tree */}
          {hasFamily && (
            <div className="w-full space-y-1">
              {/* Grandparents — single row (both sides together, labels show side) */}
              {(tree.pg.length > 0 || tree.mg.length > 0) && (
                <>
                  <GenRow title="Grandparents" emoji="💛" color={GOLD} delay={nd()}>
                    {tree.pg.map((m) => (
                      <Person
                        key={m.id}
                        name={m.name}
                        label={`${getLabel(m)} · Dad's side`}
                        photoUrl={m.photo_url}
                        isDeceased={!m.is_alive}
                        color={TEAL}
                        delay={nd()}
                        onClick={() => setSelectedMember({ member: m, type: 'grandparent' })}
                      />
                    ))}
                    {tree.mg.map((m) => (
                      <Person
                        key={m.id}
                        name={m.name}
                        label={`${getLabel(m)} · Mom's side`}
                        photoUrl={m.photo_url}
                        isDeceased={!m.is_alive}
                        color={CORAL}
                        delay={nd()}
                        onClick={() => setSelectedMember({ member: m, type: 'grandparent' })}
                      />
                    ))}
                  </GenRow>
                  <Connector color={GOLD} delay={nd()} />
                </>
              )}

              {/* Parents */}
              {tree.parents.length > 0 && (
                <>
                  <GenRow title="Parents" emoji="💛" color={GOLD} delay={nd()}>
                    {tree.parents.map((m) => (
                      <Person
                        key={m.id}
                        name={m.name}
                        label={getLabel(m)}
                        photoUrl={m.photo_url}
                        isDeceased={!m.is_alive}
                        color={GOLD}
                        delay={nd()}
                        onClick={() => setSelectedMember({ member: m, type: 'parent' })}
                      />
                    ))}
                  </GenRow>
                  <Connector color={TEAL} delay={nd()} />
                </>
              )}

              {/* Aunts & Uncles — single row (both sides together, labels show side) */}
              {(tree.pe.length > 0 || tree.me.length > 0) && (
                <>
                  <GenRow title="Aunts & Uncles" emoji="💜" color={PURPLE} delay={nd()}>
                    {tree.pe.map((m) => (
                      <Person
                        key={m.id}
                        name={m.name}
                        label={`${getLabel(m)} · Dad's side`}
                        photoUrl={m.photo_url}
                        isDeceased={!m.is_alive}
                        color={TEAL}
                        delay={nd()}
                        onClick={() => setSelectedMember({ member: m, type: 'aunt_uncle' })}
                      />
                    ))}
                    {tree.me.map((m) => (
                      <Person
                        key={m.id}
                        name={m.name}
                        label={`${getLabel(m)} · Mom's side`}
                        photoUrl={m.photo_url}
                        isDeceased={!m.is_alive}
                        color={CORAL}
                        delay={nd()}
                        onClick={() => setSelectedMember({ member: m, type: 'aunt_uncle' })}
                      />
                    ))}
                  </GenRow>
                  <Connector color={PURPLE} delay={nd()} />
                </>
              )}

              {/* That's Us! — siblings + me */}
              <GenRow title="That's Us!" emoji="⭐" color={GOLD} delay={nd()}>
                {tree.cs.map((sibling) => (
                  <Person
                    key={sibling.id}
                    name={sibling.name}
                    label="Sibling"
                    photoUrl={(sibling as any).avatarUrl || (sibling as any).custom_avatar_url}
                    color={PURPLE}
                    delay={nd()}
                    onClick={() => setSelectedMember({ member: sibling, type: 'sibling' })}
                  />
                ))}
                <Person
                  name={child.name}
                  label="That's Me!"
                  isMe
                  photoUrl={(child as any).avatarUrl || (child as any).custom_avatar_url}
                  color={GOLD}
                  delay={nd()}
                  onClick={() => setSelectedMember({ member: child, type: 'self' })}
                />
              </GenRow>

              {/* Cousins */}
              {tree.cousins.length > 0 && (
                <>
                  <Connector color={TEAL} delay={nd()} />
                  <GenRow title="Cousins" emoji="🎮" color={TEAL} delay={nd()}>
                    {tree.cousins.map((m) => (
                      <Person
                        key={m.id}
                        name={m.name}
                        label={getLabel(m)}
                        photoUrl={m.photo_url}
                        isDeceased={!m.is_alive}
                        color={TEAL}
                        delay={nd()}
                        onClick={() => setSelectedMember({ member: m, type: 'cousin' })}
                      />
                    ))}
                  </GenRow>
                </>
              )}

              {/* Other */}
              {tree.other.length > 0 && (
                <>
                  <Connector color={PURPLE} delay={nd()} />
                  <GenRow title="Family" emoji="💜" color={PURPLE} delay={nd()}>
                    {tree.other.map((m) => (
                      <Person
                        key={m.id}
                        name={m.name}
                        label={getLabel(m)}
                        photoUrl={m.photo_url}
                        isDeceased={!m.is_alive}
                        color={PURPLE}
                        delay={nd()}
                        onClick={() => setSelectedMember({ member: m, type: getRelType(m) })}
                      />
                    ))}
                  </GenRow>
                </>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-5 text-center">
        <span style={{ fontSize: 12, color: '#9B978E' }}>Made with 💛 for curious minds</span>
      </footer>

      {/* Member detail modal — existing card, unchanged */}
      <FamilyMemberDetail
        member={selectedMember?.member || null}
        type={selectedMember?.type || 'other'}
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
      />

      <style>{`
        .kids-family-scope h1,
        .kids-family-scope h2,
        .kids-family-scope h3 { font-family: 'DM Serif Display', Georgia, serif !important; }
        .family-voices-scroll::-webkit-scrollbar { height: 4px; }
        .family-voices-scroll::-webkit-scrollbar-track { background: transparent; }
        .family-voices-scroll::-webkit-scrollbar-thumb { background: #E8E6E1; border-radius: 4px; }
        .family-voices-scroll { scrollbar-width: thin; scrollbar-color: #E8E6E1 transparent; }
        @keyframes kidsFloat {
          0% { transform: translateY(0) translateX(0); }
          100% { transform: translateY(-20px) translateX(10px); }
        }
        @keyframes kidsTwinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
        @keyframes lotiBreath {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes kidsFadeIn {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes ringSpin {
          to { transform: rotate(360deg); }
        }
        @keyframes crownFloat {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
