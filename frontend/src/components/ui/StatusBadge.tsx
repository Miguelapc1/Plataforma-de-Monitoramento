import { cn, STATUS_BADGE } from '@/lib/utils';

interface Props { status: string; className?: string; }

const LABELS: Record<string, string> = {
  healthy: 'Healthy', warning: 'Warning', degraded: 'Degraded',
  critical: 'Critical', offline: 'Offline', unknown: 'Unknown',
};

export default function StatusBadge({ status, className }: Props) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium', STATUS_BADGE[status] || STATUS_BADGE.unknown, className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', `status-dot-${status}`)} />
      {LABELS[status] || status}
    </span>
  );
}
