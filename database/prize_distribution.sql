-- ============================================
-- SCHEMA PARA DISTRIBUCION DE PREMIOS
-- ============================================
-- Reglas implementadas:
-- - La bolsa de premios es el 70% de lo recaudado en la jornada.
-- - Media semana y fin de semana: 80% para 1er lugar, 20% para 2do lugar.
-- - Dominical: todo el 70% es para 1er lugar (no hay 2do lugar).
-- - Si hay mas de 20 usuarios en 2do lugar, nadie recibe ese premio
--   y el 20% se acumula para la siguiente jornada del mismo tipo.
-- - El acumulado se suma al fondo total de la siguiente jornada
--   del mismo tipo y se vuelve a dividir 80/20.
-- - Dominical no acumula ni reparte segundo lugar.

-- ============================================
-- 1. TABLA: prize_carryover
-- ============================================
-- PROPÓSITO: Guardar el dinero del 2do lugar no repartido
-- (cuando hubo mas de 20 segundos lugares) para sumarlo a la
-- bolsa de la siguiente jornada del mismo tipo.
-- Solo aplica para media_semana y fin_de_semana.

CREATE TABLE IF NOT EXISTS prize_carryover (
    type VARCHAR(20) PRIMARY KEY CHECK (type IN ('media_semana', 'fin_de_semana')),
    amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO prize_carryover (type, amount) VALUES
    ('media_semana', 0.00),
    ('fin_de_semana', 0.00)
ON CONFLICT (type) DO NOTHING;

-- ============================================
-- 2. TABLA: prize_distributions
-- ============================================
-- PROPÓSITO: Registrar el reparto de premios de cada jornada.
-- RAZÓN: Auditoria del reparto e idempotencia (una jornada solo
-- puede repartirse una vez gracias al UNIQUE en jornada_id).

CREATE TABLE IF NOT EXISTS prize_distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    jornada_id UUID NOT NULL UNIQUE REFERENCES admin_jornadas(id),
    jornada_type VARCHAR(20) NOT NULL CHECK (jornada_type IN ('media_semana', 'fin_de_semana', 'dominical')),
    total_collected DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    carryover_in DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    prize_pool DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    first_place_pool DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    second_place_pool DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    first_place_winners INTEGER NOT NULL DEFAULT 0,
    second_place_winners INTEGER NOT NULL DEFAULT 0,
    first_place_share DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    second_place_share DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    carryover_out DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prize_distributions_jornada ON prize_distributions(jornada_id);
CREATE INDEX IF NOT EXISTS idx_prize_distributions_type ON prize_distributions(jornada_type);

-- ============================================
-- 3. POLITICAS RLS (service_role full access)
-- ============================================
ALTER TABLE prize_carryover ENABLE ROW LEVEL SECURITY;
ALTER TABLE prize_distributions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on prize_carryover" ON prize_carryover;
CREATE POLICY "Service role full access on prize_carryover"
ON prize_carryover TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on prize_distributions" ON prize_distributions;
CREATE POLICY "Service role full access on prize_distributions"
ON prize_distributions TO service_role USING (true) WITH CHECK (true);
