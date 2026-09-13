-- ============================================
-- MIGRACIÓN: Permitir mismo teléfono en user y admin,
-- pero no duplicados dentro del mismo rol
-- ============================================

ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_phone_key;

ALTER TABLE users
ADD CONSTRAINT users_phone_role_key UNIQUE (phone, role);
