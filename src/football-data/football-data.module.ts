import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from '../database/database.module'
import { PredictionsModule } from '../predictions/predictions.module'
import { FootballDataController } from './football-data.controller'
import { FootballDataService } from './football-data.service'
import { DatabaseService } from 'src/database/database.service'

@Module({
  imports: [ConfigModule, DatabaseModule, PredictionsModule],
  controllers: [FootballDataController],
  providers: [FootballDataService, DatabaseService]
})
export class FootballDataModule {}