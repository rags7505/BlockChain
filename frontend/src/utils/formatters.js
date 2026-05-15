// Utility functions for formatting dates and timestamps

/**
 * Format a date string or timestamp into a readable format
 * @param {string | Date} date - The date to format
 * @param {boolean} includeTime - Whether to include time in the output
 * @returns {string} Formatted date string
 */
export const formatDate = (date, includeTime = true) => {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...(includeTime && {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  };
  
  return dateObj.toLocaleString('en-US', options);
};

/**
 * Format a date into a relative time string (e.g., "2 hours ago")
 * @param {string | Date} date - The date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) return 'Invalid Date';
  
  const now = new Date();
  const diffMs = now - dateObj;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);
  
  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
  if (diffDay < 30) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
  if (diffMonth < 12) return `${diffMonth} month${diffMonth !== 1 ? 's' : ''} ago`;
  return `${diffYear} year${diffYear !== 1 ? 's' : ''} ago`;
};

/**
 * Format file size in bytes to human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Truncate a string to a maximum length with ellipsis
 * @param {string} str - The string to truncate
 * @param {number} maxLength - Maximum length before truncating
 * @returns {string} Truncated string
 */
export const truncateString = (str, maxLength = 50) => {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return `${str.substring(0, maxLength)}...`;
};

/**
 * Format blockchain transaction hash for display
 * @param {string} txHash - Transaction hash
 * @param {number} startChars - Number of characters to show at start
 * @param {number} endChars - Number of characters to show at end
 * @returns {string} Formatted transaction hash
 */
export const formatTxHash = (txHash, startChars = 10, endChars = 8) => {
  if (!txHash) return '';
  if (txHash.length <= startChars + endChars) return txHash;
  return `${txHash.slice(0, startChars)}...${txHash.slice(-endChars)}`;
};

/**
 * Get color based on evidence type
 * @param {string} type - Evidence type
 * @returns {string} Color value
 */
export const getEvidenceTypeColor = (type) => {
  const colors = {
    fingerprint: '#9c27b0', // Purple
    image: '#2196f3', // Blue
    pdf: '#f44336', // Red
    text: '#4caf50', // Green
  };
  return colors[type] || '#757575'; // Default gray
};

/**
 * Get icon name based on evidence type
 * @param {string} type - Evidence type
 * @returns {string} Icon name for Material-UI
 */
export const getEvidenceTypeIcon = (type) => {
  const icons = {
    fingerprint: 'Fingerprint',
    image: 'Image',
    pdf: 'PictureAsPdf',
    text: 'Description',
  };
  return icons[type] || 'InsertDriveFile';
};

/**
 * Validate Evidence ID format (alphanumeric with dashes and underscores)
 * @param {string} evidenceId - Evidence ID to validate
 * @returns {boolean} True if valid
 */
export const isValidEvidenceId = (evidenceId) => {
  if (!evidenceId) return false;
  // Allow alphanumeric characters, dashes, and underscores
  const regex = /^[A-Za-z0-9_-]+$/;
  return regex.test(evidenceId) && evidenceId.length >= 3 && evidenceId.length <= 100;
};

/**
 * Format action type for display
 * @param {string} action - Action type (uploaded, viewed, verified)
 * @returns {string} Formatted action string
 */
export const formatAction = (action) => {
  const actions = {
    uploaded: 'Uploaded',
    viewed: 'Viewed',
    verified: 'Verified',
  };
  return actions[action] || action;
};

/**
 * Get status badge color
 * @param {string} status - Status (verified, tampered, pending, etc.)
 * @returns {object} Color configuration for badge
 */
export const getStatusColor = (status) => {
  const colors = {
    verified: { bg: '#4caf50', text: '#fff' },
    tampered: { bg: '#f44336', text: '#fff' },
    pending: { bg: '#ff9800', text: '#000' },
    error: { bg: '#757575', text: '#fff' },
  };
  return colors[status] || colors.error;
};
