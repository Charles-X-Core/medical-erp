ALTER TABLE contrato_signing_sessions
    ADD COLUMN contrato_storage_path VARCHAR(500) NULL AFTER signed_at;
