'use client';
import { useState, FormEvent } from 'react';
import { monitorsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface Props { onClose: () => void; onCreated: () => void; }

export default function AddMonitorModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    name: '', url: '', environment: 'production', checkInterval: 60,
    timeout: 30, method: 'GET', expectedStatus: 200, tags: '', description: '',
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await monitorsApi.create({
        ...form,
        checkInterval: Number(form.checkInterval),
        timeout: Number(form.timeout),
        expectedStatus: Number(form.expectedStatus),
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      });
      toast.success('Monitor created!');
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create monitor');
    } finally { setLoading(false); }
  }

  const field = 'bg-[#0a0a0f] border border-[#1e1e2a] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50 w-full';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111118] border border-[#1e1e2a] rounded-2xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#1e1e2a]">
          <h2 className="text-base font-semibold text-white">Add Monitor</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl leading-none">×</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div><label className="text-xs text-gray-400 mb-1 block">Name *</label>
            <input className={field} placeholder="My API" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          <div><label className="text-xs text-gray-400 mb-1 block">URL *</label>
            <input className={field} placeholder="https://api.example.com/health" value={form.url} onChange={e => setForm({...form, url: e.target.value})} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-400 mb-1 block">Environment</label>
              <select className={field} value={form.environment} onChange={e => setForm({...form, environment: e.target.value})}>
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="homologation">Homologation</option>
              </select>
            </div>
            <div><label className="text-xs text-gray-400 mb-1 block">Method</label>
              <select className={field} value={form.method} onChange={e => setForm({...form, method: e.target.value})}>
                <option>GET</option><option>POST</option><option>HEAD</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs text-gray-400 mb-1 block">Interval (s)</label>
              <input type="number" className={field} min={30} max={3600} value={form.checkInterval} onChange={e => setForm({...form, checkInterval: +e.target.value})} />
            </div>
            <div><label className="text-xs text-gray-400 mb-1 block">Timeout (s)</label>
              <input type="number" className={field} min={5} max={60} value={form.timeout} onChange={e => setForm({...form, timeout: +e.target.value})} />
            </div>
            <div><label className="text-xs text-gray-400 mb-1 block">Expected Status</label>
              <input type="number" className={field} value={form.expectedStatus} onChange={e => setForm({...form, expectedStatus: +e.target.value})} />
            </div>
          </div>
          <div><label className="text-xs text-gray-400 mb-1 block">Tags (comma-separated)</label>
            <input className={field} placeholder="api, prod, critical" value={form.tags} onChange={e => setForm({...form, tags: e.target.value})} />
          </div>
          <div><label className="text-xs text-gray-400 mb-1 block">Description</label>
            <textarea className={cn(field, 'resize-none')} rows={2} value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>
        </form>
        <div className="flex gap-3 p-6 border-t border-[#1e1e2a]">
          <button onClick={onClose} className="flex-1 border border-[#1e1e2a] text-gray-400 hover:text-white text-sm font-medium rounded-lg py-2 transition-colors">Cancel</button>
          <button onClick={handleSubmit as any} disabled={loading} className="flex-1 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-sm font-semibold rounded-lg py-2 transition-colors">
            {loading ? 'Creating...' : 'Create Monitor'}
          </button>
        </div>
      </div>
    </div>
  );
}
