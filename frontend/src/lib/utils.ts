import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

export function formatRelativeTime(date: string | Date | null): string {
  if (!date) return 'Never';
  const diff = Date.now() - new Date(date).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function formatDuration(seconds: number | null): string {
  if (!seconds) return '-';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

export function formatMs(ms: number | null | undefined): string {
  if (ms == null) return '-';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export const STATUS_COLORS: Record<string, string> = {
  healthy: '#00d084', warning: '#f5a623', degraded: '#ff8c42',
  critical: '#ff4757', offline: '#374151', unknown: '#374151',
};

export const STATUS_BADGE: Record<string, string> = {
  healthy: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  warning: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  degraded: 'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  critical: 'bg-red-500/10 text-red-400 border border-red-500/20',
  offline: 'bg-gray-700/30 text-gray-400 border border-gray-700/40',
  unknown: 'bg-gray-800/30 text-gray-500 border border-gray-800/40',
};

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || STATUS_COLORS.unknown;
}
