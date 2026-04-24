import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AgencesModule } from './agences/agences.module';
import { AgentsModule } from './agents/agents.module';
import { TransactionsModule } from './transactions/transactions.module';
import { FinanceModule } from './finance/finance.module';
import { RhModule } from './rh/rh.module';
import { ReseauxModule } from './reseaux/reseaux.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    AgencesModule,
    AgentsModule,
    TransactionsModule,
    FinanceModule,
    RhModule,
    ReseauxModule,
    DashboardModule,
  ],
})
export class AppModule {}
