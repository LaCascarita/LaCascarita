-- Verificar usuarios y sus password_hash
SELECT id, username, phone, password_hash, created_at 
FROM users 
ORDER BY created_at DESC 
LIMIT 10;
