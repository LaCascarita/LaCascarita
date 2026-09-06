-- ============================================
-- SEED DE PRUEBA: saldo + jornadas + partidos + participaciones
-- ============================================
-- Reemplaza 'USUARIO_PRUEBA' por el username con el que vas a probar.
-- Puedes encontrar tu usuario con: SELECT id, username FROM users;

DO $$
DECLARE
    v_user_id UUID;
    v_ms_id UUID;
    v_fs_id UUID;
    v_dom_id UUID;
    v_part_id UUID;
    v_match_id UUID;
    v_type VARCHAR(20);
    v_folio_prefix VARCHAR(2);
    v_folio VARCHAR(20);
BEGIN
    -- 1. Buscar usuario de prueba
    SELECT id INTO v_user_id
    FROM users
    WHERE username = 'USUARIO_PRUEBA'
    LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'No se encontro el usuario USUARIO_PRUEBA. Reemplazalo por un username valido.';
    END IF;

    -- 2. Agregar saldo de prueba
    UPDATE users SET balance = 1000.00 WHERE id = v_user_id;

    -- 3. Crear jornadas activas de prueba si no existen
    SELECT id INTO v_ms_id FROM admin_jornadas WHERE type = 'media_semana' AND status = 'active' ORDER BY created_at DESC LIMIT 1;
    IF v_ms_id IS NULL THEN
        v_ms_id := gen_random_uuid();
        INSERT INTO admin_jornadas (id, type, name, start_date, end_date, status)
        VALUES (v_ms_id, 'media_semana', 'Jornada Media Semana Prueba', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 'active');
    END IF;

    SELECT id INTO v_fs_id FROM admin_jornadas WHERE type = 'fin_de_semana' AND status = 'active' ORDER BY created_at DESC LIMIT 1;
    IF v_fs_id IS NULL THEN
        v_fs_id := gen_random_uuid();
        INSERT INTO admin_jornadas (id, type, name, start_date, end_date, status)
        VALUES (v_fs_id, 'fin_de_semana', 'Jornada Fin de Semana Prueba', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 'active');
    END IF;

    SELECT id INTO v_dom_id FROM admin_jornadas WHERE type = 'dominical' AND status = 'active' ORDER BY created_at DESC LIMIT 1;
    IF v_dom_id IS NULL THEN
        v_dom_id := gen_random_uuid();
        INSERT INTO admin_jornadas (id, type, name, start_date, end_date, status)
        VALUES (v_dom_id, 'dominical', 'Jornada Dominical Prueba', CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 'active');
    END IF;

    -- 4. Insertar partidos de prueba para cada jornada (9 por jornada)
    FOR v_type, v_folio_prefix IN
        SELECT * FROM (VALUES
            ('media_semana', 'MS'),
            ('fin_de_semana', 'FS'),
            ('dominical', 'DO')
        ) AS t(type, prefix)
    LOOP
        -- Eliminar partidos de prueba previos de esta jornada para evitar duplicados
        DELETE FROM admin_jornada_partidos
        WHERE jornada_id = CASE
            WHEN v_type = 'media_semana' THEN v_ms_id
            WHEN v_type = 'fin_de_semana' THEN v_fs_id
            WHEN v_type = 'dominical' THEN v_dom_id
        END;

        FOR i IN 1..9 LOOP
            v_match_id := gen_random_uuid();
            INSERT INTO admin_jornada_partidos (
                id, jornada_id, match_id, league_id, league_name,
                home_team_name, away_team_name, match_date, match_status, position,
                home_score, away_score
            ) VALUES (
                v_match_id,
                CASE
                    WHEN v_type = 'media_semana' THEN v_ms_id
                    WHEN v_type = 'fin_de_semana' THEN v_fs_id
                    WHEN v_type = 'dominical' THEN v_dom_id
                END,
                100000 + i, -- match_id ficticio de API-Football
                1,
                'Liga de Prueba',
                'Equipo Local ' || i,
                'Equipo Visitante ' || i,
                NOW() + INTERVAL '2 days',
                'scheduled',
                i,
                NULL,
                NULL
            );
        END LOOP;

        -- 5. Insertar una participacion de prueba con predicciones
        v_folio := 'LC-' || v_folio_prefix || '-' || LPAD(FLOOR(RANDOM()*1000000)::TEXT, 6, '0');
        v_part_id := gen_random_uuid();

        INSERT INTO participations (
            id, folio, user_id, jornada_id, payment_status, participation_status,
            payment_method, payment_amount, payment_date,
            predictions_count, correct_predictions, prize_amount, prize_status
        ) VALUES (
            v_part_id,
            v_folio,
            v_user_id,
            CASE
                WHEN v_type = 'media_semana' THEN v_ms_id
                WHEN v_type = 'fin_de_semana' THEN v_fs_id
                WHEN v_type = 'dominical' THEN v_dom_id
            END,
            'paid',
            'confirmed',
            'balance',
            10,
            NOW(),
            9,
            CASE
                WHEN v_type = 'media_semana' THEN 6
                WHEN v_type = 'fin_de_semana' THEN 8
                WHEN v_type = 'dominical' THEN 7
            END,
            CASE
                WHEN v_type = 'media_semana' THEN 0
                WHEN v_type = 'fin_de_semana' THEN 4250.00
                WHEN v_type = 'dominical' THEN 0
            END,
            CASE
                WHEN v_type = 'fin_de_semana' THEN 'pending'
                ELSE 'none'
            END
        );

        -- Insertar predicciones para esa participacion
        FOR i IN 1..9 LOOP
            INSERT INTO predictions (participation_id, match_id, prediction, is_correct, points)
            VALUES (
                v_part_id,
                (SELECT id FROM admin_jornada_partidos
                 WHERE jornada_id = CASE
                     WHEN v_type = 'media_semana' THEN v_ms_id
                     WHEN v_type = 'fin_de_semana' THEN v_fs_id
                     WHEN v_type = 'dominical' THEN v_dom_id
                 END
                 AND position = i),
                CASE WHEN i % 3 = 0 THEN 'draw' WHEN i % 3 = 1 THEN 'home' ELSE 'away' END,
                CASE
                    WHEN v_type = 'media_semana' AND i <= 6 THEN true
                    WHEN v_type = 'fin_de_semana' AND i <= 8 THEN true
                    WHEN v_type = 'dominical' AND i <= 7 THEN true
                    ELSE false
                END,
                CASE
                    WHEN v_type = 'media_semana' AND i <= 6 THEN 1
                    WHEN v_type = 'fin_de_semana' AND i <= 8 THEN 1
                    WHEN v_type = 'dominical' AND i <= 7 THEN 1
                    ELSE 0
                END
            );
        END LOOP;
    END LOOP;

    RAISE NOTICE 'Seed de prueba completado. Usuario: %, Saldo: 1000', v_user_id;
END;
$$;
