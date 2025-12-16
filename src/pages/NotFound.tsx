/**
 * Not Found Page
 *
 * 404 error page.
 */

import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-pastel-blue to-white p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-cyan/20">404</h1>
        <h2 className="mt-4 text-2xl font-semibold text-charcoal">Page not found</h2>
        <p className="mt-2 text-charcoal-muted">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
          <Link to="/">
            <Button>
              <Home className="mr-2 h-4 w-4" />
              Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
