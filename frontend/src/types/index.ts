export type MonitorStatus = 'healthy' | 'warning' | 'degraded' | 'critical' | 'offline' | 'unknown';
export type MonitorEnvironment = 'production' | 'staging' | 'homologation';

export interface MonitorStatusData {
  monitorId: string;
  currentStatus: MonitorStatus;
  lastCheckAt: string | null;
  lastHttpStatus: number | null;
  lastResponseTime: number | null;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  uptime24h: number | null;
  uptime7d: number | null;
  uptime30d: number | null;
  incidentCount: number;
  updatedAt: string;
}

export interface Monitor {
  id: string;
  name: string;
  url: string;
  environment: MonitorEnvironment;
  checkInterval: number;
  timeout: number;
  method: string;
  isActive: boolean;
  tags: string[];
  description: string | null;
  createdAt: string;
  status: MonitorStatusData | null;
}

export interface Check {
  id: string;
  monitorId: string;
  checkedAt: string;
  status: MonitorStatus;
  httpStatus: number | null;
  responseTime: number | null;
  errorMessage: string | null;
  isUp: boolean;
  dnsTime: number | null;
}

export interface Incident {
  id: string;
  monitorId: string;
  startedAt: string;
  resolvedAt: string | null;
  duration: number | null;
  severity: string;
  cause: string | null;
  details: string | null;
  isResolved: boolean;
  affectedChecks: number;
}

export interface Metrics {
  uptime24h: number | null;
  uptime7d: number | null;
  uptime30d: number | null;
  avgResponseTime: number | null;
  p95ResponseTime: number | null;
  minResponseTime: number | null;
  maxResponseTime: number | null;
  mttr: number | null;
  mtbf: number | null;
  totalChecks: number;
  incidentCount: number;
}
