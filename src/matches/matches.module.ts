import { Module } from '@nestjs/common'
import { MatchesService } from './matches.service'
import { MatchesController } from './matches.controller'
import { DatabaseService } from '../database/database.service'
import { PredictionsModule } from '../predictions/predictions.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [PredictionsModule, AuthModule],
  controllers: [MatchesController],
  providers: [MatchesService, DatabaseService],
  exports: [MatchesService]
})
export class MatchesModule {}
