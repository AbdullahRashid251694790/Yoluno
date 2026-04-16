/**
 * Journeys Page
 *
 * Visual design mirrors loveable DashboardJourneysPage exactly; data from DB.
 */

import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChildProfiles } from '@/hooks/queries/useChildProfiles';
import { useJourneys } from '@/hooks/queries/useJourneys';
import {
  useTemplatesForChild,
  useTemplateCategories,
  useStartJourneyFromTemplate,
} from '@/hooks/queries/useJourneyTemplates';
import { LoadingSpinner } from '@/components/shared';
import {
  CreateJourneyDialog,
  EditJourneyDialog,
  type JourneyForCard,
} from '@/components/dashboard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ChevronDown,
  ChevronRight,
  Sparkles,
  Eye,
  ArrowRight,
  Play,
} from 'lucide-react';
import { getUploadUrl } from '@/integrations/api/client';
import { getInitials } from '@/lib/utils';
import type { JourneyTemplate } from '@/services/journeyTemplates';

const CHILD_BGS = ['#E8F6F4', '#F3EFF8', '#FEF0EA', '#FDF6E8'];
const JOURNEY_COLORS = ['#E8946A', '#B8A5D4', '#3ECDC6', '#D4A843'];

type TabKey = 'active' | 'browse' | 'completed';

function JourneyCard({
  journey,
  childName,
  color,
  onContinue,
  onView,
}: {
  journey: JourneyForCard;
  childName?: string;
  color: string;
  onContinue?: () => void;
  onView?: () => void;
}) {
  const pct = journey.totalSteps > 0 ? (journey.currentStep / journey.totalSteps) * 100 : 0;
  const status = journey.status;
  // Not started = purple, in progress = orange, completed = teal
  const cardColor = status === 'completed' ? '#3ECDC6' : journey.currentStep === 0 ? '#B8A5D4' : '#E8946A';

  return (
    <div
      className="rounded-2xl w-full sm:w-[280px] shrink-0"
      style={{ background: '#FFFFFF', border: '1px solid #E8E6E1', borderLeft: `4px solid ${cardColor}` }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="text-[16px]" style={{ fontWeight: 600, color: '#2A2926' }}>
            {journey.title}
          </h3>
          {status === 'active' && journey.currentStep === 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] whitespace-nowrap" style={{ background: '#F5F3EE', color: '#9B978E', fontWeight: 600 }}>
              Not Started
            </span>
          )}
          {status === 'active' && journey.currentStep > 0 && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] whitespace-nowrap" style={{ background: '#FEF0EA', color: '#E8946A', fontWeight: 600 }}>
              In Progress
            </span>
          )}
          {status === 'completed' && (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] whitespace-nowrap" style={{ background: '#E8F6F4', color: '#3ECDC6', fontWeight: 600 }}>
              Complete
            </span>
          )}
        </div>
        <p className="text-[13px] mb-4" style={{ color: '#9B978E' }}>
          {journey.description || `${journey.totalSteps} steps`}
        </p>
        <div className="mb-1.5">
          <div className="h-2 rounded-full overflow-hidden" style={{ background: '#F5F3EE' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: cardColor }} />
          </div>
        </div>
        <p className="text-[12px] mb-4" style={{ color: '#9B978E' }}>
          Step {journey.currentStep} of {journey.totalSteps}
        </p>
        {status === 'active' && journey.currentStep === 0 && (
          <button
            onClick={onView}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] transition hover:bg-[#F3EFF8]"
            style={{ border: '1px solid #B8A5D4', color: '#B8A5D4', fontWeight: 600 }}
          >
            <Play size={13} /> Start
          </button>
        )}
        {status === 'active' && journey.currentStep > 0 && (
          <button
            onClick={onView}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] transition hover:bg-[#FEF0EA]"
            style={{ border: '1px solid #E8946A', color: '#E8946A', fontWeight: 600 }}
          >
            Continue <ArrowRight size={13} />
          </button>
        )}
        {status === 'completed' && (
          <button
            onClick={onView}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] transition hover:bg-[#E8F6F4]"
            style={{ border: '1px solid #3ECDC6', color: '#3ECDC6', fontWeight: 600 }}
          >
            <Eye size={13} /> View
          </button>
        )}
      </div>
    </div>
  );
}

export function JourneysPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: children = [], isLoading: loadingChildren } = useChildProfiles(user?.id);

  const [activeTab, setActiveTab] = useState<TabKey>('active');
  const [childFilter, setChildFilter] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<JourneyTemplate | null>(null);
  const [showStartDialog, setShowStartDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingJourney, setEditingJourney] = useState<JourneyForCard | null>(null);
  // Track CLOSED categories — everything is open by default
  const [closedCategories, setClosedCategories] = useState<Set<string>>(new Set());

  const activeChildId = childFilter !== 'all' ? childFilter : children[0]?.id;
  const { data: journeys = [], isLoading: loadingJourneys } = useJourneys(
    childFilter !== 'all' ? childFilter : undefined
  );
  const { data: childTemplates = [] } = useTemplatesForChild(activeChildId);
  const { data: categories = [] } = useTemplateCategories();
  const startJourney = useStartJourneyFromTemplate();

  const activeJourneys = journeys.filter((j) => j.status === 'active');
  const completedJourneys = journeys.filter((j) => j.status === 'completed');

  // Build child lookup
  const childMap = useMemo(() => {
    const map: Record<string, { name: string; initial: string; bg: string; age: number; avatarUrl?: string }> = {};
    children.forEach((c, i) => {
      map[c.id] = {
        name: c.name,
        initial: getInitials(c.name),
        bg: CHILD_BGS[i % CHILD_BGS.length],
        age: c.age,
        avatarUrl: getUploadUrl(c.avatarUrl || c.custom_avatar_url) || undefined,
      };
    });
    return map;
  }, [children]);

  // Group active journeys by child
  const groupedByChild = useMemo(() => {
    const groups: Record<string, JourneyForCard[]> = {};
    const filtered = childFilter === 'all' ? activeJourneys : activeJourneys.filter((j) => (j.child_profile_id || j.childProfileId) === childFilter);
    filtered.forEach((j) => {
      const childId = j.child_profile_id || j.childProfileId;
      const name = childMap[childId]?.name || 'Unknown';
      (groups[childId] = groups[childId] || []).push(j);
    });
    return groups;
  }, [activeJourneys, childFilter, childMap]);

  const filteredCompleted = childFilter === 'all'
    ? completedJourneys
    : completedJourneys.filter((j) => (j.child_profile_id || j.childProfileId) === childFilter);

  // Group templates by category for browse tab
  const templatesByCategory = useMemo(() => {
    const map: Record<string, JourneyTemplate[]> = {};
    childTemplates.forEach((t) => {
      const cat = t.category || 'Other';
      (map[cat] = map[cat] || []).push(t);
    });
    return map;
  }, [childTemplates]);

  const toggleCategory = (name: string) =>
    setClosedCategories((prev) => {
      const n = new Set(prev);
      n.has(name) ? n.delete(name) : n.add(name);
      return n;
    });

  const handleStartJourney = useCallback(
    (template: JourneyTemplate) => {
      if (children.length === 0) return;
      if (children.length === 1) {
        startJourney.mutate(
          { templateId: template.id, childId: children[0].id },
          { onSuccess: () => { setShowStartDialog(false); setSelectedTemplate(null); } }
        );
      } else {
        setSelectedTemplate(template);
        setShowStartDialog(true);
      }
    },
    [children, startJourney]
  );

  const handleConfirmStart = useCallback(
    (childId: string) => {
      if (!selectedTemplate) return;
      startJourney.mutate(
        { templateId: selectedTemplate.id, childId },
        { onSuccess: () => { setShowStartDialog(false); setSelectedTemplate(null); } }
      );
    },
    [selectedTemplate, startJourney]
  );

  const handleContinueJourney = useCallback(
    (journey: JourneyForCard) => {
      const childId = journey.child_profile_id || journey.childProfileId;
      if (childId) navigate(`/kids/${childId}/journeys/${journey.id}`);
    },
    [navigate]
  );

  if (loadingChildren) {
    return <div className="flex items-center justify-center h-64"><LoadingSpinner size="lg" /></div>;
  }

  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: 'active', label: 'Active', count: activeJourneys.length },
    { key: 'browse', label: 'Browse Journeys' },
    { key: 'completed', label: 'Completed', count: completedJourneys.length },
  ];

  return (
    <div className="dashboard-scope">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[28px] mb-1" style={{ fontWeight: 600, color: '#2A2926' }}>
            Journeys
          </h1>
          <p className="text-[15px] max-w-xl" style={{ color: '#6B675E' }}>
            Gentle adventures in growth — track where each child is, at their own pace.
          </p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-[14px] transition hover:bg-[#FEF0EA] shrink-0 md:w-auto w-full justify-center"
          style={{ fontWeight: 600, color: '#E8946A', border: '1px solid #E8946A', background: '#FFFFFF' }}
        >
          + Create Journey
        </button>
      </div>

      {/* Stats */}
      <p className="text-[13px] mb-4" style={{ color: '#9B978E' }}>
        {activeJourneys.length} journeys active · {completedJourneys.length} completed · {Object.keys(groupedByChild).length} children exploring
      </p>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
        <div className="flex gap-1 p-1 rounded-lg overflow-x-auto" style={{ background: '#F5F3EE' }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md text-[13px] whitespace-nowrap transition"
              style={{
                fontWeight: activeTab === t.key ? 600 : 400,
                color: activeTab === t.key ? '#2A2926' : '#6B675E',
                background: activeTab === t.key ? '#FFFFFF' : 'transparent',
                boxShadow: activeTab === t.key ? '0 1px 3px rgba(42,41,38,0.08)' : 'none',
              }}
            >
              {t.label}
              {t.count !== undefined && (
                <span
                  className="ml-1 px-1.5 py-0.5 rounded text-[11px]"
                  style={{ background: activeTab === t.key ? '#F5F3EE' : 'transparent', color: '#9B978E' }}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
        {activeTab !== 'browse' && (
          <div className="relative">
            <select
              value={childFilter}
              onChange={(e) => setChildFilter(e.target.value)}
              className="appearance-none pl-4 pr-8 py-2 rounded-lg text-[13px] border cursor-pointer"
              style={{ background: '#FFFFFF', borderColor: '#E8E6E1', color: '#2A2926' }}
            >
              <option value="all">All children</option>
              {children.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9B978E' }} />
          </div>
        )}
      </div>

      {/* Active Tab */}
      {activeTab === 'active' && (
        <>
          {loadingJourneys ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : Object.keys(groupedByChild).length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[15px]" style={{ color: '#9B978E' }}>
                No active journeys yet. Browse available journeys to get started.
              </p>
            </div>
          ) : (
            Object.entries(groupedByChild).map(([childId, childJourneys]) => {
              const child = childMap[childId];
              return (
                <div key={childId} className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      {child?.avatarUrl ? (
                        <img src={child.avatarUrl} alt={child.name} className="w-8 h-8 rounded-full object-cover" style={{ background: child.bg }} />
                      ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px]" style={{ background: child?.bg || '#F5F3EE', fontWeight: 600, color: '#2A2926' }}>
                          {child?.initial || '?'}
                        </div>
                      )}
                      <span className="text-[15px]" style={{ fontWeight: 600, color: '#2A2926' }}>{child?.name || 'Child'}</span>
                      <span className="text-[13px]" style={{ color: '#9B978E' }}>Age {child?.age}</span>
                    </div>
                    <span className="text-[13px]" style={{ color: '#9B978E' }}>{childJourneys.length} active journeys</span>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-2 sm:flex-wrap">
                    {childJourneys.map((j, i) => (
                      <JourneyCard
                        key={j.id}
                        journey={j}
                        childName={child?.name}
                        color={JOURNEY_COLORS[i % JOURNEY_COLORS.length]}
                        onContinue={() => handleContinueJourney(j)}
                        onView={() => setEditingJourney(j)}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </>
      )}

      {/* Browse Tab */}
      {activeTab === 'browse' && (
        <div className="flex flex-col gap-6">
          {Object.keys(templatesByCategory).length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[15px]" style={{ color: '#9B978E' }}>
                No journey templates available yet.
              </p>
            </div>
          ) : (
            Object.entries(templatesByCategory).map(([catName, templates]) => (
              <div key={catName}>
                <button
                  onClick={() => toggleCategory(catName)}
                  className="flex items-center gap-2 mb-3 w-full text-left"
                >
                  <ChevronRight
                    size={16}
                    className={`transition-transform ${!closedCategories.has(catName) ? 'rotate-90' : ''}`}
                    style={{ color: '#9B978E' }}
                  />
                  <h3 className="text-[17px] capitalize" style={{ fontWeight: 600, color: '#2A2926' }}>
                    {catName}
                  </h3>
                </button>
                {!closedCategories.has(catName) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pl-6">
                    {templates.map((t) => (
                      <div
                        key={t.id}
                        className="rounded-2xl p-5"
                        style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
                      >
                        <h4 className="text-[15px] mb-1" style={{ fontWeight: 600, color: '#2A2926' }}>
                          {t.title}
                        </h4>
                        <p className="text-[13px] mb-3" style={{ color: '#6B675E' }}>
                          {t.description}
                        </p>
                        <div className="flex items-center gap-3 mb-3 text-[12px]" style={{ color: '#9B978E' }}>
                          <span>{t.duration_days} days</span>
                          <span>·</span>
                          <span>Ages {t.age_range_min}-{t.age_range_max}</span>
                        </div>
                        <button
                          onClick={() => handleStartJourney(t)}
                          disabled={startJourney.isPending}
                          className="px-4 py-2 rounded-full text-[13px] transition hover:bg-[#FEF0EA]"
                          style={{ border: '1px solid #E8946A', color: '#E8946A', fontWeight: 600 }}
                        >
                          Assign to Child
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Completed Tab */}
      {activeTab === 'completed' && (
        <>
          {filteredCompleted.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-[15px]" style={{ color: '#9B978E' }}>No completed journeys yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredCompleted.map((j) => {
                const childId = j.child_profile_id || j.childProfileId;
                const child = childMap[childId];
                const completedDate = j.completedAt
                  ? new Date(j.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                  : '';
                return (
                  <div
                    key={j.id}
                    className="rounded-xl px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
                    style={{ background: '#FFFFFF', border: '1px solid #E8E6E1' }}
                  >
                    <div className="flex items-center gap-2.5 sm:w-[180px] shrink-0">
                      {child?.avatarUrl ? (
                        <img src={child.avatarUrl} alt={child.name} className="w-8 h-8 rounded-full object-cover" style={{ background: child.bg }} />
                      ) : (
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px]" style={{ background: child?.bg || '#F5F3EE', fontWeight: 600, color: '#2A2926' }}>
                          {child?.initial || '?'}
                        </div>
                      )}
                      <span className="text-[14px]" style={{ fontWeight: 600, color: '#2A2926' }}>
                        {child?.name || 'Child'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} style={{ color: '#D4A843' }} />
                        <span className="text-[14px]" style={{ color: '#2A2926' }}>
                          Completed <strong>{j.title}</strong>{completedDate ? ` on ${completedDate}` : ''}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setEditingJourney(j)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] transition hover:bg-[#E8F6F4] shrink-0"
                      style={{ border: '1px solid #3ECDC6', color: '#3ECDC6', fontWeight: 600 }}
                    >
                      <Eye size={13} /> View Reflections
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Start Journey Dialog (for multiple children) */}
      <Dialog open={showStartDialog} onOpenChange={setShowStartDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start Journey</DialogTitle>
            <DialogDescription>
              Choose which child should start "{selectedTemplate?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => handleConfirmStart(child.id)}
                disabled={startJourney.isPending}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-left transition hover:bg-[#F5F3EE]"
                style={{ border: '1px solid #E8E6E1' }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[12px]"
                  style={{ background: CHILD_BGS[children.indexOf(child) % CHILD_BGS.length], fontWeight: 600, color: '#2A2926' }}
                >
                  {getInitials(child.name)}
                </div>
                <div>
                  <p className="text-[14px]" style={{ fontWeight: 600, color: '#2A2926' }}>{child.name}</p>
                  <p className="text-[12px]" style={{ color: '#9B978E' }}>Age {child.age}</p>
                </div>
              </button>
            ))}
          </div>
          <DialogFooter>
            <button
              onClick={() => { setShowStartDialog(false); setSelectedTemplate(null); }}
              className="px-4 py-2 rounded-lg text-[13px]"
              style={{ border: '1px solid #E8E6E1', color: '#6B675E', fontWeight: 500 }}
            >
              Cancel
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Journey Dialog */}
      <CreateJourneyDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        preselectedChildId={childFilter !== 'all' ? childFilter : undefined}
      />

      {/* Edit Journey Dialog */}
      <EditJourneyDialog
        journey={editingJourney}
        open={!!editingJourney}
        onOpenChange={(open) => !open && setEditingJourney(null)}
      />
    </div>
  );
}
