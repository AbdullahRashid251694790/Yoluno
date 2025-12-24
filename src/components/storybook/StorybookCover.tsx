/**
 * StorybookCover Component
 *
 * Cover page for the storybook with title and cover illustration.
 */

import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StorybookCoverProps {
  title: string;
  coverImageUrl?: string;
  theme?: string | null;
  mood?: string | null;
  onStart: () => void;
}

export function StorybookCover({
  title,
  coverImageUrl,
  theme,
  mood,
  onStart,
}: StorybookCoverProps) {
  return (
    <div
      className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl cursor-pointer group"
      onClick={onStart}
    >
      {/* Background */}
      {coverImageUrl ? (
        <img
          src={coverImageUrl}
          alt={`Cover for ${title}`}
          className="absolute inset-0 w-full h-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400" />
      )}

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {/* Content */}
      <div className="relative h-full flex flex-col justify-end p-4 md:p-8 pb-6 md:pb-10">
        {/* Theme/Mood badges */}
        <div className="flex flex-wrap gap-2 mb-3">
          {theme && (
            <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs capitalize">
              {theme}
            </span>
          )}
          {mood && (
            <span className="px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs capitalize">
              {mood}
            </span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-4xl font-display font-bold text-white leading-tight mb-4 drop-shadow-lg line-clamp-3">
          {title}
        </h1>

        {/* Tap to start prompt */}
        <div className="flex items-center gap-2 text-white/80 group-hover:text-white transition-colors">
          <Sparkles className="h-4 w-4 animate-pulse" />
          <span className="text-sm md:text-base">Tap to begin reading</span>
        </div>
      </div>

      {/* Decorative book spine effect */}
      <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-black/30 to-transparent" />
    </div>
  );
}
