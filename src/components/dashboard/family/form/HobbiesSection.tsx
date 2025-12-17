/**
 * Hobbies Section
 *
 * Form section for managing family member hobbies.
 */

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const HOBBY_SUGGESTIONS = [
  'Reading',
  'Cooking',
  'Gardening',
  'Sports',
  'Music',
  'Art',
  'Travel',
  'Photography',
  'Gaming',
  'Hiking',
  'Fishing',
  'Crafts',
];

const MAX_HOBBIES = 20;

interface HobbiesSectionProps {
  hobbies: string[];
  onHobbiesChange: (hobbies: string[]) => void;
  isLoading: boolean;
}

export function HobbiesSection({
  hobbies,
  onHobbiesChange,
  isLoading,
}: HobbiesSectionProps) {
  const [hobbyInput, setHobbyInput] = useState('');

  const addHobby = (hobby: string) => {
    const trimmed = hobby.trim();
    if (trimmed && !hobbies.includes(trimmed) && hobbies.length < MAX_HOBBIES) {
      onHobbiesChange([...hobbies, trimmed]);
    }
    setHobbyInput('');
  };

  const removeHobby = (hobby: string) => {
    onHobbiesChange(hobbies.filter((h) => h !== hobby));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
        Hobbies & Interests
      </h3>

      <div className="space-y-2">
        <Label>Add hobbies</Label>
        <div className="flex gap-2">
          <Input
            value={hobbyInput}
            onChange={(e) => setHobbyInput(e.target.value)}
            placeholder="Type a hobby..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addHobby(hobbyInput);
              }
            }}
            disabled={isLoading || hobbies.length >= MAX_HOBBIES}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => addHobby(hobbyInput)}
            disabled={isLoading || !hobbyInput.trim() || hobbies.length >= MAX_HOBBIES}
          >
            Add
          </Button>
        </div>

        {/* Hobby Suggestions */}
        <div className="flex flex-wrap gap-1">
          {HOBBY_SUGGESTIONS.filter((h) => !hobbies.includes(h)).map((hobby) => (
            <Badge
              key={hobby}
              variant="outline"
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
              onClick={() => addHobby(hobby)}
            >
              + {hobby}
            </Badge>
          ))}
        </div>

        {/* Selected Hobbies */}
        {hobbies.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {hobbies.map((hobby) => (
              <Badge key={hobby} variant="secondary" className="gap-1">
                {hobby}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeHobby(hobby)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
