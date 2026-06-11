import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { PredictionsService } from './predictions.service'

@Controller('predictions')
export class PredictionsController {
  constructor(private readonly predictionsService: PredictionsService) {}

  @Post()
  createOrUpdate(
    @Body()
    body: {
      user_id: string
      match_id: string
      home_score: number
      away_score: number
    }
  ) {
    return this.predictionsService.createOrUpdate(
      body.user_id,
      body.match_id,
      body.home_score,
      body.away_score
    )
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.predictionsService.findByUser(userId)
  }

  @Get('match/:matchId')
  findByMatch(@Param('matchId') matchId: string) {
    return this.predictionsService.findByMatch(matchId)
  }
}
