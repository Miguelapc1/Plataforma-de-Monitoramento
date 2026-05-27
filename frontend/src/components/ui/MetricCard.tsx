import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface Props { label: string; value: string | ReactNode; sub?: string; color?: string; className?: string; }

export default function MetricCard({ label, value, sub, color, className }: Props) {
  return (
    <div className={cn('bg-[#111118] border border-[#1e1e2a] rounded-xl p-4', className)}>
      <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">{label}</p>
      <div className={cn('text-2xl font-bold', color || 'text-white')}>{value}</div>
      {sub && <p className="text-xs text-gray-600 mt-1">{sub}</p>}
    </div>
  );
}
