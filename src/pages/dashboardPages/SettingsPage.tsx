/**
 * Settings Page
 *
 * Redesigned to match loveable DashboardSettingsPage exactly.
 * All backend functionality preserved (password change, data export,
 * account deletion, sign out). Sections without backend (Subscription,
 * auto-delete, granular export/delete) are commented out of the UI.
 */

import { useState, useEffect, type ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { validatePassword } from '@/lib/utils';
import { apiClient, getErrorMessage } from '@/integrations/api/client';
import { ChevronRight, Download, LogOut, Trash2, Eye, EyeOff, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

const F = "'DM Sans', sans-serif";

/* ─── Reusable loveable-style components ─── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className="relative flex-shrink-0 rounded-full transition-colors duration-200 overflow-hidden"
      style={{ minWidth: 44, width: 44, height: 24, background: checked ? '#3ECDC6' : '#E8E6E1' }}
    >
      <span
        className="absolute rounded-full bg-white shadow transition-transform duration-200"
        style={{ width: 20, height: 20, top: 2, left: 0, transform: checked ? 'translateX(22px)' : 'translateX(2px)' }}
      />
    </button>
  );
}

function SectionCard({ children, coral }: { children: React.ReactNode; coral?: boolean }) {
  return (
    <div
      className="bg-white rounded-2xl border p-7"
      style={{ borderColor: '#E8E6E1', background: coral ? '#FEF0EA' : '#FFFFFF' }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-5">
      <h2 style={{ fontFamily: F, fontWeight: 600, fontSize: 20, color: '#2A2926' }}>{title}</h2>
      <p style={{ fontFamily: F, fontSize: 14, color: '#9B978E', marginTop: 2 }}>{subtitle}</p>
    </div>
  );
}

export function SettingsPage() {
  const { user, signOut, updatePassword } = useAuth();

  // Dev-only seed button (gitignored — loads dynamically only when file exists locally)
  const [SeedButton, setSeedButton] = useState<ComponentType | null>(null);
  useEffect(() => {
    const path = '/src/components/dashboard/settings/SeedDemoButton.tsx';
    import(/* @vite-ignore */ path)
      .then((mod) => setSeedButton(() => mod.SeedDemoButton))
      .catch(() => { /* file not present — skip */ });
  }, []);

  // Password change state
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Account deletion state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Data export state
  const [isExporting, setIsExporting] = useState(false);

  // Auto-delete setting (UI-only for now)
  const [autoDelete, setAutoDelete] = useState('Never');

  // Notification toggles — safety/redirections/weekly are wired to user_safety_settings API
  // (same backend as Safety Dashboard). journeys/stories are UI-only for now.
  const [notifications, setNotifications] = useState({
    safety: true,
    redirections: false,
    weekly: true,
    journeys: true,
    stories: false,
  });

  // Load safety notification settings from DB on mount
  useEffect(() => {
    apiClient.get('/safety-settings')
      .then((res) => {
        const d = res.data;
        setNotifications((prev) => ({
          ...prev,
          safety: d.notify_on_report ?? true,
          redirections: d.notify_on_redirect ?? false,
          weekly: d.weekly_summary ?? true,
          journeys: d.notify_on_journey ?? true,
          stories: d.notify_on_story ?? false,
        }));
      })
      .catch(() => {});
  }, []);

  // Map frontend keys to DB column names
  const keyToColumn: Record<string, string> = {
    safety: 'notify_on_report',
    redirections: 'notify_on_redirect',
    weekly: 'weekly_summary',
    journeys: 'notify_on_journey',
    stories: 'notify_on_story',
  };

  // Save notification toggle to DB
  const handleNotificationToggle = async (key: keyof typeof notifications) => {
    const newVal = !notifications[key];
    setNotifications((prev) => ({ ...prev, [key]: newVal }));

    const payload: Record<string, boolean> = {};
    for (const [k, v] of Object.entries(notifications)) {
      payload[keyToColumn[k]] = k === key ? newVal : v;
    }

    try {
      await apiClient.put('/safety-settings', payload);
    } catch {
      setNotifications((prev) => ({ ...prev, [key]: !newVal }));
      toast.error('Failed to save setting');
    }
  };

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      toast.error(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      await updatePassword(currentPassword, newPassword);
      toast.success('Password updated. Please sign in again.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsChangingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);
    try {
      await apiClient.delete('/auth/account', { data: { password: deletePassword } });
      toast.success('Account deleted');
      signOut();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleExportData() {
    setIsExporting(true);
    try {
      const response = await apiClient.get('/data-export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `yoluno-data-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 style={{ fontFamily: F, fontWeight: 600, fontSize: 28, color: '#2A2926' }}>Settings</h1>
        <p style={{ fontFamily: F, fontSize: 15, color: '#6B675E', marginTop: 4 }}>
          Manage your account, data, notifications, and subscription.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Account */}
        <SectionCard>
          <SectionTitle title="Account" subtitle="Your account information" />
          <div className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid #E8E6E1' }}>
            <div>
              <p style={{ fontFamily: F, fontSize: 13, color: '#9B978E' }}>Email</p>
              <p style={{ fontFamily: F, fontSize: 15, color: '#2A2926', marginTop: 2 }}>{user?.email}</p>
            </div>
          </div>
          <div className="pt-4">
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: '#3ECDC6', fontFamily: F }}
            >
              {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              {showPassword ? 'Hide password form' : 'Change password'}
            </button>
            {showPassword && (
              <form onSubmit={handlePasswordChange} className="mt-4 flex flex-col gap-4 max-w-md">
                {[
                  { label: 'Current Password', value: currentPassword, setter: setCurrentPassword, placeholder: '' },
                  { label: 'New Password', value: newPassword, setter: setNewPassword, placeholder: 'At least 8 characters' },
                  { label: 'Confirm New Password', value: confirmPassword, setter: setConfirmPassword, placeholder: '' },
                ].map((field) => (
                  <div key={field.label}>
                    <label style={{ fontFamily: F, fontSize: 13, color: '#6B675E', display: 'block', marginBottom: 4 }}>{field.label}</label>
                    <input
                      type="password"
                      value={field.value}
                      onChange={(e) => field.setter(e.target.value)}
                      required
                      className="w-full rounded-lg border px-4 py-2.5 text-sm"
                      style={{ borderColor: '#E8E6E1', fontFamily: F, color: '#2A2926', outline: 'none' }}
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="self-start px-6 py-2.5 rounded-full text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-50"
                  style={{ background: '#3ECDC6', fontFamily: F }}
                >
                  {isChangingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            )}
          </div>
        </SectionCard>

        {/* Subscription */}
        <SectionCard>
          <SectionTitle title="Subscription" subtitle="Your plan and billing" />
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: '#2A2926' }}>Yoluno Family — Annual</p>
                <p style={{ fontFamily: F, fontSize: 14, color: '#6B675E', marginTop: 2 }}>$79/year · Renews: May 15, 2027</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3" style={{ borderTop: '1px solid #E8E6E1' }}>
              <div className="flex items-center gap-2">
                <CreditCard size={16} style={{ color: '#9B978E' }} />
                <span style={{ fontFamily: F, fontSize: 14, color: '#6B675E' }}>Visa ending 4242</span>
              </div>
              <button className="text-sm font-medium" style={{ color: '#3ECDC6', fontFamily: F }}>Update</button>
            </div>
            <div className="flex items-center gap-6 pt-3" style={{ borderTop: '1px solid #E8E6E1' }}>
              <button className="text-sm font-medium flex items-center gap-1" style={{ color: '#3ECDC6', fontFamily: F }}>
                View billing history <ChevronRight size={14} />
              </button>
              <button className="text-sm" style={{ color: '#9B978E', fontFamily: F }}>
                Cancel subscription
              </button>
            </div>
          </div>
        </SectionCard>

        {/* Notifications */}
        <SectionCard>
          <SectionTitle title="Notifications" subtitle="Choose how Yoluno communicates with you" />
          <div className="flex flex-col divide-y divide-[#E8E6E1]">
            {([
              { key: 'safety' as const, label: 'Safety alerts', desc: 'Get notified when content is flagged or a safety report is generated', delivery: 'Email + Dashboard' },
              { key: 'redirections' as const, label: 'Boundary redirections', desc: 'Get notified when a conversation is gently redirected', delivery: 'Dashboard only' },
              { key: 'weekly' as const, label: 'Weekly summary email', desc: 'A calm overview of what your children explored, how they felt, and what they created', delivery: 'Email · Mondays' },
              { key: 'journeys' as const, label: 'Journey milestones', desc: 'Get notified when a child completes a journey step or finishes a journey', delivery: 'Dashboard' },
              { key: 'stories' as const, label: 'New stories', desc: 'Get notified when a child creates or completes a story', delivery: 'Dashboard' },
            ]).map((item) => (
              <div key={item.key} className="flex items-center justify-between py-4">
                <div className="flex-1 mr-4">
                  <p style={{ fontFamily: F, fontSize: 15, fontWeight: 500, color: '#2A2926' }}>{item.label}</p>
                  <p style={{ fontFamily: F, fontSize: 13, color: '#9B978E', marginTop: 2 }}>{item.desc}</p>
                  <p style={{ fontFamily: F, fontSize: 12, color: '#B8A5D4', marginTop: 4 }}>{item.delivery}</p>
                </div>
                <Toggle checked={notifications[item.key]} onChange={() => handleNotificationToggle(item.key)} />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Data & Privacy */}
        <SectionCard>
          <SectionTitle title="Your Data" subtitle="Control, export, and delete your family's data" />

          {/* Auto-delete */}
          <div className="mb-6 pb-6" style={{ borderBottom: '1px solid #E8E6E1' }}>
            <p style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: '#2A2926', marginBottom: 4 }}>Auto-Delete Settings</p>
            <p style={{ fontFamily: F, fontSize: 14, color: '#6B675E', marginBottom: 10 }}>Automatically delete conversation logs after a set period</p>
            <select
              value={autoDelete}
              onChange={(e) => setAutoDelete(e.target.value)}
              className="rounded-lg border px-4 py-2.5 text-sm bg-white cursor-pointer"
              style={{ borderColor: '#E8E6E1', fontFamily: F, color: '#2A2926' }}
            >
              {['Never', 'After 30 days', 'After 60 days', 'After 90 days'].map((o) => <option key={o}>{o}</option>)}
            </select>
            <p style={{ fontFamily: F, fontSize: 12, color: '#9B978E', marginTop: 8, lineHeight: 1.5 }}>
              Auto-delete applies to conversation logs only. Stories, journeys, family memories, and voice recordings are kept until you delete them manually.
            </p>
          </div>

          {/* Export */}
          <div className="mb-6 pb-6" style={{ borderBottom: '1px solid #E8E6E1' }}>
            <p style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: '#2A2926', marginBottom: 4 }}>Export Data</p>
            <p style={{ fontFamily: F, fontSize: 14, color: '#6B675E', marginBottom: 12 }}>Download your family's data in readable formats</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleExportData}
                disabled={isExporting}
                className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition hover:-translate-y-0.5 disabled:opacity-50"
                style={{ borderColor: '#3ECDC6', color: '#3ECDC6', fontFamily: F, background: 'transparent' }}
              >
                <Download size={14} /> {isExporting ? 'Exporting...' : 'Export Everything'}
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition hover:-translate-y-0.5" style={{ borderColor: '#3ECDC6', color: '#3ECDC6', fontFamily: F, background: 'transparent' }}>
                <Download size={14} /> Export Conversations
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition hover:-translate-y-0.5" style={{ borderColor: '#3ECDC6', color: '#3ECDC6', fontFamily: F, background: 'transparent' }}>
                <Download size={14} /> Export Stories
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition hover:-translate-y-0.5" style={{ borderColor: '#3ECDC6', color: '#3ECDC6', fontFamily: F, background: 'transparent' }}>
                <Download size={14} /> Export Voice Recordings
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition hover:-translate-y-0.5" style={{ borderColor: '#3ECDC6', color: '#3ECDC6', fontFamily: F, background: 'transparent' }}>
                <Download size={14} /> Export Account Summary
              </button>
            </div>
            <p style={{ fontFamily: F, fontSize: 12, color: '#9B978E', marginTop: 10 }}>
              Exports include all data across all children. Files are delivered in PDF, MP3, and text formats.
            </p>
          </div>

          {/* Delete data */}
          <div>
            <p style={{ fontFamily: F, fontSize: 15, fontWeight: 600, color: '#2A2926', marginBottom: 4 }}>Delete Data</p>
            <p style={{ fontFamily: F, fontSize: 14, color: '#6B675E', marginBottom: 10 }}>Permanently remove specific data types</p>
            <div className="flex flex-col gap-2">
              {['Delete all conversations', 'Delete all voice recordings', "Delete a child's profile and all their data"].map((action) => (
                <button
                  key={action}
                  className="flex items-center gap-1.5 text-sm font-medium text-left"
                  style={{ color: '#E8946A', fontFamily: F }}
                >
                  {action} <ChevronRight size={13} />
                </button>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Policies & Trust */}
        <SectionCard>
          <SectionTitle title="Policies & Trust" subtitle="Your rights and our commitments" />
          <div className="flex flex-col gap-2">
            {[
              { label: 'Privacy Policy', to: '/privacy-policy' },
              { label: 'Data Practices', to: '/data-practices' },
              { label: 'Safety Charter', to: '/safety-charter' },
              { label: 'How AI Works in Yoluno', to: '/how-ai-works' },
              { label: 'Terms of Service', to: '#' },
            ].map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="flex items-center gap-1.5 text-sm font-medium no-underline transition hover:underline py-1"
                style={{ color: '#6B675E', fontFamily: F }}
              >
                {link.label} <ChevronRight size={13} style={{ color: '#9B978E' }} />
              </Link>
            ))}
          </div>
        </SectionCard>

        {/* Account Actions */}
        <SectionCard coral>
          <SectionTitle title="Account Actions" subtitle="Irreversible actions for your account" />
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold border transition hover:-translate-y-0.5"
              style={{ borderColor: '#6B675E', color: '#6B675E', fontFamily: F, background: 'transparent' }}
            >
              <LogOut size={15} /> Sign Out
            </button>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-semibold border transition hover:-translate-y-0.5"
              style={{ borderColor: '#E8946A', color: '#E8946A', fontFamily: F, background: 'transparent' }}
            >
              <Trash2 size={15} /> Delete Account
            </button>
          </div>
          <p style={{ fontFamily: F, fontSize: 13, color: '#9B978E', lineHeight: 1.6, marginBottom: 6 }}>
            Permanently delete your account and all associated data — including all children's profiles, conversations, stories, journeys, voice recordings, and family memories. This action cannot be undone. All data will be removed within 30 days.
          </p>
          <p style={{ fontFamily: F, fontSize: 13 }}>
            <span style={{ color: '#3ECDC6' }}>Before deleting, you can export all your data using the options above.</span>
          </p>
        </SectionCard>
      </div>

      {/* Seed Demo Data (dev only — hidden from UI, keep code for re-enabling later)
      {SeedButton && <SeedButton />}
      */}

      {/* Delete Account Confirmation Dialog */}
      {showDeleteDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setShowDeleteDialog(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontFamily: F, fontSize: 20, fontWeight: 600, color: '#2A2926', marginBottom: 4 }}>
              Delete Account
            </h3>
            <p style={{ fontFamily: F, fontSize: 14, color: '#6B675E', lineHeight: 1.6, marginBottom: 16 }}>
              This action cannot be undone. All your data including children profiles,
              stories, journeys, and chat history will be permanently deleted.
            </p>
            <div className="mb-5">
              <label style={{ fontFamily: F, fontSize: 13, color: '#6B675E', display: 'block', marginBottom: 4 }}>
                Enter your password to confirm
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Your password"
                className="w-full rounded-lg border px-4 py-2.5 text-sm"
                style={{ borderColor: '#E8E6E1', fontFamily: F, color: '#2A2926', outline: 'none' }}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-5 py-2 rounded-full text-sm font-medium border transition hover:bg-gray-50"
                style={{ borderColor: '#E8E6E1', color: '#6B675E', fontFamily: F }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={!deletePassword || isDeleting}
                className="px-5 py-2 rounded-full text-sm font-semibold text-white transition hover:-translate-y-0.5 disabled:opacity-50"
                style={{ background: '#E8946A', fontFamily: F }}
              >
                {isDeleting ? 'Deleting...' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
