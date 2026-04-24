import { Module } from '@nestjs/common';
import { RhController } from './rh.controller';
import { RhService } from './rh.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [RhController],
  providers: [RhService, PrismaService],
  exports: [RhService],
})
export class RhModule {}
