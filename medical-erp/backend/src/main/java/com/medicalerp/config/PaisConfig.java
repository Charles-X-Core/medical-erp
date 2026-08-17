package com.medicalerp.config;

import java.util.List;

/**
 * Country-specific configuration for the multi-region clinical system.
 */
public record PaisConfig(
        String codigo,
        String nombre,
        String timezone,
        String moneda,
        boolean multiDocumento,
        List<TipoDocumentoConfig> tiposDocumento,
        String tipoDocumentoDefault,
        boolean seguroRequerido,
        List<String> tiposSeguro,
        ConsentConfig consentimiento
) {

    public record TipoDocumentoConfig(
            String codigo,
            String label,
            int maxLength,
            String pattern
    ) {
    }

    public record ConsentConfig(
            boolean requerido,
            List<TipoConsentimiento> tipos
    ) {
    }

    public record TipoConsentimiento(
            String codigo,
            String label
    ) {
    }
}
