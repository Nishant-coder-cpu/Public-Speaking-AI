'use client';

import { motion } from 'framer-motion';
import { FeedbackSession } from '@/lib/types';
import { useReducedMotion } from '@/lib/useReducedMotion';
import FeedbackHistoryItem from './FeedbackHistoryItem';

interface FeedbackHistoryListProps {
  feedbackSessions: FeedbackSession[];
  selectedId: string | null;
  onSelectFeedback: (session: FeedbackSession) => void;
  isLoading: boolean;
}

export default function FeedbackHistoryList({
  feedbackSessions,
  selectedId,
  onSelectFeedback,
  isLoading,
}: FeedbackHistoryListProps) {
  const prefersReducedMotion = useReducedMotion();

  // Framer Motion variants for stagger animation
  const listVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.3,
        ease: 'easeOut' as const,
      },
    },
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-2 pr-2">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="h-16 bg-white/5 rounded-xl"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ 
              duration: prefersReducedMotion ? 0 : 1.5, 
              repeat: Infinity,
              ease: 'easeInOut' as const,
            }}
          />
        ))}
      </div>
    );
  }

  // Empty state
  if (feedbackSessions.length === 0) {
    return (
      <motion.div
        className="text-center py-8 px-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.4, ease: 'easeOut' as const }}
      >
        <p className="text-sm text-slate-400">No feedback yet</p>
        <p className="text-xs text-slate-500 mt-1">
          Upload and analyze a video to get started
        </p>
      </motion.div>
    );
  }

  // Render feedback list in reverse chronological order (already sorted from API)
  return (
    <motion.div
      className="space-y-2 pr-2 pb-2"
      variants={listVariants}
      initial="hidden"
      animate="visible"
    >
      {feedbackSessions.map((session) => (
        <motion.div
          key={session.id}
          variants={itemVariants}
        >
          <FeedbackHistoryItem
            session={session}
            isSelected={session.id === selectedId}
            onClick={() => onSelectFeedback(session)}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
