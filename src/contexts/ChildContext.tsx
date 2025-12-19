/**
 * Child Context
 *
 * Provides active child profile state for kids mode.
 * Includes mode switching and real PIN verification.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type { ChildProfileRow } from '@/types/database';
import { childProfilesService } from '@/services/childProfiles';
import { pinService } from '@/services/pin';

// Kids mode activity modes
export type KidsMode = 'home' | 'chat' | 'stories' | 'journeys' | 'learning';

interface ChildContextValue {
  activeChild: ChildProfileRow | null;
  isKidsMode: boolean;
  activeMode: KidsMode;
  setActiveChild: (child: ChildProfileRow | null) => void;
  enterKidsMode: (child: ChildProfileRow) => void;
  exitKidsMode: () => void;
  setActiveMode: (mode: KidsMode) => void;
  verifyPin: (childId: string, pin: string) => Promise<boolean>;
}

const ChildContext = createContext<ChildContextValue | null>(null);

const STORAGE_KEY = 'yoluno_active_child';

interface ChildProviderProps {
  children: ReactNode;
}

export function ChildProvider({ children }: ChildProviderProps) {
  const [activeChild, setActiveChildState] = useState<ChildProfileRow | null>(null);
  const [isKidsMode, setIsKidsMode] = useState(false);
  const [activeMode, setActiveModeState] = useState<KidsMode>('home');

  // Restore active child from storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const { childId, isKidsMode: storedKidsMode } = JSON.parse(stored);
        if (childId) {
          childProfilesService.getById(childId).then((child) => {
            if (child) {
              setActiveChildState(child);
              setIsKidsMode(storedKidsMode);
            }
          });
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const setActiveChild = useCallback((child: ChildProfileRow | null) => {
    setActiveChildState(child);
    if (child) {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ childId: child.id, isKidsMode })
      );
      childProfilesService.updateLastActive(child.id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [isKidsMode]);

  const enterKidsMode = useCallback((child: ChildProfileRow) => {
    setActiveChildState(child);
    setIsKidsMode(true);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ childId: child.id, isKidsMode: true })
    );
    childProfilesService.updateLastActive(child.id);
  }, []);

  const exitKidsMode = useCallback(() => {
    setActiveChildState(null);
    setIsKidsMode(false);
    setActiveModeState('home');
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const setActiveMode = useCallback((mode: KidsMode) => {
    setActiveModeState(mode);
  }, []);

  const verifyPin = useCallback(async (childId: string, pin: string): Promise<boolean> => {
    try {
      // Use the real PIN verification service - no fallback
      const result = await pinService.verify(childId, pin);
      return result.verified;
    } catch {
      // PIN verification failed - return false, no fallback
      return false;
    }
  }, []);

  const value: ChildContextValue = {
    activeChild,
    isKidsMode,
    activeMode,
    setActiveChild,
    enterKidsMode,
    exitKidsMode,
    setActiveMode,
    verifyPin,
  };

  return <ChildContext.Provider value={value}>{children}</ChildContext.Provider>;
}

export function useChild(): ChildContextValue {
  const context = useContext(ChildContext);

  if (!context) {
    throw new Error('useChild must be used within a ChildProvider');
  }

  return context;
}

export function useActiveChild(): ChildProfileRow | null {
  const { activeChild } = useChild();
  return activeChild;
}

export function useIsKidsMode(): boolean {
  const { isKidsMode } = useChild();
  return isKidsMode;
}

export function useActiveMode(): KidsMode {
  const { activeMode } = useChild();
  return activeMode;
}
