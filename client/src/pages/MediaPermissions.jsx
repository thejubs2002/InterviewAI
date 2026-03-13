import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, Mic, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { useMedia } from '../contexts/MediaContext';
import toast from 'react-hot-toast';

export default function MediaPermissions() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mediaStream, permissionsGranted, requestPermissions } = useMedia();
  const [loading, setLoading] = useState(false);
  const [videoEl, setVideoEl] = useState(null);
  const [error, setError] = useState(null);

  // Attach stream to local video element
  useEffect(() => {
    if (mediaStream && videoEl) {
      videoEl.srcObject = mediaStream;
    }
  }, [mediaStream, videoEl]);

  const handleRequestPermissions = async () => {
    setLoading(true);
    setError(null);
    const stream = await requestPermissions();
    setLoading(false);
    if (!stream) {
      setError('Camera or microphone access was denied. Please allow access and try again.');
    }
  };

  const handleContinue = () => {
    const interviewId = location.state?.interviewId;
    if (!interviewId) {
      toast.error('Session expired. Please start a new interview.');
      navigate('/interview/setup');
      return;
    }
    navigate(`/interview/${interviewId}`);
  };

  const handleSkip = () => {
    const interviewId = location.state?.interviewId;
    if (interviewId) {
      navigate(`/interview/${interviewId}`);
    } else {
      navigate('/interview/setup');
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <motion.div
        className="mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold mb-2">Enable Camera & Microphone</h1>
        <p className="text-[var(--color-text-secondary)]">
          For a realistic interview experience, we need access to your camera and microphone.
        </p>
      </motion.div>

      {/* Features List */}
      <motion.div
        className="card mb-8 space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-start gap-3">
          <Camera className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold">Camera Access</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Your webcam will be visible to you during the interview for self-monitoring.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Mic className="w-5 h-5 text-primary-500 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold">Microphone Access</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Your voice will be recorded and converted to text for evaluation.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm flex items-start gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </motion.div>
      )}

      {/* Camera Preview */}
      {permissionsGranted && (
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <h2 className="text-lg font-semibold mb-3">Camera Preview</h2>
          <div className="relative bg-black rounded-2xl overflow-hidden aspect-video shadow-lg border border-surface-700">
            <video
              ref={(el) => setVideoEl(el)}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-emerald-500/90 px-3 py-2 rounded-full text-white text-sm font-semibold">
              <CheckCircle className="w-4 h-4" /> Ready
            </div>
          </div>
        </motion.div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <motion.button
          onClick={handleSkip}
          className="flex-1 btn-secondary"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Skip for Now
        </motion.button>
        <motion.button
          onClick={permissionsGranted ? handleContinue : handleRequestPermissions}
          className="flex-1 btn-primary flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={loading}
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : permissionsGranted ? (
            <>
              Continue to Interview <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            <>
              Enable Camera & Mic <Camera className="w-4 h-4" />
            </>
          )}
        </motion.button>
      </div>

      {/* Privacy Notice */}
      <motion.p
        className="text-xs text-[var(--color-text-tertiary)] text-center mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Your camera and microphone will only be used during this interview.
        They are never recorded or stored without your explicit consent.
      </motion.p>
    </div>
  );
}
