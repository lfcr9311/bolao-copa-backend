import { Module } from '@nestjs/common'
import { BracketPredictionsService } from './bracket-predictions.service'
import { BracketPredictionsController } from './bracket-predictions.controller'
import { DatabaseModule } from '../database/database.module'
import { AuthModule } from '../auth/auth.module'
import { DatabaseService } from 'src/database/database.service'

@Module({
  imports: [DatabaseModule, AuthModule],
  providers: [BracketPredictionsService, DatabaseService],
  controllers: [BracketPredictionsController],
  exports: [BracketPredictionsService],
})
export class BracketPredictionsModule {}
