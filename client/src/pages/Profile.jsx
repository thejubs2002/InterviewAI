import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import { userAPI } from "../services/api";
import { User, Target, Save } from "lucide-react";
import toast from "react-hot-toast";

const experienceLevels = [
  { value: "fresher", label: "Fresher (0-1 years)" },
  { value: "junior", label: "Junior (1-2 years)" },
  { value: "mid", label: "Mid-Level (2-4 years)" },
  { value: "senior", label: "Senior (4-8 years)" },
  { value: "lead", label: "Lead (8+ years)" },
];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || "",
    title: user?.profile?.title || "",
    bio: user?.profile?.bio || "",
    experience: user?.profile?.experience || "fresher",
    skills: user?.profile?.skills?.join(", ") || "",
    targetRole: user?.profile?.targetRole || "",
    targetCompany: user?.profile?.targetCompany || "",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await userAPI.updateProfile({
        name: form.name,
        profile: {
          title: form.title,
          bio: form.bio,
          experience: form.experience,
          skills: form.skills
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          targetRole: form.targetRole,
          targetCompany: form.targetCompany,
        },
      });
      updateUser(data.user);
      toast.success("Profile updated!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-display-sm mb-2">Profile</h1>
        <p className="text-[var(--color-text-secondary)]">
          Manage your personal information and interview preferences.
        </p>
      </motion.div>

      {/* Avatar & Stats */}
      <div className="card flex items-center gap-6">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-bold shrink-0">
          {user?.name?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <div>
          <h2 className="text-xl font-semibold">{user?.name}</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {user?.email}
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-[var(--color-text-tertiary)]">
            <span>{user?.stats?.totalInterviews || 0} interviews</span>
            <span>{user?.stats?.averageScore || 0}% avg score</span>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="card space-y-5">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <User className="w-5 h-5" /> Personal Info
        </h3>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Full Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Professional Title
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="e.g., Full Stack Developer"
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Bio</label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            rows={3}
            placeholder="Tell us about yourself..."
            className="input-field resize-y"
            maxLength={500}
          />
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
            {form.bio.length}/500
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Experience Level
          </label>
          <select
            name="experience"
            value={form.experience}
            onChange={handleChange}
            className="input-field"
          >
            {experienceLevels.map((lvl) => (
              <option key={lvl.value} value={lvl.value}>
                {lvl.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Skills & Goals */}
      <div className="card space-y-5">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Target className="w-5 h-5" /> Skills & Goals
        </h3>

        <div>
          <label className="block text-sm font-medium mb-2">
            Skills (comma-separated)
          </label>
          <input
            name="skills"
            value={form.skills}
            onChange={handleChange}
            placeholder="JavaScript, React, Node.js, Python"
            className="input-field"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Target Role
            </label>
            <input
              name="targetRole"
              value={form.targetRole}
              onChange={handleChange}
              placeholder="e.g., Senior SWE"
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              Target Company
            </label>
            <input
              name="targetCompany"
              value={form.targetCompany}
              onChange={handleChange}
              placeholder="e.g., Google"
              className="input-field"
            />
          </div>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="btn-primary w-full sm:w-auto"
      >
        {saving ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" /> Save Changes
          </>
        )}
      </button>
    </div>
  );
}
