-- ============================================
-- SCRIPT DE CONFIGURACIÓN PARA SUPABASE
-- ============================================
-- Este archivo está adaptado específicamente para Supabase
-- Ejecutar en el SQL Editor de Supabase

-- ============================================
-- HABILITAR EXTENSIONES NECESARIAS
-- ============================================
-- Supabase ya tiene uuid-ossp habilitado por defecto
-- Si necesitas otras extensiones, agrégalas aquí

-- ============================================
-- CREAR TABLAS (ORDEN IMPORTANTE POR DEPENDENCIAS)
-- ============================================

-- 1. TABLA: users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    phone VARCHAR(10) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    auth_id UUID UNIQUE,
    user_id VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    profile_picture_url TEXT,
    password_hash TEXT NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA: leagues
CREATE TABLE IF NOT EXISTS leagues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    country VARCHAR(100),
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA: teams
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    short_name VARCHAR(20),
    logo_url TEXT,
    league_id UUID REFERENCES leagues(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA: jornadas
CREATE TABLE IF NOT EXISTS jornadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('media_semana', 'fin_de_semana', 'dominical')),
    league_id UUID REFERENCES leagues(id),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    registration_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    prize_pool DECIMAL(10,2) DEFAULT 0.00,
    participation_cost DECIMAL(10,2) DEFAULT 0.00,
    max_participants INTEGER,
    current_participants INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed', 'completed', 'cancelled')),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA: matches
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jornada_id UUID NOT NULL REFERENCES jornadas(id) ON DELETE CASCADE,
    home_team_id UUID NOT NULL REFERENCES teams(id),
    away_team_id UUID NOT NULL REFERENCES teams(id),
    match_date TIMESTAMP WITH TIME ZONE NOT NULL,
    venue VARCHAR(200),
    round INTEGER,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished', 'postponed', 'cancelled')),
    home_score INTEGER,
    away_score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABLA: participations
CREATE TABLE IF NOT EXISTS participations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folio VARCHAR(20) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    jornada_id UUID NOT NULL REFERENCES jornadas(id),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    participation_status VARCHAR(20) DEFAULT 'pending' CHECK (participation_status IN ('pending', 'confirmed', 'cancelled')),
    payment_method VARCHAR(50),
    payment_amount DECIMAL(10,2),
    payment_date TIMESTAMP WITH TIME ZONE,
    predictions_count INTEGER DEFAULT 0,
    correct_predictions INTEGER DEFAULT 0,
    position INTEGER,
    prize_amount DECIMAL(10,2) DEFAULT 0.00,
    prize_status VARCHAR(20) CHECK (prize_status IN ('none', 'pending', 'paid', 'claimed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABLA: predictions
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participation_id UUID NOT NULL REFERENCES participations(id) ON DELETE CASCADE,
    match_id UUID NOT NULL REFERENCES matches(id),
    prediction VARCHAR(10) NOT NULL CHECK (prediction IN ('home', 'draw', 'away')),
    is_correct BOOLEAN,
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(participation_id, match_id)
);

-- 8. TABLA: prizes
CREATE TABLE IF NOT EXISTS prizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participation_id UUID NOT NULL REFERENCES participations(id),
    user_id UUID NOT NULL REFERENCES users(id),
    jornada_id UUID NOT NULL REFERENCES jornadas(id),
    position INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'claimed', 'cancelled')),
    payment_method VARCHAR(50),
    bank_name VARCHAR(100),
    account_number VARCHAR(50),
    clabe VARCHAR(18),
    paid_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. TABLA: rankings
CREATE TABLE IF NOT EXISTS rankings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jornada_id UUID NOT NULL REFERENCES jornadas(id),
    user_id UUID NOT NULL REFERENCES users(id),
    participation_id UUID NOT NULL REFERENCES participations(id),
    position INTEGER NOT NULL,
    points INTEGER NOT NULL,
    correct_predictions INTEGER NOT NULL,
    total_predictions INTEGER NOT NULL,
    accuracy DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(jornada_id, user_id)
);

-- 10. TABLA: notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    icon VARCHAR(50),
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. TABLA: settings
CREATE TABLE IF NOT EXISTS settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. TABLA: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- CREAR ÍNDICES
-- ============================================

-- Índices para users
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);

-- Índices para jornadas
CREATE INDEX IF NOT EXISTS idx_jornadas_status ON jornadas(status);
CREATE INDEX IF NOT EXISTS idx_jornadas_type ON jornadas(type);
CREATE INDEX IF NOT EXISTS idx_jornadas_dates ON jornadas(start_date, end_date);

-- Índices para matches
CREATE INDEX IF NOT EXISTS idx_matches_jornada ON matches(jornada_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);

-- Índices para participations
CREATE INDEX IF NOT EXISTS idx_participations_user ON participations(user_id);
CREATE INDEX IF NOT EXISTS idx_participations_jornada ON participations(jornada_id);
CREATE INDEX IF NOT EXISTS idx_participations_folio ON participations(folio);
CREATE INDEX IF NOT EXISTS idx_participations_status ON participations(payment_status, participation_status);

-- Índices para predictions
CREATE INDEX IF NOT EXISTS idx_predictions_participation ON predictions(participation_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match ON predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_predictions_correct ON predictions(is_correct);

-- Índices para prizes
CREATE INDEX IF NOT EXISTS idx_prizes_user ON prizes(user_id);
CREATE INDEX IF NOT EXISTS idx_prizes_status ON prizes(status);

-- Índices para rankings
CREATE INDEX IF NOT EXISTS idx_rankings_jornada ON rankings(jornada_id);
CREATE INDEX IF NOT EXISTS idx_rankings_user ON rankings(user_id);
CREATE INDEX IF NOT EXISTS idx_rankings_position ON rankings(jornada_id, position);

-- Índices para notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- Índices para audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table ON audit_logs(table_name);

-- ============================================
-- CREAR FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leagues_updated_at ON leagues;
CREATE TRIGGER update_leagues_updated_at BEFORE UPDATE ON leagues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_jornadas_updated_at ON jornadas;
CREATE TRIGGER update_jornadas_updated_at BEFORE UPDATE ON jornadas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_matches_updated_at ON matches;
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_participations_updated_at ON participations;
CREATE TRIGGER update_participations_updated_at BEFORE UPDATE ON participations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_predictions_updated_at ON predictions;
CREATE TRIGGER update_predictions_updated_at BEFORE UPDATE ON predictions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_prizes_updated_at ON prizes;
CREATE TRIGGER update_prizes_updated_at BEFORE UPDATE ON prizes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- CREAR VISTAS
-- ============================================

-- Vista para ranking general de usuarios (sin SECURITY DEFINER)
CREATE OR REPLACE VIEW user_rankings AS
SELECT 
    u.id,
    u.username,
    u.user_id,
    COUNT(p.id) as total_participations,
    SUM(p.correct_predictions) as total_correct,
    SUM(p.predictions_count) as total_predictions,
    CASE 
        WHEN SUM(p.predictions_count) > 0 
        THEN ROUND((SUM(p.correct_predictions)::numeric / SUM(p.predictions_count)) * 100, 2)
        ELSE 0 
    END as accuracy_percentage,
    SUM(pr.amount) as total_prizes
FROM users u
LEFT JOIN participations p ON u.id = p.user_id
LEFT JOIN prizes pr ON p.id = pr.participation_id
WHERE u.is_active = true
GROUP BY u.id, u.username, u.user_id;

-- Vista para jornadas activas (sin SECURITY DEFINER)
CREATE OR REPLACE VIEW active_jornadas AS
SELECT 
    j.*,
    COUNT(DISTINCT m.id) as total_matches,
    COUNT(DISTINCT CASE WHEN m.status = 'finished' THEN m.id END) as finished_matches
FROM jornadas j
LEFT JOIN matches m ON j.id = m.jornada_id
WHERE j.status = 'open'
GROUP BY j.id;

-- ============================================
-- INSERTAR DATOS INICIALES
-- ============================================

-- Configuración inicial
INSERT INTO settings (key, value, description) VALUES
('participation_cost', '50.00', 'Costo base de participación en quinielas'),
('payment_methods', 'mercadopago,card,transfer', 'Métodos de pago aceptados'),
('min_participants', '10', 'Mínimo de participantes para abrir una jornada'),
('prize_distribution', '70,20,10', 'Porcentaje de distribución para 1°, 2°, 3° lugar')
ON CONFLICT (key) DO NOTHING;

-- Liga MX (ejemplo)
INSERT INTO leagues (name, country, logo_url) VALUES
('Liga MX', 'México', 'https://example.com/logos/liga-mx.png')
ON CONFLICT (name) DO NOTHING;

-- Equipos de ejemplo (Liga MX)
INSERT INTO teams (name, short_name, league_id) VALUES
('América', 'AME', (SELECT id FROM leagues WHERE name = 'Liga MX' LIMIT 1)),
('Monterrey', 'MON', (SELECT id FROM leagues WHERE name = 'Liga MX' LIMIT 1)),
('Chivas', 'CHI', (SELECT id FROM leagues WHERE name = 'Liga MX' LIMIT 1)),
('Pumas', 'PUM', (SELECT id FROM leagues WHERE name = 'Liga MX' LIMIT 1)),
('Tigres', 'TIG', (SELECT id FROM leagues WHERE name = 'Liga MX' LIMIT 1)),
('Santos', 'SAN', (SELECT id FROM leagues WHERE name = 'Liga MX' LIMIT 1))
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- CONFIGURACIÓN DE ROW LEVEL SECURITY (RLS)
-- ============================================
-- Descomenta y ajusta según tus necesidades de seguridad

-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE participations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

-- Políticas de ejemplo (ajusta según tus necesidades)
-- CREATE POLICY "Users can view own profile" ON users
--     FOR SELECT USING (auth.uid() = auth_id);

-- CREATE POLICY "Users can update own profile" ON users
--     FOR UPDATE USING (auth.uid() = auth_id);

-- CREATE POLICY "Users can view own participations" ON participations
--     FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- COMENTARIOS FINALES
-- ============================================
-- Este script está listo para ejecutarse en Supabase
-- Pasos:
-- 1. Crea un proyecto en Supabase
-- 2. Ve al SQL Editor
-- 3. Copia y pega este script
-- 4. Ejecuta el script completo
-- 5. Verifica que todas las tablas se crearon correctamente
-- 6. Ajusta las políticas RLS según tus necesidades de seguridad
