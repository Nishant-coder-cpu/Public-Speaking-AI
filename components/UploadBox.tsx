'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { validateFile } from '@/utils/validation';
import { supabase } from '@/lib/supabaseClient';

interface UploadBoxProps {
  onUploadComplete: (videoPath: string, videoUrl: string) => void;
  onUploadProgress: (progress: number) => void;
  onError: (error: string) => void;
  userId: string;
}

export default function UploadBox({
  onUploadComplete,
  onUploadProgress,
  onError,
  userId,
}: UploadBoxProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // Clear previous validation error and success state
    setValidationError(null);
    setUploadSuccess(false);
    setUploadProgress(0);

    // Validate the file
    const validation = validateFile(file);
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid file');
      onError(validation.error || 'Invalid file');
      return;
    }

    // File is valid, proceed with upload
    setIsUploading(true);

    try {
      // Generate upload path: user_{userId}/{timestamp}.mp4
      const timestamp = Date.now();
      const uploadPath = `user_${userId}/${timestamp}.mp4`;

      // Simulate progress for better UX (Supabase JS client doesn't support native progress)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          const increment = Math.random() * 15;
          const newProgress = Math.min(prev + increment, 90);
          onUploadProgress(Math.round(newProgress));
          return newProgress;
        });
      }, 300);

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(uploadPath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      // Clear the progress interval
      clearInterval(progressInterval);

      if (uploadError) {
        throw uploadError;
      }

      // Set progress to 100%
      setUploadProgress(100);
      onUploadProgress(100);

      // Get public URL for the uploaded video
      const { data: urlData } = supabase.storage
        .from('videos')
        .getPublicUrl(uploadPath);

      // Mark upload as successful
      setUploadSuccess(true);
      setIsUploading(false);

      // Emit completion event
      onUploadComplete(uploadPath, urlData.publicUrl);
    } catch (error: any) {
      console.error('Upload error:', error);
      setIsUploading(false);
      setUploadProgress(0);
      const errorMessage = error.message || 'Upload failed. Please try again.';
      setValidationError(errorMessage);
      onError(errorMessage);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      <div
        onClick={!isUploading ? handleClick : undefined}
        onDragEnter={!isUploading ? handleDragEnter : undefined}
        onDragOver={!isUploading ? handleDragOver : undefined}
        onDragLeave={!isUploading ? handleDragLeave : undefined}
        onDrop={!isUploading ? handleDrop : undefined}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center 
          transition-colors
          ${
            isUploading
              ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
              : isDragging
              ? 'border-indigo-500 bg-indigo-50 cursor-pointer'
              : validationError
              ? 'border-red-300 bg-red-50 cursor-pointer'
              : uploadSuccess
              ? 'border-green-300 bg-green-50 cursor-pointer'
              : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50 cursor-pointer'
          }
        `}
      >
        {/* Cloud Upload Icon */}
        <svg
          className={`mx-auto h-12 w-12 ${
            uploadSuccess
              ? 'text-green-500'
              : validationError
              ? 'text-red-400'
              : 'text-gray-400'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          {uploadSuccess ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          )}
        </svg>

        {uploadSuccess ? (
          <p className="mt-4 text-base font-semibold text-green-600">
            Uploaded Successfully
          </p>
        ) : isUploading ? (
          <p className="mt-4 text-base text-gray-600">Uploading...</p>
        ) : (
          <>
            <p className="mt-4 text-base text-gray-600">
              <span className="font-semibold text-indigo-600">Click to upload</span> or drag and drop
            </p>
            <p className="mt-1 text-sm text-gray-500">MP4 files only, up to 150MB</p>
          </>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4"
          onChange={handleFileInput}
          className="hidden"
          disabled={isUploading}
        />
      </div>

      {/* Progress Bar */}
      {isUploading && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Uploading</span>
            <span className="text-sm font-medium text-indigo-600">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Validation Error Message */}
      {validationError && !isUploading && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600 flex items-center">
            <svg
              className="h-5 w-5 mr-2"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {validationError}
          </p>
        </div>
      )}
    </div>
  );
}
