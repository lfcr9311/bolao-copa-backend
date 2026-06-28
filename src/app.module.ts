import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AuthModule } from './auth/auth.module'
import { DatabaseModule } from './database/database.module'
import { MatchesModule } from './matches/matches.module'
import { PredictionsModule } from './predictions/predictions.module'
import { RankingModule } from './ranking/ranking.module'
import { TeamsModule } from './teams/teams.module'
import { UsersModule } from './users/users.module'
import { KnockoutMatchesModule } from './knockout-matches/knockout-matches.module'
import { BracketPredictionsModule } from './bracket-predictions/bracket-predictions.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    TeamsModule,
    MatchesModule,
    PredictionsModule,
    KnockoutMatchesModule,
    BracketPredictionsModule,
    RankingModule
  ]
})
export class AppModule {}