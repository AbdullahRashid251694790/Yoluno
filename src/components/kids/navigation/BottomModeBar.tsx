/**
 * Bottom Mode Bar Component
 *
 * Mobile-friendly bottom navigation for Kids Mode.
 * Switches between different activity modes (chat, stories, journeys, learning).
 */

import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  MessageCircle,
  BookOpen,
  Map,
  GraduationCap,
  Home,
  type LucideIcon,
} from 'lucide-react';

interface ModeConfig {
  key: string;
  label: string;
  icon: LucideIcon;
  path: string;
  color: string;
  activeColor: string;
}

const MODES: ModeConfig[] = [
  {
    key: 'home',
    label: 'Home',
    icon: Home,
    path: '',
    color: 'text-gray-500',
    activeColor: 'text-primary bg-primary/10',
  },
  {
    key: 'chat',
    label: 'Chat',
    icon: MessageCircle,
    path: '/chat',
    color: 'text-gray-500',
    activeColor: 'text-blue-600 bg-blue-100',
  },
  {
    key: 'stories',
    label: 'Stories',
    icon: BookOpen,
    path: '/stories',
    color: 'text-gray-500',
    activeColor: 'text-purple-600 bg-purple-100',
  },
  {
    key: 'journeys',
    label: 'Journeys',
    icon: Map,
    path: '/journeys',
    color: 'text-gray-500',
    activeColor: 'text-green-600 bg-green-100',
  },
  {
    key: 'learning',
    label: 'Learn',
    icon: GraduationCap,
    path: '/learning',
    color: 'text-gray-500',
    activeColor: 'text-orange-600 bg-orange-100',
  },
];

interface BottomModeBarProps {
  className?: string;
}

export function BottomModeBar({ className }: BottomModeBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { childId } = useParams<{ childId: string }>();

  if (!childId) return null;

  const basePath = `/kids/${childId}`;

  // Determine active mode from current path
  const getActiveMode = (): string => {
    const currentPath = location.pathname;

    // Check specific modes first
    for (const mode of MODES) {
      if (mode.path && currentPath.includes(`${basePath}${mode.path}`)) {
        return mode.key;
      }
    }

    // Default to home if on base path
    if (currentPath === basePath || currentPath === `${basePath}/`) {
      return 'home';
    }

    return 'home';
  };

  const activeMode = getActiveMode();

  const handleModeClick = (mode: ModeConfig) => {
    const targetPath = `${basePath}${mode.path}`;
    navigate(targetPath);
  };

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-white/95 backdrop-blur-lg border-t border-gray-200',
        'safe-area-inset-bottom',
        className
      )}
    >
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-2">
        {MODES.map((mode) => {
          const Icon = mode.icon;
          const isActive = activeMode === mode.key;

          return (
            <button
              key={mode.key}
              onClick={() => handleModeClick(mode)}
              className={cn(
                'flex flex-col items-center justify-center',
                'w-14 h-14 rounded-2xl transition-all duration-200',
                'touch-target-kids',
                isActive ? mode.activeColor : 'text-gray-500 hover:bg-gray-100'
              )}
            >
              <Icon
                className={cn(
                  'h-6 w-6 transition-transform',
                  isActive && 'scale-110'
                )}
              />
              <span
                className={cn(
                  'text-[10px] font-medium mt-0.5',
                  isActive ? 'font-bold' : 'font-normal'
                )}
              >
                {mode.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
