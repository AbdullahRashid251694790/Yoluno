/**
 * Topics Page
 *
 * Manage content topics for children. Visual design mirrors the loveable
 * DashboardTopicsPage exactly; data comes from the live database.
 */

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChildProfiles } from '@/hooks/queries/useChildProfiles';
import {
  useChildTopicSettings,
  useUpdateTopicSetting,
  useBulkUpdateTopicSettings,
} from '@/hooks/queries/useTopics';
import {
  useCustomTopics,
  useTopicPosts,
  useDeleteCustomTopic,
} from '@/hooks/queries/useTopicPosts';
import {
  CustomTopicDialog,
  TopicPostsList,
} from '@/components/dashboard/topics';
import { LoadingSpinner } from '@/components/shared';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ChevronDown,
  ChevronRight,
  Search,
  BookOpen,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import type { CustomTopic } from '@/hooks/queries/useTopicPosts';

// Meta-cluster definitions matching loveable's grouping
const CLUSTERS: { label: string; categories: string[]; isCurriculum?: boolean }[] = [
  {
    label: 'British National Curriculum',
    isCurriculum: true,
    categories: [
      'British Curriculum: English',
      'British Curriculum: Maths',
      'British Curriculum: Science',
      'British Curriculum: History',
      'British Curriculum: Geography',
      'British Curriculum: Computing',
      'British Curriculum: Languages',
      'British Curriculum: Design & Technology',
      'British Curriculum: Citizenship & PSHE',
    ],
  },
  {
    label: 'International Baccalaureate (IB)',
    isCurriculum: true,
    categories: [
      'IB: Who We Are',
      'IB: Where We Are in Place and Time',
      'IB: How We Express Ourselves',
      'IB: How the World Works',
      'IB: How We Organize Ourselves',
      'IB: Sharing the Planet',
      'IB: Thinking & Learning Skills',
      'IB: Design Thinking & Innovation',
    ],
  },
  {
    label: 'Learning & Knowledge',
    categories: ['Science & Space', 'History & Culture', 'Math & Logic', 'Technology & Future', 'World & Geography', 'Everyday Learning'],
  },
  {
    label: 'Creative & Imaginative',
    categories: ['Arts & Creativity', 'Adventure & Fantasy', 'Careers & Dreams'],
  },
  {
    label: 'Wellbeing & Relationships',
    categories: ['Emotions & Feelings', 'Family & Friends', 'Health & Body', 'Mindfulness & Wellbeing', 'Safety & Life Skills'],
  },
  {
    label: 'Fun & Exploration',
    categories: ['Animals & Nature', 'Food & Cooking'],
  },
];

interface TopicItem {
  id: string;
  name: string;
  description: string | null;
  is_allowed?: boolean;
  is_default?: boolean;
  category_name?: string;
}

function CategoryRow({
  category,
  topics,
  search,
  onToggle,
  isPending,
  childId,
  childAge,
  allPosts,
}: {
  category: string;
  topics: TopicItem[];
  search: string;
  onToggle: (id: string, current: boolean) => void;
  isPending: boolean;
  childId: string;
  childAge?: number;
  allPosts: Array<{ topic_id?: string; custom_topic_id?: string; [key: string]: any }>;
}) {
  const [expanded, setExpanded] = useState(false);

  const allowed = topics.filter((t) => t.is_allowed).length;
  const total = topics.length;
  const allAllowed = allowed === total;
  const preview = topics.slice(0, 3).map((t) => t.name).join(', ');

  if (
    search &&
    !category.toLowerCase().includes(search) &&
    !topics.some((t) => t.name.toLowerCase().includes(search))
  )
    return null;

  return (
    <div className="border-b last:border-b-0" style={{ borderColor: '#F5F3EE' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 py-3.5 px-1 text-left hover:bg-[#FAFAF7] transition"
      >
        <ChevronRight
          size={14}
          className={`transition-transform shrink-0 ${expanded ? 'rotate-90' : ''}`}
          style={{ color: '#9B978E' }}
        />
        <div className="flex-1 min-w-0">
          <span className="text-[15px]" style={{ fontWeight: 500, color: '#2A2926' }}>
            {category}
          </span>
          {!expanded && (
            <p className="text-[12px] truncate mt-0.5" style={{ color: '#9B978E' }}>
              Includes: {preview}...
            </p>
          )}
        </div>
        <span
          className="px-2.5 py-0.5 rounded-full text-[12px] shrink-0"
          style={{
            background: allAllowed ? '#E8F6F4' : '#FDF6E8',
            color: allAllowed ? '#3ECDC6' : '#D4A843',
            fontWeight: 600,
          }}
        >
          {allowed}/{total} allowed
        </span>
      </button>
      {expanded && (
        <div className="pl-8 pr-2 pb-3 flex flex-col gap-2">
          {topics.map((t) => {
            const posts = allPosts.filter((p) => p.topic_id === t.id);
            return (
              <div key={t.id}>
                <div className="flex items-start justify-between py-1.5 gap-3">
                  <div className="flex-1 min-w-0">
                    <span
                      className="text-[14px]"
                      style={{ color: t.is_allowed ? '#2A2926' : '#9B978E' }}
                    >
                      {t.name}
                    </span>
                    {t.description && (
                      <p className="text-[12px] mt-0.5 leading-relaxed" style={{ color: '#9B978E' }}>
                        {t.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => onToggle(t.id, t.is_allowed || false)}
                    disabled={isPending}
                    className="w-10 h-5 rounded-full relative transition-colors"
                    style={{ background: t.is_allowed ? '#3ECDC6' : '#D4D2CD' }}
                  >
                    <span
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all"
                      style={{ left: t.is_allowed ? 21 : 2 }}
                    />
                  </button>
                </div>
                {t.is_allowed && (
                  <div className="ml-2 mt-1 mb-2 border-l-2 pl-3" style={{ borderColor: '#E8E6E1' }}>
                    <TopicPostsList
                      childId={childId}
                      childAge={childAge}
                      topicId={t.id}
                      topicName={t.name}
                      topicDescription={t.description}
                      posts={posts}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function TopicsPage() {
  const { user } = useAuth();
  const { data: children = [], isLoading: childrenLoading } = useChildProfiles(user?.id);
  const [selectedChildId, setSelectedChildId] = useState<string>('');
  const [search, setSearch] = useState('');

  const activeChildId = selectedChildId || children[0]?.id;
  const selectedChild = children.find((c) => c.id === activeChildId);

  const { data: topicSettings, isLoading: topicsLoading } = useChildTopicSettings(activeChildId);
  const { data: customTopics = [], isLoading: customTopicsLoading } = useCustomTopics(activeChildId);
  const { data: allPosts = [] } = useTopicPosts(activeChildId);
  const updateSetting = useUpdateTopicSetting();
  const bulkUpdate = useBulkUpdateTopicSettings();
  const deleteCustomTopic = useDeleteCustomTopic();

  const [customTopicDialogOpen, setCustomTopicDialogOpen] = useState(false);
  const [editingCustomTopic, setEditingCustomTopic] = useState<CustomTopic | null>(null);
  const [deletingCustomTopic, setDeletingCustomTopic] = useState<CustomTopic | null>(null);

  if (childrenLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div
        className="dashboard-scope rounded-2xl p-10 text-center"
        style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
      >
        <p className="text-[15px]" style={{ color: '#6B675E' }}>
          Add a child profile first to manage their content topics.
        </p>
      </div>
    );
  }

  const handleToggleTopic = (topicId: string, currentAllowed: boolean) => {
    if (!activeChildId) return;
    updateSetting.mutate({ childId: activeChildId, topicId, isAllowed: !currentAllowed });
  };

  const handleAllowAll = () => {
    if (!activeChildId || !topicSettings) return;
    const settings = topicSettings.topics
      .filter((t) => !t.is_allowed)
      .map((t) => ({ topic_id: t.id, is_allowed: true }));
    if (settings.length > 0) bulkUpdate.mutate({ childId: activeChildId, settings });
  };

  const handleRestrictSensitive = () => {
    if (!activeChildId || !topicSettings) return;
    // Topics where is_default = false are system-flagged as sensitive.
    // Set those to disallowed, leave everything else untouched.
    const settings = topicSettings.topics
      .filter((t) => t.is_default === false && t.is_allowed)
      .map((t) => ({ topic_id: t.id, is_allowed: false }));
    if (settings.length > 0) bulkUpdate.mutate({ childId: activeChildId, settings });
  };

  const handleResetToDefault = () => {
    if (!activeChildId || !topicSettings) return;
    const settings = topicSettings.topics.map((t) => ({
      topic_id: t.id,
      is_allowed: t.is_default ?? true,
    }));
    bulkUpdate.mutate({ childId: activeChildId, settings });
  };

  const handleDeleteCustomTopic = async () => {
    if (!deletingCustomTopic || !activeChildId) return;
    try {
      await deleteCustomTopic.mutateAsync({ childId: activeChildId, customTopicId: deletingCustomTopic.id });
      setDeletingCustomTopic(null);
    } catch {}
  };

  // Group topics by category
  const topicsByCategory = topicSettings?.topics.reduce(
    (acc, topic) => {
      const cat = topic.category_name || 'Other';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(topic);
      return acc;
    },
    {} as Record<string, TopicItem[]>
  ) || {};

  // Build cluster groups that have topics loaded
  const mappedCategories = new Set(CLUSTERS.flatMap((c) => c.categories));
  const clusterGroups = CLUSTERS.map((cluster) => ({
    ...cluster,
    presentCategories: cluster.categories.filter((c) => (topicsByCategory[c]?.length ?? 0) > 0),
  })).filter((c) => c.presentCategories.length > 0);

  const unmappedCategories = Object.keys(topicsByCategory).filter((c) => !mappedCategories.has(c));
  if (unmappedCategories.length > 0) {
    clusterGroups.push({ label: 'Other', categories: unmappedCategories, presentCategories: unmappedCategories });
  }

  // Totals for summary bar
  const allTopics = topicSettings?.topics || [];
  const totalSubs = allTopics.length;
  const totalAllowed = allTopics.filter((t) => t.is_allowed).length;
  const totalRestricted = totalSubs - totalAllowed;

  const lc = search.toLowerCase();

  const getPostsForCustomTopic = (id: string) => allPosts.filter((p) => p.custom_topic_id === id);

  return (
    <div className="dashboard-scope">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[28px] mb-1" style={{ fontWeight: 600, color: '#2A2926' }}>
            Content Topics
          </h1>
          <p className="text-[15px] max-w-xl" style={{ color: '#6B675E' }}>
            Control what your child can explore across all spaces — Chat, Stories, Journeys, and Family.
          </p>
        </div>
        <div className="relative shrink-0">
          <select
            value={activeChildId}
            onChange={(e) => setSelectedChildId(e.target.value)}
            className="appearance-none pl-4 pr-9 py-2.5 rounded-lg text-[14px] border cursor-pointer"
            style={{ background: '#FFFFFF', borderColor: '#E8E6E1', color: '#2A2926', fontWeight: 500 }}
          >
            {children.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9B978E' }} />
        </div>
      </div>

      {/* Age Banner */}
      <div className="mb-5 px-5 py-4 rounded-xl" style={{ background: '#E8F6F4', borderLeft: '3px solid #3ECDC6' }}>
        <p className="text-[14px]" style={{ color: '#2A2926' }}>
          Showing topics for <strong>{selectedChild?.name}</strong> (age {topicSettings?.child_age ?? selectedChild?.age}).
          Topics are pre-filtered for age-appropriateness. You can further restrict any topic below.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: '#9B978E' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search topics... e.g., 'animals', 'history', 'feelings'"
          className="w-full pl-11 pr-4 py-3 rounded-xl text-[15px] border outline-none transition focus:border-[#3ECDC6]"
          style={{ background: '#FFFFFF', borderColor: '#E8E6E1', color: '#2A2926' }}
        />
      </div>

      {/* Custom Topics */}
      <div className="rounded-2xl p-6 mb-6" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Sparkles size={18} style={{ color: '#3ECDC6' }} />
            <h2 className="text-[18px]" style={{ fontWeight: 600, color: '#2A2926' }}>Custom Topics</h2>
          </div>
          <button
            onClick={() => { setEditingCustomTopic(null); setCustomTopicDialogOpen(true); }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] transition hover:bg-[#E8F6F4]"
            style={{ fontWeight: 600, color: '#3ECDC6', border: '1px solid #3ECDC6' }}
          >
            <Plus size={14} /> Add Topic
          </button>
        </div>
        <p className="text-[14px] mb-1" style={{ color: '#6B675E' }}>
          Add your own topics with custom content. Your child's guide will reference this information in conversations.
        </p>
        <p className="text-[12px] mb-4" style={{ color: '#9B978E' }}>
          Custom content is provided by you and is not verified by Yoluno.
        </p>
        {customTopicsLoading ? (
          <div className="flex justify-center py-4"><LoadingSpinner /></div>
        ) : customTopics.length === 0 ? (
          <p className="text-[14px] py-4 text-center" style={{ color: '#9B978E' }}>
            No custom topics yet. Create one to add personalised content for Luno.
          </p>
        ) : (
          customTopics.map((ct) => {
            const posts = getPostsForCustomTopic(ct.id);
            return (
              <div key={ct.id} className="flex items-center justify-between py-2.5 border-t" style={{ borderColor: '#F5F3EE' }}>
                <div className="flex items-center gap-2">
                  {ct.icon && <span className="text-[14px]">{ct.icon}</span>}
                  <span className="text-[14px]" style={{ color: '#2A2926' }}>{ct.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[12px]" style={{ background: '#F5F3EE', color: '#9B978E' }}>
                    {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                  </span>
                  <button
                    onClick={() => { setEditingCustomTopic(ct); setCustomTopicDialogOpen(true); }}
                    className="p-1 rounded hover:bg-[#F5F3EE] transition"
                  >
                    <Pencil size={12} style={{ color: '#9B978E' }} />
                  </button>
                  <button
                    onClick={() => setDeletingCustomTopic(ct)}
                    className="p-1 rounded hover:bg-[#FDF6E8] transition"
                  >
                    <Trash2 size={12} style={{ color: '#D4A843' }} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2 mb-2">
        <button
          onClick={handleAllowAll}
          disabled={bulkUpdate.isPending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] transition hover:bg-[#E8F6F4]"
          style={{ border: '1px solid #E8E6E1', color: '#6B675E', fontWeight: 500 }}
        >
          <CheckCircle2 size={13} style={{ color: '#3ECDC6' }} /> Allow All
        </button>
        <button
          onClick={handleRestrictSensitive}
          disabled={bulkUpdate.isPending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] transition hover:bg-[#FDF6E8]"
          style={{ border: '1px solid #E8E6E1', color: '#6B675E', fontWeight: 500 }}
        >
          <ShieldCheck size={13} style={{ color: '#D4A843' }} /> Restrict Sensitive Topics
        </button>
        <button
          onClick={handleResetToDefault}
          disabled={bulkUpdate.isPending}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] transition hover:bg-[#F5F3EE]"
          style={{ border: '1px solid #E8E6E1', color: '#6B675E', fontWeight: 500 }}
        >
          <RotateCcw size={13} style={{ color: '#9B978E' }} /> Reset to Default
        </button>
      </div>
      <p className="text-[12px] mb-6" style={{ color: '#9B978E' }}>
        Default settings are based on your child's age. You can adjust anything at any time.
      </p>

      {/* System Topics */}
      {topicsLoading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : (
        clusterGroups.map((cluster) => {
          if (cluster.isCurriculum) {
            return (
              <div key={cluster.label} className="rounded-2xl overflow-hidden mb-6" style={{ background: '#F5F3EE', border: '1px solid #E8E6E1' }}>
                <div className="px-6 pt-5 pb-2 flex items-center gap-2">
                  <BookOpen size={16} style={{ color: '#3ECDC6' }} />
                  <h3 className="text-[16px]" style={{ fontWeight: 600, color: '#2A2926' }}>{cluster.label}</h3>
                </div>
                <div className="bg-white mx-3 mb-3 rounded-xl px-4">
                  {cluster.presentCategories.map((cat) => (
                    <CategoryRow
                      key={cat}
                      category={cat}
                      topics={topicsByCategory[cat] || []}
                      search={lc}
                      onToggle={handleToggleTopic}
                      isPending={updateSetting.isPending}
                      childId={activeChildId}
                      childAge={selectedChild?.age}
                      allPosts={allPosts}
                    />
                  ))}
                </div>
              </div>
            );
          }

          return (
            <div key={cluster.label} className="mb-6">
              <h4
                className="text-[13px] uppercase tracking-wider mb-2 px-1"
                style={{ fontWeight: 600, color: '#9B978E', letterSpacing: '1.5px' }}
              >
                {cluster.label}
              </h4>
              <div className="rounded-2xl px-4" style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}>
                {cluster.presentCategories.map((cat) => (
                  <CategoryRow
                    key={cat}
                    category={cat}
                    topics={topicsByCategory[cat] || []}
                    search={lc}
                    onToggle={handleToggleTopic}
                    isPending={updateSetting.isPending}
                    childId={activeChildId}
                    childAge={selectedChild?.age}
                    allPosts={allPosts}
                  />
                ))}
              </div>
            </div>
          );
        })
      )}

      {/* Summary Bar */}
      {totalSubs > 0 && (
        <div
          className="rounded-xl px-5 py-4 mt-4 sticky bottom-4"
          style={{ background: '#FFFFFF', border: '1px solid #E8E6E1', boxShadow: '0 -4px 16px rgba(42,41,38,0.06)' }}
        >
          <p className="text-[14px]" style={{ color: '#6B675E' }}>
            <strong>{selectedChild?.name}</strong> (Age {selectedChild?.age}): {totalAllowed}/{totalSubs} sub-topics allowed · {totalRestricted} restricted · {customTopics.length} custom {customTopics.length === 1 ? 'topic' : 'topics'}
          </p>
        </div>
      )}

      {/* Dialogs */}
      <CustomTopicDialog
        open={customTopicDialogOpen}
        onOpenChange={setCustomTopicDialogOpen}
        childId={activeChildId}
        topic={editingCustomTopic}
      />

      <AlertDialog open={!!deletingCustomTopic} onOpenChange={(open) => !open && setDeletingCustomTopic(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Custom Topic</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingCustomTopic?.name}"? This will also
              delete all posts within this topic. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCustomTopic}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Topic
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
