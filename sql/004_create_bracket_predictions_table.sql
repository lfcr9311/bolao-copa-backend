-- Create bracket_predictions table for knockout bracket (Round 32 to Final)
CREATE TABLE IF NOT EXISTS bracket_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES matches_knockout(id) ON DELETE CASCADE,
  predicted_team_id UUID NOT NULL REFERENCES teams(id),

  -- Points awarded when match is finished
  points INT NOT NULL DEFAULT 0,
  is_correct BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_bracket_prediction_per_user_match UNIQUE (user_id, match_id),
  CONSTRAINT points_non_negative CHECK (points >= 0)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_bracket_predictions_user_id ON bracket_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_bracket_predictions_match_id ON bracket_predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_bracket_predictions_predicted_team ON bracket_predictions(predicted_team_id);
CREATE INDEX IF NOT EXISTS idx_bracket_predictions_created_at ON bracket_predictions(created_at);
