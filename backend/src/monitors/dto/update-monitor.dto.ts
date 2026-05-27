import { PartialType } from '@nestjs/mapped-types';
import { CreateMonitorDto } from './create-monitor.dto';
import { IsOptional, IsBoolean } from 'class-validator';
export class UpdateMonitorDto extends PartialType(CreateMonitorDto) {
  @IsOptional() @IsBoolean() isActive?: boolean;
}
