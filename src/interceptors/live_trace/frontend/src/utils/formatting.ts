/**
 * Formatting utilities for names, initials, and display strings
 */

/**
 * Generate two-letter initials from an ID or name string.
 * Handles hyphenated IDs (e.g., "prompt-a8b9ef35309f" -> "PA")
 * and regular names (e.g., "Customer Agent" -> "CA")
 */
export const getInitials = (input: string): string => {
  if (!input) return '??';

  // Check if it's a hyphenated ID
  const parts = input.split('-');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  // Check if it's a space-separated name
  const words = input.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  // Fall back to first two characters
  return input.substring(0, 2).toUpperCase();
};

/**
 * Format a hyphenated ID into a readable name.
 * e.g., "prompt-a8b9ef35309f" -> "Prompt A8b9ef35309f"
 * e.g., "ant-math-agent-v7" -> "Ant Math"
 */
export const formatAgentName = (id: string): string => {
  if (!id) return '';

  return id
    .split('-')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

/**
 * Format a number with K/M suffix for compact display.
 * e.g., 1500 -> "1.5K", 1000000 -> "1M"
 */
export const formatCompactNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return num.toString();
};

/**
 * Format duration in minutes to a human-readable string.
 * e.g., 0.5 -> "<1m", 45 -> "45m", 90 -> "1h 30m"
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 1) return '<1m';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};
