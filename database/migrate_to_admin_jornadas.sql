-- ============================================
-- MIGRACION: Alinear participaciones y predicciones con admin_jornadas
-- ============================================
-- Permite que las participaciones de usuarios apunten a las jornadas
-- y partidos configurados por el administrador desde API-Football.
-- Es seguro ejecutar sobre tablas vacías o en desarrollo.

-- 1. Liberar FKs antiguas si existen
ALTER TABLE IF EXISTS predictions
  DROP CONSTRAINT IF EXISTS predictions_match_id_fkey;

ALTER TABLE IF EXISTS participations
  DROP CONSTRAINT IF EXISTS participations_jornada_id_fkey;

-- 2. Apuntar jornada_id a admin_jornadas
ALTER TABLE IF EXISTS participations
  ADD CONSTRAINT participations_jornada_id_fkey
  FOREIGN KEY (jornada_id) REFERENCES admin_jornadas(id);

-- 3. Apuntar match_id a admin_jornada_partidos
ALTER TABLE IF EXISTS predictions
  ADD CONSTRAINT predictions_match_id_fkey
  FOREIGN KEY (match_id) REFERENCES admin_jornada_partidos(id);

-- Nota: las columnas ya son UUID. No es necesario alterar tipos,
-- ya que eso rompe vistas que dependen de ellas (user_rankings).
