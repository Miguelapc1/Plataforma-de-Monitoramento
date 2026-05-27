import {
  Entity, PrimaryColumn, Column, UpdateDateColumn,
  OneToOne, JoinColumn,
} from 'typeorm';
import { Monitor } from './monitor.entity';

@Entity('monitor_status')
export class MonitorStatus {
  @PrimaryColumn({ name: 'monitor_id' })
  monitorId: string;

  @Column({ name: 'current_status', default: 'unknown' })
  currentStatus: string;  // healthy | warning | degraded | critical | offline | unknown

  @Column({ name: 'last_check_at', nullable: true, type: 'timestamptz' })
  lastCheckAt: Date;

  @Column({ name: 'last_http_status', nullable: true })
  lastHttpStatus: number;

  @Column({ name: 'last_response_time', nullable: true })
  lastResponseTime: number;

  @Column({ name: 'consecutive_failures', default: 0 })
  consecutiveFailures: number;

  @Column({ name: 'consecutive_successes', default: 0 })
  consecutiveSuccesses: number;

  @Column({ name: 'uptime_24h', type: 'numeric', precision: 5, scale: 2, nullable: true })
  uptime24h: number;

  @Column({ name: 'uptime_7d', type: 'numeric', precision: 5, scale: 2, nullable: true })
  uptime7d: number;

  @Column({ name: 'uptime_30d', type: 'numeric', precision: 5, scale: 2, nullable: true })
  uptime30d: number;

  @Column({ name: 'incident_count', default: 0 })
  incidentCount: number;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => Monitor, (m) => m.status)
  @JoinColumn({ name: 'monitor_id' })
  monitor: Monitor;
}
