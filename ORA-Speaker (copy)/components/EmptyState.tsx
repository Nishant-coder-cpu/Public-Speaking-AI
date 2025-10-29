'use client';

import { Upload } from 'lucide-react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/useReducedMotion';

interface EmptyStateProps {
  onUploadClick: () => void;
}

export default function EmptyState({ onUploadClick }: EmptyStateProps) {
  const prefersReducedMotion = useReducedMotion();

  // Animation configuration that respects user preferences
  const getTransition = (duration: number, delay: number = 0) => ({
    duration: prefersReducedMotion ? 0 : duration,
    delay: prefersReducedMotion ? 0 : delay,
    ease: 'easeOut' as const,
  });

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={getTransition(0.5)}
        className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md mx-auto text-center hover:border-white/30 hover:shadow-[0_0_30px_rgba(59,130,246,0.2)] transition-all duration-300"
      >
        <motion.div 
          className="flex justify-center mb-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={getTransition(0.4, 0.2)}
        >
          <Upload className="w-12 h-12 sm:w-16 sm:h-16 text-blue-400" style={{ filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))' }} />
        </motion.div>
        
        <motion.h2 
          className="text-lg sm:text-xl font-semibold text-white mb-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={getTransition(0.4, 0.3)}
        >
          No videos yet
        </motion.h2>
        
        <motion.p 
          className="text-sm sm:text-base text-slate-300 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={getTransition(0.4, 0.4)}
        >
          Upload your first video to get personalized feedback on your public speaking skills
        </motion.p>
        
        <motion.button
          onClick={onUploadClick}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={getTransition(0.4, 0.5)}
          whileHover={!prefersReducedMotion ? { 
            scale: 1.05,
            transition: { duration: 0.2 }
          } : {}}
          whileTap={!prefersReducedMotion ? { scale: 0.95 } : {}}
        >
          Upload Video
        </motion.button>
      </motion.div>
    </div>
  );
}
