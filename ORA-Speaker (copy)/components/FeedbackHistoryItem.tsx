'use client';

import { motion } from 'framer-motion';
import { Video } from 'lucide-react';
import { FeedbackSession } from '@/lib/types';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { extractFilename, truncateFilename, formatRelativeDate } from '@/utils/feedbackHistory';

interface FeedbackHistoryItemProps {
  session: FeedbackSession;
  isSelected: boolean;
  onClick: () => void;
}

export default function FeedbackHistoryItem({
  session,
  isSelected,
  onClick,
}: FeedbackHistoryItemProps) {
  const prefersReducedMotion = useReducedMotion();

  // Extract and truncate filename from S3 path
  const filename = extractFilename(session.video_path);
  const displayName = truncateFilename(filename, 25);

  // Format the date
  const relativeDate = formatRelativeDate(session.created_at);

  return (
    <motion.button
      onClick={onClick}
      className={`
        w-full p-3 rounded-xl border
        flex items-start gap-3 text-left
        min-h-[44px]
        ${
          isSelected
            ? 'bg-blue-500/20 border-blue-400/50'
            : 'bg-white/10 border-white/20 hover:bg-white/15'
        }
      `}
      whileHover={
        !prefersReducedMotion && !isSelected
          ? {
              x: 4,
              transition: { duration: 0.2, ease: 'easeOut' },
            }
          : {}
      }
      whileTap={
        !prefersReducedMotion
          ? {
              scale: 0.98,
              transition: { duration: 0.1 },
            }
          : {}
      }
      animate={{
        backgroundColor: isSelected
          ? 'rgba(59, 130, 246, 0.2)'
          : 'rgba(255, 255, 255, 0.1)',
        borderColor: isSelected
          ? 'rgba(96, 165, 250, 0.5)'
          : 'rgba(255, 255, 255, 0.2)',
      }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
    >
      {/* Video Icon */}
      <div className="flex-shrink-0 mt-0.5">
        <Video className="w-5 h-5 text-slate-300" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {displayName}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          {relativeDate}
        </p>
      </div>
    </motion.button>
  );
}
