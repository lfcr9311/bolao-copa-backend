-- Insert Round 32 matches
INSERT INTO matches_knockout (home_team_id, away_team_id, match_date, status, round) VALUES
((SELECT id FROM teams WHERE name = 'South Africa'), (SELECT id FROM teams WHERE name = 'Canada'), '2026-06-28 12:00:00', 'SCHEDULED', 'Round 32'),
((SELECT id FROM teams WHERE name = 'Germany'), (SELECT id FROM teams WHERE name = 'Paraguay'), '2026-06-29 16:30:00', 'SCHEDULED', 'Round 32'),
((SELECT id FROM teams WHERE name = 'Netherlands'), (SELECT id FROM teams WHERE name = 'Morocco'), '2026-06-29 19:00:00', 'SCHEDULED', 'Round 32'),
((SELECT id FROM teams WHERE name = 'Brazil'), (SELECT id FROM teams WHERE name = 'Japan'), '2026-06-29 12:00:00', 'SCHEDULED', 'Round 32'),
((SELECT id FROM teams WHERE name = 'France'), (SELECT id FROM teams WHERE name = 'Sweden'), '2026-06-30 17:00:00', 'SCHEDULED', 'Round 32'),
((SELECT id FROM teams WHERE name = 'Ivory Coast'), (SELECT id FROM teams WHERE name = 'Norway'), '2026-06-30 12:00:00', 'SCHEDULED', 'Round 32'),
((SELECT id FROM teams WHERE name = 'Mexico'), (SELECT id FROM teams WHERE name = 'Ecuador'), '2026-06-30 19:00:00', 'SCHEDULED', 'Round 32'),
((SELECT id FROM teams WHERE name = 'England'), (SELECT id FROM teams WHERE name = 'DR Congo'), '2026-07-01 12:00:00', 'SCHEDULED', 'Round 32'),
((SELECT id FROM teams WHERE name = 'USA'), (SELECT id FROM teams WHERE name = 'Bosnia & Herzegovina'), '2026-07-01 17:00:00', 'SCHEDULED', 'Round 32'),
((SELECT id FROM teams WHERE name = 'Belgium'), (SELECT id FROM teams WHERE name = 'Senegal'), '2026-07-01 13:00:00', 'SCHEDULED', 'Round 32'),
((SELECT id FROM teams WHERE name = 'Portugal'), (SELECT id FROM teams WHERE name = 'Croatia'), '2026-07-02 19:00:00', 'SCHEDULED', 'Round 32'),
((SELECT id FROM teams WHERE name = 'Spain'), (SELECT id FROM teams WHERE name = 'Austria'), '2026-07-02 12:00:00', 'SCHEDULED', 'Round 32'),
((SELECT id FROM teams WHERE name = 'Switzerland'), (SELECT id FROM teams WHERE name = 'Algeria'), '2026-07-02 20:00:00', 'SCHEDULED', 'Round 32'),
((SELECT id FROM teams WHERE name = 'Argentina'), (SELECT id FROM teams WHERE name = 'Cape Verde'), '2026-07-03 18:00:00', 'SCHEDULED', 'Round 32'),
((SELECT id FROM teams WHERE name = 'Colombia'), (SELECT id FROM teams WHERE name = 'Ghana'), '2026-07-03 20:30:00', 'SCHEDULED', 'Round 32'),
((SELECT id FROM teams WHERE name = 'Australia'), (SELECT id FROM teams WHERE name = 'Egypt'), '2026-07-03 13:00:00', 'SCHEDULED', 'Round 32');

-- Insert Round of 16 matches (using placeholder for now - will be filled based on winners)
-- Match 89: W74 vs W77
-- Match 90: W73 vs W75
-- Match 91: W76 vs W78
-- Match 92: W79 vs W80
-- Match 93: W83 vs W84
-- Match 94: W81 vs W82
-- Match 95: W86 vs W88
-- Match 96: W85 vs W87

-- Insert Quarter-final matches (using placeholder)
-- Match 97: W89 vs W90
-- Match 98: W93 vs W94
-- Match 99: W91 vs W92
-- Match 100: W95 vs W96

-- Insert Semi-final matches (using placeholder)
-- Match 101: W97 vs W98
-- Match 102: W99 vs W100

-- Insert Match for third place (using placeholder)
-- Match 103: L101 vs L102

-- Insert Final match (using placeholder)
-- Match 104: W101 vs W102
