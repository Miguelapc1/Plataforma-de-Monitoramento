'use client';
import { Check } from '@/types';
import { getStatusColor } from '@/lib/utils';

interface Props { checks: Check[]; }

export default function UptimeHeatmap({ checks }: Props) {
  // Group by hour for last 7 days = 168 buckets
  const buckets: Record<string, { up: number; total: number; status: string }> = {};
  const now = Date.now();
  for (let i = 167; i >= 0; i--) {
    const hour = new Date(now - i * 3600 * 1000);
    hour.setMinutes(0, 0, 0);
    buckets[hour.toISOString()] = { up: 0, total: 0, status: 'unknown' };
  }

  checks.forEach((c) => {
    const h = new Date(c.checkedAt);
    h.setMinutes(0, 0, 0);
    const key = h.toISOString();
    if (buckets[key]) {
      buckets[key].total++;
      if (c.isUp) buckets[key].up++;
    }
  });

  const cells = Object.entries(buckets).map(([time, data]) => {
    let status = 'unknown';
    if (data.total > 0) {
      const pct = data.up / data.total;
      if (pct === 1) status = 'healthy';
      else if (pct >= 0.9) status = 'warning';
      else if (pct >= 0.5) status = 'degraded';
      else if (pct > 0) status = 'critical';
      else status = 'offline';
    }
    return { time, status, pct: data.total > 0 ? (data.up / data.total * 100).toFixed(0) : null };
  });

  const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  return (
    <div>
      <div className="flex gap-0.5 flex-wrap">
        {cells.map((cell, i) => {
          const color = cell.status === 'unknown' ? '#1e1e2a' : cell.status === 'healthy' ? '#00d084' : cell.status === 'warning' ? '#f5a623' : cell.status === 'degraded' ? '#ff8c42' : cell.status === 'critical' ? '#ff4757' : '#374151';
          const opacity = cell.status === 'unknown' ? 1 : Math.max(0.3, parseInt(cell.pct || '100') / 100);
          return (
            <div key={i} title={`${new Date(cell.time).toLocaleString()} — ${cell.pct != null ? cell.pct + '% up' : 'No data'}`}
              className="w-3 h-3 rounded-sm cursor-pointer hover:scale-125 transition-transform"
              style={{ backgroundColor: color, opacity }} />
          );
        })}
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-600">
        <span>7 days ago</span><span>Now</span>
      </div>
      <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
        {[['healthy','#00d084','Up'],['warning','#f5a623','Warning'],['critical','#ff4757','Down'],['unknown','#1e1e2a','No data']].map(([s,c,l]) => (
          <span key={s} className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: c }} />
            {l}
          </span>
        ))}
      </div>
    </div>
  );
}
