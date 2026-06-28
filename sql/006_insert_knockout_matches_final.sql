-- Delete existing matches to avoid duplicates
DELETE FROM matches_knockout WHERE round = 'Round 32';

-- Insert Round 32 matches with correct teams
INSERT INTO matches_knockout (home_team_id, away_team_id, match_date, status, round) VALUES
-- Match 73
((SELECT id FROM teams WHERE name = 'South Africa'), (SELECT id FROM teams WHERE name = 'Canada'), '2026-06-28 12:00:00', 'SCHEDULED', 'Round 32'),
-- Match 74
((SELECT id FROM teams WHERE name = 'Germany'), (SELECT id FROM teams WHERE name = 'Paraguay'), '2026-06-29 16:30:00', 'SCHEDULED', 'Round 32'),
-- Match 75
((SELECT id FROM teams WHERE name = 'Netherlands'), (SELECT id FROM teams WHERE name = 'Morocco'), '2026-06-29 19:00:00', 'SCHEDULED', 'Round 32'),
-- Match 76
((SELECT id FROM teams WHERE name = 'Brasil'), (SELECT id FROM teams WHERE name = 'Japan'), '2026-06-29 12:00:00', 'SCHEDULED', 'Round 32'),
-- Match 77
((SELECT id FROM teams WHERE name = 'France'), (SELECT id FROM teams WHERE name = 'Sweden'), '2026-06-30 17:00:00', 'SCHEDULED', 'Round 32'),
-- Match 78
((SELECT id FROM teams WHERE name = 'Ivory Coast'), (SELECT id FROM teams WHERE name = 'Norway'), '2026-06-30 12:00:00', 'SCHEDULED', 'Round 32'),
-- Match 79
((SELECT id FROM teams WHERE name = 'Mexico'), (SELECT id FROM teams WHERE name = 'Ecuador'), '2026-06-30 19:00:00', 'SCHEDULED', 'Round 32'),
-- Match 80
((SELECT id FROM teams WHERE name = 'England'), (SELECT id FROM teams WHERE name = 'Cameroon'), '2026-07-01 12:00:00', 'SCHEDULED', 'Round 32'),
-- Match 81
((SELECT id FROM teams WHERE name = 'USA'), (SELECT id FROM teams WHERE name = 'Bosnia & Herzegovina'), '2026-07-01 17:00:00', 'SCHEDULED', 'Round 32'),
-- Match 82
((SELECT id FROM teams WHERE name = 'Belgium'), (SELECT id FROM teams WHERE name = 'Senegal'), '2026-07-01 13:00:00', 'SCHEDULED', 'Round 32'),
-- Match 83
((SELECT id FROM teams WHERE name = 'Portugal'), (SELECT id FROM teams WHERE name = 'Croatia'), '2026-07-02 19:00:00', 'SCHEDULED', 'Round 32'),
-- Match 84
((SELECT id FROM teams WHERE name = 'Spain'), (SELECT id FROM teams WHERE name = 'Denmark'), '2026-07-02 12:00:00', 'SCHEDULED', 'Round 32'),
-- Match 85
((SELECT id FROM teams WHERE name = 'Switzerland'), (SELECT id FROM teams WHERE name = 'Tunisia'), '2026-07-02 20:00:00', 'SCHEDULED', 'Round 32'),
-- Match 86
((SELECT id FROM teams WHERE name = 'Argentina'), (SELECT id FROM teams WHERE name = 'Cape Verde'), '2026-07-03 18:00:00', 'SCHEDULED', 'Round 32'),
-- Match 87
((SELECT id FROM teams WHERE name = 'Uruguay'), (SELECT id FROM teams WHERE name = 'Ghana'), '2026-07-03 20:30:00', 'SCHEDULED', 'Round 32'),
-- Match 88
((SELECT id FROM teams WHERE name = 'Australia'), (SELECT id FROM teams WHERE name = 'Egypt'), '2026-07-03 13:00:00', 'SCHEDULED', 'Round 32');
