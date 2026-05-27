import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Request, ParseUUIDPipe, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MonitorsService } from './monitors.service';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';

@ApiTags('Monitors')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('monitors')
export class MonitorsController {
  constructor(private readonly svc: MonitorsService) {}

  @Post() create(@Body() dto: CreateMonitorDto, @Request() req: any) {
    return this.svc.create(dto, req.user.id);
  }
  @Get() findAll() { return this.svc.findAll(); }
  @Get(':id') findOne(@Param('id', ParseUUIDPipe) id: string) { return this.svc.findOne(id); }
  @Patch(':id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMonitorDto) { return this.svc.update(id, dto); }
  @Delete(':id') remove(@Param('id', ParseUUIDPipe) id: string) { return this.svc.remove(id); }
  @Get(':id/checks') getChecks(@Param('id', ParseUUIDPipe) id: string, @Query('hours', new DefaultValuePipe(24), ParseIntPipe) hours: number) { return this.svc.getChecks(id, hours); }
  @Get(':id/incidents') getIncidents(@Param('id', ParseUUIDPipe) id: string) { return this.svc.getIncidents(id); }
  @Get(':id/metrics') getMetrics(@Param('id', ParseUUIDPipe) id: string) { return this.svc.getMetrics(id); }
}
