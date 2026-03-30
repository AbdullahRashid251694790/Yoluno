/**
 * Journey Reminder Settings Panel
 *
 * Parent dashboard panel for configuring journey reminders.
 */

import { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useReminderSettings, useUpdateReminderSettings } from '@/hooks/queries/useJourneyReminders';
import { Loader2, Bell, Clock, MessageCircle, Save } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import type { ReminderSettingsUpdate } from '@/services/journeyReminders';

interface JourneyReminderSettingsPanelProps {
  childId: string;
  childName: string;
}

const INTERVAL_OPTIONS = [
  { value: 4, label: '4 hours' },
  { value: 8, label: '8 hours' },
  { value: 12, label: '12 hours' },
  { value: 24, label: '1 day' },
  { value: 48, label: '2 days' },
];

const TONE_OPTIONS = [
  { value: 'encouraging', label: 'Encouraging', description: 'Positive and motivating' },
  { value: 'playful', label: 'Playful', description: 'Fun and light-hearted' },
  { value: 'gentle', label: 'Gentle', description: 'Soft and supportive' },
];

export function JourneyReminderSettingsPanel({
  childId,
  childName,
}: JourneyReminderSettingsPanelProps) {
  const { data: settings, isLoading } = useReminderSettings(childId);
  const updateSettings = useUpdateReminderSettings();

  const { control, handleSubmit, reset, watch, formState: { isDirty } } = useForm<ReminderSettingsUpdate>({
    defaultValues: {
      reminders_enabled: true,
      reminder_interval_hours: 24,
      quiet_hours_start: '20:00',
      quiet_hours_end: '08:00',
      max_reminders_per_day: 3,
      reminder_tone: 'encouraging',
    },
  });

  // Reset form when settings load
  useEffect(() => {
    if (settings) {
      reset({
        reminders_enabled: settings.reminders_enabled,
        reminder_interval_hours: settings.reminder_interval_hours,
        quiet_hours_start: settings.quiet_hours_start,
        quiet_hours_end: settings.quiet_hours_end,
        max_reminders_per_day: settings.max_reminders_per_day,
        reminder_tone: settings.reminder_tone,
      });
    }
  }, [settings, reset]);

  const onSubmit = async (data: ReminderSettingsUpdate) => {
    await updateSettings.mutateAsync({ childId, settings: data });
  };

  const remindersEnabled = watch('reminders_enabled');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Enable/Disable */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-body">Journey Reminders</CardTitle>
                <CardDescription>
                  Remind {childName} about pending journey tasks
                </CardDescription>
              </div>
            </div>
            <Controller
              control={control}
              name="reminders_enabled"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>
        </CardHeader>
      </Card>

      {remindersEnabled && (
        <>
          {/* Interval Setting */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-body">Reminder Interval</CardTitle>
                  <CardDescription>
                    How often to remind about pending tasks
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Controller
                control={control}
                name="reminder_interval_hours"
                render={({ field }) => (
                  <Select
                    value={String(field.value)}
                    onValueChange={(val) => field.onChange(parseInt(val, 10))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERVAL_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={String(opt.value)}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </CardContent>
          </Card>

          {/* Max Reminders */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-body">Maximum Reminders Per Day</CardTitle>
              <CardDescription>
                Limit the number of reminders sent each day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Controller
                control={control}
                name="max_reminders_per_day"
                render={({ field }) => (
                  <div className="space-y-3">
                    <Slider
                      value={[field.value || 3]}
                      onValueChange={([val]) => field.onChange(val)}
                      min={1}
                      max={5}
                      step={1}
                    />
                    <div className="flex items-center justify-between text-body-sm">
                      <span className="text-muted-foreground">1</span>
                      <Badge variant="secondary">{field.value} per day</Badge>
                      <span className="text-muted-foreground">5</span>
                    </div>
                  </div>
                )}
              />
            </CardContent>
          </Card>

          {/* Tone Setting */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <MessageCircle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-body">Reminder Tone</CardTitle>
                  <CardDescription>
                    How Luno should phrase reminders
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Controller
                control={control}
                name="reminder_tone"
                render={({ field }) => (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {TONE_OPTIONS.map((tone) => (
                      <button
                        key={tone.value}
                        type="button"
                        onClick={() => field.onChange(tone.value)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          field.value === tone.value
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'border-muted hover:border-muted-foreground/50'
                        }`}
                      >
                        <p className="font-medium text-body-sm">{tone.label}</p>
                        <p className="text-caption text-muted-foreground mt-1">
                          {tone.description}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              />
            </CardContent>
          </Card>

          {/* Quiet Hours */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-body">Quiet Hours</CardTitle>
              <CardDescription>
                Don't send reminders during these hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="space-y-1.5">
                  <Label className="text-caption text-muted-foreground">Start</Label>
                  <Controller
                    control={control}
                    name="quiet_hours_start"
                    render={({ field }) => (
                      <input
                        type="time"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="px-3 py-2 border rounded-md text-body-sm"
                      />
                    )}
                  />
                </div>
                <span className="text-muted-foreground mt-5">to</span>
                <div className="space-y-1.5">
                  <Label className="text-caption text-muted-foreground">End</Label>
                  <Controller
                    control={control}
                    name="quiet_hours_end"
                    render={({ field }) => (
                      <input
                        type="time"
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="px-3 py-2 border rounded-md text-body-sm"
                      />
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={!isDirty || updateSettings.isPending}>
          {updateSettings.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
    </form>
  );
}
