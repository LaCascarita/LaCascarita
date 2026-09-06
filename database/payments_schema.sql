-- ============================================
-- SCHEMA PARA SISTEMA DE PAGOS Y SALDO
-- ============================================
-- Tablas para recargas (Mercado Pago y SPEI), retiros,
-- historial de transacciones y reglas de auditoria.

-- ============================================
-- 1. TABLA: payments
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    provider VARCHAR(20) NOT NULL CHECK (provider IN ('mercadopago', 'spei')),
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('deposit', 'withdrawal')),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) DEFAULT 'MXN',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded', 'processing')),
    provider_transaction_id VARCHAR(255),
    provider_metadata JSONB DEFAULT '{}',
    external_reference VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_tx ON payments(provider_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payments_external_ref ON payments(external_reference);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ============================================
-- 2. TABLA: user_balance_transactions
-- ============================================
CREATE TABLE IF NOT EXISTS user_balance_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'bet', 'prize', 'withdrawal', 'refund', 'adjustment')),
    amount DECIMAL(10,2) NOT NULL,
    balance_before DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    reference_id UUID REFERENCES payments(id),
    participation_id UUID REFERENCES participations(id),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON user_balance_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON user_balance_transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON user_balance_transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON user_balance_transactions(created_at);

-- ============================================
-- 3. TABLA: withdrawals
-- ============================================
CREATE TABLE IF NOT EXISTS withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    payment_id UUID REFERENCES payments(id),
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    bank_name VARCHAR(100),
    account_number VARCHAR(50),
    clabe VARCHAR(18),
    card_holder VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'rejected', 'cancelled')),
    processed_by UUID REFERENCES users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user ON withdrawals(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);

-- ============================================
-- 4. FUNCION Y TRIGGER: actualizar updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_payment_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_payments_timestamp ON payments;
CREATE TRIGGER update_payments_timestamp
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_payment_tables_updated_at();

DROP TRIGGER IF EXISTS update_user_balance_transactions_timestamp ON user_balance_transactions;
CREATE TRIGGER update_user_balance_transactions_timestamp
    BEFORE UPDATE ON user_balance_transactions
    FOR EACH ROW EXECUTE FUNCTION update_payment_tables_updated_at();

DROP TRIGGER IF EXISTS update_withdrawals_timestamp ON withdrawals;
CREATE TRIGGER update_withdrawals_timestamp
    BEFORE UPDATE ON withdrawals
    FOR EACH ROW EXECUTE FUNCTION update_payment_tables_updated_at();

-- ============================================
-- 5. POLITICAS RLS (service_role full access)
-- ============================================
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_balance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on payments" ON payments;
CREATE POLICY "Service role full access on payments"
ON payments TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on user_balance_transactions" ON user_balance_transactions;
CREATE POLICY "Service role full access on user_balance_transactions"
ON user_balance_transactions TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Service role full access on withdrawals" ON withdrawals;
CREATE POLICY "Service role full access on withdrawals"
ON withdrawals TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- 6. VISTA: balance_history
-- ============================================
CREATE OR REPLACE VIEW user_balance_history AS
SELECT
    u.id AS user_uuid,
    u.username,
    u.user_id AS public_user_id,
    t.id AS transaction_id,
    t.type,
    t.amount,
    t.balance_before,
    t.balance_after,
    t.status,
    t.reference_id,
    t.participation_id,
    t.description,
    t.created_at
FROM users u
JOIN user_balance_transactions t ON u.id = t.user_id
ORDER BY t.created_at DESC;
