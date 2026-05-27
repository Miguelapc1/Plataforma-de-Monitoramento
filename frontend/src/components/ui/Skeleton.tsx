import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse bg-[#1e1e2a] rounded', className)} />;
}

export function MonitorCardSkeleton() {
  return (
    <div className="bg-[#111118] border border-[#1e1e2a] rounded-xl p-5 space-y-3">
      <div className="flex items-start justify-between">
        <div className="space-y-2"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-48" /></div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="flex gap-4"><Skeleton className="h-3 w-16" /><Skeleton className="h-3 w-16" /><Skeleton className="h-3 w-16" /></div>
      <Skeleton className="h-10 w-full rounded" />
    </div>
  );
}
