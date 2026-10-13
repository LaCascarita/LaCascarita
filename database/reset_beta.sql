-- ============================================================
-- RESET PARA BETA CERRADA
-- Borra TODOS los datos de operacion: saldos, historial de
-- movimientos, pagos, retiros, quinielas y premios.
-- Las cuentas de usuarios se conservan (solo su balance va a 0).
--
-- IRREVERSIBLE: hacer respaldo/snapshot en Supabase antes de correr.
-- ============================================================

BEGIN;

-- 1. Retiros (hijos de payments)
DELETE FROM withdrawals;

-- 2. Distribuciones y acumulados de premios
DELETE FROM prize_distributions;
DELETE FROM prize_carryover;

-- 3. Historial de movimientos de saldo (referencia participations)
DELETE FROM user_balance_transactions;

-- 4. Pronosticos y participaciones (quinielas enviadas)
DELETE FROM predictions;
DELETE FROM participations;

-- 5. Pagos (recargas y retiros registrados)
DELETE FROM payments;

-- 6. Saldos de usuarios a cero
UPDATE users SET balance = 0;

COMMIT;

-- ============================================================
-- OPCIONAL: borrar tambien las jornadas de prueba
-- (descomenta si quieres empezar jornadas desde cero)
-- ============================================================
-- BEGIN;
-- DELETE FROM prize_distributions;
-- DELETE FROM prize_carryover;
-- DELETE FROM predictions;
-- DELETE FROM user_balance_transactions WHERE participation_id IS NOT NULL;
-- DELETE FROM participations;
-- DELETE FROM admin_jornada_partidos;
-- DELETE FROM admin_jornadas;
-- COMMIT;

-- Verificacion: todos deben regresar 0
SELECT
  (SELECT COUNT(*) FROM payments) AS payments,
  (SELECT COUNT(*) FROM withdrawals) AS withdrawals,
  (SELECT COUNT(*) FROM participations) AS participations,
  (SELECT COUNT(*) FROM predictions) AS predictions,
  (SELECT COUNT(*) FROM user_balance_transactions) AS transactions,
  (SELECT COUNT(*) FROM prize_distributions) AS prize_distributions,
  (SELECT COALESCE(SUM(balance),0) FROM users) AS saldo_total;
