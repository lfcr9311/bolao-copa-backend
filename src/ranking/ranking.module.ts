import { Module } from '@nestjs/common'
import { RankingService } from './ranking.service'
import { RankingController } from './ranking.controller'
import { DatabaseService } from '../database/database.service'

@Module({
  controllers: [RankingController],
  providers: [RankingService, DatabaseService]
})
export class RankingModule {}
