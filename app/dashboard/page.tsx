'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import UploadBox from '@/components/UploadBox';
import VideoPreview from '@/components/VideoPreview';
import FeedbackCard from '@/components/FeedbackCard';
import { FadeIn, SlideUp } from '@/components/AnimationWrappers';
import { staggerContainer, staggerItem } from '@/lib/animations';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface DashboardState {
  uploadedVideo: {
    path: string;
    url: string;
  } | null;
  isUploading: boolean;
  uploadProgress: number;
  isAnalyzing: boolean;
  feedback: string | null;
  error: string | null;
}

export default function Dashboard() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [state, setState] = useState<DashboardState>({
    uploadedVideo: null,
    isUploading: false,
    uploadProgress: 0,
    isAnalyzing: false,
    feedback: null,
    error: null,
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

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
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

  const handleAnalyzeVideo = async () => {
    if (!state.uploadedVideo || !userId) {
      return;
    }

    // Set analyzing state
    setState((prev) => ({
      ...prev,
      isAnalyzing: true,
      error: null,
      feedback: null,
    }));

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          videoPath: state.uploadedVideo.path,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze video');
      }

      // Update state with feedback
      setState((prev) => ({
        ...prev,
        feedback: data.feedback,
        isAnalyzing: false,
        error: null,
      }));
    } catch (error) {
      console.error('Analysis error:', error);
      setState((prev) => ({
        ...prev,
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'Failed to analyze video. Please try again.',
      }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-white/10 shadow-lg transition-shadow duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              {/* User Avatar */}
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-500 flex items-center justify-center shadow-lg">
                <span className="text-white font-semibold text-sm sm:text-base">
                  {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
                </span>
              </div>
              
              {/* Title and Email */}
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-50 truncate">
                  Speaking Coach Dashboard
                </h1>
                {userEmail && (
                  <p className="text-xs sm:text-sm text-slate-300 mt-0.5 truncate">{userEmail}</p>
                )}
              </div>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex-shrink-0 px-4 py-2 text-sm font-medium text-slate-200 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all duration-200 shadow-lg hover:shadow-blue-500/20"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-8"
        >
          {/* Welcome Section */}
          <motion.div variants={staggerItem}>
            <FadeIn delay={0.1}>
              <div className="relative backdrop-blur-lg bg-white/5 rounded-2xl shadow-xl p-6 sm:p-8 overflow-hidden group hover:bg-white/10 transition-all duration-300">
                {/* Gradient Border Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ padding: '1px' }}>
                  <div className="h-full w-full rounded-2xl backdrop-blur-lg bg-slate-900/95"></div>
                </div>
                
                {/* Content */}
                <div className="relative z-10">
                  <div className="flex items-start gap-4">
                    {/* Sparkles Icon with Glow */}
                    <div className="flex-shrink-0">
                      <div className="relative">
                        <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400 drop-shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
                        <div className="absolute inset-0 blur-xl bg-blue-500/30 rounded-full"></div>
                      </div>
                    </div>
                    
                    {/* Text Content */}
                    <div className="flex-1 min-w-0">
                      <h2 className="text-2xl sm:text-3xl font-bold text-slate-50 mb-3 bg-gradient-to-r from-slate-50 via-blue-100 to-slate-50 bg-clip-text text-transparent">
                        Welcome to Your Speaking Coach
                      </h2>
                      <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                        Upload a video of your speaking practice to receive AI-powered feedback on your performance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </motion.div>

          {/* Upload Section */}
          <motion.div variants={staggerItem}>
            <SlideUp delay={0.2}>
              <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6 sm:p-8">
                <h3 className="text-lg sm:text-xl font-semibold text-slate-50 mb-6">
                  Upload Video
                </h3>
                <UploadBox
                  onUploadComplete={handleUploadComplete}
                  onUploadProgress={handleUploadProgress}
                  onError={handleUploadError}
                />
              </div>
            </SlideUp>
          </motion.div>

          {/* Video Preview Section */}
          {state.uploadedVideo && (
            <motion.div
              variants={staggerItem}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <VideoPreview
                videoUrl={state.uploadedVideo.url}
                videoPath={state.uploadedVideo.path}
              />
              
              {/* Analyze Video Button */}
              {!state.feedback && (
                <FadeIn delay={0.1}>
                  <div className="backdrop-blur-lg bg-white/5 border border-white/10 rounded-2xl shadow-xl p-6 sm:p-8 mt-8">
                    <div className="text-center">
                      <button
                        onClick={handleAnalyzeVideo}
                        disabled={state.isAnalyzing}
                        className={`px-8 py-3 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg ${
                          state.isAnalyzing
                            ? 'bg-gradient-to-r from-blue-400 to-purple-400 cursor-not-allowed opacity-70'
                            : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]'
                        }`}
                      >
                        {state.isAnalyzing ? (
                          <span className="flex items-center justify-center">
                            <svg
                              className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              ></circle>
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              ></path>
                            </svg>
                            Analyzing...
                          </span>
                        ) : (
                          'Analyze Video'
                        )}
                      </button>
                      {state.isAnalyzing && (
                        <p className="mt-4 text-sm text-slate-400">
                          Please wait while we analyze your video. This may take a moment.
                        </p>
                      )}
                    </div>
                  </div>
                </FadeIn>
              )}
            </motion.div>
          )}

          {/* Feedback Section */}
          {state.feedback && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <FeedbackCard
                feedback={state.feedback}
                isLoading={state.isAnalyzing}
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
              <div className="backdrop-blur-lg bg-red-500/10 border border-red-500/50 rounded-2xl p-4 sm:p-6 shadow-lg">
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
      </main>
    </div>
  );
}
