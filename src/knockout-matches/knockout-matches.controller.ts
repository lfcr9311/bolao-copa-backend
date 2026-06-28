import { Body, Controller, Get, Param, Post, Patch, BadRequestException, Request } from '@nestjs/common'
import { KnockoutMatchesService } from './knockout-matches.service'
import { DatabaseService } from '../database/database.service'

@Controller('knockout-matches')
export class KnockoutMatchesController {
  constructor(
    private readonly knockoutMatchesService: KnockoutMatchesService,
    private readonly db: DatabaseService
  ) {}

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

  @Get('predictions-visible/:matchId')
  getPredictionsVisible(@Param('matchId') matchId: string, @Request() req) {
    return this.knockoutMatchesService.getPredictionsVisible(matchId, req.user?.id)
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

  @Patch(':matchId/update-result')
  async updateResult(
    @Param('matchId') matchId: string,
    @Body()
    body: {
      isAdmin: boolean
      home_score: number
      away_score: number
      home_score_extra_time?: number
      away_score_extra_time?: number
      home_penalties?: number
      away_penalties?: number
    }
  ) {
    if (!body.isAdmin) {
      throw new BadRequestException('Apenas administradores podem atualizar resultados')
    }

    await this.knockoutMatchesService.updateResult(matchId, {
      home_score: body.home_score,
      away_score: body.away_score,
      home_score_extra_time: body.home_score_extra_time,
      away_score_extra_time: body.away_score_extra_time,
      home_penalties: body.home_penalties,
      away_penalties: body.away_penalties
    })

    await this.knockoutMatchesService.calculatePointsForMatch(
      matchId,
      body.home_score,
      body.away_score,
      body.home_score_extra_time,
      body.away_score_extra_time,
      body.home_penalties,
      body.away_penalties
    )

    return { success: true, message: 'Resultado atualizado e pontos calculados' }
  }
}
