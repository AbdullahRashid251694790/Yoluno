/**
 * Stories Page
 *
 * Page for viewing and managing stories.
 */

import { EmptyState } from '@/components/shared';
import { Card, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

export function StoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Stories</h1>
        <p className="text-muted-foreground mt-1">
          View and manage stories created for your children.
        </p>
      </div>

      <Card>
        <CardContent className="py-12">
          <EmptyState
            icon={BookOpen}
            title="No stories yet"
            description="Stories created with your children will appear here."
          />
        </CardContent>
      </Card>
    </div>
  );
}
