import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Monitor } from '../monitors/entities/monitor.entity';
import { MonitorStatus } from '../monitors/entities/monitor-status.entity';

@Injectable()
export class MonitorScheduler implements OnModuleInit {
  private readonly logger = new Logger(MonitorScheduler.name);

  constructor(
    @InjectQueue('monitor-checks') private readonly queue: Queue,
    @InjectRepository(Monitor) private monitorRepo: Repository<Monitor>,
    @InjectRepository(MonitorStatus) private statusRepo: Repository<MonitorStatus>,
  ) {}

  async onModuleInit() {
    await this.queue.obliterate({ force: true });
    this.logger.log('Monitor scheduler initialized, scheduling all active monitors...');
    await this.scheduleAllMonitors();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async scheduleAllMonitors() {
    const monitors = await this.monitorRepo.find({ where: { isActive: true } });
    const now = Date.now();

    for (const monitor of monitors) {
      const status = await this.statusRepo.findOne({ where: { monitorId: monitor.id } });
      const lastCheck = status?.lastCheckAt ? new Date(status.lastCheckAt).getTime() : 0;
      const intervalMs = monitor.checkInterval * 1000;

      if (now - lastCheck >= intervalMs) {
        await this.queue.add('probe', { monitorId: monitor.id }, {
          jobId: `probe-${monitor.id}-${Math.floor(now / intervalMs)}`,
          removeOnComplete: true,
          removeOnFail: false,
          attempts: 2,
        });
      }
    }
    this.logger.debug(`Scheduled checks for ${monitors.length} monitors`);
  }

  async scheduleImmediate(monitorId: string) {
    await this.queue.add('probe', { monitorId }, { priority: 1, removeOnComplete: true });
  }
}
