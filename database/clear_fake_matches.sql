-- ============================================
-- LIMPIAR PARTIDOS FALSOS POR NOMBRE DE EQUIPO
-- ============================================
-- Borra cualquier partido cuyo equipo local o visitante tenga nombres
-- como 'Equipo Local X' o 'Equipo Visitante X'. Tambien borra las
-- predicciones, participaciones y jornadas asociadas a esos partidos.

DO $$
DECLARE
    match_ids UUID[];
    jornada_ids UUID[];
BEGIN
    -- 1. Identificar partidos falsos
    SELECT array_agg(id) INTO match_ids
    FROM admin_jornada_partidos
    WHERE home_team_name ILIKE 'Equipo Local%'
       OR away_team_name ILIKE 'Equipo Visitante%';

    IF match_ids IS NULL OR array_length(match_ids, 1) IS NULL THEN
        RAISE NOTICE 'No se encontraron partidos falsos';
        RETURN;
    END IF;

    -- 2. Identificar jornadas que usen esos partidos
    SELECT array_agg(DISTINCT jornada_id) INTO jornada_ids
    FROM admin_jornada_partidos
    WHERE id = ANY(match_ids);

    -- 3. Borrar predicciones vinculadas a participaciones de esas jornadas
    DELETE FROM predictions
    WHERE participation_id IN (
        SELECT id FROM participations WHERE jornada_id = ANY(jornada_ids)
    );

    -- 4. Borrar participaciones de esas jornadas
    DELETE FROM participations
    WHERE jornada_id = ANY(jornada_ids);

    -- 5. Borrar partidos falsos
    DELETE FROM admin_jornada_partidos
    WHERE id = ANY(match_ids);

    -- 6. Borrar jornadas que quedaron sin partidos y parecen de prueba
    DELETE FROM admin_jornadas
    WHERE id = ANY(jornada_ids)
      AND NOT EXISTS (
          SELECT 1 FROM admin_jornada_partidos p WHERE p.jornada_id = admin_jornadas.id
      );

    RAISE NOTICE 'Partidos falsos eliminados correctamente';
END;
$$;
