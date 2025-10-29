'use client';

import { Video, LogOut, X, Clock, GripVertical } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useReducedMotion } from '@/lib/useReducedMotion';
import { FeedbackSession } from '@/lib/types';
import FeedbackHistoryList from './FeedbackHistoryList';

interface SidebarProps {
  userEmail: string | null;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
  feedbackHistory: FeedbackSession[];
  selectedFeedbackId: string | null;
  onSelectFeedback: (session: FeedbackSession) => void;
  isLoadingHistory: boolean;
  onMyVideosClick?: () => void;
}

const MIN_WIDTH = 240;
const MAX_WIDTH = 480;
const DEFAULT_WIDTH = 256; // 64 * 4 = w-64

export default function Sidebar({ 
  userEmail, 
  onLogout, 
  isOpen, 
  onClose,
  feedbackHistory,
  selectedFeedbackId,
  onSelectFeedback,
  isLoadingHistory,
  onMyVideosClick,
}: SidebarProps) {
  const prefersReducedMotion = useReducedMotion();
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Load saved width from localStorage on mount
  useEffect(() => {
    const savedWidth = localStorage.getItem('sidebarWidth');
    if (savedWidth) {
      const width = parseInt(savedWidth, 10);
      if (width >= MIN_WIDTH && width <= MAX_WIDTH) {
        setSidebarWidth(width);
      }
    }
  }, []);
  
  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      // Save width to localStorage when resize ends
      localStorage.setItem('sidebarWidth', sidebarWidth.toString());
    };

    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, sidebarWidth]);

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside 
        ref={sidebarRef}
        style={{ width: `${sidebarWidth}px` }}
        className={`
          h-screen backdrop-blur-xl bg-white/10 border-r border-white/20
          fixed lg:sticky top-0 z-50 lg:z-10
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          flex flex-col relative
        `}
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Logo Section with Close Button for Mobile */}
        <div className="p-6 border-b border-white/20 flex items-center justify-between flex-shrink-0">
          <h1 className="text-xl font-bold text-white">Speaking Coach</h1>
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 flex-shrink-0">
          <ul className="space-y-2">
            <li>
              <motion.button
                onClick={onMyVideosClick}
                className="w-full flex items-center gap-3 px-4 py-3 text-white font-medium rounded-xl bg-white/10 hover:bg-white/20 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent"
                aria-current="page"
                whileHover={!prefersReducedMotion ? { 
                  x: 4,
                  transition: { duration: 0.2 }
                } : {}}
                whileTap={!prefersReducedMotion ? { scale: 0.98 } : {}}
              >
                <Video className="w-5 h-5" />
                <span>My Videos</span>
              </motion.button>
            </li>
          </ul>
        </nav>

        {/* Recent Feedback Section - Takes remaining space */}
        <div className="flex-1 overflow-hidden px-4 pb-4 min-h-0">
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 mb-3 flex-shrink-0">
              <Clock className="w-4 h-4 text-slate-300" />
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                Recent Feedback
              </h2>
            </div>
            <div 
              className="flex-1 overflow-y-auto min-h-0" 
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255, 255, 255, 0.2) transparent',
              }}
            >
              <FeedbackHistoryList
                feedbackSessions={feedbackHistory}
                selectedId={selectedFeedbackId}
                onSelectFeedback={onSelectFeedback}
                isLoading={isLoadingHistory}
              />
            </div>
          </div>
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-white/20 flex-shrink-0">
          {userEmail && (
            <div className="mb-3 px-2">
              <p className="text-sm text-slate-300 truncate" title={userEmail}>
                {userEmail}
              </p>
            </div>
          )}
          <motion.button
            onClick={() => {
              console.log('[Sidebar] Sign out button clicked');
              onLogout();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 text-white font-medium rounded-xl hover:bg-white/10 transition-colors min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent"
            whileHover={!prefersReducedMotion ? { 
              x: 4,
              transition: { duration: 0.2 }
            } : {}}
            whileTap={!prefersReducedMotion ? { scale: 0.98 } : {}}
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </motion.button>
        </div>

        {/* Resize Handle - Desktop only */}
        <div
          className="hidden lg:block absolute top-0 right-0 w-1 h-full cursor-col-resize group hover:bg-blue-400/50 transition-colors"
          onMouseDown={handleResizeStart}
          role="separator"
          aria-label="Resize sidebar"
          aria-orientation="vertical"
        >
          <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-blue-500/80 rounded-full p-1 shadow-lg">
              <GripVertical className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
