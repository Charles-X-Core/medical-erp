package com.medicalerp.paciente.dto.consentimiento;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsentimientoRenderResponse {

    private Long templateId;
    private String codigo;
    private String titulo;
    private String htmlContent;
    private String mimeType;
    private Boolean requiereFirma;
    private Boolean requiereFecha;
    private String variablesVersion;

    private Map<String, String> variables;

    private PacienteSnapshot paciente;
    private DoctorInfo doctor;
    private ClinicaInfo clinica;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PacienteSnapshot {
        private String nombreCompleto;
        private String tipoDocumento;
        private String numeroDocumento;
        private String fechaNacimiento;
        private String direccion;
        private String telefono;
        private String email;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DoctorInfo {
        private String nombre;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClinicaInfo {
        private String nombre;
        private String direccion;
    }
}
