-- Permitir recargas SPEI manuales (deposito directo a cuenta empresarial)
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_provider_check;
ALTER TABLE payments ADD CONSTRAINT payments_provider_check
  CHECK (provider IN ('mercadopago', 'spei', 'spei_manual'));
