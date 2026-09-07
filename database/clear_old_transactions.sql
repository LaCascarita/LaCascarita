-- ============================================
-- LIMPIAR TRANSACCIONES ANTIGUAS
-- ============================================
-- Borra todas las transacciones de user_balance_transactions excepto
-- las 2 mas recientes por fecha de creacion.

DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM user_balance_transactions
    WHERE id NOT IN (
        SELECT id
        FROM user_balance_transactions
        ORDER BY created_at DESC
        LIMIT 2
    );

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE 'Transacciones antiguas eliminadas: %. Se conservaron las 2 mas recientes.', deleted_count;
END;
$$;
