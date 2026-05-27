import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import axios, { AxiosError } from 'axios';
import * as dns from 'dns/promises';
import { Monitor } from '../monitors/entities/monitor.entity';
import { Check } from '../checks/entities/check.entity';
import { MonitorStatus } from '../monitors/entities/monitor-status.entity';
import { Incident } from '../incidents/entities/incident.entity';
import { WebsocketGateway } from '../websocket/websocket.gateway';

export interface ProbeResult {
  monitorId: string;
  status: 'healthy' | 'warning' | 'degraded' | 'critical' | 'offline';
  isUp: boolean;
  httpStatus?: number;
  responseTime?: number;
  errorMessage?: string;
  dnsTime?: number;
  connectTime?: number;
  ttfb?: number;
  cause?: string;
}

// SSRF protection: block private/local IPs
const BLOCKED_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^::1$/,
  /^fc00:/,
  /^fd[0-9a-f]{2}:/i,
  /^0\.0\.0\.0$/,
];

function isPrivateAddress(hostname: string): boolean {
  return BLOCKED_PATTERNS.some((p) => p.test(hostname));
}

function classifyStatus(
  responseTime: number,
  httpStatus: number,
  timeoutMs: number,
): ProbeResult['status'] {
  if (httpStatus >= 500) return 'critical';
  if (httpStatus >= 400) return 'degraded';
  if (responseTime > timeoutMs * 0.8) return 'warning';
  if (responseTime > 2000) return 'degraded';
  if (responseTime > 1000) return 'warning';
  return 'healthy';
}

@Injectable()
export class ProbeWorker {
  private readonly logger = new Logger(ProbeWorker.name);

  constructor(
    @InjectRepository(Check)
    private readonly checkRepo: Repository<Check>,
    @InjectRepository(MonitorStatus)
    private readonly statusRepo: Repository<MonitorStatus>,
    @InjectRepository(Incident)
    private readonly incidentRepo: Repository<Incident>,
    private readonly dataSource: DataSource,
    private readonly wsGateway: WebsocketGateway,
  ) {}

  async probe(monitor: Monitor): Promise<ProbeResult> {
    let url: URL;
    try {
      url = new URL(monitor.url);
    } catch {
      return {
        monitorId: monitor.id,
        status: 'offline',
        isUp: false,
        errorMessage: 'Invalid URL format',
        cause: 'invalid_url',
      };
    }

    // SSRF protection
    if (isPrivateAddress(url.hostname)) {
      return {
        monitorId: monitor.id,
        status: 'offline',
        isUp: false,
        errorMessage: 'URL points to a private/local network address',
        cause: 'ssrf_blocked',
      };
    }

    const timeoutMs = monitor.timeout * 1000;
    const startTime = Date.now();
    let dnsTime: number | undefined;

    // DNS resolution timing
    try {
      const dnsStart = Date.now();
      await dns.lookup(url.hostname);
      dnsTime = Date.now() - dnsStart;
    } catch (err) {
      const responseTime = Date.now() - startTime;
      return {
        monitorId: monitor.id,
        status: 'offline',
        isUp: false,
        responseTime,
        errorMessage: `DNS resolution failed: ${err.message}`,
        cause: 'dns_failure',
      };
    }

    // HTTP probe
    try {
      const response = await axios({
        method: monitor.method as any,
        url: monitor.url,
        timeout: timeoutMs,
        maxRedirects: monitor.followRedirects ? 5 : 0,
        validateStatus: () => true,  // Don't throw on 4xx/5xx
        headers: {
          'User-Agent': 'Sentinel-Monitor/1.0',
          ...monitor.headers,
        },
      });

      const responseTime = Date.now() - startTime;
      const httpStatus = response.status;
      const isUp = httpStatus < 400 || httpStatus === monitor.expectedStatus;

      let status: ProbeResult['status'];
      if (!isUp) {
        status = httpStatus >= 500 ? 'critical' : 'degraded';
      } else {
        status = classifyStatus(responseTime, httpStatus, timeoutMs);
      }

      return {
        monitorId: monitor.id,
        status,
        isUp,
        httpStatus,
        responseTime,
        dnsTime,
        cause: isUp ? undefined : `http_${httpStatus}`,
      };
    } catch (err: any) {
      const responseTime = Date.now() - startTime;

      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        return {
          monitorId: monitor.id,
          status: 'critical',
          isUp: false,
          responseTime,
          errorMessage: `Request timed out after ${monitor.timeout}s`,
          cause: 'timeout',
          dnsTime,
        };
      }

      if (err.code === 'ECONNREFUSED') {
        return {
          monitorId: monitor.id,
          status: 'offline',
          isUp: false,
          responseTime,
          errorMessage: 'Connection refused',
          cause: 'connection_refused',
          dnsTime,
        };
      }

      return {
        monitorId: monitor.id,
        status: 'offline',
        isUp: false,
        responseTime,
        errorMessage: err.message,
        cause: 'network_error',
        dnsTime,
      };
    }
  }

  async processResult(monitor: Monitor, result: ProbeResult): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Save check record
      const check = queryRunner.manager.create(Check, {
        monitorId: monitor.id,
        status: result.status,
        httpStatus: result.httpStatus,
        responseTime: result.responseTime,
        errorMessage: result.errorMessage,
        isUp: result.isUp,
        dnsTime: result.dnsTime,
        connectTime: result.connectTime,
        ttfb: result.ttfb,
      });
      await queryRunner.manager.save(check);

      // 2. Get current status
      let currentStatus = await queryRunner.manager.findOne(MonitorStatus, {
        where: { monitorId: monitor.id },
      });

      if (!currentStatus) {
        currentStatus = queryRunner.manager.create(MonitorStatus, {
          monitorId: monitor.id,
        });
      }

      const prevFailures = currentStatus.consecutiveFailures;

      // 3. Update status counters
      if (result.isUp) {
        currentStatus.consecutiveFailures = 0;
        currentStatus.consecutiveSuccesses = (currentStatus.consecutiveSuccesses || 0) + 1;
      } else {
        currentStatus.consecutiveFailures = (currentStatus.consecutiveFailures || 0) + 1;
        currentStatus.consecutiveSuccesses = 0;
      }

      currentStatus.currentStatus = result.status;
      currentStatus.lastCheckAt = new Date();
      currentStatus.lastHttpStatus = result.httpStatus;
      currentStatus.lastResponseTime = result.responseTime;

      // 4. Incident management
      const openIncident = await queryRunner.manager.findOne(Incident, {
        where: { monitorId: monitor.id, isResolved: false },
        order: { startedAt: 'DESC' },
      });

      // Open new incident after threshold consecutive failures
      if (
        !result.isUp &&
        currentStatus.consecutiveFailures >= monitor.alertThreshold &&
        !openIncident
      ) {
        const incident = queryRunner.manager.create(Incident, {
          monitorId: monitor.id,
          severity: result.status === 'offline' ? 'down' : 'critical',
          cause: result.cause,
          details: result.errorMessage,
          affectedChecks: currentStatus.consecutiveFailures,
        });
        await queryRunner.manager.save(incident);
        currentStatus.incidentCount = (currentStatus.incidentCount || 0) + 1;
      }

      // Resolve open incident when service recovers
      if (result.isUp && openIncident) {
        const now = new Date();
        openIncident.resolvedAt = now;
        openIncident.isResolved = true;
        openIncident.duration = Math.floor(
          (now.getTime() - openIncident.startedAt.getTime()) / 1000,
        );
        await queryRunner.manager.save(openIncident);
      }

      await queryRunner.manager.save(currentStatus);
      await queryRunner.commitTransaction();

      // 5. Emit real-time update via WebSocket
      this.wsGateway.emitMonitorUpdate({
        monitorId: monitor.id,
        status: result.status,
        httpStatus: result.httpStatus,
        responseTime: result.responseTime,
        isUp: result.isUp,
        checkedAt: new Date(),
      });

      this.logger.debug(
        `✓ ${monitor.name} [${result.status}] ${result.responseTime}ms HTTP:${result.httpStatus ?? 'N/A'}`,
      );
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to process result for ${monitor.name}: ${err.message}`);
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
