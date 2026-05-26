import { Module } from '@nestjs/common'
import { PredictionsService } from './predictions.service'
import { PredictionsController } from './predictions.controller'
import { DatabaseService } from '../database/database.service'

@Module({
  controllers: [PredictionsController],
  providers: [PredictionsService, DatabaseService],
  exports: [PredictionsService]
})
export class PredictionsModule {}
