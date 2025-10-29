/**
 * Utility functions for feedback history management
 */

/**
 * Converts a timestamp to a human-readable relative format
 * @param dateString - ISO date string from database
 * @returns Relative time string (e.g., "2 days ago", "Just now")
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
  
  return date.toLocaleDateString();
}

/**
 * Truncates a filename to a maximum length with ellipsis
 * @param filename - Original filename
 * @param maxLength - Maximum length (default: 25)
 * @returns Truncated filename with extension preserved
 */
export function truncateFilename(filename: string, maxLength: number = 25): string {
  if (filename.length <= maxLength) return filename;

  const lastDotIndex = filename.lastIndexOf('.');
  
  // If no extension found, just truncate
  if (lastDotIndex === -1) {
    return `${filename.substring(0, maxLength - 3)}...`;
  }

  const extension = filename.substring(lastDotIndex);
  const nameWithoutExt = filename.substring(0, lastDotIndex);
  
  // Calculate available space for name (maxLength - extension length - 3 for "...")
  const availableLength = maxLength - extension.length - 3;
  
  if (availableLength <= 0) {
    // If extension is too long, just truncate the whole thing
    return `${filename.substring(0, maxLength - 3)}...`;
  }

  const truncatedName = nameWithoutExt.substring(0, availableLength);
  return `${truncatedName}...${extension}`;
}

/**
 * Extracts the original filename from an S3 path
 * S3 path format: "user_<uuid>/<timestamp>_<filename>"
 * @param s3Path - Full S3 path
 * @returns Original filename without timestamp prefix
 */
export function extractFilename(s3Path: string): string {
  // Split by "/" to get the last part
  const parts = s3Path.split('/');
  const filenameWithTimestamp = parts[parts.length - 1];
  
  // Remove timestamp prefix (e.g., "1234567890_video.mp4" -> "video.mp4")
  const underscoreIndex = filenameWithTimestamp.indexOf('_');
  
  if (underscoreIndex === -1) {
    // No timestamp prefix found, return as is
    return filenameWithTimestamp;
  }
  
  const filename = filenameWithTimestamp.substring(underscoreIndex + 1);
  return filename;
}
