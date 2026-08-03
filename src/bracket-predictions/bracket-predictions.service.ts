import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { DatabaseService } from '../database/database.service'
import { randomUUID } from 'crypto'

type RoundPoints = Record<string, number>

// Potências de 2 para cada fase do mata-mata
const ROUND_POINTS: RoundPoints = {
  'Round 32': 1,
  'Round of 16': 2,
  'Quarter-final': 4,
  'Semi-final': 8,
  'Match for third place': 16,
  'Final': 32,
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

  async getBracketPredictionsArray(userId: string) {
    const result = await this.db.query(
      `
      SELECT prediction_array, results_array, points, is_correct
      FROM bracket_predictions
      WHERE user_id = $1 AND match_id IS NULL
      `,
      [userId]
    )

    if (result.rows.length === 0) {
      return {
        prediction_array: null,
        results_array: null,
        points: 0,
        is_correct: false,
      }
    }

    return result.rows[0]
  }

  async getPredictionsByMatchNumber(matchNumber: string, currentUserId?: string) {
    const matchResult = await this.db.query(
      `
      SELECT match_date FROM matches_knockout WHERE match_number = $1
      `,
      [parseInt(matchNumber, 10)]
    )

    if (matchResult.rows.length === 0) {
      throw new NotFoundException('Match not found')
    }

    const matchDate = new Date(matchResult.rows[0].match_date)
    const now = new Date()
    const thirtyMinutesBefore = new Date(matchDate.getTime() - 30 * 60 * 1000)

    if (now < thirtyMinutesBefore) {
      return {
        canView: false,
        message: 'Palpites serão visíveis 30 minutos antes do jogo',
        predictions: [],
      }
    }

    const predictions = await this.db.query(
      `
      SELECT
        u.id, u.name, u.email,
        bp.prediction_array,
        (bp.prediction_array->$2)::text as predicted_team_id
      FROM bracket_predictions bp
      INNER JOIN users u ON u.id = bp.user_id
      WHERE bp.prediction_array IS NOT NULL
      AND bp.prediction_array ? $2
      AND u.id != $3
      ORDER BY u.name
      `,
      [matchNumber, matchNumber, currentUserId || 'none']
    )

    return {
      canView: true,
      matchNumber,
      matchDate,
      totalPredictions: predictions.rows.length,
      predictions: predictions.rows.map(row => ({
        userName: row.name,
        userEmail: row.email,
        predictedTeamId: row.predicted_team_id?.replace(/"/g, ''),
      })),
    }
  }

  async getUserBracketResults(userId: string) {
    const result = await this.db.query(
      `
      SELECT u.name, u.email, bp.prediction_array, bp.results_array, bp.points, bp.is_correct, bp.created_at, bp.updated_at
      FROM bracket_predictions bp
      INNER JOIN users u ON u.id = bp.user_id
      WHERE bp.user_id = $1 AND bp.match_id IS NULL
      `,
      [userId]
    )

    if (result.rows.length === 0) {
      return {
        name: null,
        email: null,
        prediction_array: null,
        results_array: null,
        points: 0,
        is_correct: false,
        correctPredictions: 0,
        totalPredictions: 0,
        message: 'Nenhum palpite de bracket encontrado para este usuário',
      }
    }

    const record = result.rows[0]
    const predictions: Record<string, string> = record.prediction_array || {}
    const results: Record<string, string> = record.results_array || {}

    let correctCount = 0
    for (const [matchNum, predictedTeam] of Object.entries(predictions)) {
      const actualTeam = results[matchNum]
      if (actualTeam && predictedTeam === actualTeam) {
        correctCount++
      }
    }

    return {
      name: record.name,
      email: record.email,
      prediction_array: predictions,
      results_array: results,
      points: record.points || 0,
      is_correct: record.is_correct || false,
      correctPredictions: correctCount,
      totalPredictions: Object.keys(predictions).length,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }
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
    const deadline = new Date('2026-06-29T17:00:00Z')
    const now = new Date()

    if (now > deadline) {
      throw new BadRequestException('Prazo encerrado! Palpites do bracket só podem ser salvos até 28/06 às 20:00 UTC')
    }

    await this.db.query(
      `DELETE FROM bracket_predictions WHERE user_id = $1 AND match_id IS NULL`,
      [userId]
    )

    await this.db.query(
      `
      INSERT INTO bracket_predictions (id, user_id, match_id, predicted_team_id, prediction_array, points, is_correct, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, 0, false, NOW(), NOW())
      `,
      [
        randomUUID(),
        userId,
        null,
        null,
        JSON.stringify(predictionArray),
      ]
    )

    return {
      success: true,
      message: 'Palpites do bracket salvos com sucesso',
      predictionsCount: Object.keys(predictionArray).length,
    }
  }

  async setResultsArray(userId: string, resultsArray: Record<string, string>) {
    await this.db.query(
      `
      UPDATE bracket_predictions
      SET results_array = $2, updated_at = NOW()
      WHERE user_id = $1 AND match_id IS NULL
      `,
      [userId, JSON.stringify(resultsArray)]
    )

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

    // Pontuação baseada em Potências de 2 ($2^0, 2^1, 2^2, 2^3, 2^4, 2^5$)
    const roundPoints: Record<string, number> = {
  // 16-avos (Round 32) -> 1 ponto
  '73': 1, '74': 1, '75': 1, '76': 1, '77': 1, '78': 1, '79': 1, '80': 1,
  '81': 1, '82': 1, '83': 1, '84': 1, '85': 1, '86': 1, '87': 1, '88': 1,

  // Oitavas (Round of 16) -> 2 pontos
  'R16-89': 2, 'R16-90': 2, 'R16-91': 2, 'R16-92': 2,
  'R16-93': 2, 'R16-94': 2, 'R16-95': 2, 'R16-96': 2,

  // Quartas (Quarter-finals) -> 4 pontos
  'QF-97': 4, 'QF-98': 4, 'QF-99': 4, 'QF-100': 4,

  // Semifinais (Semi-finals) -> 8 pontos
  'SF-101': 8, 'SF-102': 8,

  // 3º Lugar -> 16 pontos (se houver)
  '3RD-103': 16,

  // Final -> 32 pontos
  'FINAL-104': 32,
}

    let correctCount = 0
    let totalPoints = 0

    for (const [matchNum, predictedTeam] of Object.entries(predictions)) {
      const actualTeam = results[matchNum]
      if (predictedTeam && actualTeam && predictedTeam === actualTeam) {
        correctCount++
        totalPoints += roundPoints[matchNum] || 1
      }
    }

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
      totalPoints,
    }
  }
}