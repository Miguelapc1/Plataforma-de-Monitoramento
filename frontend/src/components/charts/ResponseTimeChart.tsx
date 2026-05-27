'use client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { Check } from '@/types';
import { formatMs } from '@/lib/utils';

interface Props { checks: Check[]; }

export default function ResponseTimeChart({ checks }: Props) {
  const data = [...checks].reverse().map((c) => ({
    time: new Date(c.checkedAt).toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
    responseTime: c.isUp ? c.responseTime : null,
    status: c.status,
    httpStatus: c.httpStatus,
    isUp: c.isUp,
  }));

  const avg = data.filter(d => d.responseTime != null).reduce((a, d, _, arr) => a + (d.responseTime! / arr.length), 0);

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="rtGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#00d084" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#00d084" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2a" vertical={false} />
        <XAxis dataKey="time" tick={{ fill: '#4b5563', fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
        <YAxis tick={{ fill: '#4b5563', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}ms`} width={50} />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.[0]) return null;
            const d = payload[0].payload;
            return (
              <div className="bg-[#111118] border border-[#1e1e2a] rounded-lg p-3 text-xs space-y-1 shadow-xl">
                <p className="text-gray-400">{label}</p>
                {d.isUp ? (
                  <>
                    <p className="text-white font-medium">{formatMs(d.responseTime)}</p>
                    <p className="text-gray-500">HTTP {d.httpStatus}</p>
                  </>
                ) : (
                  <p className="text-red-400 font-medium">Down — HTTP {d.httpStatus || 'N/A'}</p>
                )}
              </div>
            );
          }}
        />
        {avg > 0 && <ReferenceLine y={avg} stroke="#f5a623" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: `avg ${Math.round(avg)}ms`, fill: '#f5a623', fontSize: 10, position: 'insideTopRight' }} />}
        <Area type="monotone" dataKey="responseTime" stroke="#00d084" strokeWidth={1.5} fill="url(#rtGrad)" dot={false} connectNulls={false} activeDot={{ r: 4, fill: '#00d084' }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
