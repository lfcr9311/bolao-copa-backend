import { BadRequestException, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { DatabaseService } from '../database/database.service'
import { PredictionsService } from '../predictions/predictions.service'

type FootballDataTeam = {
  id: number | null
  name: string | null
  shortName: string | null
  tla: string | null
  crest: string | null
}

type FootballDataScore = {
  winner: string | null
  duration: string
  fullTime: {
    home: number | null
    away: number | null
  }
  halfTime?: {
    home: number | null
    away: number | null
  }
}

type FootballDataMatch = {
  id: number
  utcDate: string
  status: string
  matchday: number
  stage: string
  group: string | null
  lastUpdated: string
  homeTeam: FootballDataTeam
  awayTeam: FootballDataTeam
  score: FootballDataScore
}

type FootballDataResponse = {
  matches: FootballDataMatch[]
}

type LocalMatch = {
  id: string
  match_date: string | Date
  home_team_code: string
  away_team_code: string
}

@Injectable()
export class FootballDataService {
  constructor(
    private readonly db: DatabaseService,
    private readonly predictionsService: PredictionsService,
    private readonly configService: ConfigService
  ) {}

  async syncFinishedMatches() {
    const localMatches = await this.findLocalMatchesToCheck()

    if (localMatches.length === 0) {
      return {
        ok: true,
        api_calls: 0,
        checked: 0,
        updated: 0,
        marked_live: 0,
        skipped_without_score: 0,
        not_found_in_api: 0,
        message: 'Nenhum jogo dentro da janela de atualização'
      }
    }

    const apiMatches = await this.fetchGroupStageMatches()

    let updated = 0
    let markedLive = 0
    let skippedWithoutScore = 0
    let notFoundInApi = 0

    for (const localMatch of localMatches) {
      const apiMatch = this.findApiMatch(localMatch, apiMatches)

      if (!apiMatch) {
        notFoundInApi++
        continue
      }

      const homeScore = apiMatch.score?.fullTime?.home
      const awayScore = apiMatch.score?.fullTime?.away

      if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore)) {
        skippedWithoutScore++

        const liveUpdated = await this.markLiveIfNeeded(localMatch.id, apiMatch.status)

        if (liveUpdated) {
          markedLive++
        }

        continue
      }

      const wasUpdated = await this.finishLocalMatch(
        localMatch.id,
        Number(homeScore),
        Number(awayScore)
      )

      if (wasUpdated) {
        updated++
      }
    }

    return {
      ok: true,
      api_calls: 1,
      checked: localMatches.length,
      updated,
      marked_live: markedLive,
      skipped_without_score: skippedWithoutScore,
      not_found_in_api: notFoundInApi
    }
  }

  private async findLocalMatchesToCheck(): Promise<LocalMatch[]> {
    const result = await this.db.query<LocalMatch>(
      `
      SELECT
        m.id,
        m.match_date,
        ht.code AS home_team_code,
        at.code AS away_team_code
      FROM matches m
      INNER JOIN teams ht ON ht.id = m.home_team_id
      INNER JOIN teams at ON at.id = m.away_team_id
      WHERE m.status <> 'FINISHED'
        AND m.match_date <= (NOW() AT TIME ZONE 'UTC')
        AND m.match_date >= (NOW() AT TIME ZONE 'UTC') - INTERVAL '2 hours'
      ORDER BY m.match_date ASC
      `
    )

    return result.rows
  }

  private async fetchGroupStageMatches(): Promise<FootballDataMatch[]> {
    const token = this.configService.get<string>('FOOTBALL_DATA_API_TOKEN')

    if (!token) {
      throw new BadRequestException('FOOTBALL_DATA_API_TOKEN não configurado')
    }

    const response = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
      method: 'GET',
      headers: {
        'X-Auth-Token': token
      }
    })

    if (!response.ok) {
      const text = await response.text()
      throw new BadRequestException(`Erro na football-data: ${response.status} - ${text}`)
    }

    const data = (await response.json()) as FootballDataResponse

    return (data.matches || []).filter((match) => match.stage === 'GROUP_STAGE')
  }

  private findApiMatch(localMatch: LocalMatch, apiMatches: FootballDataMatch[]) {
    const localHomeCode = this.normalizeTeamCode(localMatch.home_team_code)
    const localAwayCode = this.normalizeTeamCode(localMatch.away_team_code)
    const localMatchTime = this.toUtcTime(localMatch.match_date)

    return apiMatches.find((apiMatch) => {
      const apiHomeCode = this.normalizeTeamCode(apiMatch.homeTeam?.tla)
      const apiAwayCode = this.normalizeTeamCode(apiMatch.awayTeam?.tla)
      const apiMatchTime = new Date(apiMatch.utcDate).getTime()

      const sameTeams = apiHomeCode === localHomeCode && apiAwayCode === localAwayCode
      const sameDate = Math.abs(apiMatchTime - localMatchTime) <= 10 * 60 * 1000

      return sameTeams && sameDate
    })
  }

  private async markLiveIfNeeded(matchId: string, apiStatus: string) {
    const normalizedStatus = apiStatus.toUpperCase()

    if (!['IN_PLAY', 'LIVE', 'PAUSED'].includes(normalizedStatus)) {
      return false
    }

    const result = await this.db.query(
      `
      UPDATE matches
      SET
        status = 'LIVE',
        updated_at = NOW()
      WHERE id = $1
        AND status = 'SCHEDULED'
      RETURNING id
      `,
      [matchId]
    )

    return (result.rowCount ?? 0) > 0
  }

  private async finishLocalMatch(matchId: string, homeScore: number, awayScore: number) {
    const result = await this.db.query(
      `
      UPDATE matches
      SET
        home_score = $1,
        away_score = $2,
        status = 'FINISHED',
        updated_at = NOW()
      WHERE id = $3
        AND status <> 'FINISHED'
      RETURNING id
      `,
      [homeScore, awayScore, matchId]
    )

    if ((result.rowCount ?? 0) === 0) {
      return false
    }

    await this.predictionsService.calculatePointsForMatch(matchId, homeScore, awayScore)

    return true
  }

  private normalizeTeamCode(code?: string | null) {
    if (!code) {
      return ''
    }

    const normalized = code.trim().toUpperCase()

    const map: Record<string, string> = {
      CUR: 'CUW',
      URY: 'URU'
    }

    return map[normalized] || normalized
  }

  private toUtcTime(value: string | Date) {
    if (value instanceof Date) {
      return value.getTime()
    }

    const text = String(value)

    if (text.endsWith('Z')) {
      return new Date(text).getTime()
    }

    return new Date(`${text}Z`).getTime()
  }
}