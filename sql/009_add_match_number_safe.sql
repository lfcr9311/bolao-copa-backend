-- ============================================================================
-- MIGRATION 009: Add match_number column for bracket logic
-- SEGURANÇA: Transação atômica + Rollback se algo der errado
-- ============================================================================

BEGIN TRANSACTION;

-- 1. Verificar se coluna já existe (para idempotência)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'matches_knockout' AND column_name = 'match_number'
  ) THEN
    ALTER TABLE matches_knockout ADD COLUMN match_number INTEGER UNIQUE;
    RAISE NOTICE 'Coluna match_number adicionada com sucesso';
  ELSE
    RAISE NOTICE 'Coluna match_number já existe, pulando ADD COLUMN';
  END IF;
END $$;

-- 2. Limpar dados antigos se existirem (segurança)
UPDATE matches_knockout SET match_number = NULL WHERE round IN ('Round 32', 'Round 16', 'Quarter-final', 'Semi-final', 'Final');

-- ============================================================================
-- ROUND 32 (matches 73-88) - Atualizar por ID exato
-- ============================================================================

UPDATE matches_knockout SET match_number = 73
WHERE round = 'Round 32' AND home_team_id = (SELECT id FROM teams WHERE name = 'South Africa')
AND away_team_id = (SELECT id FROM teams WHERE name = 'Canada');

UPDATE matches_knockout SET match_number = 74
WHERE round = 'Round 32' AND home_team_id = (SELECT id FROM teams WHERE name = 'Germany')
AND away_team_id = (SELECT id FROM teams WHERE name = 'Paraguay');

UPDATE matches_knockout SET match_number = 75
WHERE round = 'Round 32' AND home_team_id = (SELECT id FROM teams WHERE name = 'Netherlands')
AND away_team_id = (SELECT id FROM teams WHERE name = 'Morocco');

UPDATE matches_knockout SET match_number = 76
WHERE round = 'Round 32' AND home_team_id = (SELECT id FROM teams WHERE name = 'Brasil')
AND away_team_id = (SELECT id FROM teams WHERE name = 'Japan');

UPDATE matches_knockout SET match_number = 77
WHERE round = 'Round 32' AND home_team_id = (SELECT id FROM teams WHERE name = 'France')
AND away_team_id = (SELECT id FROM teams WHERE name = 'Sweden');

UPDATE matches_knockout SET match_number = 78
WHERE round = 'Round 32' AND home_team_id = (SELECT id FROM teams WHERE name = 'Ivory Coast')
AND away_team_id = (SELECT id FROM teams WHERE name = 'Norway');

UPDATE matches_knockout SET match_number = 79
WHERE round = 'Round 32' AND home_team_id = (SELECT id FROM teams WHERE name = 'Mexico')
AND away_team_id = (SELECT id FROM teams WHERE name = 'Ecuador');

UPDATE matches_knockout SET match_number = 80
WHERE round = 'Round 32' AND home_team_id = (SELECT id FROM teams WHERE name = 'England')
AND away_team_id = (SELECT id FROM teams WHERE name = 'Cameroon');

UPDATE matches_knockout SET match_number = 81
WHERE round = 'Round 32' AND home_team_id = (SELECT id FROM teams WHERE name = 'USA')
AND away_team_id = (SELECT id FROM teams WHERE name = 'Bosnia & Herzegovina');

UPDATE matches_knockout SET match_number = 82
WHERE round = 'Round 32' AND home_team_id = (SELECT id FROM teams WHERE name = 'Belgium')
AND away_team_id = (SELECT id FROM teams WHERE name = 'Senegal');

UPDATE matches_knockout SET match_number = 83
WHERE round = 'Round 32' AND home_team_id = (SELECT id FROM teams WHERE name = 'Portugal')
AND away_team_id = (SELECT id FROM teams WHERE name = 'Croatia');

UPDATE matches_knockout SET match_number = 84
WHERE round = 'Round 32' AND home_team_id = (SELECT id FROM teams WHERE name = 'Spain')
AND away_team_id = (SELECT id FROM teams WHERE name = 'Denmark');

UPDATE matches_knockout SET match_number = 85
WHERE round = 'Round 32' AND home_team_id = (SELECT id FROM teams WHERE name = 'Switzerland')
AND away_team_id = (SELECT id FROM teams WHERE name = 'Tunisia');

UPDATE matches_knockout SET match_number = 86
WHERE round = 'Round 32' AND home_team_id = (SELECT id FROM teams WHERE name = 'Argentina')
AND away_team_id = (SELECT id FROM teams WHERE name = 'Cape Verde');

UPDATE matches_knockout SET match_number = 87
WHERE round = 'Round 32' AND home_team_id = (SELECT id FROM teams WHERE name = 'Uruguay')
AND away_team_id = (SELECT id FROM teams WHERE name = 'Ghana');

UPDATE matches_knockout SET match_number = 88
WHERE round = 'Round 32' AND home_team_id = (SELECT id FROM teams WHERE name = 'Australia')
AND away_team_id = (SELECT id FROM teams WHERE name = 'Egypt');

-- ============================================================================
-- VERIFICAÇÃO: Garantir que todos os 16 matches do Round 32 têm número
-- ============================================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM matches_knockout
  WHERE round = 'Round 32' AND match_number IS NULL;

  IF v_count > 0 THEN
    RAISE EXCEPTION 'ERRO: % matches do Round 32 sem match_number! ROLLBACK AUTOMÁTICO', v_count;
  ELSE
    RAISE NOTICE '✓ Todos os 16 matches do Round 32 têm match_number';
  END IF;
END $$;

-- ============================================================================
-- VERIFICAÇÃO: Garantir que não há duplicatas
-- ============================================================================

DO $$
DECLARE
  v_duplicates INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_duplicates
  FROM (
    SELECT match_number FROM matches_knockout
    WHERE match_number IS NOT NULL
    GROUP BY match_number
    HAVING COUNT(*) > 1
  ) t;

  IF v_duplicates > 0 THEN
    RAISE EXCEPTION 'ERRO: % match_numbers duplicados! ROLLBACK AUTOMÁTICO', v_duplicates;
  ELSE
    RAISE NOTICE '✓ Sem duplicatas de match_number';
  END IF;
END $$;

-- ============================================================================
-- FINAL REPORT
-- ============================================================================

SELECT
  'MIGRATION SUMMARY' AS status,
  COUNT(*) as total_matches,
  COUNT(CASE WHEN match_number IS NOT NULL THEN 1 END) as com_numero,
  COUNT(CASE WHEN match_number IS NULL THEN 1 END) as sem_numero,
  COUNT(DISTINCT round) as rounds
FROM matches_knockout;

-- Se tudo passou, commit
COMMIT;

RAISE NOTICE '✓ Migration 009 executada com sucesso!';
