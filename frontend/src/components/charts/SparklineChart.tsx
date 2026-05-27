'use client';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { getStatusColor, formatMs } from '@/lib/utils';
import { Check } from '@/types';

interface Props { checks: Check[]; status: string; height?: number; }

export default function SparklineChart({ checks, status, height = 40 }: Props) {
  const data = [...checks].reverse().slice(-48).map((c) => ({
    t: c.checkedAt,
    v: c.isUp ? (c.responseTime || 0) : null,
    up: c.isUp,
  }));

  if (data.length === 0) return <div className="h-10 flex items-center justify-center text-xs text-gray-700">No data</div>;

  const color = getStatusColor(status);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <defs>
          <linearGradient id={`sg-${status}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          content={({ active, payload }) => active && payload?.[0] ? (
            <div className="bg-[#0a0a0f] border border-[#1e1e2a] rounded px-2 py-1 text-xs text-white">
              {payload[0].value != null ? formatMs(payload[0].value as number) : 'Down'}
            </div>
          ) : null}
        />
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
          fill={`url(#sg-${status})`} dot={false} connectNulls={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
