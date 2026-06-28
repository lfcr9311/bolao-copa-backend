import { Controller, Post, Get, Body, Param, UseGuards, Request, BadRequestException } from '@nestjs/common'
import { BracketPredictionsService } from './bracket-predictions.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { AdminGuard } from '../auth/admin.guard'

@Controller('bracket-predictions')
export class BracketPredictionsController {
  constructor(private readonly bracketPredictionsService: BracketPredictionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createOrUpdatePrediction(
    @Request() req,
    @Body() body: { matchId: string; predictedTeamId: string }
  ) {
    if (!body.matchId || !body.predictedTeamId) {
      throw new BadRequestException('matchId and predictedTeamId are required')
    }

    return this.bracketPredictionsService.createOrUpdatePrediction(
      req.user.id,
      body.matchId,
      body.predictedTeamId
    )
  }

  @Post('save-bracket')
  @UseGuards(JwtAuthGuard)
  async saveBracketPredictions(
    @Request() req,
    @Body() body: { predictionArray: Record<string, string> }
  ) {
    if (!body.predictionArray || Object.keys(body.predictionArray).length === 0) {
      throw new BadRequestException('predictionArray is required and cannot be empty')
    }

    return this.bracketPredictionsService.saveBracketPredictionsArray(
      req.user.id,
      body.predictionArray
    )
  }

  @Get('my-predictions')
  @UseGuards(JwtAuthGuard)
  async getMyPredictions(@Request() req) {
    return this.bracketPredictionsService.getPredictionsByUser(req.user.id)
  }

  @Get('my-bracket')
  @UseGuards(JwtAuthGuard)
  async getMyBracketPredictions(@Request() req) {
    return this.bracketPredictionsService.getBracketPredictionsArray(req.user.id)
  }

  @Get('my-results')
  @UseGuards(JwtAuthGuard)
  async getMyResults(@Request() req) {
    return this.bracketPredictionsService.getUserBracketResults(req.user.id)
  }

  @Get('match/:matchId')
  async getPredictionsByMatch(@Param('matchId') matchId: string) {
    return this.bracketPredictionsService.getPredictionsByMatch(matchId)
  }

  @Post('calculate-points/:matchId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async calculatePoints(@Param('matchId') matchId: string) {
    return this.bracketPredictionsService.calculatePointsForMatch(matchId)
  }

  @Get('leaderboard')
  async getLeaderboard() {
    return this.bracketPredictionsService.getLeaderboard()
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getMyStats(@Request() req) {
    return this.bracketPredictionsService.getUserBracketStats(req.user.id)
  }

  @Get('stats/:userId')
  async getUserStats(@Param('userId') userId: string) {
    return this.bracketPredictionsService.getUserBracketStats(userId)
  }

  @Post('set-results')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async setResults(
    @Request() req,
    @Body() body: { userId: string; resultsArray: Record<string, string> }
  ) {
    if (!body.userId || !body.resultsArray) {
      throw new BadRequestException('userId and resultsArray are required')
    }

    return this.bracketPredictionsService.setResultsArray(body.userId, body.resultsArray)
  }
}
