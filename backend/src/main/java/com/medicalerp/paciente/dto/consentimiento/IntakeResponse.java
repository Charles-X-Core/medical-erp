package com.medicalerp.paciente.dto.consentimiento;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IntakeResponse {

    private Long pacienteId;
    private String pacienteNombreCompleto;
    private List<IntakeConsentimientoResult> consentimientos;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class IntakeConsentimientoResult {
        private Long consentimientoId;
        private String tipo;
        private String estadoDocumento;
        private String hashDocumento;
        private Boolean firmado;
    }
}
