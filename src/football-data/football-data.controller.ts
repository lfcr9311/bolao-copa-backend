import { Controller, Get, Headers, Query, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { FootballDataService } from './football-data.service'

@Controller('football-data')
export class FootballDataController {
  constructor(
    private readonly footballDataService: FootballDataService,
    private readonly configService: ConfigService
  ) {}

  @Get('sync-results')
  async syncResults(
    @Headers('authorization') authorization?: string,
    @Query('secret') secret?: string
  ) {
    const cronSecret = this.configService.get<string>('CRON_SECRET')

    if (cronSecret) {
      const expectedAuthorization = `Bearer ${cronSecret}`

      if (authorization !== expectedAuthorization && secret !== cronSecret) {
        throw new UnauthorizedException('Não autorizado')
      }
    }

    return this.footballDataService.syncFinishedMatches()
  }
}