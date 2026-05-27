import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { MonitorScheduler } from './monitor.scheduler';
import { MonitorProcessor } from './monitor.processor';
import { ProbeWorker } from './probe.worker';
import { Monitor } from '../monitors/entities/monitor.entity';
import { MonitorStatus } from '../monitors/entities/monitor-status.entity';
import { Check } from '../checks/entities/check.entity';
import { Incident } from '../incidents/entities/incident.entity';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'monitor-checks' }),
    TypeOrmModule.forFeature([Monitor, MonitorStatus, Check, Incident]),
    WebsocketModule,
  ],
  providers: [MonitorScheduler, MonitorProcessor, ProbeWorker],
  exports: [BullModule],
})
export class QueueModule {}
