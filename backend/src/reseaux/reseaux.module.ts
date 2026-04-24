import { Module } from '@nestjs/common';
import { ReseauxController } from './reseaux.controller';
import { ReseauxService } from './reseaux.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [ReseauxController],
  providers: [ReseauxService, PrismaService],
  exports: [ReseauxService],
})
export class ReseauxModule {}
