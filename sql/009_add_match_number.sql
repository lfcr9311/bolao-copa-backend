-- Add match_number column to track the official match number (73-104)
ALTER TABLE matches_knockout ADD COLUMN match_number INTEGER UNIQUE;

-- Update Round 32 matches with their official numbers (73-88)
UPDATE matches_knockout SET match_number = 73 WHERE round = 'Round 32' AND home_team_id = (SELECT id FROM teams WHERE name = 'South Africa');
UPDATE matches_knockout SET match_number = 74 WHERE round = 'Round 32' AND home_team_id = (SELECT id FROM teams WHERE name = 'Germany');
UPDATE matches_knockout SET match_number = 75 WHERE round = 'Round 32' AND home_team_id = (SELECT id FROM teams WHERE name = 'Netherlands');
UPDATE matches_knockout SET match_number = 76 WHERE round = 'Round 32' AND home_team_id = (SELECT id FROM teams WHERE name = 'Brasil');
UPDATE matches_knockout SET match_number = 77 WHERE round = 'Round 32' AND home_team_id = (SELECT id FROM teams WHERE name = 'France');
UPDATE matches_knockout SET match_number = 78 WHERE round = 'Round 32' AND home_team_id = (SELECT id FROM teams WHERE name = 'Ivory Coast');
UPDATE matches_knockout SET match_number = 79 WHERE round = 'Round 32' AND home_team_id = (SELECT id FROM teams WHERE name = 'Mexico');
UPDATE matches_knockout SET match_number = 80 WHERE round = 'Round 32' AND home_team_id = (SELECT id FROM teams WHERE name = 'England');
UPDATE matches_knockout SET match_number = 81 WHERE round = 'Round 32' AND home_team_id = (SELECT id FROM teams WHERE name = 'USA');
UPDATE matches_knockout SET match_number = 82 WHERE round = 'Round 32' AND home_team_id = (SELECT id FROM teams WHERE name = 'Belgium');
UPDATE matches_knockout SET match_number = 83 WHERE round = 'Round 32' AND home_team_id = (SELECT id FROM teams WHERE name = 'Portugal');
UPDATE matches_knockout SET match_number = 84 WHERE round = 'Round 32' AND home_team_id = (SELECT id FROM teams WHERE name = 'Spain');
UPDATE matches_knockout SET match_number = 85 WHERE round = 'Round 32' AND home_team_id = (SELECT id FROM teams WHERE name = 'Switzerland');
UPDATE matches_knockout SET match_number = 86 WHERE round = 'Round 32' AND home_team_id = (SELECT id FROM teams WHERE name = 'Argentina');
UPDATE matches_knockout SET match_number = 87 WHERE round = 'Round 32' AND home_team_id = (SELECT id FROM teams WHERE name = 'Uruguay');
UPDATE matches_knockout SET match_number = 88 WHERE round = 'Round 32' AND home_team_id = (SELECT id FROM teams WHERE name = 'Australia');

-- Round 16 (89-96)
UPDATE matches_knockout SET match_number = 89 WHERE round = 'Round 16';
UPDATE matches_knockout SET match_number = 90 WHERE round = 'Round 16';
UPDATE matches_knockout SET match_number = 91 WHERE round = 'Round 16';
UPDATE matches_knockout SET match_number = 92 WHERE round = 'Round 16';
UPDATE matches_knockout SET match_number = 93 WHERE round = 'Round 16';
UPDATE matches_knockout SET match_number = 94 WHERE round = 'Round 16';
UPDATE matches_knockout SET match_number = 95 WHERE round = 'Round 16';
UPDATE matches_knockout SET match_number = 96 WHERE round = 'Round 16';

-- Quarter-final (97-100)
-- Semi-final (101-102)
-- Final (104)
