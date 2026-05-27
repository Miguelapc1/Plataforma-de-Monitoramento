import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Monitor } from './entities/monitor.entity';
import { MonitorStatus } from './entities/monitor-status.entity';
import { Check } from '../checks/entities/check.entity';
import { Incident } from '../incidents/entities/incident.entity';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';

const PRIVATE_PATTERNS = [/^localhost$/i, /^127\./, /^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./, /^::1$/, /^0\.0\.0\.0$/];

@Injectable()
export class MonitorsService {
  constructor(
    @InjectRepository(Monitor) private monitorRepo: Repository<Monitor>,
    @InjectRepository(MonitorStatus) private statusRepo: Repository<MonitorStatus>,
    @InjectRepository(Check) private checkRepo: Repository<Check>,
    @InjectRepository(Incident) private incidentRepo: Repository<Incident>,
  ) {}

  private validateUrl(url: string) {
    let parsed: URL;
    try { parsed = new URL(url); } catch { throw new BadRequestException('Invalid URL'); }
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new BadRequestException('Only HTTP/HTTPS');
    if (PRIVATE_PATTERNS.some(p => p.test(parsed.hostname))) throw new BadRequestException('Private/local IPs not allowed');
  }

    async create(dto: CreateMonitorDto, userId: string) {
        this.validateUrl(dto.url);
        
        // 1. Removemos o environment problemático do DTO
        const { environment, ...restOfDto } = dto;

        // 2. Criamos o monitor usando 'createdBy' e forçando o tipo do 'environment'
        const monitor = this.monitorRepo.create({
          ...restOfDto,
          createdBy: userId, // Voltamos para o campo que provavelmente existe na Entidade
          environment: environment as any
        });

        const saved = await this.monitorRepo.save(monitor);

        // 3. Agora o TypeScript vai reconhecer o objeto individual e aceitar o '.id'
        await this.statusRepo.save(this.statusRepo.create({ monitorId: saved.id }));
        
        return saved;
      }

  async findAll() {
    return this.monitorRepo.find({
      relations: ['status'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const monitor = await this.monitorRepo.findOne({ where: { id }, relations: ['status'] });
    if (!monitor) throw new NotFoundException('Monitor not found');
    return monitor;
  }

  async update(id: string, dto: UpdateMonitorDto) {
    const monitor = await this.findOne(id);
    if (dto.url) this.validateUrl(dto.url);
    Object.assign(monitor, dto);
    return this.monitorRepo.save(monitor);
  }

  async remove(id: string) {
    const monitor = await this.findOne(id);
    await this.monitorRepo.remove(monitor);
  }

  async getChecks(id: string, hours = 24) {
    const since = new Date(Date.now() - hours * 3600 * 1000);
    return this.checkRepo.find({
      where: { monitorId: id },
      order: { checkedAt: 'DESC' },
      take: 500,
    });
  }

  async getIncidents(id: string) {
    return this.incidentRepo.find({
      where: { monitorId: id },
      order: { startedAt: 'DESC' },
      take: 50,
    });
  }

  async getMetrics(id: string) {
    await this.findOne(id);
    const [p24, p7d, p30d] = await Promise.all([
      this.calcUptime(id, 24),
      this.calcUptime(id, 24 * 7),
      this.calcUptime(id, 24 * 30),
    ]);
    const recent = await this.checkRepo.find({ where: { monitorId: id }, order: { checkedAt: 'DESC' }, take: 200 });
    const times = recent.filter(c => c.responseTime != null).map(c => c.responseTime);
    const sorted = [...times].sort((a, b) => a - b);
    const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null;
    const p95 = sorted.length ? sorted[Math.floor(sorted.length * 0.95)] : null;
    const incidents = await this.incidentRepo.find({ where: { monitorId: id, isResolved: true }, order: { startedAt: 'DESC' }, take: 20 });
    const mttr = incidents.length ? Math.round(incidents.reduce((a, i) => a + (i.duration || 0), 0) / incidents.length) : null;
    const allIncidents = await this.incidentRepo.find({ where: { monitorId: id }, order: { startedAt: 'ASC' } });
    let mtbf = null;
    if (allIncidents.length > 1) {
      const gaps = [];
      for (let i = 1; i < allIncidents.length; i++) {
        const gap = (new Date(allIncidents[i].startedAt).getTime() - new Date(allIncidents[i-1].startedAt).getTime()) / 1000;
        gaps.push(gap);
      }
      mtbf = Math.round(gaps.reduce((a,b) => a+b,0) / gaps.length);
    }
    return { uptime24h: p24, uptime7d: p7d, uptime30d: p30d, avgResponseTime: avg, p95ResponseTime: p95, minResponseTime: sorted[0] || null, maxResponseTime: sorted[sorted.length-1] || null, mttr, mtbf, totalChecks: recent.length, incidentCount: allIncidents.length };
  }

  private async calcUptime(id: string, hours: number): Promise<number> {
    const since = new Date(Date.now() - hours * 3600 * 1000);
    const result = await this.checkRepo.createQueryBuilder('c')
      .select('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN c.is_up THEN 1 ELSE 0 END)', 'up')
      .where('c.monitor_id = :id AND c.checked_at >= :since', { id, since })
      .getRawOne();
    if (!result.total || result.total === '0') return 100;
    return Math.round((parseInt(result.up) / parseInt(result.total)) * 10000) / 100;
  }

  async getActiveMonitors(): Promise<Monitor[]> {
    return this.monitorRepo.find({ where: { isActive: true } });
  }
}
