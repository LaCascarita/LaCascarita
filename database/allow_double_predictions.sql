-- ============================================
-- PERMITIR MULTIPLES PREDICCIONES POR PARTIDO EN UNA PARTICIPACION
-- ============================================
-- La tabla `predictions` tenia una constraint UNIQUE(participation_id, match_id).
-- Eso impide guardar "dobles" (varias selecciones en un mismo partido).
-- Este script elimina esa constraint si aun existe.

DO $$
DECLARE
    con_name TEXT;
    v_participation_id_attnum SMALLINT;
    v_match_id_attnum SMALLINT;
BEGIN
    SELECT attnum INTO v_participation_id_attnum
    FROM pg_attribute
    WHERE attrelid = 'predictions'::regclass
      AND attname = 'participation_id';

    SELECT attnum INTO v_match_id_attnum
    FROM pg_attribute
    WHERE attrelid = 'predictions'::regclass
      AND attname = 'match_id';

    IF v_participation_id_attnum IS NULL OR v_match_id_attnum IS NULL THEN
        RAISE EXCEPTION 'No se encontraron las columnas participation_id o match_id en predictions';
    END IF;

    SELECT conname INTO con_name
    FROM pg_constraint
    WHERE conrelid = 'predictions'::regclass
      AND contype = 'u'
      AND conkey @> ARRAY[v_participation_id_attnum, v_match_id_attnum]::SMALLINT[];

    IF con_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE predictions DROP CONSTRAINT %I', con_name);
        RAISE NOTICE 'Constraint % eliminada correctamente', con_name;
    ELSE
        RAISE NOTICE 'No se encontro una constraint UNIQUE sobre (participation_id, match_id)';
    END IF;
END;
$$;
