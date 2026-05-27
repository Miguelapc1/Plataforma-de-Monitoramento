import { IsString, IsUrl, IsOptional, IsInt, Min, Max, IsBoolean, IsArray, IsEnum, IsObject } from 'class-validator';

export enum MonitorEnv { PRODUCTION = 'production', STAGING = 'staging', HOMOLOGATION = 'homologation' }

export class CreateMonitorDto {
  @IsString() name: string;
  @IsUrl() url: string;
  @IsOptional() @IsEnum(MonitorEnv) environment?: MonitorEnv;
  @IsOptional() @IsInt() @Min(30) @Max(3600) checkInterval?: number;
  @IsOptional() @IsInt() @Min(5) @Max(60) timeout?: number;
  @IsOptional() @IsString() method?: string;
  @IsOptional() @IsInt() expectedStatus?: number;
  @IsOptional() @IsBoolean() followRedirects?: boolean;
  @IsOptional() @IsArray() tags?: string[];
  @IsOptional() @IsObject() headers?: Record<string, string>;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() @Min(1) @Max(10) alertThreshold?: number;
}
