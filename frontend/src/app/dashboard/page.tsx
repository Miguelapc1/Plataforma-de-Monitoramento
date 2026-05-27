'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { monitorsApi } from '@/lib/api';
import { Monitor } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useWebSocket } from '@/hooks/useWebSocket';
import Navbar from '@/components/layout/Navbar';
import MonitorCard from '@/components/monitors/MonitorCard';
import AddMonitorModal from '@/components/monitors/AddMonitorModal';
import { MonitorCardSkeleton } from '@/components/ui/Skeleton';
import toast from 'react-hot-toast';

const STATUS_ORDER = ['critical','offline','degraded','warning','unknown','healthy'];

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading]);

  const fetchMonitors = useCallback(async () => {
    try {
      const res = await monitorsApi.list();
      setMonitors(res.data);
    } catch { toast.error('Failed to load monitors'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchMonitors(); }, [fetchMonitors]);

  // Poll every 30s
  useEffect(() => {
    const t = setInterval(fetchMonitors, 30000);
    return () => clearInterval(t);
  }, [fetchMonitors]);

  // Real-time updates
  const handleWsUpdate = useCallback((data: any) => {
    setMonitors(prev => prev.map(m => m.id === data.monitorId ? {
      ...m,
      status: { ...m.status!, currentStatus: data.status, lastHttpStatus: data.httpStatus,
        lastResponseTime: data.responseTime, lastCheckAt: data.checkedAt, monitorId: m.id,
        consecutiveFailures: m.status?.consecutiveFailures || 0,
        consecutiveSuccesses: m.status?.consecutiveSuccesses || 0,
        uptime24h: m.status?.uptime24h || null, uptime7d: m.status?.uptime7d || null,
        uptime30d: m.status?.uptime30d || null, incidentCount: m.status?.incidentCount || 0,
        updatedAt: new Date().toISOString(),
      }
    } : m));
  }, []);
  useWebSocket(handleWsUpdate);

  const filtered = monitors
    .filter(m => filter === 'all' || m.status?.currentStatus === filter || (filter === 'issues' && ['critical','offline','degraded','warning'].includes(m.status?.currentStatus || '')))
    .filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()) || m.url.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => STATUS_ORDER.indexOf(a.status?.currentStatus || 'unknown') - STATUS_ORDER.indexOf(b.status?.currentStatus || 'unknown'));

  const counts = {
    healthy: monitors.filter(m => m.status?.currentStatus === 'healthy').length,
    issues: monitors.filter(m => ['critical','offline','degraded','warning'].includes(m.status?.currentStatus || '')).length,
    total: monitors.length,
  };

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <Navbar />
      <main className="max-w-screen-2xl mx-auto px-6 pt-20 pb-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 mt-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              {counts.total} monitors · {counts.healthy} healthy · {counts.issues} with issues
            </p>
          </div>
          <button onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
            <span className="text-lg leading-none">+</span> Add Monitor
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total', value: counts.total, color: 'text-white' },
            { label: 'Healthy', value: counts.healthy, color: 'text-emerald-400' },
            { label: 'Issues', value: counts.issues, color: counts.issues > 0 ? 'text-red-400' : 'text-gray-500' },
            { label: 'Inactive', value: monitors.filter(m => !m.isActive).length, color: 'text-gray-500' },
          ].map(c => (
            <div key={c.label} className="bg-[#111118] border border-[#1e1e2a] rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1">{c.label}</p>
              <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search monitors..." className="bg-[#111118] border border-[#1e1e2a] rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#2d2d3d] w-56" />
          <div className="flex gap-1">
            {[['all','All'],['issues','Issues'],['healthy','Healthy'],['offline','Offline']].map(([v,l]) => (
              <button key={v} onClick={() => setFilter(v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === v ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({length: 8}).map((_, i) => <MonitorCardSkeleton key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 text-gray-600">
            {monitors.length === 0 ? (
              <div>
                <p className="text-lg mb-2">No monitors yet</p>
                <p className="text-sm">Click "Add Monitor" to start monitoring your services</p>
              </div>
            ) : <p>No monitors match your filter</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-fade-in">
            {filtered.map(m => <MonitorCard key={m.id} monitor={m} />)}
          </div>
        )}
      </main>
      {showAdd && <AddMonitorModal onClose={() => setShowAdd(false)} onCreated={fetchMonitors} />}
    </div>
  );
}
