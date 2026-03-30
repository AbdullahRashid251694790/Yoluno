/**
 * Voice Description Wizard
 *
 * Multi-step wizard for adding family members via voice description.
 * Step 1: Optional photo upload + voice recording
 * Step 2: Review extracted data and confirm
 */

import { useState, useCallback } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Check, Mic, Square, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { PhotoUpload } from './PhotoUpload';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { whisperService } from '@/services/whisper';
import { extractFromDescription, type ExtractedFamilyData } from '@/services/family';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VoiceDescriptionWizardProps {
  onComplete: (data: ExtractedFamilyData & { photoFile: File | null }) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

type Step = 'describe' | 'review';

const RELATIONSHIP_OPTIONS = [
  { value: 'parent', label: 'Parent' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'aunt_uncle', label: 'Aunt/Uncle' },
  { value: 'cousin', label: 'Cousin' },
  { value: 'other', label: 'Other' },
];

export function VoiceDescriptionWizard({
  onComplete,
  onCancel,
  isSubmitting = false,
}: VoiceDescriptionWizardProps) {
  const [step, setStep] = useState<Step>('describe');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [transcription, setTranscription] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedFamilyData | null>(null);

  // Editable form state (for review step)
  const [formData, setFormData] = useState<ExtractedFamilyData>({
    name: '',
    relationship: 'other',
    occupation: null,
    hobbies: [],
    funFacts: null,
    connectionDescription: null,
    isLiving: true,
  });
  const [hobbiesInput, setHobbiesInput] = useState('');

  const handleRecordingComplete = useCallback(async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const result = await whisperService.transcribe(blob, { format: 'webm' });
      const newText = transcription ? `${transcription} ${result.text}` : result.text;
      setTranscription(newText);
      toast.success('Voice transcribed successfully');
    } catch (error) {
      console.error('Transcription error:', error);
      toast.error('Failed to transcribe voice. Please try again.');
    } finally {
      setIsTranscribing(false);
    }
  }, [transcription]);

  const {
    isRecording,
    duration,
    startRecording,
    stopRecording,
    reset: resetRecorder,
  } = useAudioRecorder({
    onRecordingComplete: handleRecordingComplete,
    onError: (err) => {
      toast.error(err.message || 'Microphone access denied');
    },
    maxDuration: 120000, // 2 minutes max
  });

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClearTranscription = () => {
    setTranscription('');
    resetRecorder();
  };

  const handleContinue = async () => {
    if (!transcription.trim()) {
      toast.error('Please record a voice description first');
      return;
    }

    setIsExtracting(true);
    try {
      const data = await extractFromDescription(transcription);
      setExtractedData(data);
      setFormData(data);
      setHobbiesInput(data.hobbies.join(', '));
      setStep('review');
    } catch (error) {
      console.error('Extraction error:', error);
      toast.error('Failed to extract information. Please try again.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleBack = () => {
    setStep('describe');
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    // Parse hobbies from comma-separated input
    const hobbies = hobbiesInput
      .split(',')
      .map((h) => h.trim())
      .filter(Boolean);

    onComplete({
      ...formData,
      hobbies,
      photoFile,
    });
  };

  const updateFormData = (field: keyof ExtractedFamilyData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isProcessing = isTranscribing || isExtracting;

  return (
    <div className="space-y-6">
      {step === 'describe' && (
        <>
          {/* Photo Upload (Optional) */}
          <div className="space-y-2">
            <Label>Photo (optional)</Label>
            <PhotoUpload
              onChange={setPhotoFile}
              disabled={isProcessing}
            />
          </div>

          {/* Voice Recording */}
          <div className="space-y-3">
            <Label>Describe this person</Label>
            <p className="text-body-sm text-muted-foreground">
              Tell us about this family member: their name, how they're related to your child,
              what they do, their hobbies, and any fun facts.
            </p>

            {/* Recording Controls */}
            <div className="flex items-center gap-2">
              {!isRecording ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={startRecording}
                  disabled={isProcessing}
                  className="gap-2"
                >
                  <Mic className="h-4 w-4" />
                  {transcription ? 'Add More' : 'Start Recording'}
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={stopRecording}
                  className="gap-2 animate-pulse"
                >
                  <Square className="h-4 w-4" />
                  Stop ({formatDuration(duration)})
                </Button>
              )}

              {isTranscribing && (
                <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Transcribing...
                </div>
              )}

              {transcription && !isRecording && !isTranscribing && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearTranscription}
                  className="gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>

            {/* Recording Status */}
            {isRecording && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
                <div className="h-3 w-3 bg-destructive rounded-full animate-pulse" />
                <span className="text-body-sm font-medium">Recording... Speak now</span>
              </div>
            )}

            {/* Transcription Display */}
            {transcription && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-body-sm">{transcription}</p>
              </div>
            )}

            {!transcription && !isRecording && (
              <div className="p-4 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center text-muted-foreground">
                <p className="text-body-sm">
                  Example: "This is my dad, John. He's a software engineer who loves fishing
                  and hiking. He makes the best pancakes on weekends!"
                </p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleContinue}
              disabled={!transcription.trim() || isProcessing}
              className="gap-2"
            >
              {isExtracting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Extracting...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </>
      )}

      {step === 'review' && (
        <>
          <div className="flex items-start gap-4">
            {/* Photo Preview */}
            {photoFile && (
              <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                <img
                  src={URL.createObjectURL(photoFile)}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Form Fields */}
            <div className="flex-1 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateFormData('name', e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="relationship">Relationship *</Label>
                  <Select
                    value={formData.relationship}
                    onValueChange={(value) => updateFormData('relationship', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="relationship">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATIONSHIP_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="connectionDescription">Connection to child</Label>
                <Input
                  id="connectionDescription"
                  value={formData.connectionDescription || ''}
                  onChange={(e) => updateFormData('connectionDescription', e.target.value || null)}
                  placeholder="e.g., Dad's sister, Mom's father"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="occupation">Occupation</Label>
                <Input
                  id="occupation"
                  value={formData.occupation || ''}
                  onChange={(e) => updateFormData('occupation', e.target.value || null)}
                  placeholder="e.g., Teacher, Engineer"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="hobbies">Hobbies (comma-separated)</Label>
                <Input
                  id="hobbies"
                  value={hobbiesInput}
                  onChange={(e) => setHobbiesInput(e.target.value)}
                  placeholder="e.g., Fishing, Hiking, Cooking"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="funFacts">Fun facts</Label>
                <Textarea
                  id="funFacts"
                  value={formData.funFacts || ''}
                  onChange={(e) => updateFormData('funFacts', e.target.value || null)}
                  placeholder="Any interesting stories or facts..."
                  rows={2}
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="isLiving"
                  checked={formData.isLiving}
                  onCheckedChange={(checked) => updateFormData('isLiving', checked === true)}
                  disabled={isSubmitting}
                />
                <Label htmlFor="isLiving" className="cursor-pointer">Currently living</Label>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={isSubmitting}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.name.trim()}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Add to Family Tree
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
