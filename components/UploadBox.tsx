'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { validateFile } from '@/utils/validation';

interface UploadBoxProps {
  onUploadComplete: (videoPath: string, videoUrl: string) => void;
  onUploadProgress: (progress: number) => void;
  onError: (error: string) => void;
}

export default function UploadBox({
  onUploadComplete,
  onUploadProgress,
  onError,
}: UploadBoxProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
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

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = async (file: File) => {
    // Clear previous errors
    setValidationError(null);

    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setValidationError(validation.error || 'Invalid file');
      onError(validation.error || 'Invalid file');
      return;
    }

    // Start upload
    await uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    onUploadProgress(0);

    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }

      // Step 1: Get pre-signed upload URL from our API
      const uploadUrlResponse = await fetch('/api/upload-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ fileName: file.name }),
      });

      if (!uploadUrlResponse.ok) {
        throw new Error('Failed to get upload URL');
      }

      const { uploadUrl, s3Key } = await uploadUrlResponse.json();

      // Step 2: Upload file directly to S3 using pre-signed URL with progress tracking
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentComplete);
          onUploadProgress(percentComplete);
        }
      });

      // Handle upload completion
      await new Promise<void>((resolve, reject) => {
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'));
        });

        xhr.open('PUT', uploadUrl);
        xhr.setRequestHeader('Content-Type', 'video/mp4');
        xhr.send(file);
      });

      // Ensure progress is at 100%
      setUploadProgress(100);
      onUploadProgress(100);

      // Step 3: Get a signed download URL for video preview
      const previewUrlResponse = await fetch('/api/preview-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ s3Key }),
      });

      if (!previewUrlResponse.ok) {
        throw new Error('Failed to get preview URL');
      }

      const { previewUrl } = await previewUrlResponse.json();

      // Notify parent component of successful upload with preview URL
      onUploadComplete(s3Key, previewUrl);
      
    } catch (error: any) {
      const errorMessage = error.message || 'Upload failed. Please try again.';
      setValidationError(errorMessage);
      onError(errorMessage);
      setUploadProgress(0);
      onUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div className="w-full">
      <div
        className={`
          border-2 border-dashed rounded-lg p-12 text-center
          transition-colors cursor-pointer
          ${isDragging 
            ? 'border-primary-500 bg-primary-50' 
            : 'border-gray-300 hover:border-primary-400'
          }
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {/* Cloud Icon */}
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>

        {isUploading ? (
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Uploading...</p>
            <div className="w-full bg-gray-200 rounded-full h-2 max-w-md mx-auto">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">{uploadProgress}%</p>
          </div>
        ) : (
          <>
            <p className="mt-2 text-sm text-gray-600">
              Drag and drop your MP4 file here, or click to browse
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Maximum file size: 250MB
            </p>
          </>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isUploading}
        />
      </div>

      {/* Validation Error Message */}
      {validationError && (
        <div className="mt-4 p-3 bg-error-50 border border-error-200 rounded-md">
          <p className="text-sm text-error-600">{validationError}</p>
        </div>
      )}

      {/* Success Message */}
      {uploadProgress === 100 && !isUploading && !validationError && (
        <div className="mt-4 p-3 bg-success-50 border border-success-200 rounded-md">
          <p className="text-sm text-success-600">Uploaded Successfully</p>
        </div>
      )}
    </div>
  );
}
