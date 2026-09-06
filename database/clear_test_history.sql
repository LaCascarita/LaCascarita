-- ============================================
-- LIMPIAR HISTORIAL DE PARTICIPACIONES DE PRUEBA
-- ============================================
-- Reemplaza 'BrandonS' por el username que quieras limpiar.
-- Elimina predicciones y participaciones de ese usuario sin tocar jornadas ni partidos.

DO $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id
    FROM users
    WHERE username = 'BrandonS'
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No se encontro el usuario BrandonS. Reemplazalo por un username valido.';
    END IF;

    -- 1. Borrar predicciones asociadas a las participaciones del usuario
    DELETE FROM predictions
    WHERE participation_id IN (
        SELECT id FROM participations WHERE user_id = v_user_id
    );

    -- 2. Borrar participaciones del usuario
    DELETE FROM participations
    WHERE user_id = v_user_id;

    RAISE NOTICE 'Historial limpiado para el usuario: %', v_user_id;
END;
$$;
