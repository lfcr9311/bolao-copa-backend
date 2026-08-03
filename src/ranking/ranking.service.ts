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
      WITH user_bracket_points AS (
        SELECT 
          bp.user_id,
          COALESCE(
            SUM(
              CASE 
                -- Se o palpite for correto (prediction == result)
                WHEN (bp.prediction_array->>k.key) IS NOT NULL 
                 AND (bp.prediction_array->>k.key) = (bp.results_array->>k.key) THEN
                  CASE 
                    -- R32 (Jogos 73 a 88): 1 ponto (2^0)
                    WHEN k.key::INT BETWEEN 73 AND 88 THEN 1
                    -- Oitavas (Jogos 89 a 96): 2 pontos (2^1)
                    WHEN k.key::INT BETWEEN 89 AND 96 THEN 2
                    -- Quartas (Jogos 97 a 100): 4 pontos (2^2)
                    WHEN k.key::INT BETWEEN 97 AND 100 THEN 4
                    -- Semis (Jogos 101 e 102): 8 pontos (2^3)
                    WHEN k.key::INT BETWEEN 101 AND 102 THEN 8
                    -- 3º Lugar (Jogo 103): 16 pontos (2^4)
                    WHEN k.key::INT = 103 THEN 16
                    -- Final (Jogo 104): 32 pontos (2^5)
                    WHEN k.key::INT = 104 THEN 32
                    ELSE 1
                  END
                ELSE 0
              END
            ), 0
          )::INT as calculated_bracket_points
        FROM bracket_predictions bp
        LEFT JOIN LATERAL jsonb_object_keys(COALESCE(bp.prediction_array, '{}'::jsonb)) k(key) ON true
        WHERE bp.match_id IS NULL
        GROUP BY bp.user_id
      )
      SELECT
        u.id,
        u.name,
        u.email,
        u.photo,
        (SELECT COALESCE(SUM(points), 0)::INT FROM predictions WHERE user_id = u.id) AS grupos_points,
        (SELECT COALESCE(SUM(points), 0)::INT FROM predictions_knockout WHERE user_id = u.id) AS knockout_points,
        COALESCE(ubp.calculated_bracket_points, 0) AS bracket_points,
        (
          (SELECT COALESCE(SUM(points), 0) FROM predictions WHERE user_id = u.id) +
          (SELECT COALESCE(SUM(points), 0) FROM predictions_knockout WHERE user_id = u.id) +
          COALESCE(ubp.calculated_bracket_points, 0)
        )::INT AS total_points
      FROM users u
      LEFT JOIN user_bracket_points ubp ON ubp.user_id = u.id
      ORDER BY total_points DESC, u.name ASC
      `
    )

    return result.rows
  }
}