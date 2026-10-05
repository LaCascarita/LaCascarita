-- ============================================
-- RECUPERACION DE CONTRASENA POR CORREO (RESEND)
-- ============================================
-- Códigos de 6 dígitos con expiración de 10 minutos.
-- Se guarda solo el hash del código, nunca en texto plano.
-- ============================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(255);

CREATE TABLE IF NOT EXISTS password_reset_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    attempts INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reset_codes_user ON password_reset_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_reset_codes_expires ON password_reset_codes(expires_at);

ALTER TABLE password_reset_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on password_reset_codes" ON password_reset_codes;
CREATE POLICY "Service role full access on password_reset_codes"
ON password_reset_codes TO service_role USING (true) WITH CHECK (true);
