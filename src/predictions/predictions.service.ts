import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { DatabaseService } from '../database/database.service'

type MatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED'

type MatchForPrediction = {
  id: string
  match_date: string | Date
  status: MatchStatus
}

type PredictionPoints = {
  points: number
  exactScore: boolean
  correctResult: boolean
  correctGoalDifference: boolean
}

@Injectable()
export class PredictionsService {
  constructor(private readonly db: DatabaseService) {}

  async createOrUpdate(userId: string, matchId: string, homeScore: number, awayScore: number) {
    this.validateScore(homeScore, 'Gols do mandante')
    this.validateScore(awayScore, 'Gols do visitante')

    const matchResult = await this.db.query<MatchForPrediction>(
      `
      SELECT
        id,
        to_char(match_date, 'YYYY-MM-DD"T"HH24:MI:SS') || 'Z' AS match_date,
        status
      FROM matches
      WHERE id = $1
      LIMIT 1
      `,
      [matchId]
    )

    const match = matchResult.rows[0]

    if (!match) {
      throw new NotFoundException('Jogo não encontrado')
    }

    this.validatePredictionDeadline(match)

    const result = await this.db.query(
      `
      INSERT INTO predictions (
        user_id,
        match_id,
        home_score,
        away_score,
        points,
        exact_score,
        correct_result,
        correct_goal_difference,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, 0, false, false, false, NOW(), NOW())
      ON CONFLICT (user_id, match_id)
      DO UPDATE SET
        home_score = EXCLUDED.home_score,
        away_score = EXCLUDED.away_score,
        points = 0,
        exact_score = false,
        correct_result = false,
        correct_goal_difference = false,
        updated_at = NOW()
      RETURNING *
      `,
      [userId, matchId, homeScore, awayScore]
    )

    return result.rows[0]
  }

  async findByUser(userId: string) {
    const result = await this.db.query(
      `
      SELECT
        p.id,
        p.user_id,
        p.match_id,
        p.home_score AS predicted_home_score,
        p.away_score AS predicted_away_score,
        p.points,
        p.exact_score,
        p.correct_result,
        p.correct_goal_difference,
        m.home_score AS real_home_score,
        m.away_score AS real_away_score,
        to_char(m.match_date, 'YYYY-MM-DD"T"HH24:MI:SS') || 'Z' AS match_date,
        m.status,
        ht.name AS home_team_name,
        ht.code AS home_team_code,
        at.name AS away_team_name,
        at.code AS away_team_code
      FROM predictions p
      INNER JOIN matches m ON m.id = p.match_id
      INNER JOIN teams ht ON ht.id = m.home_team_id
      INNER JOIN teams at ON at.id = m.away_team_id
      WHERE p.user_id = $1
      ORDER BY m.match_date ASC
      `,
      [userId]
    )

    return result.rows
  }

  async calculatePointsForMatch(matchId: string, realHomeScore: number, realAwayScore: number) {
    this.validateScore(realHomeScore, 'Gols do mandante')
    this.validateScore(realAwayScore, 'Gols do visitante')

    const predictions = await this.db.query(
      `
      SELECT *
      FROM predictions
      WHERE match_id = $1
      `,
      [matchId]
    )

    for (const prediction of predictions.rows) {
      const calculated = this.calculatePredictionPoints(
        realHomeScore,
        realAwayScore,
        prediction.home_score,
        prediction.away_score
      )

      await this.db.query(
        `
        UPDATE predictions
        SET
          points = $1,
          exact_score = $2,
          correct_result = $3,
          correct_goal_difference = $4,
          updated_at = NOW()
        WHERE id = $5
        `,
        [
          calculated.points,
          calculated.exactScore,
          calculated.correctResult,
          calculated.correctGoalDifference,
          prediction.id
        ]
      )
    }

    return { updated: predictions.rowCount ?? 0 }
  }

  private validatePredictionDeadline(match: MatchForPrediction) {
    if (match.status !== 'SCHEDULED') {
      throw new BadRequestException('Não é possível palpitar em jogo já iniciado, finalizado ou cancelado')
    }

    const matchDate = new Date(match.match_date)

    if (Number.isNaN(matchDate.getTime())) {
      throw new BadRequestException('Data da partida inválida')
    }

    const now = new Date()
    const thirtyMinutesInMs = 30 * 60 * 1000
    const deadline = new Date(matchDate.getTime() - thirtyMinutesInMs)

    if (now >= deadline) {
      throw new BadRequestException('Prazo de palpite encerrado. Só é possível criar ou alterar até 30 minutos antes da partida')
    }
  }

  private validateScore(score: number, fieldName: string) {
    if (!Number.isInteger(score)) {
      throw new BadRequestException(`${fieldName} deve ser um número inteiro`)
    }

    if (score < 0) {
      throw new BadRequestException(`${fieldName} não pode ser negativo`)
    }

    if (score > 99) {
      throw new BadRequestException(`${fieldName} inválido`)
    }
  }

  private calculatePredictionPoints(
    realHomeScore: number,
    realAwayScore: number,
    predictedHomeScore: number,
    predictedAwayScore: number
  ): PredictionPoints {
    const exactScore =
      realHomeScore === predictedHomeScore &&
      realAwayScore === predictedAwayScore

    const realResult = this.getMatchResult(realHomeScore, realAwayScore)
    const predictedResult = this.getMatchResult(predictedHomeScore, predictedAwayScore)

    const correctResult = realResult === predictedResult

    const realGoalDifference = realHomeScore - realAwayScore
    const predictedGoalDifference = predictedHomeScore - predictedAwayScore

    const correctGoalDifference = realGoalDifference === predictedGoalDifference

    const correctHomeGoals = realHomeScore === predictedHomeScore
    const correctAwayGoals = realAwayScore === predictedAwayScore
    const correctAnyTeamGoals = correctHomeGoals || correctAwayGoals

    let points = 0

    if (exactScore) {
      points = 10
    } else if (correctResult && correctGoalDifference) {
      points = 8
    } else if (correctResult && correctAnyTeamGoals) {
      points = 6
    } else if (correctResult) {
      points = 5
    } else if (correctAnyTeamGoals) {
      points = 1
    }

    return {
      points,
      exactScore,
      correctResult,
      correctGoalDifference
    }
  }

  private getMatchResult(homeScore: number, awayScore: number): 'HOME' | 'AWAY' | 'DRAW' {
    if (homeScore > awayScore) {
      return 'HOME'
    }

    if (awayScore > homeScore) {
      return 'AWAY'
    }

    return 'DRAW'
  }
}