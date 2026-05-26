import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common'
import { DatabaseService } from '../database/database.service'
import { PredictionsService } from '../predictions/predictions.service'

@Injectable()
export class MatchesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly predictionsService: PredictionsService
  ) {}

  async create(body: {
    home_team_id: string
    away_team_id: string
    match_date: string
    round?: string
    group_name?: string
  }) {
    if (body.home_team_id === body.away_team_id) {
      throw new BadRequestException('Os times devem ser diferentes')
    }

    if (!body.match_date) {
      throw new BadRequestException('Data da partida é obrigatória')
    }

    const matchDate = new Date(body.match_date)

    if (Number.isNaN(matchDate.getTime())) {
      throw new BadRequestException('Data da partida inválida')
    }

    const result = await this.db.query(
      `
      INSERT INTO matches (
        home_team_id,
        away_team_id,
        match_date,
        round,
        group_name
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        home_team_id,
        away_team_id,
        to_char(match_date, 'YYYY-MM-DD"T"HH24:MI:SS') || 'Z' AS match_date,
        home_score,
        away_score,
        status,
        round,
        group_name,
        created_at,
        updated_at
      `,
      [
        body.home_team_id,
        body.away_team_id,
        matchDate.toISOString(),
        body.round || null,
        this.normalizeGroupName(body.group_name)
      ]
    )

    return result.rows[0]
  }

  async findAll() {
    const result = await this.db.query(
      `
      SELECT
        m.id,
        m.home_team_id,
        ht.name AS home_team_name,
        ht.code AS home_team_code,
        m.away_team_id,
        at.name AS away_team_name,
        at.code AS away_team_code,
        m.home_score,
        m.away_score,
        to_char(m.match_date, 'YYYY-MM-DD"T"HH24:MI:SS') || 'Z' AS match_date,
        m.status,
        m.round,
        m.group_name,
        m.created_at
      FROM matches m
      INNER JOIN teams ht ON ht.id = m.home_team_id
      INNER JOIN teams at ON at.id = m.away_team_id
      ORDER BY m.match_date ASC
      `
    )

    return result.rows
  }

  async finishMatch(matchId: string, homeScore: number, awayScore: number) {
    const match = await this.findById(matchId)

    if (!match) {
      throw new NotFoundException('Jogo não encontrado')
    }

    this.validateScore(homeScore, 'Gols do mandante')
    this.validateScore(awayScore, 'Gols do visitante')

    const result = await this.db.query(
      `
      UPDATE matches
      SET
        home_score = $1,
        away_score = $2,
        status = 'FINISHED',
        updated_at = NOW()
      WHERE id = $3
      RETURNING
        id,
        home_team_id,
        away_team_id,
        to_char(match_date, 'YYYY-MM-DD"T"HH24:MI:SS') || 'Z' AS match_date,
        home_score,
        away_score,
        status,
        round,
        group_name,
        created_at,
        updated_at
      `,
      [homeScore, awayScore, matchId]
    )

    await this.predictionsService.calculatePointsForMatch(matchId, homeScore, awayScore)

    return result.rows[0]
  }

  async findById(matchId: string) {
    const result = await this.db.query(
      `
      SELECT
        id,
        home_team_id,
        away_team_id,
        match_date,
        home_score,
        away_score,
        status,
        round,
        group_name,
        created_at,
        updated_at
      FROM matches
      WHERE id = $1
      LIMIT 1
      `,
      [matchId]
    )

    return result.rows[0] || null
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

  private normalizeGroupName(groupName?: string | null) {
    if (!groupName) {
      return null
    }

    return groupName
      .replace(/^group\s+/i, '')
      .trim()
      .toUpperCase()
  }
}