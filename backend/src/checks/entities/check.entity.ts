import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Monitor } from '../../monitors/entities/monitor.entity';

@Entity('checks')
export class Check {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'monitor_id' })
  monitorId: string;

  @Column({ name: 'checked_at', type: 'timestamptz', default: () => 'NOW()' })
  checkedAt: Date;

  @Column({ default: 'unknown' })
  status: string;  // healthy | warning | degraded | critical | offline

  @Column({ name: 'http_status', nullable: true })
  httpStatus: number;

  @Column({ name: 'response_time', nullable: true })
  responseTime: number;  // ms

  @Column({ name: 'error_message', nullable: true, type: 'text' })
  errorMessage: string;

  @Column({ name: 'is_up', default: true })
  isUp: boolean;

  @Column({ name: 'dns_time', nullable: true })
  dnsTime: number;

  @Column({ name: 'connect_time', nullable: true })
  connectTime: number;

  @Column({ nullable: true })
  ttfb: number;

  @Column({ default: 'default' })
  region: string;

  @ManyToOne(() => Monitor, (m) => m.checks)
  @JoinColumn({ name: 'monitor_id' })
  monitor: Monitor;
}
