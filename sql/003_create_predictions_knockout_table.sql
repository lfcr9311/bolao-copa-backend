-- Create predictions_knockout table
CREATE TABLE IF NOT EXISTS predictions_knockout (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches_knockout(id) ON DELETE CASCADE,

  -- Regular time prediction
  home_score INT NOT NULL,
  away_score INT NOT NULL,

  -- Alternative scenario (extra time and/or penalties)
  home_score_extra_time INT,
  away_score_extra_time INT,
  home_penalties INT,
  away_penalties INT,

  -- Points calculation
  points INT NOT NULL DEFAULT 0,
  points_regular_time INT NOT NULL DEFAULT 0,
  points_alternative INT NOT NULL DEFAULT 0,

  -- Flags for verification
  correct_result_regular BOOLEAN NOT NULL DEFAULT false,
  correct_score_regular BOOLEAN NOT NULL DEFAULT false,
  correct_goal_difference_regular BOOLEAN NOT NULL DEFAULT false,
  correct_alternative BOOLEAN NOT NULL DEFAULT false,
  wrong_alternative BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_knockout_prediction_per_user_match UNIQUE (user_id, match_id),
  CONSTRAINT prediction_scores_non_negative CHECK (
    home_score >= 0 AND away_score >= 0 AND
    (home_score_extra_time IS NULL OR home_score_extra_time >= 0) AND
    (away_score_extra_time IS NULL OR away_score_extra_time >= 0) AND
    (home_penalties IS NULL OR home_penalties >= 0) AND
    (away_penalties IS NULL OR away_penalties >= 0)
  )
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_predictions_knockout_user_id ON predictions_knockout(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_knockout_match_id ON predictions_knockout(match_id);
CREATE INDEX IF NOT EXISTS idx_predictions_knockout_created_at ON predictions_knockout(created_at);
