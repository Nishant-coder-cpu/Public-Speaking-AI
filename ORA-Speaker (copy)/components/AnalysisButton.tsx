'use client';

import { motion } from 'framer-motion';
import { Loader2, CheckCircle2 } from 'lucide-react';

interface AnalysisButtonProps {
  type: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  onClick: () => void;
  loading: boolean;
  completed: boolean;
  active: boolean;
}

export default function AnalysisButton({
  type,
  label,
  icon,
  description,
  onClick,
  loading,
  completed,
  active,
}: AnalysisButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={loading}
      whileHover={{ scale: loading ? 1 : 1.02 }}
      whileTap={{ scale: loading ? 1 : 0.98 }}
      transition={{ duration: 0.3 }}
      className={`
        relative min-h-[140px] w-full rounded-xl p-6
        flex flex-col items-start gap-3
        transition-all duration-300
        focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900
        ${
          loading
            ? 'border-2 border-blue-500 bg-blue-500/10 cursor-not-allowed opacity-70'
            : completed && active
            ? 'border-2 border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
            : completed
            ? 'border-2 border-green-500/50 bg-white/5 hover:border-green-500 hover:bg-white/10'
            : active
            ? 'border-2 border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20'
            : 'border-2 border-white/20 bg-white/5 hover:border-white/30 hover:bg-white/10'
        }
      `}
    >
      {/* Icon Section */}
      <div
        className={`
          flex items-center justify-center w-12 h-12 rounded-lg
          transition-colors duration-300
          ${
            loading
              ? 'bg-blue-500/20 text-blue-400'
              : completed && active
              ? 'bg-blue-500/20 text-blue-400'
              : completed
              ? 'bg-green-500/20 text-green-400'
              : active
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-white/10 text-slate-300'
          }
        `}
      >
        {loading ? (
          <Loader2 className="w-6 h-6 animate-spin" />
        ) : completed ? (
          <CheckCircle2 className="w-6 h-6" />
        ) : (
          <div className="w-6 h-6">{icon}</div>
        )}
      </div>

      {/* Text Content */}
      <div className="flex-1 text-left">
        <h3
          className={`
            text-lg font-semibold mb-1
            transition-colors duration-300
            ${
              loading
                ? 'text-blue-300'
                : completed && active
                ? 'text-blue-300'
                : completed
                ? 'text-green-300'
                : active
                ? 'text-blue-300'
                : 'text-slate-200'
            }
          `}
        >
          {loading ? 'Analyzing...' : label}
        </h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          {loading ? 'Processing your video...' : description}
        </p>
      </div>

      {/* Completed Badge (top-right corner) */}
      {completed && !loading && (
        <div className="absolute top-4 right-4">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
        </div>
      )}
    </motion.button>
  );
}
