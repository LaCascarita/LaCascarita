-- ============================================
-- ESTRUCTURA PARA SISTEMA DE ADMINISTRADOR
-- ============================================
-- Este archivo contiene las tablas necesarias para
-- que los administradores configuren jornadas de quinielas
-- seleccionando partidos de API-Football

-- ============================================
-- 1. TABLA: admin_jornadas
-- ============================================
-- PROPÓSITO: Almacenar configuraciones de jornadas creadas por administradores
-- RAZÓN: Permite configurar las 3 tipos de jornadas (media_semana, fin_de_semana, dominical)
-- con sus respectivos partidos seleccionados de API-Football

CREATE TABLE IF NOT EXISTS admin_jornadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(20) NOT NULL CHECK (type IN ('media_semana', 'fin_de_semana', 'dominical')),
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas
CREATE INDEX IF NOT EXISTS idx_admin_jornadas_type ON admin_jornadas(type);
CREATE INDEX IF NOT EXISTS idx_admin_jornadas_dates ON admin_jornadas(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_admin_jornadas_status ON admin_jornadas(status);

-- ============================================
-- 2. TABLA: admin_jornada_partidos
-- ============================================
-- PROPÓSITO: Almacenar los partidos seleccionados para cada jornada
-- RAZÓN: Guarda la referencia a los partidos de API-Football asignados a cada jornada
-- Máximo 9 partidos por jornada

CREATE TABLE IF NOT EXISTS admin_jornada_partidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jornada_id UUID NOT NULL REFERENCES admin_jornadas(id) ON DELETE CASCADE,
    match_id INTEGER NOT NULL, -- ID del partido en API-Football
    league_id INTEGER NOT NULL, -- ID de la liga en API-Football
    league_name VARCHAR(100),
    home_team_name VARCHAR(100),
    away_team_name VARCHAR(100),
    home_team_badge TEXT,
    away_team_badge TEXT,
    match_date TIMESTAMP WITH TIME ZONE NOT NULL,
    match_status VARCHAR(20),
    home_score INTEGER,
    away_score INTEGER,
    position INTEGER NOT NULL, -- Posición del partido en la jornada (1-9)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(jornada_id, match_id)
);

-- Índices para búsquedas
CREATE INDEX IF NOT EXISTS idx_admin_jornada_partidos_jornada ON admin_jornada_partidos(jornada_id);
CREATE INDEX IF NOT EXISTS idx_admin_jornada_partidos_match ON admin_jornada_partidos(match_id);
CREATE INDEX IF NOT EXISTS idx_admin_jornada_partidos_position ON admin_jornada_partidos(jornada_id, position);

-- ============================================
-- FUNCIÓN PARA ACTUALIZAR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_admin_jornadas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para admin_jornadas
DROP TRIGGER IF EXISTS update_admin_jornadas_timestamp ON admin_jornadas;
CREATE TRIGGER update_admin_jornadas_timestamp
    BEFORE UPDATE ON admin_jornadas
    FOR EACH ROW EXECUTE FUNCTION update_admin_jornadas_updated_at();

-- ============================================
-- COMENTARIOS
-- ============================================
-- Este schema simplificado permite:
-- - Configurar jornadas por tipo (media_semana, fin_de_semana, dominical)
-- - Asignar hasta 9 partidos por jornada
-- - Guardar referencias a API-Football para obtener datos actualizados
-- - Mantener historial de configuraciones
