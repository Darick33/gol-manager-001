import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { FinesModule } from './modules/fines/fines.module';
import { MatchesModule } from './modules/matches/matches.module';
import { BalanceModule } from './modules/balance/balance.module';
import { RoundsModule } from './modules/rounds/rounds.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { PdfModule } from './modules/pdf/pdf.module';
import { PlayersModule } from './modules/players/players.module';
import { TeamsModule } from './modules/teams/teams.module';
import { TournamentsModule } from './modules/tournaments/tournaments.module';
import { UsersModule } from './modules/users/users.module';
import { PublicModule } from './modules/public/public.module';
import { LeaguesModule } from './modules/leagues/leagues.module';
import { LeagueMiddleware } from './modules/leagues/league.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      { name: 'global', ttl: 60_000, limit: 120 },
    ]),
    DatabaseModule,
    UsersModule,
    AuthModule,
    TournamentsModule,
    TeamsModule,
    PlayersModule,
    MatchesModule,
    FinesModule,
    PaymentsModule,
    PdfModule,
    NotificationsModule,
    CloudinaryModule,
    BalanceModule,
    RoundsModule,
    PublicModule,
    LeaguesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LeagueMiddleware)
      .forRoutes({ path: 'public/*path', method: RequestMethod.ALL });
  }
}
