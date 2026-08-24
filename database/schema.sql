-- ============================================
-- ESTRUCTURA DE BASE DE DATOS - LA CASCARITA
-- ============================================
-- Este archivo contiene la estructura completa de tablas
-- para el funcionamiento de la plataforma de quinielas

-- ============================================
-- 1. TABLA: users
-- ============================================
-- PROPÓSITO: Almacenar información de usuarios registrados
-- RAZÓN: Fundamental para autenticación, autorización y personalización
-- Permite el registro, login, recuperación de contraseña y gestión de perfiles

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    phone VARCHAR(10) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE, -- Opcional para futuras funcionalidades
    auth_id UUID UNIQUE, -- Referencia a Supabase Auth
    user_id VARCHAR(20) UNIQUE NOT NULL, -- Formato LC-XXXXXX
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    profile_picture_url TEXT,
    balance DECIMAL(10,2) DEFAULT 0.00, -- Saldo disponible del usuario
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para optimizar búsquedas
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_user_id ON users(user_id);

-- ============================================
-- 2. TABLA: leagues
-- ============================================
-- PROPÓSITO: Almacenar información de ligas de fútbol
-- RAZÓN: Permite organizar partidos y jornadas por liga
-- Necesario para escalar a múltiples ligas en el futuro

CREATE TABLE leagues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    country VARCHAR(100),
    logo_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. TABLA: teams
-- ============================================
-- PROPÓSITO: Almacenar información de equipos participantes
-- RAZÓN: Esencial para mostrar partidos con nombres y logos de equipos
-- Permite gestión de información de equipos por liga

CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    short_name VARCHAR(20),
    logo_url TEXT,
    league_id UUID REFERENCES leagues(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 4. TABLA: jornadas
-- ============================================
-- PROPÓSITO: Representar jornadas/rondas de quiniela
-- RAZÓN: Fundamental para "Crear jornadas" y "Editar jornadas"
-- Agrupa partidos para una quiniela específica

CREATE TABLE jornadas (
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

-- Índices para búsquedas de jornadas activas
CREATE INDEX idx_jornadas_status ON jornadas(status);
CREATE INDEX idx_jornadas_type ON jornadas(type);
CREATE INDEX idx_jornadas_dates ON jornadas(start_date, end_date);

-- ============================================
-- 5. TABLA: matches
-- ============================================
-- PROPÓSITO: Almacenar información de partidos individuales
-- RAZÓN: Necesario para "Crear partidos" dentro de las jornadas
-- Es la base para que los usuarios hagan sus pronósticos

CREATE TABLE matches (
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

-- Índices para búsquedas de partidos por jornada
CREATE INDEX idx_matches_jornada ON matches(jornada_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_date ON matches(match_date);

-- ============================================
-- 6. TABLA: participations
-- ============================================
-- PROPÓSITO: Registrar participaciones de usuarios en jornadas
-- RAZÓN: Esencial para "Historial de participaciones"
-- Controla el estado de pago y confirmación de quinielas

CREATE TABLE participations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folio VARCHAR(20) UNIQUE NOT NULL, -- Formato LC-FS-XXXXXX
    user_id UUID NOT NULL REFERENCES users(id),
    jornada_id UUID NOT NULL REFERENCES jornadas(id),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    participation_status VARCHAR(20) DEFAULT 'pending' CHECK (participation_status IN ('pending', 'confirmed', 'cancelled')),
    payment_method VARCHAR(50),
    payment_amount DECIMAL(10,2),
    payment_date TIMESTAMP WITH TIME ZONE,
    predictions_count INTEGER DEFAULT 0,
    correct_predictions INTEGER DEFAULT 0,
    position INTEGER, -- Posición en el ranking de la jornada
    prize_amount DECIMAL(10,2) DEFAULT 0.00,
    prize_status VARCHAR(20) CHECK (prize_status IN ('none', 'pending', 'paid', 'claimed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para búsquedas de participaciones
CREATE INDEX idx_participations_user ON participations(user_id);
CREATE INDEX idx_participations_jornada ON participations(jornada_id);
CREATE INDEX idx_participations_folio ON participations(folio);
CREATE INDEX idx_participations_status ON participations(payment_status, participation_status);

-- ============================================
-- 7. TABLA: predictions
-- ============================================
-- PROPÓSITO: Almacenar pronósticos individuales de usuarios
-- RAZÓN: Fundamental para "Captura de pronósticos"
-- Permite calcular aciertos y determinar ganadores

CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participation_id UUID NOT NULL REFERENCES participations(id) ON DELETE CASCADE,
    match_id UUID NOT NULL REFERENCES matches(id),
    prediction VARCHAR(10) NOT NULL CHECK (prediction IN ('home', 'draw', 'away')),
    is_correct BOOLEAN, -- Se actualiza cuando termina el partido
    points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(participation_id, match_id) -- Un usuario solo puede pronosticar una vez por partido
);

-- Índices para cálculos de ranking
CREATE INDEX idx_predictions_participation ON predictions(participation_id);
CREATE INDEX idx_predictions_match ON predictions(match_id);
CREATE INDEX idx_predictions_correct ON predictions(is_correct);

-- ============================================
-- 8. TABLA: prizes
-- ============================================
-- PROPÓSITO: Registrar premios ganados por usuarios
-- RAZÓN: Necesario para seguimiento de premios y pagos
-- Permite "Mis premios" en el dashboard del usuario

CREATE TABLE prizes (
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

-- Índices para búsqueda de premios por usuario
CREATE INDEX idx_prizes_user ON prizes(user_id);
CREATE INDEX idx_prizes_status ON prizes(status);

-- ============================================
-- 9. TABLA: rankings
-- ============================================
-- PROPÓSITO: Almacenar rankings históricos por jornada
-- RAZÓN: Permite "Mi ranking" y ranking general
-- Optimiza consultas de ranking sin cálculos en tiempo real

CREATE TABLE rankings (
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

-- Índices para consultas de ranking
CREATE INDEX idx_rankings_jornada ON rankings(jornada_id);
CREATE INDEX idx_rankings_user ON rankings(user_id);
CREATE INDEX idx_rankings_position ON rankings(jornada_id, position);

-- ============================================
-- 10. TABLA: notifications
-- ============================================
-- PROPÓSITO: Almacenar notificaciones para usuarios
-- RAZÓN: Permite mostrar anuncios importantes y actualizaciones
-- Mejora la experiencia de usuario con comunicación proactiva

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE, -- NULL para notificaciones globales
    type VARCHAR(20) NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error')),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    icon VARCHAR(50),
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para notificaciones no leídas
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- ============================================
-- 11. TABLA: settings
-- ============================================
-- PROPÓSITO: Configuración global de la plataforma
-- RAZÓN: Permite ajustar parámetros sin modificar código
-- Facilita mantenimiento y cambios de configuración

CREATE TABLE settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Datos iniciales de configuración
INSERT INTO settings (key, value, description) VALUES
('participation_cost', '50.00', 'Costo base de participación en quinielas'),
('payment_methods', 'mercadopago,card,transfer', 'Métodos de pago aceptados'),
('min_participants', '10', 'Mínimo de participantes para abrir una jornada'),
('prize_distribution', '70,20,10', 'Porcentaje de distribución para 1°, 2°, 3° lugar');

-- ============================================
-- 12. TABLA: audit_logs
-- ============================================
-- PROPÓSITO: Registrar acciones administrativas
-- RAZÓN: Necesario para seguridad y trazabilidad
-- Permite auditoría de cambios importantes en el sistema

CREATE TABLE audit_logs (
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

-- Índices para búsquedas de auditoría
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_table ON audit_logs(table_name);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar timestamp updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leagues_updated_at BEFORE UPDATE ON leagues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jornadas_updated_at BEFORE UPDATE ON jornadas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participations_updated_at BEFORE UPDATE ON participations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_predictions_updated_at BEFORE UPDATE ON predictions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prizes_updated_at BEFORE UPDATE ON prizes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VISTAS ÚTILES
-- ============================================

-- Vista para ranking general de usuarios
CREATE VIEW user_rankings AS
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

-- Vista para jornadas activas con estadísticas
CREATE VIEW active_jornadas AS
SELECT 
    j.*,
    j.current_participants,
    j.prize_pool,
    COUNT(DISTINCT m.id) as total_matches,
    COUNT(DISTINCT CASE WHEN m.status = 'finished' THEN m.id END) as finished_matches
FROM jornadas j
LEFT JOIN matches m ON j.id = m.jornada_id
WHERE j.status = 'open'
GROUP BY j.id;

-- ============================================
-- COMENTARIOS FINALES
-- ============================================
-- Esta estructura de base de datos soporta todas las funcionalidades
-- del MES 1: usuarios, quinielas, jornadas, administración
-- 
-- Características principales:
-- - UUIDs para seguridad y escalabilidad
-- - Índices optimizados para consultas frecuentes
-- - Restricciones de integridad referencial
-- - Triggers para mantenimiento automático de timestamps
-- - Vistas para consultas complejas optimizadas
-- - Auditoría completa de acciones administrativas
-- - Soporte para múltiples ligas y tipos de quinielas
