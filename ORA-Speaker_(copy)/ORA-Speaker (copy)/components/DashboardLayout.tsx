'use client';

import { useState, useEffect, cloneElement, isValidElement, ReactElement } from 'react';
import Sidebar from './Sidebar';
import { FeedbackSession } from '@/lib/types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userEmail: string | null;
  onLogout: () => void;
  feedbackHistory: FeedbackSession[];
  selectedFeedbackId: string | null;
  onSelectFeedback: (session: FeedbackSession) => void;
  isLoadingHistory: boolean;
  onMyVideosClick?: () => void;
}

export default function DashboardLayout({
  children,
  userEmail,
  onLogout,
  feedbackHistory,
  selectedFeedbackId,
  onSelectFeedback,
  isLoadingHistory,
  onMyVideosClick,
}: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Listen for custom event to close mobile sidebar
  useEffect(() => {
    const handleCloseMobileSidebar = () => {
      closeSidebar();
    };

    window.addEventListener('closeMobileSidebar', handleCloseMobileSidebar);

    return () => {
      window.removeEventListener('closeMobileSidebar', handleCloseMobileSidebar);
    };
  }, []);

  // Clone children and inject onMenuClick prop if it's a valid React element
  const childrenWithProps = isValidElement(children)
    ? cloneElement(children as ReactElement<any>, { onMenuClick: toggleSidebar })
    : children;

  return (
    <div className="flex h-screen relative overflow-hidden">
      {/* Animated Background with Gradient Mesh - Same as landing page */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        {/* Animated Gradient Orbs */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{ animationDelay: '2s' }} />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" style={{ animationDelay: '4s' }} />
      </div>
      
      {/* Content with proper z-index */}
      <div className="relative z-10 flex w-full h-full">
        <Sidebar 
          userEmail={userEmail} 
          onLogout={onLogout}
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          feedbackHistory={feedbackHistory}
          selectedFeedbackId={selectedFeedbackId}
          onSelectFeedback={onSelectFeedback}
          isLoadingHistory={isLoadingHistory}
          onMyVideosClick={onMyVideosClick}
        />
        <main className="flex-1 flex flex-col overflow-hidden">
          {childrenWithProps}
        </main>
      </div>
    </div>
  );
}
