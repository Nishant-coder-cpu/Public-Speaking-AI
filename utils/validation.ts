export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const validateFile = (file: File): ValidationResult => {
  if (file.type !== 'video/mp4') {
    return { valid: false, error: 'Only MP4 files are supported' };
  }
  if (file.size > 150 * 1024 * 1024) {
    return { valid: false, error: 'File size must be less than 150MB' };
  }
  return { valid: true };
};
