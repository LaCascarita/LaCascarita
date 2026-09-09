-- ============================================
-- CORREGIR VULNERABILIDADES DE SEGURIDAD EN SUPABASE
-- ============================================
-- 1. Activa RLS en todas las tablas con política para service_role
-- 2. Corrige vistas "Security Definer" a "security_invoker = on"
-- 3. Corrige funciones con search_path mutable
-- Ejecutar en Supabase SQL Editor como "New query" y dar Run.

-- ============================================
-- 1. HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================
DO $$
DECLARE
    t text;
    policy_name text;
    tables_list text[] := ARRAY[
        'users',
        'leagues',
        'teams',
        'jornadas',
        'matches',
        'participations',
        'predictions',
        'prizes',
        'rankings',
        'notifications',
        'settings',
        'audit_logs',
        'admin_jornadas',
        'admin_jornada_partidos',
        'payments',
        'user_balance_transactions',
        'withdrawals'
    ];
BEGIN
    FOREACH t IN ARRAY tables_list
    LOOP
        EXECUTE format('ALTER TABLE IF EXISTS %I ENABLE ROW LEVEL SECURITY;', t);

        policy_name := 'Service role full access on ' || t;

        EXECUTE format(
            'DROP POLICY IF EXISTS %I ON %I;',
            policy_name,
            t
        );

        EXECUTE format(
            'CREATE POLICY %I ON %I TO service_role USING (true) WITH CHECK (true);',
            policy_name,
            t
        );
    END LOOP;
END;
$$;

-- ============================================
-- 2. CORREGIR VISTAS SECURITY DEFINER
-- ============================================
-- user_balance_history
DROP VIEW IF EXISTS public.user_balance_history;
CREATE VIEW public.user_balance_history
WITH (security_invoker = on)
AS
SELECT
    u.id AS user_uuid,
    u.username,
    u.user_id AS public_user_id,
    t.id AS transaction_id,
    t.type,
    t.amount,
    t.balance_before,
    t.balance_after,
    t.status,
    t.reference_id,
    t.participation_id,
    t.description,
    t.created_at
FROM public.users u
JOIN public.user_balance_transactions t ON u.id = t.user_id
ORDER BY t.created_at DESC;

-- user_rankings
DROP VIEW IF EXISTS public.user_rankings;
CREATE VIEW public.user_rankings
WITH (security_invoker = on)
AS
SELECT
    u.id,
    u.username,
    u.user_id,
    COUNT(p.id) AS total_participations,
    SUM(p.correct_predictions) AS total_correct,
    SUM(p.predictions_count) AS total_predictions,
    CASE
        WHEN SUM(p.predictions_count) > 0
        THEN ROUND((SUM(p.correct_predictions)::numeric / SUM(p.predictions_count)) * 100, 2)
        ELSE 0
    END AS accuracy_percentage,
    SUM(pr.amount) AS total_prizes
FROM public.users u
LEFT JOIN public.participations p ON u.id = p.user_id
LEFT JOIN public.prizes pr ON p.id = pr.participation_id
WHERE u.is_active = true
GROUP BY u.id, u.username, u.user_id;

-- active_jornadas
DROP VIEW IF EXISTS public.active_jornadas;
CREATE VIEW public.active_jornadas
WITH (security_invoker = on)
AS
SELECT
    j.*,
    j.current_participants,
    j.prize_pool,
    COUNT(DISTINCT m.id) AS total_matches,
    COUNT(DISTINCT CASE WHEN m.status = 'finished' THEN m.id END) AS finished_matches
FROM public.jornadas j
LEFT JOIN public.matches m ON j.id = m.jornada_id
WHERE j.status = 'open'
GROUP BY j.id;

-- ============================================
-- 3. CORREGIR FUNCIONES CON SEARCH_PATH MUTABLE
-- ============================================
ALTER FUNCTION public.update_updated_at_column() SET search_path = '';
ALTER FUNCTION public.update_admin_jornadas_updated_at() SET search_path = '';
ALTER FUNCTION public.update_payment_tables_updated_at() SET search_path = '';
