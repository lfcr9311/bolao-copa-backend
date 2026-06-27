import { Module } from '@nestjs/common'
import { KnockoutMatchesService } from './knockout-matches.service'
import { KnockoutMatchesController } from './knockout-matches.controller'
import { DatabaseModule } from '../database/database.module'
import { DatabaseService } from 'src/database/database.service'

@Module({
  imports: [DatabaseModule],
  providers: [KnockoutMatchesService, DatabaseService],
  controllers: [KnockoutMatchesController],
  exports: [KnockoutMatchesService]
})
export class KnockoutMatchesModule {}
