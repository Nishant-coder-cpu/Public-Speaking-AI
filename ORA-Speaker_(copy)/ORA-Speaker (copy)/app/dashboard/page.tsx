'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import DashboardLayout from '@/components/DashboardLayout';
import MainHeader from '@/components/MainHeader';
import EmptyState from '@/components/EmptyState';
import UploadBox from '@/components/UploadBox';
import VideoPreview from '@/components/VideoPreview';
import FeedbackCard from '@/components/FeedbackCard';
import AnalysisButton from '@/components/AnalysisButton';
import { FadeIn, SlideUp } from '@/components/AnimationWrappers';
import { motion, AnimatePresence } from 'framer-motion';
import { FeedbackSession, AnalysisType } from '@/lib/types';
import { ANALYSIS_LABELS } from '@/lib/analysisPrompts';
import { BarChart3, Scale, Clock, Wrench, TrendingUp } from 'lucide-react';

interface DashboardState {
  uploadedVideo: {
    path: string;
    url: string;
  } | null;
  isUploading: boolean;
  uploadProgress: number;
  isAnalyzing: boolean;
  analysisStage: 'preparing' | 'analyzing' | 'generating' | 'complete' | null;
  feedback: string | null;
  error: string | null;
  showUploadBox: boolean;
  feedbackHistory: FeedbackSession[];
  selectedFeedbackId: string | null;
  isLoadingHistory: boolean;
  historyError: string | null;
  // Multi-analysis state
  analysisResults: Record<AnalysisType, string>;
  loadingStates: Record<AnalysisType, boolean>;
  completedAnalyses: Record<AnalysisType, boolean>;
  activeAnalysisType: AnalysisType | null;
}

export default function Dashboard({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadResetTrigger, setUploadResetTrigger] = useState(0);
  const uploadBoxRef = useRef<HTMLDivElement>(null);
  
  const [state, setState] = useState<DashboardState>({
    uploadedVideo: null,
    isUploading: false,
    uploadProgress: 0,
    isAnalyzing: false,
    analysisStage: null,
    feedback: null,
    error: null,
    showUploadBox: false,
    feedbackHistory: [],
    selectedFeedbackId: null,
    isLoadingHistory: false,
    historyError: null,
    // Multi-analysis state
    analysisResults: {} as Record<AnalysisType, string>,
    loadingStates: {} as Record<AnalysisType, boolean>,
    completedAnalyses: {} as Record<AnalysisType, boolean>,
    activeAnalysisType: null,
  });

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/');
          return;
        }

        setUserId(session.user.id);
        setUserEmail(session.user.email || null);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Clear completion stage after 5 seconds
  useEffect(() => {
    if (state.analysisStage === 'complete') {
      const timer = setTimeout(() => {
        setState((prev) => ({
          ...prev,
          analysisStage: null,
        }));
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [state.analysisStage]);

  // Fetch feedback history function
  const fetchFeedbackHistory = async () => {
    if (!userId) return;
    
    setState(prev => ({ ...prev, isLoadingHistory: true }));
    
    try {
      // Determine limit based on screen size
      // Mobile (<768px): 5 items, Desktop (>=768px): 10 items
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const limit = isMobile ? 5 : 10;
      
      const { data, error } = await supabase
        .from('feedback_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      
      setState(prev => ({
        ...prev,
        feedbackHistory: data || [],
        isLoadingHistory: false,
        historyError: null,
      }));
    } catch (error) {
      console.error('Error fetching feedback history:', error);
      setState(prev => ({
        ...prev,
        isLoadingHistory: false,
        historyError: 'Failed to load feedback history',
      }));
    }
  };

  // Fetch feedback history when userId is available
  useEffect(() => {
    fetchFeedbackHistory();
  }, [userId]);

  // Refetch feedback history on window resize (mobile <-> desktop transition)
  useEffect(() => {
    let previousIsMobile = typeof window !== 'undefined' && window.innerWidth < 768;
    
    const handleResize = () => {
      const currentIsMobile = window.innerWidth < 768;
      // Only refetch if we crossed the mobile/desktop threshold
      if (currentIsMobile !== previousIsMobile) {
        previousIsMobile = currentIsMobile;
        fetchFeedbackHistory();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [userId]);

  const handleLogout = async () => {
    console.log('[Dashboard] Logout initiated');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[Dashboard] Logout error from Supabase:', error);
        throw error;
      }
      console.log('[Dashboard] Logout successful, redirecting to home');
      router.push('/');
    } catch (error) {
      console.error('[Dashboard] Logout error:', error);
      // Force redirect even if signOut fails
      router.push('/');
    }
  };

  const handleSelectFeedback = async (session: FeedbackSession) => {
    // Update state to set selected feedback and clear upload mode
    setState(prev => ({
      ...prev,
      selectedFeedbackId: session.id,
      feedback: session.feedback_text,
      uploadedVideo: null,
      showUploadBox: false,
      error: null,
      // Set active analysis type from the session
      activeAnalysisType: session.analysis_type,
      // Clear multi-analysis state (viewing history, not analyzing new video)
      analysisResults: {} as Record<AnalysisType, string>,
      loadingStates: {} as Record<AnalysisType, boolean>,
      completedAnalyses: {} as Record<AnalysisType, boolean>,
    }));

    // Generate pre-signed URL for the video
    try {
      // Get current session for auth token
      const { data: { session: authSession } } = await supabase.auth.getSession();
      
      if (!authSession) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/preview-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authSession.access_token}`,
        },
        body: JSON.stringify({ s3Key: session.video_path }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load video preview');
      }

      // Update uploadedVideo state with path and URL
      setState(prev => ({
        ...prev,
        uploadedVideo: {
          path: session.video_path,
          url: data.previewUrl,
        },
      }));
    } catch (error) {
      console.error('Error loading video preview:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load video preview. Please try again.',
      }));
    }

    // Close mobile sidebar after selection (check window width < 1024px)
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      // Trigger sidebar close - this will be handled by DashboardLayout
      const event = new CustomEvent('closeMobileSidebar');
      window.dispatchEvent(event);
    }
  };

  const handleUploadComplete = (videoPath: string, videoUrl: string) => {
    console.log('✅ Upload complete!');
    console.log('S3 Key (path):', videoPath);
    console.log('S3 URL:', videoUrl);
    
    setState((prev) => ({
      ...prev,
      uploadedVideo: { path: videoPath, url: videoUrl },
      isUploading: false,
      uploadProgress: 100,
      error: null,
      showUploadBox: true, // Keep upload box visible after upload
    }));
  };

  const handleUploadProgress = (progress: number) => {
    setState((prev) => ({
      ...prev,
      uploadProgress: progress,
      isUploading: progress < 100,
    }));
  };

  const handleUploadError = (error: string) => {
    setState((prev) => ({
      ...prev,
      error,
      isUploading: false,
      uploadProgress: 0,
    }));
  };

  const handleUploadClick = () => {
    // Clear selected feedback when entering upload mode
    setState((prev) => ({
      ...prev,
      showUploadBox: true,
      selectedFeedbackId: null,
      uploadedVideo: null,
      feedback: null,
      error: null,
      // Clear multi-analysis state
      analysisResults: {} as Record<AnalysisType, string>,
      loadingStates: {} as Record<AnalysisType, boolean>,
      completedAnalyses: {} as Record<AnalysisType, boolean>,
      activeAnalysisType: null,
    }));
    
    // Trigger upload box reset
    setUploadResetTrigger(prev => prev + 1);
    
    // Scroll to upload box after it's rendered
    setTimeout(() => {
      if (uploadBoxRef.current) {
        uploadBoxRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleMyVideosClick = () => {
    // Clear selection and show upload interface
    setState((prev) => ({
      ...prev,
      selectedFeedbackId: null,
      showUploadBox: false,
      uploadedVideo: null,
      feedback: null,
      error: null,
      // Clear multi-analysis state
      analysisResults: {} as Record<AnalysisType, string>,
      loadingStates: {} as Record<AnalysisType, boolean>,
      completedAnalyses: {} as Record<AnalysisType, boolean>,
      activeAnalysisType: null,
    }));
  };

  const handleAnalyze = async (analysisType: AnalysisType) => {
    if (!state.uploadedVideo || !userId) {
      return;
    }

    // If already generated, just display it
    if (state.analysisResults[analysisType]) {
      setState((prev) => ({
        ...prev,
        activeAnalysisType: analysisType,
        feedback: prev.analysisResults[analysisType],
        error: null,
      }));
      return;
    }

    // Set loading state for this specific analysis type
    setState((prev) => ({
      ...prev,
      loadingStates: { ...prev.loadingStates, [analysisType]: true },
      activeAnalysisType: analysisType,
      error: null,
    }));

    try {
      // Get current session for auth token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Authentication required');
      }

      // Create AbortController for timeout handling (5 minutes)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          userId,
          videoPath: state.uploadedVideo.path,
          analysisType,
        }),
        signal: controller.signal,
      });

      // Clear timeout
      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze video');
      }

      // Store result and mark as completed
      setState((prev) => ({
        ...prev,
        analysisResults: { ...prev.analysisResults, [analysisType]: data.feedback },
        completedAnalyses: { ...prev.completedAnalyses, [analysisType]: true },
        loadingStates: { ...prev.loadingStates, [analysisType]: false },
        feedback: data.feedback,
        selectedFeedbackId: data.feedbackSessionId,
        error: null,
      }));

      // Refresh feedback history to show the new feedback at the top
      await fetchFeedbackHistory();
    } catch (error) {
      console.error('Analysis error:', error);
      
      // Check if it's a timeout error
      const isTimeout = error instanceof Error && error.name === 'AbortError';
      const errorMessage = isTimeout 
        ? 'Analysis is taking longer than expected. Please try again with a shorter video.'
        : error instanceof Error ? error.message : 'Failed to analyze video. Please try again.';
      
      setState((prev) => ({
        ...prev,
        loadingStates: { ...prev.loadingStates, [analysisType]: false },
        error: errorMessage,
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-slate-300">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout 
      userEmail={userEmail} 
      onLogout={handleLogout}
      feedbackHistory={state.feedbackHistory}
      selectedFeedbackId={state.selectedFeedbackId}
      onSelectFeedback={handleSelectFeedback}
      isLoadingHistory={state.isLoadingHistory}
      onMyVideosClick={handleMyVideosClick}
    >
      <MainHeader
        title="Your Videos"
        subtitle="Upload and analyze your public speaking performances"
        onUploadClick={handleUploadClick}
        onMenuClick={onMenuClick}
      />

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {/* Conditional rendering: Show EmptyState when no video and upload box not shown, otherwise show upload/video components */}
        <AnimatePresence mode="wait">
          {!state.uploadedVideo && !state.isUploading && !state.showUploadBox && !state.feedback ? (
            <EmptyState key="empty-state" onUploadClick={handleUploadClick} />
          ) : (
            <motion.div
              key={`content-${state.showUploadBox ? 'upload' : state.selectedFeedbackId || 'default'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="space-y-8 max-w-5xl mx-auto"
            >
            {/* Upload Section - Only show when explicitly requested or during upload */}
            {(state.showUploadBox || state.isUploading) && (
              <div ref={uploadBoxRef}>
                <SlideUp delay={0.1}>
                  <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-lg p-6 hover:border-white/30 hover:shadow-xl transition-all duration-300">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Upload Video
                    </h3>
                    <UploadBox
                      onUploadComplete={handleUploadComplete}
                      onUploadProgress={handleUploadProgress}
                      onError={handleUploadError}
                      resetTrigger={uploadResetTrigger}
                    />
                  </div>
                </SlideUp>
              </div>
            )}

            {/* Video Preview Section */}
            {state.uploadedVideo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <VideoPreview
                  videoUrl={state.uploadedVideo.url}
                  videoPath={state.uploadedVideo.path}
                />

                {/* Analysis Button Grid */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 }}
                  className="mt-6"
                >
                  <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-lg p-6 hover:border-white/30 transition-all duration-300">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Choose Analysis Type
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <AnalysisButton
                        type="executive_summary"
                        label={ANALYSIS_LABELS.executive_summary.label}
                        icon={<BarChart3 />}
                        description={ANALYSIS_LABELS.executive_summary.description}
                        onClick={() => handleAnalyze('executive_summary')}
                        loading={state.loadingStates.executive_summary || false}
                        completed={state.completedAnalyses.executive_summary || false}
                        active={state.activeAnalysisType === 'executive_summary'}
                      />
                      <AnalysisButton
                        type="strengths_failures"
                        label={ANALYSIS_LABELS.strengths_failures.label}
                        icon={<Scale />}
                        description={ANALYSIS_LABELS.strengths_failures.description}
                        onClick={() => handleAnalyze('strengths_failures')}
                        loading={state.loadingStates.strengths_failures || false}
                        completed={state.completedAnalyses.strengths_failures || false}
                        active={state.activeAnalysisType === 'strengths_failures'}
                      />
                      <AnalysisButton
                        type="timewise_analysis"
                        label={ANALYSIS_LABELS.timewise_analysis.label}
                        icon={<Clock />}
                        description={ANALYSIS_LABELS.timewise_analysis.description}
                        onClick={() => handleAnalyze('timewise_analysis')}
                        loading={state.loadingStates.timewise_analysis || false}
                        completed={state.completedAnalyses.timewise_analysis || false}
                        active={state.activeAnalysisType === 'timewise_analysis'}
                      />
                      <AnalysisButton
                        type="action_fixes"
                        label={ANALYSIS_LABELS.action_fixes.label}
                        icon={<Wrench />}
                        description={ANALYSIS_LABELS.action_fixes.description}
                        onClick={() => handleAnalyze('action_fixes')}
                        loading={state.loadingStates.action_fixes || false}
                        completed={state.completedAnalyses.action_fixes || false}
                        active={state.activeAnalysisType === 'action_fixes'}
                      />
                      <AnalysisButton
                        type="visualizations"
                        label={ANALYSIS_LABELS.visualizations.label}
                        icon={<TrendingUp />}
                        description={ANALYSIS_LABELS.visualizations.description}
                        onClick={() => handleAnalyze('visualizations')}
                        loading={state.loadingStates.visualizations || false}
                        completed={state.completedAnalyses.visualizations || false}
                        active={state.activeAnalysisType === 'visualizations'}
                      />
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Feedback Section */}
            {state.feedback && state.activeAnalysisType && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <FeedbackCard
                  feedback={state.feedback}
                  isLoading={state.loadingStates[state.activeAnalysisType] || false}
                  analysisType={state.activeAnalysisType}
                  analysisLabel={ANALYSIS_LABELS[state.activeAnalysisType]?.label}
                />
              </motion.div>
            )}

            {/* Error Display */}
            {state.error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <div className="backdrop-blur-lg bg-red-500/10 border border-red-500/50 rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    <svg
                      className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <p className="text-sm text-red-200 flex-1">{state.error}</p>
                  </div>
                </div>
              </motion.div>
            )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
