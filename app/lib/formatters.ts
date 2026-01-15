/**
 * Formatting utilities for displaying data in the UI
 * Handles currency, dates, file sizes, and other common formats
 */

/**
 * Format a number as British pounds currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a date in en-GB locale
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
}

/**
 * Format date and time together
 */
export function formatDateTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Format bytes as human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
}

/**
 * Format a number with thousand separators
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("en-GB").format(Math.round(num));
}

/**
 * Format percentage with optional decimal places
 */
export function formatPercent(value: number, decimals: number = 0): string {
  return (
    (Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)).toFixed(decimals) + "%"
  );
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return formatDate(d);
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
}

/**
 * Format address in UK format
 */
export function formatAddress(address: {
  line1: string;
  line2?: string;
  city: string;
  postcode: string;
}): string {
  const parts = [address.line1];
  if (address.line2) parts.push(address.line2);
  parts.push(address.city);
  parts.push(address.postcode);
  return parts.join(", ");
}

/**
 * Format risk score with color coding
 */
export function formatRiskScore(score: number): { score: string; color: string; level: string } {
  if (score < 33) {
    return { score: score.toFixed(0), color: "green", level: "Low" };
  }
  if (score < 67) {
    return { score: score.toFixed(0), color: "amber", level: "Medium" };
  }
  return { score: score.toFixed(0), color: "red", level: "High" };
}

/**
 * Format GDV (Gross Development Value) with currency
 */
export function formatGDV(gdv: number): string {
  if (gdv >= 1000000) {
    return `£${(gdv / 1000000).toFixed(1)}M`;
  }
  if (gdv >= 1000) {
    return `£${(gdv / 1000).toFixed(0)}K`;
  }
  return formatCurrency(gdv);
}

/**
 * Format site reference/code for display
 */
export function formatSiteReference(ref: string): string {
  return ref.toUpperCase().replace(/-/g, " ");
}
