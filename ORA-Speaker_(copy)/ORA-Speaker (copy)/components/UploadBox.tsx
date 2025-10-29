'use client';

import { useState, useRef, useEffect, DragEvent, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { validateFile } from '@/utils/validation';

interface UploadBoxProps {
  onUploadComplete: (videoPath: string, videoUrl: string) => void;
  onUploadProgress: (progress: number) => void;
  onError: (error: string) => void;
  resetTrigger?: number; // Optional prop to trigger reset from parent
}

export default function UploadBox({
  onUploadComplete,
  onUploadProgress,
  onError,
  resetTrigger,
}: UploadBoxProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset upload state when resetTrigger changes
  useEffect(() => {
    if (resetTrigger !== undefined) {
      setUploadSuccess(false);
      setValidationError(null);
      setUploadProgress(0);
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [resetTrigger]);

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
    // Clear previous errors and success state
    setValidationError(null);
    setUploadSuccess(false);

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

      // Set success state
      setUploadSuccess(true);

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
      // If upload was successful, reset state for new upload
      if (uploadSuccess) {
        setUploadSuccess(false);
        setValidationError(null);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
      fileInputRef.current?.click();
    }
  };

  // Determine the current state for styling
  const getContainerClasses = () => {
    const baseClasses = 'backdrop-blur-lg border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 focus-within:ring-2 focus-within:ring-blue-400 focus-within:ring-offset-2 focus-within:ring-offset-slate-900';
    
    if (validationError) {
      return `${baseClasses} bg-red-500/5 border-red-500/50 shadow-lg animate-shake`;
    }
    
    if (uploadSuccess) {
      return `${baseClasses} bg-green-500/5 border-green-500/50 shadow-lg`;
    }
    
    if (isUploading) {
      return `${baseClasses} bg-white/5 border-blue-500/50 shadow-lg cursor-not-allowed`;
    }
    
    if (isDragging) {
      return `${baseClasses} bg-white/10 border-blue-500/50 shadow-xl scale-[1.02]`;
    }
    
    return `${baseClasses} bg-white/5 border-white/20 hover:border-blue-500/50 hover:bg-white/10 hover:shadow-xl cursor-pointer`;
  };

  return (
    <div className="w-full">
      <motion.div
        className={getContainerClasses()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        animate={{
          scale: isDragging ? 1.02 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Icon with gradient styling - only show when not uploading */}
        {!isUploading && (
          <motion.div
            animate={{
              scale: isDragging ? 1.1 : 1,
              rotate: isDragging ? 5 : 0,
            }}
            transition={{ duration: 0.2 }}
          >
            {uploadSuccess ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <CheckCircle2 className="w-16 h-16 mx-auto text-green-400" />
              </motion.div>
            ) : validationError ? (
              <AlertCircle className="w-16 h-16 mx-auto text-red-400" />
            ) : (
              <div className="relative inline-block">
                <Upload 
                  className="w-16 h-16 mx-auto text-blue-400"
                />
                <div className="absolute inset-0 w-16 h-16 mx-auto bg-blue-400/20 blur-xl rounded-full"></div>
              </div>
            )}
          </motion.div>
        )}

        {isUploading ? (
          <div className="flex flex-col items-center justify-center py-4">
            {/* Animated upload icon with pulsing rings */}
            <div className="relative w-24 h-24 mx-auto mb-6">
              {/* Outer pulsing ring */}
              <motion.div
                className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/30 to-purple-500/30"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 0, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
              
              {/* Middle pulsing ring */}
              <motion.div
                className="absolute inset-2 rounded-full bg-gradient-to-r from-blue-500/40 to-purple-500/40"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.6, 0, 0.6],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 0.3,
                }}
              />
              
              {/* Inner circle with upload icon */}
              <motion.div
                className="absolute inset-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg"
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                <Upload className="w-8 h-8 text-white" />
              </motion.div>
              
              {/* Floating particles */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full bg-blue-400"
                  style={{
                    left: '50%',
                    top: '50%',
                  }}
                  animate={{
                    x: [0, Math.cos((i * 120 * Math.PI) / 180) * 40],
                    y: [0, Math.sin((i * 120 * Math.PI) / 180) * 40],
                    opacity: [1, 0],
                    scale: [1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'easeOut',
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
            
            <motion.p
              className="text-sm text-slate-300 mb-4"
              animate={{
                opacity: [1, 0.6, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              Uploading your video...
            </motion.p>
            
            {/* Animated gradient progress bar with shimmer */}
            <div className="w-full bg-slate-800/50 rounded-full h-3 max-w-md mx-auto overflow-hidden mb-3">
              <motion.div
                className="h-3 rounded-full relative"
                style={{
                  width: `${uploadProgress}%`,
                  background: 'linear-gradient(90deg, #3B82F6, #A855F7, #06B6D4)',
                  backgroundSize: '200% 100%',
                }}
                animate={{
                  backgroundPosition: ['0% 0%', '200% 0%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              >
                {/* Shimmer overlay */}
                <div 
                  className="absolute inset-0 opacity-50"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 2s linear infinite',
                  }}
                />
              </motion.div>
            </div>
            
            <p className="text-xs text-slate-400 font-medium">{uploadProgress}%</p>
          </div>
        ) : uploadSuccess ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4"
          >
            <p className="text-sm text-green-400 font-medium">Upload Complete!</p>
            <p className="text-xs text-slate-400 mt-1">Click to upload another video</p>
          </motion.div>
        ) : validationError ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4"
          >
            <p className="text-sm text-red-400 font-medium">Upload Failed</p>
            <p className="text-xs text-slate-400 mt-1">Click to try again</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <p className="mt-4 text-sm text-slate-300">
              Drag and drop your MP4 file here, or click to browse
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Maximum file size: 250MB
            </p>
          </motion.div>
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
      </motion.div>

      {/* Error Message with animation */}
      <AnimatePresence>
        {validationError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="mt-4 backdrop-blur-lg bg-red-500/10 border border-red-500/50 rounded-2xl p-4 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-300 font-medium">Error</p>
              <p className="text-sm text-red-200/80 mt-1">{validationError}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
