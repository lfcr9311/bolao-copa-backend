import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { DatabaseService } from '../database/database.service'

type KnockoutMatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'CANCELLED'

type KnockoutMatchForPrediction = {
  id: string
  match_date: string | Date
  status: KnockoutMatchStatus
}

type KnockoutPredictionPoints = {
  points: number
  pointsRegularTime: number
  pointsAlternative: number
  correctResultRegular: boolean
  correctScoreRegular: boolean
  correctGoalDifferenceRegular: boolean
  correctAlternative: boolean
  wrongAlternative: boolean
}

@Injectable()
export class KnockoutMatchesService {
  constructor(private readonly db: DatabaseService) {}

  async updateResult(matchId: string, result: {
    home_score: number
    away_score: number
    home_score_extra_time?: number
    away_score_extra_time?: number
    home_penalties?: number
    away_penalties?: number
  }) {
    await this.db.query(
      `
      UPDATE matches_knockout
      SET
        home_score = $1,
        away_score = $2,
        home_score_extra_time = $3,
        away_score_extra_time = $4,
        home_penalties = $5,
        away_penalties = $6,
        status = 'FINISHED',
        updated_at = NOW()
      WHERE id = $7
      `,
      [
        result.home_score,
        result.away_score,
        result.home_score_extra_time ?? null,
        result.away_score_extra_time ?? null,
        result.home_penalties ?? null,
        result.away_penalties ?? null,
        matchId
      ]
    )
  }

  async findAll() {
    const result = await this.db.query(
      `
      SELECT
        m.id,
        m.home_team_id,
        m.away_team_id,
        m.home_score,
        m.away_score,
        m.home_score_extra_time,
        m.away_score_extra_time,
        m.home_penalties,
        m.away_penalties,
        to_char(m.match_date, 'YYYY-MM-DD"T"HH24:MI:SS') || 'Z' AS match_date,
        m.status,
        m.round,
        m.match_number,
        m.advance_team_id,
        ht.name AS home_team_name,
        ht.code AS home_team_code,
        at.name AS away_team_name,
        at.code AS away_team_code
      FROM matches_knockout m
      INNER JOIN teams ht ON ht.id = m.home_team_id
      INNER JOIN teams at ON at.id = m.away_team_id
      ORDER BY COALESCE(m.match_number, 0), m.match_date ASC
      `
    )

    return result.rows
  }

  async createOrUpdatePrediction(
    userId: string,
    matchId: string,
    homeScore: number,
    awayScore: number,
    homeScoreExtraTime?: number,
    awayScoreExtraTime?: number,
    homePenalties?: number,
    awayPenalties?: number
  ) {
    this.validateScore(homeScore, 'Gols do mandante')
    this.validateScore(awayScore, 'Gols do visitante')

    if (homeScoreExtraTime !== undefined) {
      this.validateScore(homeScoreExtraTime, 'Gols do mandante na prorrogação')
    }
    if (awayScoreExtraTime !== undefined) {
      this.validateScore(awayScoreExtraTime, 'Gols do visitante na prorrogação')
    }
    if (homePenalties !== undefined) {
      this.validateScore(homePenalties, 'Pênaltis do mandante')
    }
    if (awayPenalties !== undefined) {
      this.validateScore(awayPenalties, 'Pênaltis do visitante')
    }

    const matchResult = await this.db.query<KnockoutMatchForPrediction>(
      `
      SELECT
        id,
        to_char(match_date, 'YYYY-MM-DD"T"HH24:MI:SS') || 'Z' AS match_date,
        status
      FROM matches_knockout
      WHERE id = $1
      LIMIT 1
      `,
      [matchId]
    )

    const match = matchResult.rows[0]

    if (!match) {
      throw new NotFoundException('Jogo de knockout não encontrado')
    }

    this.validatePredictionDeadline(match)

    const result = await this.db.query(
      `
      INSERT INTO predictions_knockout (
        user_id,
        match_id,
        home_score,
        away_score,
        home_score_extra_time,
        away_score_extra_time,
        home_penalties,
        away_penalties,
        points,
        points_regular_time,
        points_alternative,
        correct_result_regular,
        correct_score_regular,
        correct_goal_difference_regular,
        correct_alternative,
        wrong_alternative,
        created_at,
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 0, 0, false, false, false, false, false, NOW(), NOW())
      ON CONFLICT (user_id, match_id)
      DO UPDATE SET
        home_score = EXCLUDED.home_score,
        away_score = EXCLUDED.away_score,
        home_score_extra_time = EXCLUDED.home_score_extra_time,
        away_score_extra_time = EXCLUDED.away_score_extra_time,
        home_penalties = EXCLUDED.home_penalties,
        away_penalties = EXCLUDED.away_penalties,
        points = 0,
        points_regular_time = 0,
        points_alternative = 0,
        correct_result_regular = false,
        correct_score_regular = false,
        correct_goal_difference_regular = false,
        correct_alternative = false,
        wrong_alternative = false,
        updated_at = NOW()
      RETURNING *
      `,
      [
        userId,
        matchId,
        homeScore,
        awayScore,
        homeScoreExtraTime ?? null,
        awayScoreExtraTime ?? null,
        homePenalties ?? null,
        awayPenalties ?? null
      ]
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
        p.home_score_extra_time AS predicted_home_score_extra_time,
        p.away_score_extra_time AS predicted_away_score_extra_time,
        p.home_penalties AS predicted_home_penalties,
        p.away_penalties AS predicted_away_penalties,
        p.points,
        p.points_regular_time,
        p.points_alternative,
        p.correct_result_regular,
        p.correct_score_regular,
        p.correct_goal_difference_regular,
        p.correct_alternative,
        p.wrong_alternative,
        m.home_score AS real_home_score,
        m.away_score AS real_away_score,
        m.home_score_extra_time AS real_home_score_extra_time,
        m.away_score_extra_time AS real_away_score_extra_time,
        m.home_penalties AS real_home_penalties,
        m.away_penalties AS real_away_penalties,
        to_char(m.match_date, 'YYYY-MM-DD"T"HH24:MI:SS') || 'Z' AS match_date,
        m.status,
        m.round,
        ht.name AS home_team_name,
        ht.code AS home_team_code,
        at.name AS away_team_name,
        at.code AS away_team_code
      FROM predictions_knockout p
      INNER JOIN matches_knockout m ON m.id = p.match_id
      INNER JOIN teams ht ON ht.id = m.home_team_id
      INNER JOIN teams at ON at.id = m.away_team_id
      WHERE p.user_id = $1
      ORDER BY m.match_date ASC
      `,
      [userId]
    )

    return result.rows
  }

  async findByMatch(matchId: string) {
    const result = await this.db.query(
      `
      SELECT
        p.id,
        p.user_id,
        p.match_id,
        p.home_score AS predicted_home_score,
        p.away_score AS predicted_away_score,
        p.home_score_extra_time AS predicted_home_score_extra_time,
        p.away_score_extra_time AS predicted_away_score_extra_time,
        p.home_penalties AS predicted_home_penalties,
        p.away_penalties AS predicted_away_penalties,
        p.points,
        p.points_regular_time,
        p.points_alternative,
        p.correct_result_regular,
        p.correct_score_regular,
        p.correct_goal_difference_regular,
        p.correct_alternative,
        p.wrong_alternative,
        u.name AS user_name,
        u.email AS user_email
      FROM predictions_knockout p
      INNER JOIN users u ON u.id = p.user_id
      WHERE p.match_id = $1
      ORDER BY p.points DESC, u.name ASC
      `,
      [matchId]
    )

    return result.rows
  }

  async getPredictionsVisible(matchId: string, currentUserId?: string) {
    // Busca o match para verificar se está dentro de 30 min antes do jogo
    const matchResult = await this.db.query(
      `SELECT match_date FROM matches_knockout WHERE id = $1`,
      [matchId]
    )

    if (matchResult.rows.length === 0) {
      throw new NotFoundException('Match not found')
    }

    const matchDate = new Date(matchResult.rows[0].match_date)
    const now = new Date()
    const thirtyMinutesBefore = new Date(matchDate.getTime() - 30 * 60 * 1000)

    // Se ainda não chegou 30 min antes, retorna vazio
    if (now < thirtyMinutesBefore) {
      return {
        canView: false,
        message: `Palpites serão visíveis em ${Math.ceil((thirtyMinutesBefore.getTime() - now.getTime()) / 60000)} minutos`,
        predictions: []
      }
    }

    // Busca todos os palpites desse match dos outros users
    const predictions = await this.db.query(
      `
      SELECT
        u.name,
        u.email,
        p.home_score,
        p.away_score,
        p.home_score_extra_time,
        p.away_score_extra_time,
        p.home_penalties,
        p.away_penalties
      FROM predictions_knockout p
      INNER JOIN users u ON u.id = p.user_id
      WHERE p.match_id = $1
      AND u.id != $2
      ORDER BY u.name
      `,
      [matchId, currentUserId || 'none']
    )

    return {
      canView: true,
      matchId,
      matchDate,
      totalPredictions: predictions.rows.length,
      predictions: predictions.rows
    }
  }

  async calculatePointsForMatch(
    matchId: string,
    realHomeScore: number,
    realAwayScore: number,
    realHomeScoreExtraTime?: number,
    realAwayScoreExtraTime?: number,
    realHomePenalties?: number,
    realAwayPenalties?: number
  ) {
    this.validateScore(realHomeScore, 'Gols do mandante')
    this.validateScore(realAwayScore, 'Gols do visitante')

    if (realHomeScoreExtraTime !== undefined) {
      this.validateScore(realHomeScoreExtraTime, 'Gols do mandante na prorrogação')
    }
    if (realAwayScoreExtraTime !== undefined) {
      this.validateScore(realAwayScoreExtraTime, 'Gols do visitante na prorrogação')
    }
    if (realHomePenalties !== undefined) {
      this.validateScore(realHomePenalties, 'Pênaltis do mandante')
    }
    if (realAwayPenalties !== undefined) {
      this.validateScore(realAwayPenalties, 'Pênaltis do visitante')
    }

    const predictions = await this.db.query(
      `
      SELECT *
      FROM predictions_knockout
      WHERE match_id = $1
      `,
      [matchId]
    )

    for (const prediction of predictions.rows) {
      const calculated = this.calculatePredictionPoints(
        realHomeScore,
        realAwayScore,
        realHomeScoreExtraTime,
        realAwayScoreExtraTime,
        realHomePenalties,
        realAwayPenalties,
        prediction.home_score,
        prediction.away_score,
        prediction.home_score_extra_time,
        prediction.away_score_extra_time,
        prediction.home_penalties,
        prediction.away_penalties
      )

      await this.db.query(
        `
        UPDATE predictions_knockout
        SET
          points = $1,
          points_regular_time = $2,
          points_alternative = $3,
          correct_result_regular = $4,
          correct_score_regular = $5,
          correct_goal_difference_regular = $6,
          correct_alternative = $7,
          wrong_alternative = $8,
          updated_at = NOW()
        WHERE id = $9
        `,
        [
          calculated.points,
          calculated.pointsRegularTime,
          calculated.pointsAlternative,
          calculated.correctResultRegular,
          calculated.correctScoreRegular,
          calculated.correctGoalDifferenceRegular,
          calculated.correctAlternative,
          calculated.wrongAlternative,
          prediction.id
        ]
      )
    }

    return { updated: predictions.rowCount ?? 0 }
  }

  private validatePredictionDeadline(match: KnockoutMatchForPrediction) {
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
    realHomeScoreExtraTime?: number,
    realAwayScoreExtraTime?: number,
    realHomePenalties?: number,
    realAwayPenalties?: number,
    predictedHomeScore: number = 0,
    predictedAwayScore: number = 0,
    predictedHomeScoreExtraTime?: number,
    predictedAwayScoreExtraTime?: number,
    predictedHomePenalties?: number,
    predictedAwayPenalties?: number
  ): KnockoutPredictionPoints {
    let pointsRegularTime = 0
    let pointsAlternative = 0
    let correctAlternative = false
    let wrongAlternative = false

    // Regular time calculation
    const regularTimeResult = this.calculateRegularTimePoints(
      realHomeScore,
      realAwayScore,
      predictedHomeScore,
      predictedAwayScore
    )

    pointsRegularTime = regularTimeResult.points

    // Alternative scenario calculation (only if the user provided alternative scenario)
    if (
      predictedHomeScoreExtraTime !== undefined ||
      predictedAwayScoreExtraTime !== undefined ||
      predictedHomePenalties !== undefined ||
      predictedAwayPenalties !== undefined
    ) {
      const alternativeResult = this.calculateAlternativeScenarioPoints(
        realHomeScore,
        realAwayScore,
        realHomeScoreExtraTime,
        realAwayScoreExtraTime,
        realHomePenalties,
        realAwayPenalties,
        predictedHomeScore,
        predictedAwayScore,
        predictedHomeScoreExtraTime,
        predictedAwayScoreExtraTime,
        predictedHomePenalties,
        predictedAwayPenalties
      )

      pointsAlternative = alternativeResult.points
      correctAlternative = alternativeResult.correct
      wrongAlternative = alternativeResult.wrong
    }

    const totalPoints = pointsRegularTime + pointsAlternative

    return {
      points: totalPoints,
      pointsRegularTime,
      pointsAlternative,
      correctResultRegular: regularTimeResult.correctResult,
      correctScoreRegular: regularTimeResult.exactScore,
      correctGoalDifferenceRegular: regularTimeResult.correctGoalDifference,
      correctAlternative,
      wrongAlternative
    }
  }

  private calculateRegularTimePoints(
    realHomeScore: number,
    realAwayScore: number,
    predictedHomeScore: number,
    predictedAwayScore: number
  ) {
    const exactScore = realHomeScore === predictedHomeScore && realAwayScore === predictedAwayScore

    const realResult = this.getMatchResult(realHomeScore, realAwayScore)
    const predictedResult = this.getMatchResult(predictedHomeScore, predictedAwayScore)

    const correctResult = realResult === predictedResult

    const realGoalDifference = realHomeScore - realAwayScore
    const predictedGoalDifference = predictedHomeScore - predictedAwayScore
    const correctGoalDifference = realGoalDifference === predictedGoalDifference

    let points = 0

    // If predicted a draw
    if (predictedResult === 'DRAW') {
      if (exactScore) {
        points = 10 // Cravou o placar do empate
      } else if (correctResult) {
        points = 5 // Acertou o empate
      }
    }
    // If predicted a winner
    else {
      if (exactScore) {
        points = 10 // Cravou o placar
      } else if (correctResult && correctGoalDifference) {
        points = 8 // Acertou vencedor + saldo de gols
      } else if (correctResult) {
        points = 5 // Acertou apenas o vencedor
      }
    }

    return {
      points,
      exactScore,
      correctResult,
      correctGoalDifference
    }
  }

  private calculateAlternativeScenarioPoints(
    realHomeScore: number,
    realAwayScore: number,
    realHomeScoreExtraTime?: number,
    realAwayScoreExtraTime?: number,
    realHomePenalties?: number,
    realAwayPenalties?: number,
    predictedHomeScore: number = 0,
    predictedAwayScore: number = 0,
    predictedHomeScoreExtraTime?: number,
    predictedAwayScoreExtraTime?: number,
    predictedHomePenalties?: number,
    predictedAwayPenalties?: number
  ) {
    const regularTimeResult = this.getMatchResult(realHomeScore, realAwayScore)
    const predictedRegularTimeResult = this.getMatchResult(predictedHomeScore, predictedAwayScore)

    // Prorrogação só existe se tempo normal foi empate
    const hasExtraTimeInReality = regularTimeResult === 'DRAW' &&
      realHomeScoreExtraTime !== undefined &&
      realAwayScoreExtraTime !== undefined

    // Pênaltis só existem se prorrogação foi empate
    const extraTimeResult = hasExtraTimeInReality
      ? this.getMatchResult(realHomeScoreExtraTime!, realAwayScoreExtraTime!)
      : null

    const hasPenaltiesInReality = hasExtraTimeInReality &&
      extraTimeResult === 'DRAW' &&
      realHomePenalties !== undefined &&
      realAwayPenalties !== undefined

    // Cenário 1: Apostou em vencedor no tempo normal
    if (predictedRegularTimeResult !== 'DRAW') {
      // Se o jogo foi para prorrogação/pênaltis (empate no TN, não como previsto)
      if (regularTimeResult === 'DRAW' && hasExtraTimeInReality) {
        if (extraTimeResult === 'DRAW' && hasPenaltiesInReality) {
          // Jogo foi para pênaltis
          const penaltiesResult = this.getMatchResult(realHomePenalties!, realAwayPenalties!)
          const predictedPenaltiesResult = this.getMatchResult(
            predictedHomePenalties ?? 0,
            predictedAwayPenalties || 0
          )

          const penaltiesExactScore =
            realHomePenalties === predictedHomePenalties &&
            realAwayPenalties === predictedAwayPenalties

          if (penaltiesExactScore) {
            return { points: 10, correct: true, wrong: false } // Cravou o placar dos pênaltis
          } else if (penaltiesResult === predictedPenaltiesResult) {
            return { points: 8, correct: true, wrong: false } // Acertou apenas o vencedor
          }
        } else if (extraTimeResult !== 'DRAW') {
          // Jogo foi para prorrogação e teve vencedor
          const predictedExtraTimeResult = this.getMatchResult(
            predictedHomeScoreExtraTime ?? 0,
            predictedAwayScoreExtraTime ?? 0
          )

          if (extraTimeResult === predictedExtraTimeResult) {
            return { points: 8, correct: true, wrong: false } // Acertou o vencedor na prorrogação
          }
        }
      }

      return { points: -3, correct: false, wrong: true } // Errou o cenário
    }

    // Cenário 2: Apostou em empate no tempo normal
    if (predictedRegularTimeResult === 'DRAW') {
      // Se não houve prorrogação (jogo não foi para extra time)
      if (!hasExtraTimeInReality) {
        // Acertou o empate, mas não há cenário alternativo
        return { points: 0, correct: false, wrong: false }
      }

      // Houve prorrogação
      if (extraTimeResult === 'DRAW' && hasPenaltiesInReality) {
        // Jogo foi para pênaltis
        const penaltiesResult = this.getMatchResult(realHomePenalties!, realAwayPenalties!)
        const predictedPenaltiesResult = this.getMatchResult(
          predictedHomePenalties ?? 0,
          predictedAwayPenalties || 0
        )

        const penaltiesExactScore =
          realHomePenalties === predictedHomePenalties &&
          realAwayPenalties === predictedAwayPenalties

        if (penaltiesExactScore) {
          return { points: 10, correct: true, wrong: false } // Cravou o placar dos pênaltis
        } else if (penaltiesResult === predictedPenaltiesResult) {
          return { points: 8, correct: true, wrong: false } // Acertou apenas o vencedor
        }
      } else if (extraTimeResult !== 'DRAW') {
        // Prorrogação teve um vencedor
        const predictedExtraTimeResult = this.getMatchResult(
          predictedHomeScoreExtraTime ?? 0,
          predictedAwayScoreExtraTime ?? 0
        )

        if (extraTimeResult === predictedExtraTimeResult) {
          return { points: 8, correct: true, wrong: false } // Acertou o vencedor na prorrogação
        }
      } else if (extraTimeResult === 'DRAW') {
        // Prorrogação também foi empate
        const predictedExtraTimeResult = this.getMatchResult(
          predictedHomeScoreExtraTime ?? 0,
          predictedAwayScoreExtraTime || 0
        )

        if (extraTimeResult === predictedExtraTimeResult) {
          return { points: 3, correct: true, wrong: false } // Acertou novo empate na prorrogação
        }
      }

      return { points: -3, correct: false, wrong: true } // Errou o cenário
    }

    return { points: 0, correct: false, wrong: false }
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
