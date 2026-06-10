import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common'
import { MatchesService } from './matches.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from '../auth/admin.guard'

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post()
  create(
    @Body()
    body: {
      home_team_id: string
      away_team_id: string
      match_date: string
      round?: string
      group_name?: string
    }
  ) {
    return this.matchesService.create(body)
  }

  @Get()
  findAll() {
    return this.matchesService.findAll()
  }

  @Patch(':id/finish')
  @UseGuards(JwtAuthGuard, AdminGuard)
  finishMatch(
    @Param('id') id: string,
    @Body() body: { home_score: number; away_score: number }
  ) {
    return this.matchesService.finishMatch(id, body.home_score, body.away_score)
  }

  @Patch(':id/update-result')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateResult(
    @Param('id') id: string,
    @Body() body: { home_score: number; away_score: number }
  ) {
    return this.matchesService.finishMatch(id, body.home_score, body.away_score)
  }
}
