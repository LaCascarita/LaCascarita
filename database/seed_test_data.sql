-- ============================================
-- SEED DE PRUEBA: saldo falso para probar quinielas
-- ============================================
-- Reemplaza 'BrandonS' por el username con el que vas a probar.
-- NO crea jornadas ni partidos: esos deben agregarse desde el panel de administrador.

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

    UPDATE users SET balance = 1000.00 WHERE id = v_user_id;

    RAISE NOTICE 'Saldo de prueba asignado. Usuario: %, Saldo: $1000', v_user_id;
END;
$$;
