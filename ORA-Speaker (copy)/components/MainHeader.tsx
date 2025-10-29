'use client';

import React from 'react';
import { Upload, Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/useReducedMotion';

interface MainHeaderProps {
  title: string;
  subtitle?: string;
  onUploadClick: () => void;
  onMenuClick?: () => void;
}

export default function MainHeader({ title, subtitle, onUploadClick, onMenuClick }: MainHeaderProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <header className="backdrop-blur-xl bg-white/10 border-b border-white/20 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="flex items-center justify-between gap-4">
        {/* Mobile Menu Button */}
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 text-white hover:bg-white/10 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        )}

        {/* Title and Subtitle Section */}
        <div className="flex flex-col flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm lg:text-base text-slate-300 mt-1 line-clamp-2">
              {subtitle}
            </p>
          )}
        </div>

        {/* Upload Button */}
        <motion.button
          onClick={onUploadClick}
          className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] whitespace-nowrap min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent"
          whileHover={!prefersReducedMotion ? { 
            scale: 1.05,
            transition: { duration: 0.2 }
          } : {}}
          whileTap={!prefersReducedMotion ? { scale: 0.95 } : {}}
        >
          <Upload className="w-5 h-5" />
          <span className="hidden sm:inline">Upload New Video</span>
          <span className="sm:hidden">Upload</span>
        </motion.button>
      </div>
    </header>
  );
}
