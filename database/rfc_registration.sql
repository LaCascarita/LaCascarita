-- =====================================================
-- MIGRACIÓN: RFC obligatorio en registro + teléfono opcional
-- PROPÓSITO: Validar mayoría de edad por fecha en RFC y
--            permitir registro sin teléfono
-- EJECUTAR EN: Supabase SQL Editor
-- =====================================================

-- RFC de persona física (13 caracteres)
ALTER TABLE users ADD COLUMN IF NOT EXISTS rfc VARCHAR(13);

-- El teléfono pasa a ser opcional
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;

-- Un RFC solo puede pertenecer a una cuenta de usuario
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_rfc_unique
    ON users (rfc)
    WHERE rfc IS NOT NULL AND role = 'user';

CREATE INDEX IF NOT EXISTS idx_users_rfc ON users(rfc);
