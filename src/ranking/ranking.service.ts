import { Injectable } from '@nestjs/common'
import { DatabaseService } from '../database/database.service'

@Injectable()
export class RankingService {
  constructor(private readonly db: DatabaseService) {}

  async getRanking() {
    const result = await this.db.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.photo,
        COALESCE(SUM(p.points), 0)::INT AS total_points,
        COALESCE(SUM(CASE WHEN p.exact_score = true THEN 1 ELSE 0 END), 0)::INT AS exact_scores,
        COALESCE(SUM(CASE WHEN p.correct_result = true THEN 1 ELSE 0 END), 0)::INT AS correct_results,
        COALESCE(SUM(CASE WHEN p.correct_goal_difference = true THEN 1 ELSE 0 END), 0)::INT AS correct_goal_differences
      FROM users u
      LEFT JOIN predictions p ON p.user_id = u.id
      GROUP BY u.id, u.name, u.email, u.photo
      ORDER BY
        total_points DESC,
        exact_scores DESC,
        correct_results DESC,
        u.name ASC
      `
    )

    return result.rows
  }

  async getKnockoutRanking() {
    const result = await this.db.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.photo,
        COALESCE(SUM(pk.points), 0)::INT AS total_points,
        COALESCE(SUM(CASE WHEN pk.correct_score_regular = true THEN 1 ELSE 0 END), 0)::INT AS exact_scores,
        COALESCE(SUM(CASE WHEN pk.correct_result_regular = true THEN 1 ELSE 0 END), 0)::INT AS correct_results,
        COALESCE(COUNT(pk.id), 0)::INT AS total_predictions
      FROM users u
      LEFT JOIN predictions_knockout pk ON pk.user_id = u.id
      GROUP BY u.id, u.name, u.email, u.photo
      ORDER BY
        total_points DESC,
        exact_scores DESC,
        correct_results DESC,
        u.name ASC
      `
    )

    return result.rows
  }

  async getGeneralRanking() {
    const result = await this.db.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.photo,
        (SELECT COALESCE(SUM(points), 0)::INT FROM predictions WHERE user_id = u.id) AS grupos_points,
        (SELECT COALESCE(SUM(points), 0)::INT FROM predictions_knockout WHERE user_id = u.id) AS knockout_points,
        (SELECT COALESCE(points, 0)::INT FROM bracket_predictions WHERE user_id = u.id AND match_id IS NULL) AS bracket_points
      FROM users u
      ORDER BY
        ((SELECT COALESCE(SUM(points), 0) FROM predictions WHERE user_id = u.id) +
         (SELECT COALESCE(SUM(points), 0) FROM predictions_knockout WHERE user_id = u.id) +
         (SELECT COALESCE(points, 0) FROM bracket_predictions WHERE user_id = u.id AND match_id IS NULL)) DESC
      `
    )

    return result.rows.map(row => ({
      ...row,
      total_points: (row.grupos_points + row.knockout_points + row.bracket_points)
    }))
  }
}
