import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MonitorsController } from './monitors.controller';
import { MonitorsService } from './monitors.service';
import { Monitor } from './entities/monitor.entity';
import { MonitorStatus } from './entities/monitor-status.entity';
import { Check } from '../checks/entities/check.entity';
import { Incident } from '../incidents/entities/incident.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Monitor, MonitorStatus, Check, Incident])],
  controllers: [MonitorsController],
  providers: [MonitorsService],
  exports: [MonitorsService, TypeOrmModule],
})
export class MonitorsModule {}
