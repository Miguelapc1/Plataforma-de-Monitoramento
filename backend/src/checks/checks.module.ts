import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Check } from './entities/check.entity';

@Module({ imports: [TypeOrmModule.forFeature([Check])], exports: [TypeOrmModule] })
export class ChecksModule {}
