-- ============================================
-- MIGRACIÓN: AGREGAR password_hash A USERS
-- ============================================
-- Este script agrega el campo password_hash a la tabla users existente
-- Ejecutar esto en lugar de schema.sql completo

-- Agregar campo password_hash si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NOT NULL DEFAULT '';
        RAISE NOTICE 'Campo password_hash agregado exitosamente';
    ELSE
        RAISE NOTICE 'Campo password_hash ya existe';
    END IF;
END $$;

-- Verificar que el campo se agregó
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name = 'password_hash';
