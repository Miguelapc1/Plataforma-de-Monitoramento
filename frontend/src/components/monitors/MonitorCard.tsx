'use client';
import Link from 'next/link';
import { Monitor } from '@/types';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatRelativeTime, formatMs, cn } from '@/lib/utils';

interface Props { monitor: Monitor; checks?: any[]; }

const ENV_COLORS: Record<string, string> = {
  production: 'text-blue-400', staging: 'text-purple-400', homologation: 'text-yellow-500',
};

export default function MonitorCard({ monitor, checks = [] }: Props) {
  const s = monitor.status;
  const status = s?.currentStatus || 'unknown';

  return (
    <Link href={`/monitors/${monitor.id}`}>
      <div className="bg-[#111118] border border-[#1e1e2a] rounded-xl p-5 hover:border-[#2d2d3d] transition-all cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <div className="min-w-0 flex-1 pr-3">
            <h3 className="font-semibold text-white text-sm truncate group-hover:text-emerald-400 transition-colors">{monitor.name}</h3>
            <p className="text-xs text-gray-600 truncate mt-0.5 font-mono">{monitor.url}</p>
          </div>
          <StatusBadge status={status} />
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <span className={cn('font-medium', ENV_COLORS[monitor.environment] || 'text-gray-400')}>
            {monitor.environment}
          </span>
          <span>HTTP {s?.lastHttpStatus || '—'}</span>
          <span className={cn(s?.lastResponseTime && s.lastResponseTime > 1000 ? 'text-yellow-400' : '')}>
            {formatMs(s?.lastResponseTime)}
          </span>
          <span className="ml-auto">{formatRelativeTime(s?.lastCheckAt || null)}</span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex-1">
            <p className="text-gray-600 mb-1">24h uptime</p>
            <div className="flex items-center gap-1.5">
              <div className="flex-1 h-1.5 bg-[#1e1e2a] rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${s?.uptime24h || 0}%`, background: (s?.uptime24h || 0) > 99 ? '#00d084' : (s?.uptime24h || 0) > 95 ? '#f5a623' : '#ff4757' }} />
              </div>
              <span className="text-gray-400 font-mono w-12 text-right">
                {s?.uptime24h != null ? `${s.uptime24h.toFixed(1)}%` : '—'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-gray-600 mb-1">Incidents</p>
            <p className={cn('font-mono font-semibold', (s?.incidentCount || 0) > 0 ? 'text-red-400' : 'text-gray-500')}>
              {s?.incidentCount || 0}
            </p>
          </div>
        </div>

        {/* Mini sparkline from checks data */}
        {checks.length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#1e1e2a]">
            <div className="flex gap-0.5 h-6 items-end">
              {checks.slice(-30).map((c, i) => (
                <div key={i} className="flex-1 rounded-sm min-h-[2px]"
                  style={{
                    height: c.isUp && c.responseTime ? `${Math.min(100, (c.responseTime / 2000) * 100)}%` : '30%',
                    background: !c.isUp ? '#ff4757' : c.responseTime > 1000 ? '#f5a623' : '#00d084',
                    opacity: 0.7,
                  }} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
