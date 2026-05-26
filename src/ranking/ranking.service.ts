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
        COALESCE(SUM(p.points), 0)::INT AS total_points,
        COALESCE(SUM(CASE WHEN p.exact_score = true THEN 1 ELSE 0 END), 0)::INT AS exact_scores,
        COALESCE(SUM(CASE WHEN p.correct_result = true THEN 1 ELSE 0 END), 0)::INT AS correct_results,
        COALESCE(SUM(CASE WHEN p.correct_goal_difference = true THEN 1 ELSE 0 END), 0)::INT AS correct_goal_differences
      FROM users u
      LEFT JOIN predictions p ON p.user_id = u.id
      GROUP BY u.id, u.name, u.email
      ORDER BY
        total_points DESC,
        exact_scores DESC,
        correct_results DESC,
        u.name ASC
      `
    )

    return result.rows
  }
}
