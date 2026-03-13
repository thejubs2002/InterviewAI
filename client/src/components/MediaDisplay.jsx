import { motion } from 'framer-motion';
import { Volume2, VolumeX, Mic, MicOff } from 'lucide-react';

export default function MediaDisplay({
  videoRef,
  mediaStream,
  isRecording,
  isMuted,
  onToggleMute,
}) {
  return (
    <motion.div
      className="relative bg-black rounded-2xl overflow-hidden aspect-video shadow-lg border border-surface-700"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />

      {/* Recording Indicator */}
      {isRecording && (
        <motion.div
          className="absolute top-4 left-4 flex items-center gap-2 bg-red-500/90 px-3 py-2 rounded-full text-white text-sm font-semibold"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <div className="w-2 h-2 rounded-full bg-white" />
          REC
        </motion.div>
      )}

      {/* Mute Toggle */}
      <motion.button
        onClick={onToggleMute}
        className="absolute bottom-4 right-4 p-3 rounded-full bg-surface-900/70 hover:bg-surface-800/70 text-white transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {isMuted ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </motion.button>

      {/* No Camera Message */}
      {!mediaStream && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-900/50 backdrop-blur-sm">
          <div className="text-center text-white">
            <Mic className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Camera not available</p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
