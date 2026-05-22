import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
