-- Insert Round of 16 matches (placeholders - will be filled based on Round 32 winners)
INSERT INTO matches_knockout (home_team_id, away_team_id, match_date, status, round) VALUES
-- Round 16 matches (8 total)
((SELECT id FROM teams WHERE name = 'Brasil'), (SELECT id FROM teams WHERE name = 'Argentina'), '2026-07-04 12:00:00', 'SCHEDULED', 'Round of 16'),
((SELECT id FROM teams WHERE name = 'Brasil'), (SELECT id FROM teams WHERE name = 'Argentina'), '2026-07-04 17:00:00', 'SCHEDULED', 'Round of 16'),
((SELECT id FROM teams WHERE name = 'Brasil'), (SELECT id FROM teams WHERE name = 'Argentina'), '2026-07-05 16:00:00', 'SCHEDULED', 'Round of 16'),
((SELECT id FROM teams WHERE name = 'Brasil'), (SELECT id FROM teams WHERE name = 'Argentina'), '2026-07-05 18:00:00', 'SCHEDULED', 'Round of 16'),
((SELECT id FROM teams WHERE name = 'Brasil'), (SELECT id FROM teams WHERE name = 'Argentina'), '2026-07-06 14:00:00', 'SCHEDULED', 'Round of 16'),
((SELECT id FROM teams WHERE name = 'Brasil'), (SELECT id FROM teams WHERE name = 'Argentina'), '2026-07-06 17:00:00', 'SCHEDULED', 'Round of 16'),
((SELECT id FROM teams WHERE name = 'Brasil'), (SELECT id FROM teams WHERE name = 'Argentina'), '2026-07-07 12:00:00', 'SCHEDULED', 'Round of 16'),
((SELECT id FROM teams WHERE name = 'Brasil'), (SELECT id FROM teams WHERE name = 'Argentina'), '2026-07-07 13:00:00', 'SCHEDULED', 'Round of 16'),

-- Quarter-final matches (4 total)
((SELECT id FROM teams WHERE name = 'Brasil'), (SELECT id FROM teams WHERE name = 'Argentina'), '2026-07-09 16:00:00', 'SCHEDULED', 'Quarter-final'),
((SELECT id FROM teams WHERE name = 'Brasil'), (SELECT id FROM teams WHERE name = 'Argentina'), '2026-07-10 12:00:00', 'SCHEDULED', 'Quarter-final'),
((SELECT id FROM teams WHERE name = 'Brasil'), (SELECT id FROM teams WHERE name = 'Argentina'), '2026-07-11 17:00:00', 'SCHEDULED', 'Quarter-final'),
((SELECT id FROM teams WHERE name = 'Brasil'), (SELECT id FROM teams WHERE name = 'Argentina'), '2026-07-11 20:00:00', 'SCHEDULED', 'Quarter-final'),

-- Semi-final matches (2 total)
((SELECT id FROM teams WHERE name = 'Brasil'), (SELECT id FROM teams WHERE name = 'Argentina'), '2026-07-14 14:00:00', 'SCHEDULED', 'Semi-final'),
((SELECT id FROM teams WHERE name = 'Brasil'), (SELECT id FROM teams WHERE name = 'Argentina'), '2026-07-15 15:00:00', 'SCHEDULED', 'Semi-final'),

-- Match for third place (1 total)
((SELECT id FROM teams WHERE name = 'Brasil'), (SELECT id FROM teams WHERE name = 'Argentina'), '2026-07-18 17:00:00', 'SCHEDULED', 'Match for third place'),

-- Final (1 total)
((SELECT id FROM teams WHERE name = 'Brasil'), (SELECT id FROM teams WHERE name = 'Argentina'), '2026-07-19 15:00:00', 'SCHEDULED', 'Final');
