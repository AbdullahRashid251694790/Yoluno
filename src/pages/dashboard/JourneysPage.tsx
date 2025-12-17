/**
 * Journeys Page
 *
 * Page for tracking learning journeys.
 */

import { EmptyState } from '@/components/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Map } from 'lucide-react';

export function JourneysPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Learning Journeys</h1>
        <p className="text-muted-foreground mt-1">
          Track learning progress and habit-building journeys.
        </p>
      </div>

      <Card>
        <CardContent className="py-12">
          <EmptyState
            icon={Map}
            title="No journeys yet"
            description="Learning journeys will appear here when your children start them."
          />
        </CardContent>
      </Card>
    </div>
  );
}
