import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../contexts/AuthContext';
import { Brain, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const { login, googleLogin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link to="/" className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-semibold tracking-tight">InterviewAI</span>
          </Link>

          <h2 className="text-display-sm mb-2">Welcome back</h2>
          <p className="text-[var(--color-text-secondary)] mb-8">Sign in to continue your interview preparation.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="input-field pl-12"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="input-field pl-12 pr-12"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 text-base"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight className="w-5 h-5 ml-2" /></>
              )}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-200 dark:border-surface-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-[var(--color-bg)] text-[var(--color-text-tertiary)]">or continue with</span>
            </div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                try {
                  await googleLogin(credentialResponse.credential);
                  toast.success('Welcome back!');
                } catch (error) {
                  toast.error(error.response?.data?.message || 'Google login failed');
                }
              }}
              onError={() => toast.error('Google login failed')}
              shape="pill"
              size="large"
              width="100%"
              text="signin_with"
            />
          </div>

          <p className="text-center text-sm text-[var(--color-text-secondary)] mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
              Create one
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right panel - decorative */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-gradient-to-br from-primary-50 via-primary-100 to-accent-50 dark:from-primary-950 dark:via-surface-950 dark:to-surface-900 p-12">
        <div className="max-w-lg text-center">
          <div className="w-24 h-24 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow-lg">
            <Brain className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-heading mb-4">Practice Makes Perfect</h3>
          <p className="text-[var(--color-text-secondary)] leading-relaxed">
            Prepare for your dream job with AI-powered mock interviews across aptitude, technical, HR, and managerial categories.
          </p>
        </div>
      </div>
    </div>
  );
}
