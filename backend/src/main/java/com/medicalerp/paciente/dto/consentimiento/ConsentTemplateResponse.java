package com.medicalerp.paciente.dto.consentimiento;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsentTemplateResponse {

    private Long id;
    private Long clinicaId;
    private String codigo;
    private String version;
    private String titulo;
    private String storagePath;
    private String mimeType;
    private String variablesRequeridas;
    private String variablesVersion;
    private Boolean requiereFirma;
    private Boolean requiereFecha;
    private Boolean activo;
    private LocalDateTime createdAt;
}
