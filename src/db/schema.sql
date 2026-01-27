-- Table 1: invoices
CREATE TABLE IF NOT EXISTS invoices (
    invoice_id TEXT PRIMARY KEY,
    vendor_id TEXT NOT NULL,
    po_id TEXT NOT NULL,
    grn_id TEXT NOT NULL,
    invoice_date DATE NOT NULL,
    currency TEXT DEFAULT 'INR',
    invoice_json JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table 2: grns
CREATE TABLE IF NOT EXISTS grns (
    grn_id TEXT PRIMARY KEY,
    po_id TEXT NOT NULL,
    received_date DATE NOT NULL,
    grn_json JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table 3: vendor_master
CREATE TABLE IF NOT EXISTS vendor_master (
    vendor_id TEXT PRIMARY KEY,
    vendor_name TEXT NOT NULL,
    bank_account TEXT NOT NULL,
    ifsc TEXT NOT NULL,
    account_holder_name TEXT NOT NULL,
    bank_last_changed_at TIMESTAMP,
    risk_flags TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table 4: purchase_orders
CREATE TABLE IF NOT EXISTS purchase_orders (
    po_id TEXT PRIMARY KEY,
    vendor_id TEXT NOT NULL,
    po_json JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table 5: validation_runs
CREATE TABLE IF NOT EXISTS validation_runs (
    run_id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL,
    po_id TEXT NOT NULL,
    grn_id TEXT NOT NULL,
    model_id TEXT,
    status TEXT NOT NULL,
    decision TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table 6: validation_exceptions
CREATE TABLE IF NOT EXISTS validation_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id TEXT NOT NULL REFERENCES validation_runs(run_id),
    rule_id TEXT NOT NULL,
    severity TEXT NOT NULL,
    category TEXT NOT NULL,
    message TEXT NOT NULL,
    evidence JSONB NOT NULL,
    suggested_resolution TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table 7: validation_reports
CREATE TABLE IF NOT EXISTS validation_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id TEXT NOT NULL REFERENCES validation_runs(run_id),
    report_json JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table 8: entitlements (mock from Agent-1)
CREATE TABLE IF NOT EXISTS entitlements (
    entitlement_id TEXT PRIMARY KEY,
    model_id TEXT NOT NULL,
    po_id TEXT NOT NULL,
    invoice_id TEXT NOT NULL,
    entitlement_json JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_validation_runs_invoice ON validation_runs(invoice_id);
CREATE INDEX idx_validation_exceptions_run ON validation_exceptions(run_id);
CREATE INDEX idx_validation_reports_run ON validation_reports(run_id);