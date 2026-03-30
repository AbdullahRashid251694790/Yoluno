/**
 * StorybookNavigation Component
 *
 * Page navigation controls with arrows and page dots.
 */

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface StorybookNavigationProps {
  currentPage: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
  onGoToPage: (page: number) => void;
}

export function StorybookNavigation({
  currentPage,
  totalPages,
  onPrevious,
  onNext,
  onGoToPage,
}: StorybookNavigationProps) {
  // Show max 7 page dots, with current page in center when possible
  const getVisibleDots = () => {
    const maxDots = 7;
    if (totalPages <= maxDots) {
      return Array.from({ length: totalPages }, (_, i) => i);
    }

    const halfDots = Math.floor(maxDots / 2);
    let start = currentPage - halfDots;
    let end = currentPage + halfDots;

    if (start < 0) {
      start = 0;
      end = maxDots - 1;
    } else if (end >= totalPages) {
      end = totalPages - 1;
      start = totalPages - maxDots;
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const visibleDots = getVisibleDots();

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Previous button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onPrevious}
        disabled={currentPage === 0}
        className={cn(
          'rounded-full bg-white/20 hover:bg-white/30 text-white',
          'disabled:opacity-30 disabled:cursor-not-allowed'
        )}
      >
        <ChevronLeft className="h-6 w-6" />
      </Button>

      {/* Page dots */}
      <div className="flex items-center gap-2">
        {visibleDots[0] > 0 && (
          <>
            <button
              onClick={() => onGoToPage(0)}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                currentPage === 0
                  ? 'w-4 bg-white'
                  : 'bg-white/40 hover:bg-white/60'
              )}
              aria-label="Go to cover"
            />
            {visibleDots[0] > 1 && (
              <span className="text-white/40 text-caption">...</span>
            )}
          </>
        )}

        {visibleDots.map((pageIndex) => (
          <button
            key={pageIndex}
            onClick={() => onGoToPage(pageIndex)}
            className={cn(
              'w-2 h-2 rounded-full transition-all',
              currentPage === pageIndex
                ? 'w-4 bg-white'
                : 'bg-white/40 hover:bg-white/60'
            )}
            aria-label={`Go to page ${pageIndex === 0 ? 'cover' : pageIndex}`}
          />
        ))}

        {visibleDots[visibleDots.length - 1] < totalPages - 1 && (
          <>
            {visibleDots[visibleDots.length - 1] < totalPages - 2 && (
              <span className="text-white/40 text-caption">...</span>
            )}
            <button
              onClick={() => onGoToPage(totalPages - 1)}
              className={cn(
                'w-2 h-2 rounded-full transition-all',
                currentPage === totalPages - 1
                  ? 'w-4 bg-white'
                  : 'bg-white/40 hover:bg-white/60'
              )}
              aria-label="Go to last page"
            />
          </>
        )}
      </div>

      {/* Next button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onNext}
        disabled={currentPage === totalPages - 1}
        className={cn(
          'rounded-full bg-white/20 hover:bg-white/30 text-white',
          'disabled:opacity-30 disabled:cursor-not-allowed'
        )}
      >
        <ChevronRight className="h-6 w-6" />
      </Button>
    </div>
  );
}
