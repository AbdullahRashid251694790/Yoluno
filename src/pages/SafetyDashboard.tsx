/**
 * Safety Dashboard Page
 *
 * Visual design mirrors loveable DashboardSafetyPage exactly; data from DB.
 * Existing BuddySettingsPanel / JourneyReminderSettingsPanel kept as imports
 * but commented out of the UI — accessible via ?tab=buddy URL param.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChildProfiles } from '@/hooks/queries';
import { useSafetyReports } from '@/hooks/queries/useBuddyChat';
import { useWeeklySummary } from '@/hooks/queries/useAnalytics';
import { useChildTopicSettings } from '@/hooks/queries/useTopics';
import {
  // SafetyReportsPanel, // replaced with inline loveable-styled content below
  BuddySettingsPanel,
  // JourneyReminderSettingsPanel, // kept for re-enabling later
} from '@/components/dashboard/safety';
import { useMarkSafetyReportReviewed } from '@/hooks/queries/useBuddyChat';
import { apiClient } from '@/integrations/api/client';
import { LoadingState } from '@/components/shared/feedback/LoadingState';
import { formatRelativeTime } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ChevronDown,
  CheckCircle2,
  ExternalLink,
  Mail,
  Shield,
  Eye,
  AlertCircle,
  X,
} from 'lucide-react';
import { AlertTriangle, Clock, MessageSquare } from 'lucide-react';

/* ─── Read-only conversation viewer modal ─── */
function ConversationModal({
  messages,
  childName,
  sessionTitle,
  highlightMessageId,
  onClose,
}: {
  messages: any[];
  childName: string;
  sessionTitle: string;
  highlightMessageId?: string;
  onClose: () => void;
}) {
  // Scroll flagged message into view on open
  useEffect(() => {
    if (highlightMessageId) {
      setTimeout(() => {
        document.getElementById(`msg-${highlightMessageId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
    }
  }, [highlightMessageId]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl flex flex-col"
        style={{ maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#E8E6E1' }}>
          <div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 600, color: '#2A2926' }}>
              {sessionTitle || 'Conversation'}
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#9B978E', marginTop: 2 }}>
              {childName}'s chat with Luno — read-only view
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition hover:bg-gray-100"
            style={{ color: '#9B978E' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
          {messages.length === 0 && (
            <p className="text-center py-10" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#9B978E' }}>
              No messages found for this conversation.
            </p>
          )}
          {messages.map((msg: any) => {
            const isChild = msg.role === 'child';
            const isFlagged = msg.id === highlightMessageId;
            return (
              <div
                key={msg.id}
                id={`msg-${msg.id}`}
                className={`flex ${isChild ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="rounded-2xl px-4 py-3 max-w-[80%] relative"
                  style={{
                    background: isChild ? '#3ECDC6' : '#F5F3EE',
                    color: isChild ? '#FFFFFF' : '#2A2926',
                    border: isFlagged ? '2px solid #E8946A' : 'none',
                    boxShadow: isFlagged ? '0 0 0 3px rgba(232,148,106,0.2)' : 'none',
                  }}
                >
                  {isFlagged && (
                    <span
                      className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full"
                      style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, background: '#E8946A', color: '#fff', fontWeight: 600 }}
                    >
                      Flagged
                    </span>
                  )}
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                    {msg.content}
                  </p>
                  <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, marginTop: 4, opacity: 0.6 }}>
                    {new Date(msg.created_at).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t text-center" style={{ borderColor: '#E8E6E1' }}>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#9B978E' }}>
            This is a read-only view of your child's conversation
          </p>
        </div>
      </div>
    </div>
  );
}

function SafetyReportsInline({
  childId,
  reports,
  filter,
  onViewConversation,
}: {
  childId?: string;
  reports: any[];
  filter: 'unread' | 'all';
  onViewConversation?: (report: any) => void;
}) {
  const markReviewed = useMarkSafetyReportReviewed();

  const filtered = filter === 'unread'
    ? reports.filter((r) => !r.is_reviewed && !r.reviewed)
    : reports;

  // Exclude yellow (redirections — shown in their own section above)
  const isRedirect = (r: any) =>
    r.report_type === 'topic_redirect' || (!r.report_type && r.issue_summary?.includes('asked about:'));
  const safetyOnly = filtered.filter((r) => !isRedirect(r));

  if (safetyOnly.length === 0) {
    return (
      <div
        className="bg-white rounded-xl border p-10 flex flex-col items-center text-center"
        style={{ borderColor: '#E8E6E1' }}
      >
        <div
          className="flex items-center justify-center rounded-full mb-4"
          style={{ width: 56, height: 56, background: '#E8F6F4' }}
        >
          <CheckCircle2 size={28} style={{ color: '#3ECDC6' }} />
        </div>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 600, color: '#2A2926', marginBottom: 6 }}>
          No reports need your attention right now
        </p>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#9B978E', maxWidth: 480, lineHeight: 1.6 }}>
          Safety reports appear here when the AI detects something beyond a routine
          boundary redirect. You can also flag any conversation yourself using the
          "Report a Concern" button above.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {safetyOnly.map((r: any) => (
        <div
          key={r.id}
          className="bg-white rounded-xl border p-5"
          style={{
            borderColor: '#E8E6E1',
            borderLeft: `3px solid ${r.severity === 'red' ? '#E8946A' : '#D4A843'}`,
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {r.severity === 'red' ? (
                  <AlertTriangle size={14} style={{ color: '#E8946A' }} />
                ) : (
                  <Clock size={14} style={{ color: '#D4A843' }} />
                )}
                <span
                  className="px-2 py-0.5 rounded-full"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 11,
                    background: r.severity === 'red' ? '#FEF0EA' : '#FDF6E8',
                    color: r.severity === 'red' ? '#E8946A' : '#D4A843',
                    fontWeight: 600,
                  }}
                >
                  {r.severity === 'red' ? 'HIGH' : 'MODERATE'}
                </span>
                {!r.reviewed && (
                  <span
                    className="px-2 py-0.5 rounded-full"
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, background: '#F5F3EE', color: '#9B978E', fontWeight: 500 }}
                  >
                    Unread
                  </span>
                )}
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, color: '#2A2926', marginBottom: 4 }}>
                {r.issue_summary}
              </p>
              {r.message_excerpt && (
                <div className="rounded-lg p-3 mb-2" style={{ background: '#F5F3EE' }}>
                  <p className="italic" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#6B675E' }}>
                    "{r.message_excerpt}"
                  </p>
                </div>
              )}
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#9B978E' }}>
                {formatRelativeTime(r.created_at)}
                {r.reviewed && ' · Reviewed'}
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              {onViewConversation && r.session_id && (
                <button
                  onClick={() => onViewConversation(r)}
                  className="px-4 py-1.5 rounded-lg text-xs font-medium border transition hover:bg-gray-50"
                  style={{ borderColor: '#E8E6E1', color: '#6B675E', fontFamily: "'DM Sans', sans-serif" }}
                >
                  View Conversation
                </button>
              )}
              {!r.reviewed && (
                <button
                  onClick={() => markReviewed.mutate({ reportId: r.id })}
                  disabled={markReviewed.isPending}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold border transition hover:bg-[#E8F6F4]"
                  style={{ borderColor: '#3ECDC6', color: '#3ECDC6', fontFamily: "'DM Sans', sans-serif" }}
                >
                  Mark Reviewed
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SafetyDashboardPage() {
  const { user } = useAuth();
  const { data: childProfiles = [], isLoading } = useChildProfiles(user?.id);
  const markReviewed = useMarkSafetyReportReviewed();
  const [searchParams] = useSearchParams();
  const urlChildId = searchParams.get('child');
  const urlTab = searchParams.get('tab');
  const [selectedChildId, setSelectedChildId] = useState<string | null>(urlChildId);
  const [reportTab, setReportTab] = useState<'Unread' | 'All Reports'>('Unread');

  // Conversation viewer state
  const [viewingConvo, setViewingConvo] = useState<{
    messages: any[];
    childName: string;
    sessionTitle: string;
    highlightMessageId?: string;
  } | null>(null);
  const [convoLoading, setConvoLoading] = useState(false);

  const openConversation = useCallback(async (report: any) => {
    if (!report.session_id || !report.child_profile_id) {
      toast.error('Conversation data not available for this report');
      return;
    }
    setConvoLoading(true);
    try {
      const res = await apiClient.get(
        `/buddy-chat/${report.child_profile_id}/sessions/${report.session_id}/messages`
      );
      setViewingConvo({
        messages: res.data,
        childName: report.child_name || 'Child',
        sessionTitle: report.issue_summary || 'Conversation',
        highlightMessageId: report.message_id,
      });
    } catch {
      toast.error('Could not load conversation');
    } finally {
      setConvoLoading(false);
    }
  }, []);

  const [settings, setSettings] = useState({
    notifyRedirect: false,
    notifyReport: true,
    weeklySummary: true,
  });

  // Load safety settings from DB
  useEffect(() => {
    apiClient.get('/safety-settings')
      .then((res) => {
        const d = res.data;
        setSettings({
          notifyRedirect: d.notify_on_redirect ?? false,
          notifyReport: d.notify_on_report ?? true,
          weeklySummary: d.weekly_summary ?? true,
        });
      })
      .catch(() => {});
  }, []);

  // Save a toggle change to DB
  const handleToggle = async (key: 'notifyRedirect' | 'notifyReport' | 'weeklySummary') => {
    const newVal = !settings[key];
    setSettings((s) => ({ ...s, [key]: newVal }));

    const payload: Record<string, boolean> = {
      notify_on_redirect: key === 'notifyRedirect' ? newVal : settings.notifyRedirect,
      notify_on_report: key === 'notifyReport' ? newVal : settings.notifyReport,
      weekly_summary: key === 'weeklySummary' ? newVal : settings.weeklySummary,
    };

    try {
      await apiClient.put('/safety-settings', payload);
    } catch {
      // Revert on failure
      setSettings((s) => ({ ...s, [key]: !newVal }));
      toast.error('Failed to save setting');
    }
  };

  useEffect(() => {
    if (urlChildId) {
      setSelectedChildId(urlChildId);
    } else if (childProfiles.length > 0 && !selectedChildId) {
      setSelectedChildId(childProfiles[0].id);
    }
  }, [childProfiles, selectedChildId, urlChildId]);

  const selectedChild = childProfiles.find((c) => c.id === selectedChildId);

  // Data queries — fetch ALL reports for redirections section, plus unread for count
  const { data: safetyReports = [] } = useSafetyReports(user?.id, false);
  const { data: weeklySummary } = useWeeklySummary(selectedChildId || undefined);
  const { data: topicSettings } = useChildTopicSettings(selectedChildId || undefined);

  // Compute metrics
  const conversationsThisWeek = parseInt(String(weeklySummary?.total_messages ?? '0'), 10);
  const childReports = safetyReports.filter(
    (r: any) => !selectedChildId || r.child_profile_id === selectedChildId
  );
  const isTopicRedirect = (r: any) =>
    r.report_type === 'topic_redirect' || (!r.report_type && r.issue_summary?.includes('asked about:'));
  const redirectionsThisWeek = childReports.filter(isTopicRedirect).length;
  const unreadReports = childReports.filter((r: any) => !r.reviewed).length;

  const allTopics = topicSettings?.topics ?? [];
  const topicsBlocked = allTopics.filter((t) => !t.is_allowed).length;
  const totalTopics = allTopics.length;

  // If URL says ?tab=buddy, show the Luno settings panel instead
  const showBuddySettings = urlTab === 'buddy' && selectedChild;

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <LoadingState message="Loading safety dashboard..." />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 28, color: '#2A2926' }}>
            Safety
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#6B675E', marginTop: 4, maxWidth: 560 }}>
            Review safety reports, see how boundaries are working, and customise
            safety settings for each child.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedChildId || ''}
              onChange={(e) => setSelectedChildId(e.target.value)}
              className="appearance-none pr-8 pl-4 py-2 rounded-lg text-sm border bg-white cursor-pointer"
              style={{ borderColor: '#E8E6E1', color: '#6B675E', fontFamily: "'DM Sans', sans-serif" }}
            >
              {childProfiles.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: '#9B978E' }}
            />
          </div>
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition hover:-translate-y-0.5"
            style={{
              border: '2px solid #E8946A',
              color: '#E8946A',
              background: 'transparent',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <AlertCircle size={15} /> Report a Concern
          </button>
        </div>
      </div>

      {/* Tab switcher when on buddy settings */}
      {showBuddySettings && (
        <>
          <div
            className="flex gap-1 p-1 rounded-xl mb-6"
            style={{ background: '#F5F3EE', display: 'inline-flex' }}
          >
            <Link
              to={`/dashboard/safety${selectedChildId ? `?child=${selectedChildId}` : ''}`}
              className="px-5 py-2 rounded-lg text-sm transition no-underline"
              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 400, background: 'transparent', color: '#9B978E' }}
            >
              Safety Reports
            </Link>
            <span
              className="px-5 py-2 rounded-lg text-sm"
              style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, background: '#FFFFFF', color: '#2A2926', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
            >
              Luno Settings
            </span>
          </div>

          <div className="mb-10">
            <BuddySettingsPanel
              childId={selectedChild!.id}
              childName={selectedChild!.name}
            />
          </div>
        </>
      )}

      {/* Safety Overview */}
      {!showBuddySettings && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            {[
              {
                label: 'Conversations This Week',
                value: String(conversationsThisWeek),
                sub: 'all within boundaries',
                bg: '#E8F6F4',
              },
              {
                label: 'Redirections This Week',
                value: String(redirectionsThisWeek),
                sub: 'gentle redirects when curiosity crossed a boundary',
                bg: '#FDF6E8',
              },
              {
                label: 'Topics Blocked',
                value: String(topicsBlocked),
                sub: `of ${totalTopics} sub-topics restricted by you`,
                bg: '#F5F3EE',
              },
              {
                label: 'Safety Reports',
                value: unreadReports > 0 ? `${unreadReports} unread` : '0 unread',
                sub: unreadReports > 0 ? 'needs your attention' : 'all reviewed',
                bg: '#E8F6F4',
              },
            ].map((card, i) => (
              <div key={i} className="rounded-2xl p-5" style={{ background: card.bg }}>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#6B675E', marginBottom: 8 }}>{card.label}</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 28, fontWeight: 600, color: '#2A2926', lineHeight: 1.1 }}>{card.value}</p>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#9B978E', marginTop: 6, lineHeight: 1.4 }}>{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Recent Redirections */}
          <div className="mb-10">
            <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 20, fontWeight: 600, color: '#2A2926', marginBottom: 4 }}>
              Recent Redirections
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#9B978E', marginBottom: 20 }}>
              When your child's curiosity crossed a boundary, here's what happened
            </p>

            {childReports.filter((r: any) => isTopicRedirect(r) && !r.reviewed && !r.is_reviewed).length === 0 ? (
              <div
                className="bg-white rounded-xl border p-8 text-center"
                style={{ borderColor: '#E8E6E1' }}
              >
                <CheckCircle2 size={28} className="mx-auto mb-3" style={{ color: '#3ECDC6' }} />
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#9B978E' }}>
                  No redirections this week — all conversations stayed within boundaries.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {childReports
                  .filter((r: any) => isTopicRedirect(r) && !r.reviewed && !r.is_reviewed)
                  .slice(0, 10)
                  .map((r: any) => (
                    <div
                      key={r.id}
                      className="bg-white rounded-xl border p-5 relative"
                      style={{ borderColor: '#E8E6E1', borderLeft: '3px solid #D4A843' }}
                    >
                      {/* Mark as Reviewed — top right */}
                      <div className="absolute top-4 right-4">
                        <button
                          onClick={() => markReviewed.mutate({ reportId: r.id })}
                          disabled={markReviewed.isPending}
                          className="px-3 py-1 rounded-lg text-xs font-semibold border transition hover:bg-[#E8F6F4]"
                          style={{ borderColor: '#3ECDC6', color: '#3ECDC6', fontFamily: "'DM Sans', sans-serif" }}
                        >
                          Mark as Reviewed
                        </button>
                      </div>

                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#9B978E', marginBottom: 8 }}>
                        {new Date(r.created_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="pr-36" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: '#2A2926', fontWeight: 500, marginBottom: 8 }}>
                        {r.issue_summary}
                      </p>
                      {r.ai_analysis && (
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#6B675E', lineHeight: 1.6, marginBottom: 8 }}>
                          {r.ai_analysis}
                        </p>
                      )}
                      {r.message_excerpt && (
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#9B978E', marginBottom: 14 }}>
                          Topic boundary: {r.ai_analysis?.match(/Topic boundary: (.+)/)?.[1] || 'Restricted by parent'}
                        </p>
                      )}
                      <div className="flex items-center gap-3 flex-wrap">
                        <button
                          onClick={() => openConversation(r)}
                          disabled={convoLoading}
                          className="px-4 py-1.5 rounded-lg text-xs font-medium border transition hover:bg-gray-50"
                          style={{ borderColor: '#E8E6E1', color: '#6B675E', fontFamily: "'DM Sans', sans-serif" }}
                        >
                          {convoLoading ? 'Loading...' : 'View Full Conversation'}
                        </button>
                        <button
                          onClick={() => window.location.href = '/dashboard/topics'}
                          className="px-4 py-1.5 rounded-lg text-xs font-medium border transition hover:bg-teal-50"
                          style={{ borderColor: '#3ECDC6', color: '#3ECDC6', fontFamily: "'DM Sans', sans-serif" }}
                        >
                          Adjust This Boundary
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Safety Reports */}
          <div className="mb-10">
            <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 20, fontWeight: 600, color: '#2A2926', marginBottom: 4 }}>
              Safety Reports
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#9B978E', marginBottom: 16 }}>
              Generated when the AI detects content that may need your attention — beyond
              routine boundary redirections
            </p>

            {/* Info banner */}
            <div
              className="rounded-xl p-4 mb-5"
              style={{ background: '#F5F3EE', borderLeft: '3px solid #3ECDC6' }}
            >
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#6B675E', lineHeight: 1.6 }}>
                <strong>Redirections</strong> happen when curiosity crosses a topic boundary
                you've set — they're normal and handled automatically.{' '}
                <strong>Safety reports</strong> are generated for more sensitive situations,
                such as when a child expresses distress or asks about topics that may
                indicate they need support.
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: '#F5F3EE', display: 'inline-flex' }}>
              {(['Unread', 'All Reports'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setReportTab(tab)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    background: reportTab === tab ? '#FFFFFF' : 'transparent',
                    color: reportTab === tab ? '#2A2926' : '#9B978E',
                    boxShadow: reportTab === tab ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <SafetyReportsInline
              childId={selectedChild?.id}
              reports={childReports}
              filter={reportTab === 'Unread' ? 'unread' : 'all'}
              onViewConversation={openConversation}
            />
          </div>

          {/* Safety Settings */}
          <div className="mb-10">
            <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 20, fontWeight: 600, color: '#2A2926', marginBottom: 4 }}>
              Safety Settings
            </h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#9B978E', marginBottom: 16 }}>
              Global safety controls for {selectedChild?.name || 'your child'}
            </p>

            <div
              className="bg-white rounded-xl border divide-y divide-[#E8E6E1]"
              style={{ borderColor: '#E8E6E1' }}
            >
              {[
                {
                  key: 'notifyRedirect' as const,
                  label: 'Notify me when a boundary is redirected',
                  desc: 'Receive a dashboard notification each time Luno redirects a conversation',
                },
                {
                  key: 'notifyReport' as const,
                  label: 'Notify me when a safety report is generated',
                  desc: 'Receive an email alert for safety reports',
                },
                {
                  key: 'weeklySummary' as const,
                  label: 'Include safety summary in weekly email',
                  desc: 'A summary of redirections and reports in your weekly parent digest',
                },
              ].map((toggle) => (
                <div key={toggle.key} className="flex items-center justify-between p-5">
                  <div className="flex-1 mr-4">
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 500, color: '#2A2926' }}>
                      {toggle.label}
                    </p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#9B978E', marginTop: 2 }}>
                      {toggle.desc}
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggle(toggle.key)}
                    className="relative flex-shrink-0 rounded-full transition-colors duration-200 overflow-hidden"
                    style={{
                      minWidth: 44,
                      width: 44,
                      height: 24,
                      background: settings[toggle.key] ? '#3ECDC6' : '#E8E6E1',
                    }}
                  >
                    <span
                      className="absolute rounded-full bg-white shadow transition-transform duration-200"
                      style={{
                        width: 20,
                        height: 20,
                        top: 2,
                        left: 0,
                        transform: settings[toggle.key]
                          ? 'translateX(22px)'
                          : 'translateX(2px)',
                      }}
                    />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 mt-5">
              <Link
                to="/dashboard/topics"
                className="flex items-center gap-2 text-sm font-medium no-underline transition hover:underline"
                style={{ color: '#3ECDC6', fontFamily: "'DM Sans', sans-serif" }}
              >
                Manage topic boundaries <ExternalLink size={13} />
              </Link>
              <Link
                to={`/dashboard/safety?tab=buddy${selectedChildId ? `&child=${selectedChildId}` : ''}`}
                className="flex items-center gap-2 text-sm font-medium no-underline transition hover:underline"
                style={{ color: '#3ECDC6', fontFamily: "'DM Sans', sans-serif" }}
              >
                Adjust Luno's personality <ExternalLink size={13} />
              </Link>
            </div>
          </div>

          {/* Trust Links */}
          <div>
            <h2 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 600, color: '#2A2926', marginBottom: 16 }}>
              How Yoluno Keeps Children Safe
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: Shield,
                  title: 'Safety Charter',
                  desc: 'The rules that govern every interaction',
                  link: '/safety-charter',
                },
                {
                  icon: Eye,
                  title: 'How AI Works',
                  desc: "What the technology does and doesn't do",
                  link: '/how-ai-works',
                },
                {
                  icon: Mail,
                  title: 'Contact Safety Team',
                  desc: 'safety@yoluno.com — responses within 24 hours',
                  link: 'mailto:safety@yoluno.com',
                },
              ].map((card, i) => {
                const isExternal = card.link.startsWith('mailto:');
                const Wrapper = isExternal ? 'a' : Link;
                const wrapperProps = isExternal
                  ? { href: card.link }
                  : { to: card.link };
                return (
                  <Wrapper
                    key={i}
                    {...(wrapperProps as any)}
                    className="bg-white rounded-xl border p-5 no-underline transition hover:-translate-y-0.5 hover:shadow-md block"
                    style={{ borderColor: '#E8E6E1' }}
                  >
                    <card.icon size={20} style={{ color: '#3ECDC6', marginBottom: 10 }} />
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: '#2A2926', marginBottom: 4 }}>
                      {card.title}
                    </p>
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#9B978E', lineHeight: 1.5 }}>
                      {card.desc}
                    </p>
                  </Wrapper>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Read-only conversation viewer modal */}
      {viewingConvo && (
        <ConversationModal
          messages={viewingConvo.messages}
          childName={viewingConvo.childName}
          sessionTitle={viewingConvo.sessionTitle}
          highlightMessageId={viewingConvo.highlightMessageId}
          onClose={() => setViewingConvo(null)}
        />
      )}
    </div>
  );
}
