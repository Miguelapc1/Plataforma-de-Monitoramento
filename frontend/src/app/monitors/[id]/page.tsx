'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { monitorsApi } from '@/lib/api';
import { Monitor, Check, Incident, Metrics } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/useWebSocket';
import Navbar from '@/components/layout/Navbar';
import StatusBadge from '@/components/ui/StatusBadge';
import MetricCard from '@/components/ui/MetricCard';
import { Skeleton } from '@/components/ui/Skeleton';
import ResponseTimeChart from '@/components/charts/ResponseTimeChart';
import UptimeHeatmap from '@/components/charts/UptimeHeatmap';
import { formatRelativeTime, formatMs, formatDuration, cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const CAUSE_LABELS: Record<string, string> = {
  timeout: 'Timeout', http_500: 'HTTP 500', http_503: 'HTTP 503',
  dns_failure: 'DNS Failure', connection_refused: 'Connection Refused',
  network_error: 'Network Error', ssrf_blocked: 'SSRF Blocked', invalid_url: 'Invalid URL',
};

export default function MonitorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [monitor, setMonitor] = useState<Monitor | null>(null);
  const [checks, setChecks] = useState<Check[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview'|'incidents'|'checks'>('overview');

  useEffect(() => { if (!authLoading && !user) router.push('/login'); }, [user, authLoading]);

  const fetchAll = useCallback(async () => {
    try {
      const [mRes, cRes, iRes, meRes] = await Promise.all([
        monitorsApi.get(id), monitorsApi.checks(id, 24),
        monitorsApi.incidents(id), monitorsApi.metrics(id),
      ]);
      setMonitor(mRes.data);
      setChecks(cRes.data);
      setIncidents(iRes.data);
      setMetrics(meRes.data);
    } catch { toast.error('Failed to load monitor data'); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { const t = setInterval(fetchAll, 30000); return () => clearInterval(t); }, [fetchAll]);

  const handleWsUpdate = useCallback((data: any) => {
    if (data.monitorId !== id) return;
    setMonitor(prev => prev ? { ...prev, status: { ...prev.status!, currentStatus: data.status, lastHttpStatus: data.httpStatus, lastResponseTime: data.responseTime, lastCheckAt: data.checkedAt } } : prev);
  }, [id]);
  useWebSocket(handleWsUpdate);

  if (authLoading || loading) return (
    <div className="min-h-screen bg-[#0a0a0f]"><Navbar />
      <main className="max-w-5xl mx-auto px-6 pt-20 pb-12">
        <div className="mt-6 space-y-4">{Array.from({length:4}).map((_,i)=><Skeleton key={i} className="h-24 rounded-xl" />)}</div>
      </main>
    </div>
  );

  if (!monitor) return null;
  const s = monitor.status;
  const status = s?.currentStatus || 'unknown';
  const ENV_COLOR: Record<string,string> = { production:'text-blue-400', staging:'text-purple-400', homologation:'text-yellow-500' };

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 pt-20 pb-16">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-600 mt-6 mb-6">
          <Link href="/dashboard" className="hover:text-gray-300 transition-colors">Dashboard</Link>
          <span>/</span>
          <span className="text-gray-400">{monitor.name}</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-white">{monitor.name}</h1>
              <StatusBadge status={status} />
              <span className={cn('text-xs font-medium px-2 py-0.5 rounded border border-[#1e1e2a]', ENV_COLOR[monitor.environment] || 'text-gray-400')}>
                {monitor.environment}
              </span>
            </div>
            <p className="text-sm text-gray-500 font-mono">{monitor.url}</p>
            {monitor.description && <p className="text-sm text-gray-600 mt-1">{monitor.description}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => { monitorsApi.update(id, { isActive: !monitor.isActive }).then(() => { toast.success(monitor.isActive ? 'Monitor paused' : 'Monitor resumed'); fetchAll(); }); }}
              className="text-xs border border-[#1e1e2a] text-gray-400 hover:text-white px-3 py-1.5 rounded-lg transition-colors">
              {monitor.isActive ? 'Pause' : 'Resume'}
            </button>
            <button onClick={() => { if (confirm('Delete this monitor?')) monitorsApi.delete(id).then(() => { toast.success('Deleted'); router.push('/dashboard'); }); }}
              className="text-xs border border-red-500/20 text-red-400 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors">
              Delete
            </button>
          </div>
        </div>

        {/* Top metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <MetricCard label="Response Time" value={formatMs(s?.lastResponseTime)} sub={`HTTP ${s?.lastHttpStatus || '—'}`}
            color={s?.lastResponseTime && s.lastResponseTime > 1000 ? 'text-yellow-400' : 'text-emerald-400'} />
          <MetricCard label="Last Check" value={formatRelativeTime(s?.lastCheckAt || null)}
            sub={`Every ${monitor.checkInterval}s`} />
          <MetricCard label="Uptime 24h"
            value={metrics?.uptime24h != null ? `${metrics.uptime24h.toFixed(2)}%` : '—'}
            color={!metrics?.uptime24h || metrics.uptime24h > 99 ? 'text-emerald-400' : metrics.uptime24h > 95 ? 'text-yellow-400' : 'text-red-400'} />
          <MetricCard label="Uptime 7d"
            value={metrics?.uptime7d != null ? `${metrics.uptime7d.toFixed(2)}%` : '—'}
            color={!metrics?.uptime7d || metrics.uptime7d > 99 ? 'text-emerald-400' : metrics.uptime7d > 95 ? 'text-yellow-400' : 'text-red-400'} />
        </div>

        {/* Advanced metrics */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-8">
          {[
            { label: 'Avg Response', value: formatMs(metrics?.avgResponseTime) },
            { label: 'P95', value: formatMs(metrics?.p95ResponseTime) },
            { label: 'Best', value: formatMs(metrics?.minResponseTime) },
            { label: 'Worst', value: formatMs(metrics?.maxResponseTime) },
            { label: 'MTTR', value: formatDuration(metrics?.mttr ?? null) }, // Adicionado ?? null
            { label: 'MTBF', value: formatDuration(metrics?.mtbf ?? null) }, // Adicionado ?? null
          ].map(m => (
            <div key={m.label} className="bg-[#111118] border border-[#1e1e2a] rounded-xl p-3 text-center">
              <p className="text-xs text-gray-600 mb-1">{m.label}</p>
              <p className="text-sm font-semibold text-white font-mono">{m.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 border-b border-[#1e1e2a]">
          {(['overview','incidents','checks'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px', tab === t ? 'border-emerald-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300')}>
              {t}
              {t === 'incidents' && incidents.length > 0 && <span className="ml-1.5 bg-red-500/20 text-red-400 text-xs px-1.5 py-0.5 rounded-full">{incidents.length}</span>}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-[#111118] border border-[#1e1e2a] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Response Time — Last 24h</h3>
              <ResponseTimeChart checks={checks} />
            </div>
            <div className="bg-[#111118] border border-[#1e1e2a] rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Availability Heatmap — Last 7 days</h3>
              <UptimeHeatmap checks={checks} />
            </div>
          </div>
        )}

        {tab === 'incidents' && (
          <div className="space-y-3 animate-fade-in">
            {incidents.length === 0 ? (
              <div className="text-center py-16 text-gray-600 text-sm">No incidents recorded</div>
            ) : incidents.map(inc => (
              <div key={inc.id} className="bg-[#111118] border border-[#1e1e2a] rounded-xl p-4 flex items-start gap-4">
                <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', inc.isResolved ? 'bg-emerald-500' : 'bg-red-500 status-dot-critical')} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('text-xs font-medium px-2 py-0.5 rounded border', inc.isResolved ? 'bg-gray-700/30 text-gray-400 border-gray-700' : 'bg-red-500/10 text-red-400 border-red-500/20')}>
                      {inc.isResolved ? 'Resolved' : 'Active'}
                    </span>
                    <span className="text-xs text-gray-500">{CAUSE_LABELS[inc.cause || ''] || inc.cause || 'Unknown'}</span>
                    {inc.duration && <span className="text-xs text-gray-600">Duration: {formatDuration(inc.duration)}</span>}
                  </div>
                  <p className="text-sm text-gray-400 truncate">{inc.details || 'No details'}</p>
                  <div className="flex gap-4 mt-1 text-xs text-gray-600">
                    <span>Started: {new Date(inc.startedAt).toLocaleString()}</span>
                    {inc.resolvedAt && <span>Resolved: {new Date(inc.resolvedAt).toLocaleString()}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'checks' && (
          <div className="bg-[#111118] border border-[#1e1e2a] rounded-xl overflow-hidden animate-fade-in">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-[#1e1e2a]">
                {['Time','Status','HTTP','Response Time','DNS','Error'].map(h => (
                  <th key={h} className="text-left text-xs text-gray-500 font-medium px-4 py-3">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {checks.slice(0,50).map(c => (
                  <tr key={c.id} className="border-b border-[#1e1e2a]/50 hover:bg-white/2">
                    <td className="px-4 py-2.5 text-gray-400 font-mono text-xs">{new Date(c.checkedAt).toLocaleTimeString()}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={c.status} /></td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{c.httpStatus || '—'}</td>
                    <td className={cn('px-4 py-2.5 font-mono text-xs', c.responseTime && c.responseTime > 1000 ? 'text-yellow-400' : 'text-gray-300')}>{formatMs(c.responseTime)}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{formatMs(c.dnsTime)}</td>
                    <td className="px-4 py-2.5 text-xs text-red-400 truncate max-w-xs">{c.errorMessage || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
