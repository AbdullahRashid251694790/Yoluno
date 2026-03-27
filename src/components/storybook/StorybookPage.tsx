/**
 * StorybookPage Component
 *
 * Single page of the storybook with illustration and text.
 */

import { Loader2, ImageOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getUploadUrl } from '@/integrations/api/client';
import type { StoryPage } from '@/services/storyPages';

interface StorybookPageProps {
  page: StoryPage;
  pageNumber: number;
  totalPages: number;
  isActive: boolean;
}

export function StorybookPage({
  page,
  pageNumber,
  totalPages,
  isActive,
}: StorybookPageProps) {
  const illustrationUrl = page.illustration_url
    ? getUploadUrl(page.illustration_url)
    : null;

  return (
    <div
      className={cn(
        'relative w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-b from-primary/10 to-primary/10',
        'transition-opacity duration-300',
        isActive ? 'opacity-100' : 'opacity-0'
      )}
    >
      {/* Page number badge */}
      <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-foreground/70 z-10">
        {pageNumber} / {totalPages}
      </div>

      {/* Vertically centered content: image + text stacked */}
      <div className="w-full h-full overflow-y-auto flex flex-col justify-center">
        {/* Illustration */}
        {page.illustration_status === 'completed' && illustrationUrl ? (
          <img
            src={illustrationUrl}
            alt={`Illustration for page ${pageNumber}`}
            className="w-full"
          />
        ) : page.illustration_status === 'generating' || page.illustration_status === 'pending' ? (
          <div className="w-full aspect-square flex items-center justify-center bg-gradient-to-br from-primary/20 to-lolo/10">
            <div className="text-center text-primary">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-2" />
              <p className="text-sm">Creating illustration...</p>
            </div>
          </div>
        ) : (
          <div className="w-full aspect-square flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/30">
            <div className="text-center text-muted-foreground">
              <ImageOff className="h-12 w-12 mx-auto mb-2" />
              <p className="text-sm">Illustration unavailable</p>
            </div>
          </div>
        )}

        {/* Text directly below image */}
        <div className="px-4 py-3 md:px-6 md:py-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl p-3 md:p-4 shadow-lg max-w-prose mx-auto">
            <p className="text-sm md:text-base lg:text-lg leading-relaxed text-foreground font-serif text-center">
              {page.content}
            </p>
          </div>
        </div>
      </div>

      {/* Decorative book spine effect */}
      <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/10 to-transparent z-10" />

      {/* Page edge effect */}
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-l from-black/5 to-transparent z-10" />
    </div>
  );
}
