/**
 * Family Tree Page
 *
 * Visual design mirrors loveable DashboardFamilyPage exactly; data from DB.
 * Keeps existing edit/delete functionality via FamilyMemberDialog.
 */

import { useState, useMemo, useEffect } from 'react';
import { Plus, Pencil, Trash2, Mic, Image as ImageIcon, Heart, Play, BookOpen } from 'lucide-react';
import { apiClient } from '@/integrations/api/client';
import { FamilyMemberDialog } from './FamilyMemberDialog';
import {
  useFamilyMembers,
  useDeleteFamilyMember,
} from '@/hooks/queries/useFamily';
import { useChildProfiles } from '@/hooks/queries/useChildProfiles';
import { useAuth } from '@/contexts/AuthContext';
import { getUploadUrl } from '@/integrations/api/client';
import { getInitials } from '@/lib/utils';
import type { FamilyMemberRow } from '@/types/database';
import { toast } from 'sonner';

type Tab = 'tree' | 'list' | 'memories';

const CHILD_BGS = ['#E8F6F4', '#F3EFF8', '#FEF0EA', '#FDF6E8'];

export function FamilyTreePage() {
  const { user } = useAuth();
  const { data: members = [], isLoading } = useFamilyMembers(user?.id);
  const { data: childProfiles = [] } = useChildProfiles(user?.id);
  const deleteMember = useDeleteFamilyMember();

  const [activeTab, setActiveTab] = useState<Tab>('tree');
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
    } catch {}
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setSelectedMember(undefined);
  };

  // Group members by relationship for tree view, in family hierarchy order
  const GROUP_ORDER = ['Grandparents', 'Parents', 'Siblings', 'Uncles & Aunts', 'Cousins', 'Other Family'];

  const groups = useMemo(() => {
    const map: Record<string, FamilyMemberRow[]> = {};
    members.forEach((m) => {
      const group = getRelationshipGroup(m.relationship);
      (map[group] = map[group] || []).push(m);
    });
    // Return as ordered entries
    const ordered: [string, FamilyMemberRow[]][] = [];
    GROUP_ORDER.forEach((g) => {
      if (map[g]) ordered.push([g, map[g]]);
    });
    // Any groups not in the order list go at the end
    Object.keys(map).forEach((g) => {
      if (!GROUP_ORDER.includes(g)) ordered.push([g, map[g]]);
    });
    return ordered;
  }, [members]);

  // Fetch memory counts (photos, stories, videos) per member
  const [memoryCounts, setMemoryCounts] = useState<Record<string, { photos: number; stories: number; videos: number }>>({});

  useEffect(() => {
    if (members.length === 0) return;
    const fetchCounts = async () => {
      const counts: Record<string, { photos: number; stories: number; videos: number }> = {};
      for (const m of members) {
        try {
          const [p, s, v] = await Promise.all([
            apiClient.get(`/family/members/${m.id}/photos`).catch(() => ({ data: [] })),
            apiClient.get(`/family/members/${m.id}/stories`).catch(() => ({ data: [] })),
            apiClient.get(`/family/members/${m.id}/videos`).catch(() => ({ data: [] })),
          ]);
          counts[m.id] = {
            photos: (p.data || []).length,
            stories: (s.data || []).length,
            videos: (v.data || []).length,
          };
        } catch {
          counts[m.id] = { photos: 0, stories: 0, videos: 0 };
        }
      }
      setMemoryCounts(counts);
    };
    fetchCounts();
  }, [members]);

  const tabs: [Tab, string][] = [
    ['tree', 'Tree View'],
    ['list', 'List View'],
    ['memories', 'Memories'],
  ];

  return (
    <div className="dashboard-scope">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[28px] mb-1" style={{ fontWeight: 600, color: '#2A2926' }}>
            Your Family
          </h1>
          <p className="text-[15px] max-w-xl" style={{ color: '#6B675E' }}>
            Add the people who matter most. Luno uses what you share here to answer your
            child's questions about family — and nothing more.
          </p>
        </div>
        <button
          onClick={handleAddMember}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-[14px] transition hover:bg-[#FDF6E8] shrink-0 md:w-auto w-full justify-center"
          style={{ fontWeight: 600, color: '#D4A843', border: '1px solid #D4A843', background: '#FFFFFF' }}
        >
          <Plus size={16} /> Add Family Member
        </button>
      </div>

      {/* AI Disclosure Banner */}
      <div
        className="mb-6 px-5 py-4"
        style={{ background: '#FDF6E8', borderLeft: '3px solid #D4A843' }}
      >
        <p className="text-[14px] leading-relaxed" style={{ color: '#6B675E' }}>
          Information you add here helps Luno respond when your child asks about family.
          For example, if you add that Grandma loves gardening, Luno can share that when
          your child asks. Luno will never invent details you haven't provided.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 p-1 rounded-lg w-fit" style={{ background: '#F5F3EE' }}>
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className="px-4 py-2 rounded-md text-[13.5px] transition"
            style={{
              fontWeight: activeTab === key ? 600 : 400,
              color: activeTab === key ? '#2A2926' : '#6B675E',
              background: activeTab === key ? '#FFFFFF' : 'transparent',
              boxShadow: activeTab === key ? '0 1px 3px rgba(42,41,38,0.08)' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-16">
          <p className="text-[14px]" style={{ color: '#9B978E' }}>Loading family...</p>
        </div>
      )}

      {/* Tree View */}
      {!isLoading && activeTab === 'tree' && (
        <>
          {members.length === 0 ? (
            <div className="text-center py-16">
              <Heart size={32} style={{ color: '#D4A843' }} className="mx-auto mb-3 opacity-40" />
              <p className="text-[15px] mb-4" style={{ color: '#9B978E' }}>
                No family members yet. Add the people who matter most.
              </p>
              <button
                onClick={handleAddMember}
                className="px-5 py-2.5 rounded-lg text-[14px] transition hover:bg-[#FDF6E8]"
                style={{ fontWeight: 600, color: '#D4A843', border: '1px solid #D4A843' }}
              >
                <Plus size={14} className="inline mr-1.5" /> Add First Member
              </button>
            </div>
          ) : (
            <>
              {groups.map(([group, groupMembers]) => (
                <div key={group} className="mb-8">
                  <h3
                    className="text-[14px] mb-3 uppercase tracking-wider"
                    style={{ fontWeight: 600, color: '#9B978E', letterSpacing: '1.5px' }}
                  >
                    {group}
                  </h3>
                  <div className="flex flex-wrap gap-4">
                    {groupMembers.map((m) => {
                      const avatarUrl = getUploadUrl(m.photo_url);
                      return (
                        <div
                          key={m.id}
                          className="rounded-2xl overflow-hidden w-full sm:w-[200px] transition-all hover:-translate-y-0.5 hover:shadow-md"
                          style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
                        >
                          <div style={{ height: 3, background: '#D4A843' }} />
                          <div className="p-4">
                            {/* Edit/Delete at top */}
                            <div className="flex justify-end gap-1 mb-2">
                              <button
                                onClick={() => handleEditMember(m)}
                                className="p-1 rounded hover:bg-[#F5F3EE] transition"
                              >
                                <Pencil size={12} style={{ color: '#9B978E' }} />
                              </button>
                              <button
                                onClick={() => handleDeleteMember(m.id)}
                                className="p-1 rounded hover:bg-[#FDF6E8] transition"
                              >
                                <Trash2 size={12} style={{ color: '#D4A843' }} />
                              </button>
                            </div>
                            <div className="flex flex-col items-center text-center">
                              {avatarUrl ? (
                                <img
                                  src={avatarUrl}
                                  alt={m.name}
                                  className="w-12 h-12 rounded-full object-cover mb-3"
                                  style={{ background: '#FDF6E8' }}
                                />
                              ) : (
                                <div
                                  className="w-12 h-12 rounded-full flex items-center justify-center text-[16px] mb-3"
                                  style={{ background: '#FDF6E8', fontWeight: 600, color: '#2A2926' }}
                                >
                                  {getInitials(m.name)}
                                </div>
                              )}
                              <p className="text-[16px] mb-0.5" style={{ fontWeight: 600, color: '#2A2926' }}>
                                {m.name}
                              </p>
                              <p className="text-[13px] mb-2" style={{ color: '#D4A843' }}>
                                {formatRelationship(m.relationship, m.specific_relationship)}
                              </p>
                              {(() => {
                                const mc = memoryCounts[m.id];
                                const parts: string[] = [];
                                if (mc?.videos) parts.push(`${mc.videos} voice recording${mc.videos > 1 ? 's' : ''}`);
                                if (mc?.photos) parts.push(`${mc.photos} photo${mc.photos > 1 ? 's' : ''}`);
                                if (mc?.stories) parts.push(`${mc.stories} ${mc.stories > 1 ? 'stories' : 'story'}`);
                                return (
                                  <p className="text-[12px] mb-2" style={{ color: '#9B978E' }}>
                                    {parts.length > 0 ? parts.join(' · ') : 'No memories yet'}
                                  </p>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Children */}
              <div className="mb-10">
                <h3
                  className="text-[14px] mb-3 uppercase tracking-wider"
                  style={{ fontWeight: 600, color: '#9B978E', letterSpacing: '1.5px' }}
                >
                  Children
                </h3>
                <div className="flex flex-wrap gap-3">
                  {childProfiles.map((c, i) => {
                    const avatarUrl = getUploadUrl(c.avatarUrl || c.custom_avatar_url);
                    return (
                      <div
                        key={c.id}
                        className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
                        style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
                      >
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={c.name}
                            className="w-9 h-9 rounded-full object-cover"
                            style={{ background: CHILD_BGS[i % CHILD_BGS.length] }}
                          />
                        ) : (
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-[13px]"
                            style={{ background: CHILD_BGS[i % CHILD_BGS.length], fontWeight: 600, color: '#2A2926' }}
                          >
                            {getInitials(c.name)}
                          </div>
                        )}
                        <div>
                          <p className="text-[14px] leading-tight" style={{ fontWeight: 600, color: '#2A2926' }}>
                            {c.name}
                          </p>
                          <p className="text-[12px]" style={{ color: '#9B978E' }}>Age {c.age}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Preview */}
              <div className="mb-4">
                <h2 className="text-[18px] mb-1" style={{ fontWeight: 600, color: '#2A2926' }}>
                  What your child will hear
                </h2>
                <p className="text-[14px] mb-4" style={{ color: '#9B978E' }}>
                  A preview of how Luno responds based on what you've shared
                </p>
              </div>
              <div className="rounded-2xl p-6" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
                <div className="flex justify-end mb-3">
                  <div className="px-4 py-3 rounded-xl max-w-xs text-[13px]" style={{ background: '#E8F6F4', color: '#2A2926' }}>
                    Who is {members[0]?.name || 'Grandma'}?
                  </div>
                </div>
                <div className="flex gap-2.5 mb-4">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] shrink-0 mt-1" style={{ background: '#E8F6F4', fontWeight: 700, color: '#3ECDC6' }}>
                    L
                  </div>
                  <div className="px-4 py-3 rounded-xl max-w-sm text-[13px]" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1', color: '#2A2926' }}>
                    {members[0]
                      ? `${members[0].name} is your ${members[0].relationship.toLowerCase()}!${members[0].hobbies?.length ? ` They love ${members[0].hobbies[0].toLowerCase()}.` : ''} Would you like to know more?`
                      : "That's your family! Would you like to know more about them?"}
                  </div>
                </div>
                <p className="text-[12px]" style={{ color: '#9B978E' }}>
                  This response is generated from the information you entered. Edit a family
                  member's profile to change what Luno shares.
                </p>
              </div>
            </>
          )}
        </>
      )}

      {/* List View */}
      {!isLoading && activeTab === 'list' && (
        <div className="flex flex-col gap-3">
          {members.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[15px]" style={{ color: '#9B978E' }}>No family members yet.</p>
            </div>
          ) : (
            <>
              {members.map((m) => {
                const avatarUrl = getUploadUrl(m.photo_url);
                const group = getRelationshipGroup(m.relationship);
                return (
                  <div
                    key={m.id}
                    className="rounded-xl px-6 py-4 flex items-center gap-4"
                    style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
                  >
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={m.name} className="w-11 h-11 rounded-full object-cover shrink-0" style={{ background: '#FDF6E8' }} />
                    ) : (
                      <div className="w-11 h-11 rounded-full flex items-center justify-center text-[15px] shrink-0" style={{ background: '#FDF6E8', fontWeight: 600, color: '#2A2926' }}>
                        {getInitials(m.name)}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-[15px]" style={{ fontWeight: 600, color: '#2A2926' }}>{m.name}</p>
                      <p className="text-[13px]" style={{ color: '#D4A843' }}>{formatRelationship(m.relationship, m.specific_relationship)} · {group}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditMember(m)}
                        className="flex items-center gap-1 text-[12px] hover:underline"
                        style={{ color: '#9B978E' }}
                      >
                        <Pencil size={11} /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteMember(m.id)}
                        className="flex items-center gap-1 text-[12px] hover:underline"
                        style={{ color: '#D4A843' }}
                      >
                        <Trash2 size={11} /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
              <div className="mt-4 border-t pt-5" style={{ borderColor: '#E8E6E1' }}>
                <h3 className="text-[13px] uppercase tracking-wider mb-3" style={{ fontWeight: 600, color: '#9B978E', letterSpacing: '1.5px' }}>
                  Children
                </h3>
                {childProfiles.map((c, i) => {
                  const avatarUrl = getUploadUrl(c.avatarUrl || c.custom_avatar_url);
                  return (
                    <div key={c.id} className="flex items-center gap-3 py-2">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={c.name} className="w-8 h-8 rounded-full object-cover" style={{ background: CHILD_BGS[i % CHILD_BGS.length] }} />
                      ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px]" style={{ background: CHILD_BGS[i % CHILD_BGS.length], fontWeight: 600, color: '#2A2926' }}>
                          {getInitials(c.name)}
                        </div>
                      )}
                      <span className="text-[14px]" style={{ color: '#2A2926' }}>{c.name}, Age {c.age}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* Memories Tab */}
      {!isLoading && activeTab === 'memories' && (
        <MemoriesTab members={members} />
      )}

      {/* Dialog */}
      <FamilyMemberDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        member={selectedMember}
      />
    </div>
  );
}

/** Memories Tab — fetches voice clips, photos, and stories across all members */
function MemoriesTab({ members }: { members: FamilyMemberRow[] }) {
  interface Memory {
    id: string;
    type: 'voice' | 'photo' | 'story';
    memberName: string;
    title: string;
    subtitle: string;
    date: string;
    photoUrl?: string;
    audioUrl?: string;
  }

  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);

  useEffect(() => {
    if (members.length === 0) { setLoading(false); return; }

    const fetchAll = async () => {
      const all: Memory[] = [];

      for (const m of members) {
        try {
          const [photosRes, storiesRes, videosRes] = await Promise.all([
            apiClient.get(`/family/members/${m.id}/photos`).catch(() => ({ data: [] })),
            apiClient.get(`/family/members/${m.id}/stories`).catch(() => ({ data: [] })),
            apiClient.get(`/family/members/${m.id}/videos`).catch(() => ({ data: [] })),
          ]);

          (photosRes.data || []).forEach((p: any) => {
            all.push({
              id: p.id,
              type: 'photo',
              memberName: m.name,
              title: p.caption || `Photo of ${m.name}`,
              subtitle: p.caption ? '' : 'Memory photo',
              date: p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
              photoUrl: getUploadUrl(p.photo_url) || undefined,
            });
          });

          (storiesRes.data || []).forEach((s: any) => {
            all.push({
              id: s.id,
              type: 'story',
              memberName: m.name,
              title: s.content?.slice(0, 60) + (s.content?.length > 60 ? '...' : ''),
              subtitle: `Story about ${m.name}`,
              date: s.created_at ? new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
            });
          });

          (videosRes.data || []).forEach((v: any) => {
            all.push({
              id: v.id,
              type: 'voice',
              memberName: m.name,
              title: v.title || `Video from ${m.name}`,
              subtitle: '',
              date: v.created_at ? new Date(v.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
            });
          });
        } catch {}
      }

      // Sort newest first
      all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMemories(all);
      setLoading(false);
    };

    fetchAll();
  }, [members]);

  if (loading) {
    return <div className="text-center py-16"><p className="text-[14px]" style={{ color: '#9B978E' }}>Loading memories...</p></div>;
  }

  if (memories.length === 0) {
    return (
      <div className="text-center py-16">
        <Heart size={32} style={{ color: '#D4A843' }} className="mx-auto mb-3 opacity-40" />
        <p className="text-[15px]" style={{ color: '#9B978E' }}>
          No memories uploaded yet. Add voice recordings, photos, or stories to family members.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {memories.map((m) => (
        <div key={m.id} className="rounded-2xl overflow-hidden" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
          <div style={{ height: 3, background: '#D4A843' }} />
          <div className="p-5">
            <div className="flex items-center gap-2 mb-3">
              {m.type === 'voice' && <Mic size={15} style={{ color: '#D4A843' }} />}
              {m.type === 'photo' && <ImageIcon size={15} style={{ color: '#D4A843' }} />}
              {m.type === 'story' && <BookOpen size={15} style={{ color: '#D4A843' }} />}
              <span className="text-[12px] uppercase tracking-wider" style={{ fontWeight: 600, color: '#D4A843' }}>
                {m.type === 'voice' ? 'Voice Recording' : m.type === 'photo' ? 'Photo' : 'Story'}
              </span>
            </div>
            {m.type === 'photo' && m.photoUrl && (
              <img src={m.photoUrl} alt={m.title} className="w-full h-32 object-cover rounded-xl mb-3" />
            )}
            <p className="text-[14px] mb-1" style={{ fontWeight: 600, color: '#2A2926' }}>{m.title}</p>
            <p className="text-[13px] mb-3" style={{ color: '#6B675E' }}>from {m.memberName}</p>
            <span className="text-[12px]" style={{ color: '#9B978E' }}>{m.date}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Format raw DB relationship slugs into readable labels.
 *  Uses specific_relationship (e.g. paternal_aunt) when available,
 *  falls back to the generic relationship field. */
function formatRelationship(relationship: string, specificRelationship?: string | null): string {
  const map: Record<string, string> = {
    paternal_uncle: 'Uncle',
    paternal_aunt: 'Aunt',
    paternal_uncle_wife: "Uncle's Wife",
    paternal_aunt_husband: "Aunt's Husband",
    maternal_uncle: 'Uncle',
    maternal_aunt: 'Aunt',
    maternal_uncle_wife: "Uncle's Wife",
    maternal_aunt_husband: "Aunt's Husband",
    grandmother: 'Grandmother',
    grandfather: 'Grandfather',
    paternal_grandfather: 'Grandfather',
    paternal_grandmother: 'Grandmother',
    maternal_grandfather: 'Grandfather',
    maternal_grandmother: 'Grandmother',
    grandparent: 'Grandparent',
    step_parent: 'Step-Parent',
    step_mother: 'Step-Mother',
    step_father: 'Step-Father',
    step_sibling: 'Step-Sibling',
    cousin: 'Cousin',
    sibling: 'Sibling',
    brother: 'Brother',
    sister: 'Sister',
    mother: 'Mother',
    father: 'Father',
    parent: 'Parent',
    uncle: 'Uncle',
    aunt: 'Aunt',
    aunt_uncle: 'Uncle / Aunt',
    mom: 'Mom',
    dad: 'Dad',
  };
  // Try specific first, then generic
  const key = (specificRelationship || relationship).toLowerCase().trim();
  if (map[key]) return map[key];
  return relationship.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Map a relationship string to a display group */
function getRelationshipGroup(relationship: string): string {
  const r = relationship.toLowerCase();
  if (r.includes('grand')) return 'Grandparents';
  if (r.includes('parent') || r === 'mother' || r === 'mom' || r === 'father' || r === 'dad' || r.includes('step-parent') || r.includes('step parent')) return 'Parents';
  if (r.includes('uncle') || r.includes('aunt')) return 'Uncles & Aunts';
  if (r.includes('cousin')) return 'Cousins';
  if (r.includes('sibling') || r.includes('brother') || r.includes('sister')) return 'Siblings';
  return 'Other Family';
}
