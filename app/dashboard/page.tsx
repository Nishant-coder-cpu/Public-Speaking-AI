'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import UploadBox from '@/components/UploadBox';

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
  const [user, setUser] = useState<User | null>(null);
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
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/');
        return;
      }

      setUser(session.user);
      setLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.push('/');
      } else {
        setUser(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleUploadComplete = (videoPath: string, videoUrl: string) => {
    setState((prev) => ({
      ...prev,
      uploadedVideo: { path: videoPath, url: videoUrl },
      isUploading: false,
      uploadProgress: 0,
      error: null,
    }));
  };

  const handleUploadProgress = (progress: number) => {
    setState((prev) => ({
      ...prev,
      isUploading: true,
      uploadProgress: progress,
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Speaking Coach</h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, {user?.email}
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Upload Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Upload Your Video
            </h2>
            <UploadBox
              userId={user?.id || ''}
              onUploadComplete={handleUploadComplete}
              onUploadProgress={handleUploadProgress}
              onError={handleUploadError}
            />
          </div>

          {/* Video Preview Section Placeholder */}
          {state.uploadedVideo && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Video Preview
              </h2>
              <p className="text-sm text-gray-600">
                Video preview component will be integrated here
              </p>
            </div>
          )}

          {/* Feedback Section Placeholder */}
          {state.feedback && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                AI Feedback
              </h2>
              <p className="text-sm text-gray-600">
                Feedback component will be integrated here
              </p>
            </div>
          )}

          {/* Error Display */}
          {state.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <svg
                  className="h-5 w-5 text-red-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="ml-3 text-sm text-red-700">{state.error}</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
