import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProbeWorker } from './probe.worker';
import { Monitor } from '../monitors/entities/monitor.entity';

@Processor('monitor-checks')
export class MonitorProcessor {
  private readonly logger = new Logger(MonitorProcessor.name);

  constructor(
    private readonly probe: ProbeWorker,
    @InjectRepository(Monitor) private monitorRepo: Repository<Monitor>,
  ) {}

  @Process('probe')
  async handleProbe(job: Job<{ monitorId: string }>) {
    const { monitorId } = job.data;
    const monitor = await this.monitorRepo.findOne({ where: { id: monitorId, isActive: true } });
    if (!monitor) { this.logger.warn(`Monitor ${monitorId} not found or inactive`); return; }
    try {
      const result = await this.probe.probe(monitor);
      await this.probe.processResult(monitor, result);
    } catch (err) {
      this.logger.error(`Probe failed for ${monitor.name}: ${err.message}`);
      throw err;
    }
  }
}
