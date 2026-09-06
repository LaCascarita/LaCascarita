-- ============================================
-- ACTIVAR RLS CON POLÍTICAS SEGUROS
-- ============================================
-- Este script activa Row Level Security (RLS) en todas las tablas
-- con políticas que permiten que las Vercel Functions funcionen
-- usando SERVICE ROLE KEY (que ignora RLS por defecto)

-- ============================================
-- ACTIVAR RLS EN TABLA USERS
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas las operaciones con service role
CREATE POLICY "Service role full access on users"
ON users
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- ACTIVAR RLS EN TABLA LEAGUES
-- ============================================
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on leagues"
ON leagues
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- ACTIVAR RLS EN TABLA TEAMS
-- ============================================
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on teams"
ON teams
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- ACTIVAR RLS EN TABLA JORNADAS
-- ============================================
ALTER TABLE jornadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on jornadas"
ON jornadas
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- ACTIVAR RLS EN TABLA MATCHES
-- ============================================
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on matches"
ON matches
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- ACTIVAR RLS EN TABLA PARTICIPATIONS
-- ============================================
ALTER TABLE participations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on participations"
ON participations
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- ACTIVAR RLS EN TABLA PREDICTIONS
-- ============================================
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on predictions"
ON predictions
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- ACTIVAR RLS EN TABLA PRIZES
-- ============================================
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on prizes"
ON prizes
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- ACTIVAR RLS EN TABLA RANKINGS
-- ============================================
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on rankings"
ON rankings
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- ACTIVAR RLS EN TABLA NOTIFICATIONS
-- ============================================
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on notifications"
ON notifications
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- ACTIVAR RLS EN TABLA SETTINGS
-- ============================================
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on settings"
ON settings
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- ACTIVAR RLS EN TABLA AUDIT_LOGS
-- ============================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on audit_logs"
ON audit_logs
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- ACTIVAR RLS EN TABLAS DE ADMINISTRADOR
-- ============================================
ALTER TABLE admin_jornadas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on admin_jornadas"
ON admin_jornadas
TO service_role
USING (true)
WITH CHECK (true);

ALTER TABLE admin_jornada_partidos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on admin_jornada_partidos"
ON admin_jornada_partidos
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- COMENTARIOS
-- ============================================
-- Este script:
-- 1. Activa RLS en todas las tablas (cumple requisito de Supabase)
-- 2. Crea políticas que permiten acceso completo a service_role
-- 3. Las Vercel Functions usando SERVICE ROLE KEY funcionarán normalmente
-- 4. La app no se ve afectada porque usa SERVICE ROLE KEY
-- 5. Futuro: se pueden agregar políticas más específicas para anon/authenticated
