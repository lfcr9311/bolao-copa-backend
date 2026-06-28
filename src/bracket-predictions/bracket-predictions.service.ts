import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { DatabaseService } from '../database/database.service'

type RoundPoints = Record<string, number>

const ROUND_POINTS: RoundPoints = {
  'Round 32': 1,
  'Round of 16': 2,
  'Quarter-final': 4,
  'Semi-final': 8,
  'Final': 16,
  'Match for third place': 1,
}

@Injectable()
export class BracketPredictionsService {
  constructor(private readonly db: DatabaseService) {}

  async createOrUpdatePrediction(userId: string, matchId: string, predictedTeamId: string) {
    // Validate match exists and get match details
    const matchResult = await this.db.query(
      `
      SELECT m.id, m.round, m.advance_team_id, m.status
      FROM matches_knockout m
      WHERE m.id = $1
      `,
      [matchId]
    )

    if (matchResult.rows.length === 0) {
      throw new NotFoundException('Match not found')
    }

    const match = matchResult.rows[0]

    // Can only predict if match is not finished
    if (match.status === 'FINISHED') {
      throw new BadRequestException('Cannot predict on finished matches')
    }

    // Validate predicted team exists in the match
    const teamInMatchResult = await this.db.query(
      `
      SELECT COUNT(*) as count
      FROM matches_knockout
      WHERE id = $1 AND (home_team_id = $2 OR away_team_id = $2)
      `,
      [matchId, predictedTeamId]
    )

    if (teamInMatchResult.rows[0].count === 0) {
      throw new BadRequestException('Predicted team is not in this match')
    }

    // Insert or update prediction
    const result = await this.db.query(
      `
      INSERT INTO bracket_predictions (user_id, match_id, predicted_team_id, points)
      VALUES ($1, $2, $3, 0)
      ON CONFLICT (user_id, match_id)
      DO UPDATE SET predicted_team_id = $3, updated_at = NOW()
      RETURNING *
      `,
      [userId, matchId, predictedTeamId]
    )

    return result.rows[0]
  }

  async getPredictionsByUser(userId: string) {
    const result = await this.db.query(
      `
      SELECT
        bp.id,
        bp.user_id,
        bp.match_id,
        bp.predicted_team_id,
        bp.points,
        bp.is_correct,
        bp.created_at,
        bp.updated_at,
        m.round,
        m.status,
        m.advance_team_id,
        m.home_team_id,
        m.away_team_id,
        ht.name as home_team_name,
        ht.code as home_team_code,
        at.name as away_team_name,
        at.code as away_team_code,
        pt.name as predicted_team_name,
        pt.code as predicted_team_code
      FROM bracket_predictions bp
      INNER JOIN matches_knockout m ON m.id = bp.match_id
      INNER JOIN teams ht ON ht.id = m.home_team_id
      INNER JOIN teams at ON at.id = m.away_team_id
      INNER JOIN teams pt ON pt.id = bp.predicted_team_id
      WHERE bp.user_id = $1
      ORDER BY m.match_date ASC
      `,
      [userId]
    )

    return result.rows
  }

  async getPredictionsByMatch(matchId: string) {
    const result = await this.db.query(
      `
      SELECT
        bp.id,
        bp.user_id,
        bp.match_id,
        bp.predicted_team_id,
        bp.points,
        bp.is_correct,
        bp.created_at,
        u.name as user_name,
        pt.name as predicted_team_name,
        pt.code as predicted_team_code
      FROM bracket_predictions bp
      INNER JOIN users u ON u.id = bp.user_id
      INNER JOIN teams pt ON pt.id = bp.predicted_team_id
      WHERE bp.match_id = $1
      ORDER BY bp.created_at ASC
      `,
      [matchId]
    )

    return result.rows
  }

  async calculatePointsForMatch(matchId: string) {
    // Get match details
    const matchResult = await this.db.query(
      `
      SELECT id, round, advance_team_id, status
      FROM matches_knockout
      WHERE id = $1
      `,
      [matchId]
    )

    if (matchResult.rows.length === 0) {
      throw new NotFoundException('Match not found')
    }

    const match = matchResult.rows[0]

    if (match.status !== 'FINISHED') {
      throw new BadRequestException('Match is not finished yet')
    }

    if (!match.advance_team_id) {
      throw new BadRequestException('No team has been registered as advanced')
    }

    const points = ROUND_POINTS[match.round] || 0

    // Update all predictions for this match
    await this.db.query(
      `
      UPDATE bracket_predictions
      SET
        is_correct = (predicted_team_id = $1),
        points = CASE WHEN predicted_team_id = $1 THEN $2 ELSE 0 END,
        updated_at = NOW()
      WHERE match_id = $3
      `,
      [match.advance_team_id, points, matchId]
    )

    return {
      matchId,
      advanceTeamId: match.advance_team_id,
      round: match.round,
      pointsAwarded: points,
    }
  }

  async getLeaderboard() {
    const result = await this.db.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        SUM(bp.points) as total_points,
        COUNT(CASE WHEN bp.is_correct THEN 1 END) as correct_predictions,
        COUNT(*) as total_predictions
      FROM users u
      LEFT JOIN bracket_predictions bp ON bp.user_id = u.id
      GROUP BY u.id, u.name, u.email
      ORDER BY total_points DESC, correct_predictions DESC
      `
    )

    return result.rows
  }

  async getUserBracketStats(userId: string) {
    const result = await this.db.query(
      `
      SELECT
        u.id,
        u.name,
        SUM(bp.points) as total_points,
        COUNT(CASE WHEN bp.is_correct THEN 1 END) as correct_predictions,
        COUNT(*) as total_predictions,
        ROUND(
          (COUNT(CASE WHEN bp.is_correct THEN 1 END)::FLOAT / COUNT(*)::FLOAT * 100)::NUMERIC,
          2
        ) as accuracy_percentage
      FROM users u
      LEFT JOIN bracket_predictions bp ON bp.user_id = u.id
      WHERE u.id = $1
      GROUP BY u.id, u.name
      `,
      [userId]
    )

    if (result.rows.length === 0) {
      throw new NotFoundException('User not found')
    }

    return result.rows[0]
  }

  async saveBracketPredictionsArray(userId: string, predictionArray: Record<string, string>) {
    // Verifica limite de data/hora: 28/06 20:00 UTC
    const deadline = new Date('2026-06-28T20:00:00Z')
    const now = new Date()

    if (now > deadline) {
      throw new BadRequestException('Prazo encerrado! Palpites do bracket só podem ser salvos até 28/06 às 20:00 UTC')
    }

    // Salva o array completo de palpites do bracket (73-104)
    await this.db.query(
      `
      INSERT INTO bracket_predictions (id, user_id, match_id, predicted_team_id, prediction_array, points, is_correct, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, 0, false, NOW(), NOW())
      ON CONFLICT (user_id, match_id) DO UPDATE SET
        prediction_array = $5,
        updated_at = NOW()
      `,
      [
        require('crypto').randomUUID(),
        userId,
        null,
        null,
        JSON.stringify(predictionArray),
      ]
    )

    return {
      success: true,
      message: 'Palpites do bracket salvos com sucesso',
      predictionsCount: Object.keys(predictionArray).length
    }
  }

  async setResultsArray(userId: string, resultsArray: Record<string, string>) {
    // Salva os resultados reais e calcula pontos
    await this.db.query(
      `
      UPDATE bracket_predictions
      SET results_array = $2, updated_at = NOW()
      WHERE user_id = $1 AND match_id IS NULL
      `,
      [userId, JSON.stringify(resultsArray)]
    )

    // Calccula pontos: compara prediction_array vs results_array
    const result = await this.db.query(
      `
      SELECT prediction_array, results_array
      FROM bracket_predictions
      WHERE user_id = $1 AND match_id IS NULL
      `,
      [userId]
    )

    if (result.rows.length === 0) {
      throw new NotFoundException('Bracket predictions not found for this user')
    }

    const record = result.rows[0]
    const predictions: Record<string, string> = record.prediction_array || {}
    const results: Record<string, string> = record.results_array || {}

    // Conta quantos acertos
    let correctCount = 0
    const roundPoints: Record<string, number> = {
      '73': 1, '74': 1, '75': 1, '76': 1, '77': 1, '78': 1, '79': 1, '80': 1,
      '81': 1, '82': 1, '83': 1, '84': 1, '85': 1, '86': 1, '87': 1, '88': 1,
      '89': 2, '90': 2, '91': 2, '92': 2, '93': 2, '94': 2, '95': 2, '96': 2,
      '97': 4, '98': 4, '99': 4, '100': 4,
      '101': 8, '102': 8,
      '104': 16,
    }

    let totalPoints = 0
    for (const [matchNum, predictedTeam] of Object.entries(predictions)) {
      const actualTeam = results[matchNum]
      if (predictedTeam === actualTeam) {
        correctCount++
        totalPoints += roundPoints[matchNum] || 1
      }
    }

    // Salva pontos
    await this.db.query(
      `
      UPDATE bracket_predictions
      SET points = $2, is_correct = true, updated_at = NOW()
      WHERE user_id = $1 AND match_id IS NULL
      `,
      [userId, totalPoints]
    )

    return {
      success: true,
      message: 'Resultados salvos e pontos calculados',
      userId,
      correctPredictions: correctCount,
      totalPredictions: Object.keys(predictions).length,
      totalPoints
    }
  }
}
