import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, OneToMany, OneToOne,
} from 'typeorm';
import { Check } from '../../checks/entities/check.entity';
import { Incident } from '../../incidents/entities/incident.entity';
import { MonitorStatus } from './monitor-status.entity';

export enum MonitorEnvironment {
  PRODUCTION = 'production',
  STAGING = 'staging',
  HOMOLOGATION = 'homologation',
}

export enum MonitorMethod {
  GET = 'GET',
  POST = 'POST',
  HEAD = 'HEAD',
}

@Entity('monitors')
export class Monitor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 2048 })
  url: string;

  @Column({
    type: 'enum',
    enum: MonitorEnvironment,
    default: MonitorEnvironment.PRODUCTION,
  })
  environment: MonitorEnvironment;

  @Column({ name: 'check_interval', default: 60 })
  checkInterval: number;  // seconds

  @Column({ default: 30 })
  timeout: number;  // seconds

  @Column({ default: 'GET' })
  method: string;

  @Column({ name: 'expected_status', default: 200 })
  expectedStatus: number;

  @Column({ name: 'follow_redirects', default: true })
  followRedirects: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'text', array: true, default: [] })
  tags: string[];

  @Column({ type: 'jsonb', default: {} })
  headers: Record<string, string>;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ name: 'alert_threshold', default: 3 })
  alertThreshold: number;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Check, (check) => check.monitor)
  checks: Check[];

  @OneToMany(() => Incident, (incident) => incident.monitor)
  incidents: Incident[];

  @OneToOne(() => MonitorStatus, (status) => status.monitor)
  status: MonitorStatus;
}
