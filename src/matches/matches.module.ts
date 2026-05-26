import { Module } from '@nestjs/common'
import { MatchesService } from './matches.service'
import { MatchesController } from './matches.controller'
import { DatabaseService } from '../database/database.service'
import { PredictionsModule } from '../predictions/predictions.module'

@Module({
  imports: [PredictionsModule],
  controllers: [MatchesController],
  providers: [MatchesService, DatabaseService],
  exports: [MatchesService]
})
export class MatchesModule {}
