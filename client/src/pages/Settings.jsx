import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { userAPI } from "../services/api";
import { Sun, Moon, Monitor, Lock, Trash2, Activity } from "lucide-react";
import toast from "react-hot-toast";

export default function Settings() {
  const { user, updateUser, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [changingPassword, setChangingPassword] = useState(false);
  const [difficulty, setDifficulty] = useState(
    user?.preferences?.difficulty || "adaptive",
  );
  const [savingPrefs, setSavingPrefs] = useState(false);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
  };

  const handlePasswordChange = async () => {
    if (passwords.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    setChangingPassword(true);
    try {
      await userAPI.changePassword(passwords);
      toast.success("Password changed successfully");
      setPasswords({ currentPassword: "", newPassword: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSavePreferences = async () => {
    setSavingPrefs(true);
    try {
      const { data } = await userAPI.updateProfile({
        preferences: { difficulty, theme },
      });
      updateUser(data.user);
      toast.success("Preferences saved");
    } catch (error) {
      toast.error("Failed to save preferences");
    } finally {
      setSavingPrefs(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action is permanent and cannot be undone.",
    );
    if (!confirmed) return;

    const doubleConfirm = window.confirm(
      "This will permanently delete all your data including interview history. Are you absolutely sure?",
    );
    if (!doubleConfirm) return;

    try {
      await userAPI.deleteAccount();
      logout();
      navigate("/");
      toast.success("Account deleted");
    } catch (error) {
      toast.error("Failed to delete account");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-display-sm mb-2">Settings</h1>
        <p className="text-[var(--color-text-secondary)]">
          Customize your experience and manage your account.
        </p>
      </motion.div>

      {/* Appearance */}
      <div className="card space-y-4">
        <h3 className="text-lg font-semibold">Appearance</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "light", label: "Light", icon: Sun },
            { value: "dark", label: "Dark", icon: Moon },
            { value: "system", label: "System", icon: Monitor },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleThemeChange(opt.value)}
              className={`p-4 rounded-2xl border text-center transition-all ${
                theme === opt.value
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-950/30 ring-1 ring-primary-500"
                  : "border-surface-200 dark:border-surface-700 hover:border-surface-300"
              }`}
            >
              <opt.icon className="w-5 h-5 mx-auto mb-2" />
              <p className="text-sm font-medium">{opt.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Interview Preferences */}
      <div className="card space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Activity className="w-5 h-5" /> Interview Preferences
        </h3>
        <div>
          <label className="block text-sm font-medium mb-2">
            Default Difficulty
          </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="input-field"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
            <option value="adaptive">Adaptive (AI adjusts)</option>
          </select>
        </div>
        <button
          onClick={handleSavePreferences}
          disabled={savingPrefs}
          className="btn-primary text-sm"
        >
          {savingPrefs ? "Saving..." : "Save Preferences"}
        </button>
      </div>

      {/* Change Password - only for local auth users */}
      {user?.authProvider !== 'google' && (
      <div className="card space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Lock className="w-5 h-5" /> Change Password
        </h3>
        <div>
          <label className="block text-sm font-medium mb-2">
            Current Password
          </label>
          <input
            type="password"
            value={passwords.currentPassword}
            onChange={(e) =>
              setPasswords({ ...passwords, currentPassword: e.target.value })
            }
            className="input-field"
            autoComplete="current-password"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">New Password</label>
          <input
            type="password"
            value={passwords.newPassword}
            onChange={(e) =>
              setPasswords({ ...passwords, newPassword: e.target.value })
            }
            className="input-field"
            placeholder="At least 8 characters"
            autoComplete="new-password"
          />
        </div>
        <button
          onClick={handlePasswordChange}
          disabled={
            changingPassword ||
            !passwords.currentPassword ||
            !passwords.newPassword
          }
          className="btn-primary text-sm"
        >
          {changingPassword ? "Changing..." : "Change Password"}
        </button>
      </div>
      )}

      {/* Danger Zone */}
      <div className="card border-red-200 dark:border-red-900 space-y-4">
        <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
          <Trash2 className="w-5 h-5" /> Danger Zone
        </h3>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </p>
        <button
          onClick={handleDeleteAccount}
          className="px-4 py-2 rounded-xl text-sm font-medium text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
        >
          Delete My Account
        </button>
      </div>
    </div>
  );
}
