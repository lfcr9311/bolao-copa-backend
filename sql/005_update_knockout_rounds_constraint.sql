-- Update the valid_knockout_round constraint to accept all tournament stages
ALTER TABLE matches_knockout DROP CONSTRAINT valid_knockout_round;

ALTER TABLE matches_knockout
ADD CONSTRAINT valid_knockout_round CHECK (round IN ('Round 32', 'Round of 16', 'Quarter-final', 'Semi-final', 'Match for third place', 'Final'));
