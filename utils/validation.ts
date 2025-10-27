// File validation utilities

interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a file for upload
 * Checks if the file is MP4 format and under 150MB
 */
export const validateFile = (file: File): ValidationResult => {
  // Check file type
  if (file.type !== 'video/mp4') {
    return { valid: false, error: 'Only MP4 files are supported' };
  }

  // Check file size (150MB = 150 * 1024 * 1024 bytes)
  const maxSize = 150 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 150MB' };
  }

  return { valid: true };
};
