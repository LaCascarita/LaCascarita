-- ============================================
-- LIMPIAR JORNADAS Y PARTIDOS DE PRUEBA
-- ============================================
-- Elimina jornadas con nombre que contenga 'Prueba', junto con sus partidos,
-- participaciones y predicciones. Los partidos reales creados desde el admin
-- no se veran afectados.

DO $$
DECLARE
    jornada_ids UUID[];
BEGIN
    SELECT array_agg(id) INTO jornada_ids
    FROM admin_jornadas
    WHERE name ILIKE '%Prueba%';

    IF jornada_ids IS NULL OR array_length(jornada_ids, 1) IS NULL THEN
        RAISE NOTICE 'No se encontraron jornadas de prueba';
        RETURN;
    END IF;

    -- 1. Borrar predicciones vinculadas a participaciones de jornadas de prueba
    DELETE FROM predictions
    WHERE participation_id IN (
        SELECT id FROM participations WHERE jornada_id = ANY(jornada_ids)
    );

    -- 2. Borrar participaciones de jornadas de prueba
    DELETE FROM participations
    WHERE jornada_id = ANY(jornada_ids);

    -- 3. Borrar partidos de prueba
    DELETE FROM admin_jornada_partidos
    WHERE jornada_id = ANY(jornada_ids);

    -- 4. Borrar jornadas de prueba
    DELETE FROM admin_jornadas
    WHERE id = ANY(jornada_ids);

    RAISE NOTICE 'Jornadas y partidos de prueba eliminados correctamente';
END;
$$;
