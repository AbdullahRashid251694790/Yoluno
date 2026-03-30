/**
 * Safety Reports Panel Component
 *
 * Displays safety reports for parent review with filtering and actions.
 */

import { useState } from 'react';
import { useSafetyReports, useMarkSafetyReportReviewed } from '@/hooks/queries/useBuddyChat';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { EmptyState } from '@/components/shared/feedback/EmptyState';
import { LoadingSpinner } from '@/components/shared/feedback/LoadingState';
import { formatRelativeTime } from '@/lib/utils';
import { AlertTriangle, CheckCircle, Clock, MessageSquare } from 'lucide-react';
import type { SafetyReport } from '@/services/buddyChat';

export function SafetyReportsPanel() {
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState<SafetyReport | null>(null);
  const [notes, setNotes] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('unread');

  // Fetch reports based on filter
  const { data: reports = [], isLoading } = useSafetyReports(
    user?.id,
    filter === 'unread'
  );

  // Mark as reviewed mutation
  const { mutate: markReviewed, isPending: isMarking } = useMarkSafetyReportReviewed();

  const handleReview = (report: SafetyReport) => {
    setSelectedReport(report);
    setNotes('');
  };

  const handleMarkReviewed = () => {
    if (!selectedReport) return;

    markReviewed(
      {
        reportId: selectedReport.id,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          setSelectedReport(null);
          setNotes('');
        },
      }
    );
  };

  const getSeverityColor = (severity: 'yellow' | 'red') => {
    return severity === 'red' ? 'destructive' : 'warning';
  };

  const getSeverityIcon = (severity: 'yellow' | 'red') => {
    return severity === 'red' ? AlertTriangle : Clock;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Safety Reports</CardTitle>
          <CardDescription>Loading reports...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" className="text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const unreadCount = reports.filter((r) => !r.reviewed).length;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Safety Reports
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount} new
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Monitor conversations for safety concerns
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
            <TabsList className="mb-4">
              <TabsTrigger value="unread">
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </TabsTrigger>
              <TabsTrigger value="all">All Reports</TabsTrigger>
            </TabsList>

            <TabsContent value={filter}>
              <ScrollArea className="h-[500px] pr-4">
                {reports.length === 0 ? (
                  <EmptyState
                    icon={filter === 'unread' ? CheckCircle : MessageSquare}
                    title={
                      filter === 'unread'
                        ? 'No unread reports'
                        : 'No safety reports yet'
                    }
                    description={
                      filter === 'unread'
                        ? 'All reports have been reviewed'
                        : 'Safety reports will appear here when conversations are flagged'
                    }
                    className="py-12"
                  />
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => {
                      const SeverityIcon = getSeverityIcon(report.severity);

                      return (
                        <Card
                          key={report.id}
                          className={
                            !report.reviewed ? 'border-l-4 border-l-destructive' : ''
                          }
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <SeverityIcon className="h-4 w-4 text-destructive" />
                                  <Badge variant={getSeverityColor(report.severity)}>
                                    {report.severity.toUpperCase()}
                                  </Badge>
                                  {report.report_type === 'real_time' && (
                                    <Badge variant="outline">Real-time Alert</Badge>
                                  )}
                                  {!report.reviewed && (
                                    <Badge variant="secondary">Unread</Badge>
                                  )}
                                </div>

                                <h4 className="font-semibold">{report.issue_summary}</h4>

                                {report.message_excerpt && (
                                  <Alert>
                                    <MessageSquare className="h-4 w-4" />
                                    <AlertDescription className="text-body-sm">
                                      "{report.message_excerpt}"
                                    </AlertDescription>
                                  </Alert>
                                )}

                                {report.ai_analysis && (
                                  <p className="text-body-sm text-muted-foreground">
                                    {report.ai_analysis}
                                  </p>
                                )}

                                <div className="flex items-center gap-4 text-caption text-muted-foreground">
                                  <span>
                                    {formatRelativeTime(report.created_at)}
                                  </span>
                                  {report.reviewed && report.reviewed_at && (
                                    <span className="flex items-center gap-1">
                                      <CheckCircle className="h-3 w-3" />
                                      Reviewed {formatRelativeTime(report.reviewed_at)}
                                    </span>
                                  )}
                                </div>

                                {report.parent_notes && (
                                  <div className="mt-2 rounded-md bg-muted p-2">
                                    <p className="text-body-sm">
                                      <strong>Your notes:</strong> {report.parent_notes}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {!report.reviewed && (
                                <Button
                                  size="sm"
                                  onClick={() => handleReview(report)}
                                >
                                  Review
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog
        open={!!selectedReport}
        onOpenChange={(open) => !open && setSelectedReport(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Safety Report</DialogTitle>
            <DialogDescription>
              Mark this report as reviewed and optionally add notes.
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{selectedReport.issue_summary}</strong>
                </AlertDescription>
              </Alert>

              {selectedReport.message_excerpt && (
                <div>
                  <label className="text-body-sm font-medium">Message:</label>
                  <p className="mt-1 rounded-md bg-muted p-3 text-body-sm">
                    "{selectedReport.message_excerpt}"
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="notes" className="text-body-sm font-medium">
                  Notes (optional):
                </label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about how you addressed this concern..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedReport(null)}
              disabled={isMarking}
            >
              Cancel
            </Button>
            <Button onClick={handleMarkReviewed} disabled={isMarking}>
              {isMarking ? 'Marking...' : 'Mark as Reviewed'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
