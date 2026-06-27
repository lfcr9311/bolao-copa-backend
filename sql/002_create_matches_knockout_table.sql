-- Create matches_knockout table for knockout stages (Round of 32 to Final)
CREATE TABLE IF NOT EXISTS matches_knockout (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  home_team_id UUID NOT NULL REFERENCES teams(id),
  away_team_id UUID NOT NULL REFERENCES teams(id),

  -- Regular time scores
  home_score INT,
  away_score INT,

  -- Extra time scores
  home_score_extra_time INT,
  away_score_extra_time INT,

  -- Penalties scores
  home_penalties INT,
  away_penalties INT,

  match_date TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
  round VARCHAR(80) NOT NULL,
  advance_team_id UUID REFERENCES teams(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT different_teams CHECK (home_team_id <> away_team_id),
  CONSTRAINT valid_status CHECK (status IN ('SCHEDULED', 'LIVE', 'FINISHED', 'CANCELLED')),
  CONSTRAINT valid_knockout_round CHECK (round IN ('Round 32', 'Round of 16', 'Quarterfinals', 'Semifinals', 'Final'))
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_matches_knockout_home_team ON matches_knockout(home_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_knockout_away_team ON matches_knockout(away_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_knockout_advance_team ON matches_knockout(advance_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_knockout_match_date ON matches_knockout(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_knockout_round ON matches_knockout(round);
CREATE INDEX IF NOT EXISTS idx_matches_knockout_status ON matches_knockout(status);
