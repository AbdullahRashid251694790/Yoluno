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
        'relative w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-amber-50 to-orange-50',
        'flex flex-col transition-opacity duration-300',
        isActive ? 'opacity-100' : 'opacity-0'
      )}
    >
      {/* Illustration area (top 60%) */}
      <div className="relative flex-[3] bg-gradient-to-b from-blue-100 to-purple-100 overflow-hidden">
        {page.illustration_status === 'completed' && illustrationUrl ? (
          <img
            src={illustrationUrl}
            alt={`Illustration for page ${pageNumber}`}
            className="w-full h-full object-cover"
          />
        ) : page.illustration_status === 'generating' || page.illustration_status === 'pending' ? (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-200 to-pink-200">
            <div className="text-center text-purple-600">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-2" />
              <p className="text-sm">Creating illustration...</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300">
            <div className="text-center text-gray-500">
              <ImageOff className="h-12 w-12 mx-auto mb-2" />
              <p className="text-sm">Illustration unavailable</p>
            </div>
          </div>
        )}

        {/* Page number badge */}
        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-gray-700">
          {pageNumber} / {totalPages}
        </div>
      </div>

      {/* Text area (bottom 40%) */}
      <div className="flex-[2] p-6 md:p-8 flex items-center justify-center bg-gradient-to-b from-amber-50/50 to-amber-100/50">
        <p className="text-lg md:text-xl lg:text-2xl leading-relaxed text-gray-800 font-serif text-center max-w-prose">
          {page.content}
        </p>
      </div>

      {/* Decorative book spine effect */}
      <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/10 to-transparent" />

      {/* Page edge effect */}
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-l from-black/5 to-transparent" />
    </div>
  );
}
