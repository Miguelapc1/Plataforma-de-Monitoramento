import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Monitor } from '../../monitors/entities/monitor.entity';

@Entity('incidents')
export class Incident {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'monitor_id' })
  monitorId: string;

  @Column({ name: 'started_at', type: 'timestamptz', default: () => 'NOW()' })
  startedAt: Date;

  @Column({ name: 'resolved_at', nullable: true, type: 'timestamptz' })
  resolvedAt: Date;

  @Column({ nullable: true })
  duration: number;  // seconds

  @Column({ default: 'critical' })
  severity: string;  // warning | critical | down

  @Column({ nullable: true })
  cause: string;  // timeout | http_error | dns_failure | connection_refused

  @Column({ nullable: true, type: 'text' })
  details: string;

  @Column({ name: 'is_resolved', default: false })
  isResolved: boolean;

  @Column({ name: 'affected_checks', default: 0 })
  affectedChecks: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Monitor, (m) => m.incidents)
  @JoinColumn({ name: 'monitor_id' })
  monitor: Monitor;
}
