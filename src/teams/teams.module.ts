import { Module } from '@nestjs/common'
import { TeamsService } from './teams.service'
import { TeamsController } from './teams.controller'
import { DatabaseService } from '../database/database.service'

@Module({
  controllers: [TeamsController],
  providers: [TeamsService, DatabaseService],
  exports: [TeamsService]
})
export class TeamsModule {}
