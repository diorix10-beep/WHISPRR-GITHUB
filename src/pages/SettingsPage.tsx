import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Moon, Sun, Lock, Eye, MessageSquare, User, Shield, Info } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { supabase } from '../lib/supabase';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user, profile, updateProfile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();

  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    follow_notifications: true,
    reaction_notifications: true,
    comment_notifications: true,
  });

  const [privacySettings, setPrivacySettings] = useState({
    profile_visible: profile?.profile_visible ?? true,
    online_status_visible: profile?.online_status_visible ?? true,
    read_receipts_enabled: profile?.read_receipts_enabled ?? true,
    who_can_message: profile?.who_can_message ?? 'everyone',
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    const savedSettings = {
      email_notifications: localStorage.getItem('email_notifications') !== 'false',
      push_notifications: localStorage.getItem('push_notifications') !== 'false',
      follow_notifications: localStorage.getItem('follow_notifications') !== 'false',
      reaction_notifications: localStorage.getItem('reaction_notifications') !== 'false',
      comment_notifications: localStorage.getItem('comment_notifications') !== 'false',
    };
    setNotificationSettings(savedSettings);
  }, []);

  useEffect(() => {
    if (profile) {
      setPrivacySettings({
        profile_visible: profile.profile_visible,
        online_status_visible: profile.online_status_visible,
        read_receipts_enabled: profile.read_receipts_enabled,
        who_can_message: profile.who_can_message,
      });
    }
  }, [profile]);

  const handleNotificationToggle = (key: keyof typeof notificationSettings) => {
    const newSettings = { ...notificationSettings, [key]: !notificationSettings[key] };
    setNotificationSettings(newSettings);
    localStorage.setItem(key, String(newSettings[key]));
    showToast('Notification preference saved', 'success');
  };

  const handlePrivacyToggle = async (key: 'profile_visible' | 'online_status_visible' | 'read_receipts_enabled') => {
    const newSettings = { ...privacySettings, [key]: !privacySettings[key] };
    setPrivacySettings(newSettings);

    try {
      await updateProfile({ [key]: newSettings[key] });
      showToast('Privacy setting updated', 'success');
    } catch (error) {
      setPrivacySettings(prev => ({ ...prev, [key]: !newSettings[key] }));
      showToast('Failed to update setting. Please try again.', 'error');
    }
  };

  const handleWhoCanMessageChange = async (value: 'everyone' | 'followers' | 'no_one') => {
    const prev = privacySettings.who_can_message;
    setPrivacySettings(p => ({ ...p, who_can_message: value }));

    try {
      await updateProfile({ who_can_message: value });
      showToast('Messaging preference updated', 'success');
    } catch (error) {
      setPrivacySettings(p => ({ ...p, who_can_message: prev }));
      showToast('Failed to update setting. Please try again.', 'error');
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmNewPassword) {
      showToast('Please fill in both password fields', 'error');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      showToast('Password updated successfully', 'success');
      setShowPasswordModal(false);
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update password', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      showToast('Failed to sign out. Please try again.', 'error');
    }
  };

  return (
    <div className="page-container pb-24">
      <h1 className="section-title mb-8">Settings</h1>

      {/* Account Section */}
      <section className="mb-8" aria-labelledby="account-heading">
        <div className="flex items-center gap-2 mb-4">
          <User size={20} className="text-primary-500" />
          <h2 id="account-heading" className="text-lg font-semibold text-warm-900 dark:text-warm-50">
            Account
          </h2>
        </div>

        <div className="space-y-4 bg-warm-50 dark:bg-warm-800 p-4 rounded-2xl">
          <div>
            <label className="block text-sm font-semibold text-warm-900 dark:text-warm-50 mb-2">
              Email Address
            </label>
            <div className="p-3 bg-white dark:bg-warm-700 rounded-lg text-warm-700 dark:text-warm-300">
              {user?.email || 'Not set'}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-warm-900 dark:text-warm-50 mb-2">
              Password
            </label>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center gap-2 btn-secondary"
            >
              <Lock size={18} />
              Change Password
            </button>
          </div>
        </div>
      </section>

      {/* Appearance Section */}
      <section className="mb-8" aria-labelledby="appearance-heading">
        <h2 id="appearance-heading" className="text-lg font-semibold text-warm-900 dark:text-warm-50 mb-4">
          Appearance
        </h2>

        <div className="space-y-4 bg-warm-50 dark:bg-warm-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon size={20} className="text-primary-500" />
              ) : (
                <Sun size={20} className="text-primary-500" />
              )}
              <div>
                <p className="font-semibold text-warm-900 dark:text-warm-50">Dark Mode</p>
                <p className="text-sm text-warm-600 dark:text-warm-400">
                  {theme === 'dark' ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              role="switch"
              aria-checked={theme === 'dark'}
              aria-label="Toggle dark mode"
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                theme === 'dark' ? 'bg-primary-500' : 'bg-warm-300 dark:bg-warm-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  theme === 'dark' ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* Notifications Section */}
      <section className="mb-8" aria-labelledby="notifications-heading">
        <h2 id="notifications-heading" className="text-lg font-semibold text-warm-900 dark:text-warm-50 mb-4">
          Notifications
        </h2>

        <div className="space-y-3 bg-warm-50 dark:bg-warm-800 p-4 rounded-2xl">
          <ToggleRow
            label="Email Notifications"
            description="Receive email updates"
            checked={notificationSettings.email_notifications}
            onChange={() => handleNotificationToggle('email_notifications')}
          />
          <ToggleRow
            label="Push Notifications"
            description="Receive in-app notifications"
            checked={notificationSettings.push_notifications}
            onChange={() => handleNotificationToggle('push_notifications')}
            border
          />
          <ToggleRow
            label="Follow Notifications"
            description="When someone follows you"
            checked={notificationSettings.follow_notifications}
            onChange={() => handleNotificationToggle('follow_notifications')}
            border
          />
          <ToggleRow
            label="Reaction Notifications"
            description="When someone reacts to your whisper"
            checked={notificationSettings.reaction_notifications}
            onChange={() => handleNotificationToggle('reaction_notifications')}
            border
          />
          <ToggleRow
            label="Comment Notifications"
            description="When someone comments on your whisper"
            checked={notificationSettings.comment_notifications}
            onChange={() => handleNotificationToggle('comment_notifications')}
            border
          />
        </div>
      </section>

      {/* Privacy Section */}
      <section className="mb-8" aria-labelledby="privacy-heading">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={20} className="text-primary-500" />
          <h2 id="privacy-heading" className="text-lg font-semibold text-warm-900 dark:text-warm-50">
            Privacy
          </h2>
        </div>

        <div className="space-y-3 bg-warm-50 dark:bg-warm-800 p-4 rounded-2xl">
          <ToggleRow
            label="Profile Visibility"
            description={privacySettings.profile_visible ? 'Visible to everyone' : 'Private'}
            checked={privacySettings.profile_visible}
            onChange={() => handlePrivacyToggle('profile_visible')}
          />
          <ToggleRow
            label="Online Status"
            description="Show when you're online"
            checked={privacySettings.online_status_visible}
            onChange={() => handlePrivacyToggle('online_status_visible')}
            border
          />
          <ToggleRow
            label="Read Receipts"
            description="Show when you've read messages"
            checked={privacySettings.read_receipts_enabled}
            onChange={() => handlePrivacyToggle('read_receipts_enabled')}
            border
          />

          <div className="pt-3 border-t border-warm-200 dark:border-warm-700">
            <label htmlFor="who-can-message" className="flex items-center gap-2 mb-2">
              <MessageSquare size={16} className="text-primary-500" />
              <p className="font-semibold text-warm-900 dark:text-warm-50">Who Can Message You</p>
            </label>
            <select
              id="who-can-message"
              value={privacySettings.who_can_message}
              onChange={(e) => handleWhoCanMessageChange(e.target.value as 'everyone' | 'followers' | 'no_one')}
              className="input-field"
            >
              <option value="everyone">Everyone</option>
              <option value="followers">Followers Only</option>
              <option value="no_one">No One</option>
            </select>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="mb-8" aria-labelledby="about-heading">
        <div className="flex items-center gap-2 mb-4">
          <Info size={20} className="text-primary-500" />
          <h2 id="about-heading" className="text-lg font-semibold text-warm-900 dark:text-warm-50">
            About
          </h2>
        </div>

        <div className="space-y-4 bg-warm-50 dark:bg-warm-800 p-4 rounded-2xl">
          <div>
            <p className="text-sm text-warm-600 dark:text-warm-400 mb-3">
              <span className="font-semibold text-warm-900 dark:text-warm-50">WHISPRR</span>{' '}v1.0.0
            </p>
            <p className="text-sm text-warm-700 dark:text-warm-300">
              A platform for authentic self-expression where thoughts are cherished,
              conversations are meaningful, and connections are genuine.
            </p>
          </div>
          <div className="pt-4 border-t border-warm-200 dark:border-warm-700 space-y-2">
            <button
              onClick={() => navigate('/terms')}
              className="block text-sm text-primary-500 hover:underline"
            >
              Terms of Service
            </button>
            <button
              onClick={() => navigate('/privacy')}
              className="block text-sm text-primary-500 hover:underline"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => showToast('For support, contact hello@whisprr.xyz', 'info')}
              className="block text-sm text-primary-500 hover:underline"
            >
              Contact Support
            </button>
          </div>
        </div>
      </section>

      {/* Sign Out */}
      <button
        onClick={handleSignOut}
        className="w-full btn-secondary flex items-center justify-center gap-2 mb-4"
      >
        <LogOut size={18} />
        Sign Out
      </button>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="password-modal-title"
        >
          <div className="bg-white dark:bg-warm-800 rounded-2xl shadow-xl w-full max-sm p-6">
            <h3 id="password-modal-title" className="font-serif text-xl font-semibold text-warm-900 dark:text-warm-50 mb-6">
              Change Password
            </h3>

            <div className="space-y-4">
              <div>
                <label htmlFor="new-password" className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-2">
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                  placeholder="At least 6 characters"
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="confirm-new-password" className="block text-sm font-medium text-warm-700 dark:text-warm-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  id="confirm-new-password"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="input-field"
                  placeholder="Confirm your password"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleChangePassword}
                disabled={passwordLoading}
                className="flex-1 btn-primary"
              >
                {passwordLoading ? 'Updating...' : 'Update Password'}
              </button>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setNewPassword('');
                  setConfirmNewPassword('');
                }}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToggleRow({ label, description, checked, onChange, border = false }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  border?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between ${border ? 'pt-3 border-t border-warm-200 dark:border-warm-700' : ''}`}>
      <div>
        <p className="font-semibold text-warm-900 dark:text-warm-50">{label}</p>
        <p className="text-sm text-warm-600 dark:text-warm-400">{description}</p>
      </div>
      <button
        onClick={onChange}
        role="switch"
        aria-checked={checked}
        aria-label={`${label}: ${checked ? 'enabled' : 'disabled'}`}
        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors flex-shrink-0 ${
          checked ? 'bg-primary-500' : 'bg-warm-300 dark:bg-warm-600'
        }`}
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
