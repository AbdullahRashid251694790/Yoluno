/**
 * PIN Input Grid Component
 *
 * A kid-friendly 4-digit PIN input with visual feedback.
 * Designed for touch interaction with large buttons.
 */

import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Delete } from 'lucide-react';

interface PINInputGridProps {
  onComplete: (pin: string) => void;
  onPinChange?: (pin: string) => void;
  error?: string | null;
  disabled?: boolean;
  className?: string;
}

export function PINInputGrid({
  onComplete,
  onPinChange,
  error,
  disabled = false,
  className,
}: PINInputGridProps) {
  const [pin, setPin] = useState<string>('');

  // Reset PIN when error changes (new attempt)
  useEffect(() => {
    if (error) {
      // Shake animation then clear after delay
      const timer = setTimeout(() => {
        setPin('');
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleDigitPress = useCallback(
    (digit: string) => {
      if (disabled || pin.length >= 4) return;

      const newPin = pin + digit;
      setPin(newPin);
      onPinChange?.(newPin);

      if (newPin.length === 4) {
        onComplete(newPin);
      }
    },
    [pin, disabled, onComplete, onPinChange]
  );

  const handleBackspace = useCallback(() => {
    if (disabled || pin.length === 0) return;
    const newPin = pin.slice(0, -1);
    setPin(newPin);
    onPinChange?.(newPin);
  }, [pin, disabled, onPinChange]);

  const handleClear = useCallback(() => {
    setPin('');
    onPinChange?.('');
  }, [onPinChange]);

  // Number pad layout
  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'];

  return (
    <div className={cn('flex flex-col items-center gap-6', className)}>
      {/* PIN Dots Display */}
      <div className="flex gap-4">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={cn(
              'w-4 h-4 rounded-full transition-all duration-200',
              pin.length > index
                ? error
                  ? 'bg-destructive scale-110 animate-shake'
                  : 'bg-primary scale-110'
                : 'bg-muted border-2 border-muted-foreground/30'
            )}
          />
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-body-sm text-destructive font-medium animate-in fade-in">
          {error}
        </p>
      )}

      {/* Number Pad */}
      <div className="grid grid-cols-3 gap-3 max-w-xs">
        {digits.map((digit, index) => {
          if (digit === '') {
            return <div key={index} className="w-16 h-16" />;
          }

          if (digit === 'delete') {
            return (
              <Button
                key={index}
                variant="ghost"
                size="lg"
                className="w-16 h-16 rounded-full text-muted-foreground hover:bg-muted"
                onClick={handleBackspace}
                disabled={disabled || pin.length === 0}
                type="button"
              >
                <Delete className="h-6 w-6" />
              </Button>
            );
          }

          return (
            <Button
              key={index}
              variant="outline"
              size="lg"
              className={cn(
                'w-16 h-16 rounded-full text-h4 font-bold',
                'hover:bg-primary hover:text-primary-foreground hover:scale-105',
                'active:scale-95 transition-all duration-150',
                'touch-target-kids'
              )}
              onClick={() => handleDigitPress(digit)}
              disabled={disabled}
              type="button"
            >
              {digit}
            </Button>
          );
        })}
      </div>

      {/* Clear button */}
      {pin.length > 0 && !disabled && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={handleClear}
          type="button"
        >
          Clear
        </Button>
      )}
    </div>
  );
}
