import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { KnockoutMatchesService } from './knockout-matches.service'

@Controller('knockout-matches')
export class KnockoutMatchesController {
  constructor(private readonly knockoutMatchesService: KnockoutMatchesService) {}

  @Get()
  findAll() {
    return this.knockoutMatchesService.findAll()
  }

  @Post('predictions')
  createOrUpdatePrediction(
    @Body()
    body: {
      userId: string
      matchId: string
      homeScore: number
      awayScore: number
      homeScoreExtraTime?: number
      awayScoreExtraTime?: number
      homePenalties?: number
      awayPenalties?: number
    }
  ) {
    return this.knockoutMatchesService.createOrUpdatePrediction(
      body.userId,
      body.matchId,
      body.homeScore,
      body.awayScore,
      body.homeScoreExtraTime,
      body.awayScoreExtraTime,
      body.homePenalties,
      body.awayPenalties
    )
  }

  @Get('predictions/user/:userId')
  getUserPredictions(@Param('userId') userId: string) {
    return this.knockoutMatchesService.findByUser(userId)
  }

  @Get('predictions/:matchId')
  getMatchPredictions(@Param('matchId') matchId: string) {
    return this.knockoutMatchesService.findByMatch(matchId)
  }

  @Post(':matchId/calculate-points')
  calculatePoints(
    @Param('matchId') matchId: string,
    @Body()
    body: {
      realHomeScore: number
      realAwayScore: number
      realHomeScoreExtraTime?: number
      realAwayScoreExtraTime?: number
      realHomePenalties?: number
      realAwayPenalties?: number
    }
  ) {
    return this.knockoutMatchesService.calculatePointsForMatch(
      matchId,
      body.realHomeScore,
      body.realAwayScore,
      body.realHomeScoreExtraTime,
      body.realAwayScoreExtraTime,
      body.realHomePenalties,
      body.realAwayPenalties
    )
  }
}
